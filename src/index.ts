import { handleSearchRequestStream, PLATFORMS_GAL, PLATFORMS_PATCH, getPlatformHealth } from "./core";
import type { Env, Platform } from "./types";
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

const RATE_WIN = 60_000, RATE_MAX = 30;
const limits = new Map<string, { n: number; at: number }>();
let lastLimitSweep = 0;

// 内存限流 fallback（当没有 SEARCHGAL_RATELIMIT binding 时使用，如 Vercel/Netlify）
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
    const { success } = await env.SEARCHGAL_RATELIMIT.limit({ key: ip || "unknown" });
    return !success;
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

// ═════════════════════════════════════════════
//  Server
// ═════════════════════════════════════════════

async function handleSearch(req: Request, ctx: ExecutionContext, plats: Platform[], env: Env): Promise<Response> {
  let game: string;
  try {
    game = await parseGame(req);
  } catch { return err("无法解析请求体", 400); }
  game = game.trim();
  if (!game) return err("请输入游戏名称", 400);
  if (game.length > 100) return err("关键词过长", 400);
  game = Array.from(game).filter((char) => {
    const code = char.charCodeAt(0);
    return code > 0x1f && code !== 0x7f;
  }).join("");

  const { readable, writable } = new TransformStream();
  const w = writable.getWriter();
  const enc = new TextEncoder();
  ctx.waitUntil(
    handleSearchRequestStream(game, plats, w, env, ctx)
      .catch((e) => { console.error("Stream err:", e); w.write(enc.encode(JSON.stringify({ error: "搜索出错", done: true }) + "\n")).catch(() => {}); })
      .finally(() => w.close().catch(() => {}))
  );
  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache,no-transform", "Connection": "keep-alive", "X-Content-Type-Options": "nosniff", ...CORS },
  });
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

    // 搜索接口
    if (req.method === "POST") {
      const ip = req.headers.get("CF-Connecting-IP") || req.headers.get("X-Forwarded-For") || "";
      if (await limited(ip, env)) return err("请求过于频繁", 429);
      if (p === "/gal") return handleSearch(req, ctx, PLATFORMS_GAL, env);
      if (p === "/patch") return handleSearch(req, ctx, PLATFORMS_PATCH, env);
    }

    // 背景图片代理（避免广告拦截器）+ Cache API 按小时缓存
    if (req.method === "GET" && p === "/api/bg") {
      const t = u.searchParams.get("t") || Date.now().toString();
      const hourBucket = Math.floor(Date.now() / 3_600_000);
      const cacheKey = new Request(u.origin + "/__bg_" + hourBucket, req);
      const cache = caches.default;
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
      const apiUrl = "https://api.yppp.net/api.php?t=" + t;
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
