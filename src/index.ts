import {
  PLATFORMS_GAL,
  PLATFORMS_PATCH,
  getPlatformHealth,
  runPlatformsCollect,
  getCache,
  setCache,
  cacheKey,
  CACHE_TTL_RESULT_SECONDS,
  resolveBatchSize,
} from "./core";
import type { Env, Platform, StreamResult } from "./types";
import { HTML } from "./html";

// 用 HTML 内容哈希生成缓存键：改了 html.ts 后哈希自动变化，Cache API 旧键自然失效，
// 不再依赖手动把 /__html_v4 改成 v5 这种容易忘的版本号 bump。
function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}
const HTML_CACHE_KEY = "/__html_" + hashString(HTML);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};
const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache,no-transform",
  "Connection": "keep-alive",
  "X-Content-Type-Options": "nosniff",
  ...CORS,
};

const RATE_WIN = 60_000, RATE_MAX = 60;
const limits = new Map<string, { n: number; at: number }>();
let lastLimitSweep = 0;

// 内存限流 fallback（当没有 RATE_LIMIT binding 时使用，如本地 wrangler dev 未配置）
function limitedMemory(ip: string) {
  const t = Date.now();
  if (t - lastLimitSweep > RATE_WIN) {
    lastLimitSweep = t;
    for (const [key, value] of limits) {
      if (t > value.at) limits.delete(key);
    }
  }

  const key = ip || "unknown";
  const e = limits.get(key);
  if (!e || t > e.at) { limits.set(key, { n: 1, at: t + RATE_WIN }); return false; }
  if (e.n >= RATE_MAX) return true;
  e.n++;
  return false;
}

// 统一限流入口：优先用 CF Rate Limiting binding（分布式），否则 fallback 到内存
async function limited(ip: string, env: Env): Promise<boolean> {
  if (env.SEARCHGAL_RATELIMIT) {
    try {
      const { success } = await env.SEARCHGAL_RATELIMIT.limit({ key: ip || "unknown" });
      return !success;
    } catch (e) {
      // 限流绑定异常（如 wrangler.toml 里 namespace_id 配置错误/占位）时，
      // 降级为内存限流，避免一次性把整个搜索接口拖垮成 500。
      console.error("RATELIMIT 绑定调用失败，降级为内存限流:", e);
      return limitedMemory(ip);
    }
  }
  return limitedMemory(ip);
}

function j(body: object, st: number) {
  return new Response(JSON.stringify(body), { status: st, headers: { "Content-Type": "application/json", ...CORS } });
}
function err(msg: string, st: number) { return j({ error: msg }, st); }

async function parseGame(req: Request): Promise<string> {
  const contentType = req.headers.get("Content-Type") || "";

  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    const value = form.get("game");
    return typeof value === "string" ? value : "";
  }

  const text = await req.text();
  if (contentType.includes("application/json")) {
    const data = JSON.parse(text) as { game?: unknown };
    return typeof data.game === "string" ? data.game : "";
  }

  const params = new URLSearchParams(text);
  return params.get("game") || "";
}

// 按批切分数组
function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// 过滤控制字符（与旧逻辑一致）
function sanitizeGame(game: string): string {
  return Array.from(game).filter((char) => {
    const code = char.charCodeAt(0);
    return code > 0x1f && code !== 0x7f;
  }).join("");
}

// ── 服务端 fan-out（供外部 API / 服务端 SSE 使用）──
// 依赖 Worker 自调用能力：通过 Service Binding（env.SELF）触发独立的 /__batch 调用，
// 每次独立调用各有专属 50 子请求预算。免费计划下必须走这条路才能搜完 37+ 平台。
// 注意：前端搜索默认走「客户端 fan-out」（见 html.ts），不会调用本路径；
// 本路径仅在配置了 [[services]] SELF 绑定时对外部 POST /gal、/patch 生效。
async function streamFanout(
  game: string, plats: Platform[], env: Env, ctx: ExecutionContext, selfUrl: URL, type: string
): Promise<Response> {
  const { readable, writable } = new TransformStream();
  const w = writable.getWriter();
  const enc = new TextEncoder();

  ctx.waitUntil((async () => {
    try {
      // KV 缓存命中则直接重放，无需真正搜索
      if (env?.SEARCHGAL_KV) {
        const key = cacheKey(game, plats);
        const cached = await getCache(env, key);
        if (cached && Array.isArray(cached) && cached.length > 0) {
          for (const ev of cached) await w.write(enc.encode(JSON.stringify(ev) + "\n"));
          return;
        }
      }

      await w.write(enc.encode(JSON.stringify({ total: plats.length }) + "\n"));

      const batches = chunk(plats, resolveBatchSize(env));
      const collected: object[] = [];
      let done = 0;
      const total = plats.length;

      // 每批 = 一次独立 Worker 调用（经 Service Binding 触发，自有 50 子请求预算）。
      // 父调用本身仅消耗「批数」个子请求，从而绕过免费计划 50 子请求硬上限。
      await Promise.all(batches.map(async (batch) => {
        const body = JSON.stringify({ game, type, platforms: batch.map((p) => p.name) });
        const r = await env.SELF!.fetch(new Request(selfUrl.origin + "/__batch", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-searchgal-internal": "1" },
          body,
        }));
        const data = (await r.json()) as { results?: StreamResult[] };
        const results = Array.isArray(data.results) ? data.results : [];
        for (const res of results) {
          done++;
          const ev = { progress: { completed: done, total }, result: res };
          collected.push(ev);
          await w.write(enc.encode(JSON.stringify(ev) + "\n"));
        }
      }));

      const doneEv = { done: true };
      collected.push(doneEv);
      await w.write(enc.encode(JSON.stringify(doneEv) + "\n"));

      // 写入 KV 缓存（异步，不阻塞响应）
      if (env?.SEARCHGAL_KV && collected.some((e) => {
        const r = (e as { result?: StreamResult }).result;
        return r !== undefined && Array.isArray(r.items) && r.items.length > 0;
      })) {
        const toCache = collected.filter((e) => "total" in e || "result" in e || "done" in e);
        const cp = setCache(env, cacheKey(game, plats), toCache, CACHE_TTL_RESULT_SECONDS);
        if (ctx) ctx.waitUntil(cp); else await cp;
      }
    } catch (e) {
      console.error("fanout err:", e);
      await w.write(enc.encode(JSON.stringify({ error: "搜索出错", done: true }) + "\n")).catch(() => {});
    } finally {
      w.close().catch(() => {});
    }
  })());

  return new Response(readable, { headers: SSE_HEADERS });
}

async function handleSearch(req: Request, ctx: ExecutionContext, plats: Platform[], env: Env, type: string): Promise<Response> {
  let game: string;
  try {
    game = await parseGame(req);
  } catch { return err("无法解析请求体", 400); }
  game = game.trim();
  if (!game) return err("请输入游戏名称", 400);
  if (game.length > 100) return err("关键词过长", 400);
  game = sanitizeGame(game);

  const selfUrl = new URL(req.url);
  // 服务端 fan-out 依赖 Worker 自调用（Service Binding，即 env.SELF）。
  // 免费计划下无法在单次调用内搜完 37+ 平台，必须分批触发独立调用。
  // 若未配置 SELF 绑定：前端已改用「客户端 fan-out」，这里给出明确指引而非含糊的「搜索出错」。
  if (!env.SELF) {
    return err(
      "当前部署未配置 Worker 自调用（Service Binding），无法在服务端一次性搜索 37+ 平台（会触发免费计划 50 子请求上限）。" +
      "本站前端已自动改用「客户端分批」搜索，请直接通过网页使用；如需服务端 SSE 接口，请为 Worker 添加指向自身的 [[services]] 绑定（binding = SELF）。",
      400
    );
  }
  return streamFanout(game, plats, env, ctx, selfUrl, type);
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const u = new URL(req.url), p = u.pathname;

    // 首页 HTML（启用 Cache API，命中时直接返回缓存的 Response，省去重复序列化）
    if (req.method === "GET" && (p === "/" || p === "/index.html")) {
      const ck = new Request(u.origin + HTML_CACHE_KEY, req), cache = caches.default;
      const hit = await cache.match(ck);
      if (hit) return hit;
      const r = new Response(HTML, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache", "CDN-Cache-Control": "no-cache", "Vary": "Accept-Encoding", "X-Content-Type-Options": "nosniff" } });
      ctx.waitUntil(cache.put(ck, r.clone())); return r;
    }

    // 健康检查
    if (req.method === "GET" && p === "/health") {
      const h = getPlatformHealth();
      return j({ status: "ok", platforms: { gal: PLATFORMS_GAL.length, patch: PLATFORMS_PATCH.length }, breakers: Object.keys(h).length, details: h, ts: new Date().toISOString() }, 200);
    }

    // CORS 预检
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

    // 内部批处理端点：父调用带 x-searchgal-internal 头免二次限流；外部直接调用则走限流兜底。
    // 每次调用都是独立 Worker 调用，拥有自己专属的 50 子请求预算（fan-out 的核心）。
    if (req.method === "POST" && p === "/__batch") {
      const internal = req.headers.get("x-searchgal-internal") === "1";
      if (!internal) {
        const ip = req.headers.get("CF-Connecting-IP") || req.headers.get("X-Forwarded-For") || "";
        if (await limited(ip, env)) return err("请求过于频繁", 429);
      }

      let payload: { game?: unknown; type?: unknown; platforms?: unknown };
      const ct = req.headers.get("Content-Type") || "";
      if (ct.includes("application/json")) {
        payload = JSON.parse(await req.text());
      } else {
        const f = await req.formData();
        payload = { game: f.get("game"), type: f.get("type"), platforms: JSON.parse(String(f.get("platforms") || "[]")) };
      }

      const game = String(payload.game ?? "").trim();
      const type = String(payload.type ?? "gal");
      const names = Array.isArray(payload.platforms) ? payload.platforms.map(String) : [];
      const all = type === "patch" ? PLATFORMS_PATCH : PLATFORMS_GAL;
      const subset = names
        .map((n) => all.find((pl) => pl.name === n))
        .filter((x): x is Platform => Boolean(x));

      // 每批结果按「game + 本批平台集合」缓存：命中则直接返回，省子请求、加速重复搜索
      let results: StreamResult[] | null = null;
      if (env?.SEARCHGAL_KV && subset.length > 0) {
        const cached = await getCache(env, cacheKey(game, subset));
        if (cached && Array.isArray(cached)) results = cached as StreamResult[];
      }
      if (!results) {
        results = await runPlatformsCollect(game, subset, env);
        if (env?.SEARCHGAL_KV && subset.length > 0) {
          await setCache(env, cacheKey(game, subset), results, CACHE_TTL_RESULT_SECONDS);
        }
      }

      return new Response(JSON.stringify({ total: subset.length, results }), {
        headers: { "Content-Type": "application/json", ...CORS },
      });
    }

    // 搜索接口
    if (req.method === "POST") {
      const ip = req.headers.get("CF-Connecting-IP") || req.headers.get("X-Forwarded-For") || "";
      if (await limited(ip, env)) return err("请求过于频繁", 429);
      if (p === "/gal") return handleSearch(req, ctx, PLATFORMS_GAL, env, "gal");
      if (p === "/patch") return handleSearch(req, ctx, PLATFORMS_PATCH, env, "patch");
    }

    // 背景图片代理（避免广告拦截器）+ Cache API 按小时缓存
    if (req.method === "GET" && p === "/api/bg") {
      const t = u.searchParams.get("t") || Date.now().toString();
      const hourBucket = Math.floor(Date.now() / 3_600_000);
      const cacheKey = new Request(u.origin + "/__bg_" + hourBucket, req);
      const cache = caches.default;
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
      const apiUrl = (env.BG_API_URL || "https://api.yppp.net/api.php") + "?t=" + t;
      try {
        const resp = await fetch(apiUrl, { redirect: "follow" });
        if (!resp.ok) throw new Error("API error: " + resp.status);
        const contentType = (resp.headers.get("Content-Type") || "").toLowerCase();
        // 仅当返回真正是图片时才写入一小时缓存，避免把上游错误页/非图片响应写进缓存
        const isImage = contentType.startsWith("image/");
        const headers = new Headers();
        headers.set("Content-Type", contentType || "image/*");
        headers.set("Cache-Control", "public, max-age=3600");
        headers.set("Access-Control-Allow-Origin", "*");
        const r = new Response(resp.body, { status: 200, headers });
        if (isImage) ctx.waitUntil(cache.put(cacheKey, r.clone()));
        else console.error("背景图片代理返回非图片类型，跳过缓存:", contentType);
        return r;
      } catch (e) {
        console.error("背景图片代理失败:", e);
        return new Response("Not Found", { status: 404 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
