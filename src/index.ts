import { handleSearchRequestStream, PLATFORMS_GAL, PLATFORMS_PATCH, getPlatformHealth } from "./core";
import type { Env, Platform } from "./types";
import { HTML } from "./html";

// ===== CORS：限制可信来源，不再允许 * =====
const ALLOWED_ORIGINS = [
  "https://searchgal.example.com",   // 换成你的生产域名
  "https://your-domain.com",
  // 开发环境
  "http://localhost:8787",
  "http://127.0.0.1:8787",
];
function buildCORS(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (!origin) {
    headers["Access-Control-Allow-Origin"] = "*";
    return headers;
  }
  // 允许同 workers.dev / pages.dev 自动放行（开发方便）
  const allowed = ALLOWED_ORIGINS.includes(origin)
    || origin.endsWith(".workers.dev")
    || origin.endsWith(".pages.dev");
  headers["Access-Control-Allow-Origin"] = allowed ? origin : (ALLOWED_ORIGINS[0] || "*");
  if (allowed) headers["Vary"] = "Origin";
  return headers;
}

// ===== 限流：内存版（重启会丢失，生产建议迁移到 KV）=====
const RATE_WIN = 60_000, RATE_MAX = 30;
const limits = new Map<string, { n: number; at: number }>();
function limited(ip: string) {
  const t = Date.now(), e = limits.get(ip);
  if (!e || t > e.at) { limits.set(ip, { n: 1, at: t + RATE_WIN }); return false; }
  if (e.n >= RATE_MAX) return true;
  e.n++;
  return false;
}

// ===== 统一响应 =====
function jsonBody(body: object) { return JSON.stringify(body); }
function j(body: object, st: number, origin: string | null) {
  return new Response(jsonBody(body), { status: st, headers: { "Content-Type": "application/json", ...buildCORS(origin) } });
}
function err(msg: string, st: number, origin: string | null) { return j({ error: msg }, st, origin); }

// ===== 输入验证 / XSS 防护 =====
const BLOCKED_CHARS = /[<>"'&=]/;
const SAFE_RE   = /^[一-鿿㐀-䶿\w.\-\s\+#]+$/u;

function sanitizeInput(raw: string): { ok: true; value: string } | { ok: false; reason: string } {
  const cleaned = raw.replace(/[\x00-\x1F\x7F]/g, "").trim();
  if (!cleaned) return { ok: false, reason: "请输入游戏名称" };
  if (cleaned.length > 100) return { ok: false, reason: "关键词过长（最多 100 字）" };
  if (BLOCKED_CHARS.test(cleaned)) return { ok: false, reason: "包含非法字符（< > \" ' & = 不允许）" };
  if (!SAFE_RE.test(cleaned))    return { ok: false, reason: "包含不支持的字符，请只使用中文/英文/数字/常见符号" };
  return { ok: true, value: cleaned };
}

// ════════════════════════════════════════════
//  Server
// ════════════════════════════════════════════

async function handleSearch(req: Request, ctx: ExecutionContext, plats: Platform[], env: Env): Promise<Response> {
  const origin = req.headers.get("Origin");
  let game    = "";

  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    game = params.get("game") || "";
    if (!game) { try { game = String((JSON as any).parse(text).game || ""); } catch {} }
  } catch {
    return err("无法解析请求体", 400, origin);
  }

  const v = sanitizeInput(game);
  if (!v.ok) return err(v.reason, 400, origin);
  game = v.value;

  const { readable, writable } = new TransformStream();
  const w   = writable.getWriter();
  const enc = new TextEncoder();
  ctx.waitUntil(
    handleSearchRequestStream(game, plats, w, env)
      .catch((e) => {
        console.error("Stream err:", e);
        w.write(enc.encode(JSON.stringify({ error: "搜索过程出错", done: true }) + "\n")).catch(() => {});
      })
      .finally(() => w.close().catch(() => {}))
  );
  return new Response(readable, {
    headers: {
      "Content-Type":  "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache,no-transform",
      "Connection":    "keep-alive",
      "X-Content-Type-Options": "nosniff",
      ...buildCORS(origin),
    },
  });
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const u = new URL(req.url), p = u.pathname;
    const origin = req.headers.get("Origin");

    // 首页 HTML（Cache API 加速）
    if (req.method === "GET" && (p === "/" || p === "/index.html")) {
      const ck = new Request(u.origin + "/__html_v3", req), cache = caches.default;
      const hit = await cache.match(ck); if (hit) return hit;
      const r = new Response(HTML, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public,max-age=3600,s-maxage=86400",
          "CDN-Cache-Control": "public,max-age=86400",
          "Vary": "Accept-Encoding",
          "X-Content-Type-Options": "nosniff",
        },
      });
      ctx.waitUntil(cache.put(ck, r.clone())); return r;
    }

    // 健康检查
    if (req.method === "GET" && p === "/health") {
      const h = getPlatformHealth();
      return j({ status: "ok", platforms: { gal: PLATFORMS_GAL.length, patch: PLATFORMS_PATCH.length }, breakers: Object.keys(h).length, details: h, ts: new Date().toISOString() }, 200, origin);
    }

    // CORS 预检
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: buildCORS(origin) });
    }

    // 搜索接口
    if (req.method === "POST") {
      const ip = req.headers.get("CF-Connecting-IP") || req.headers.get("X-Forwarded-For") || "";
      if (limited(ip)) return err("请求过于频繁，请稍后再试", 429, origin);
      if (p === "/gal")    return handleSearch(req, ctx, PLATFORMS_GAL, env);
      if (p === "/patch") return handleSearch(req, ctx, PLATFORMS_PATCH, env);
    }

    return new Response("Not Found", { status: 404 });
  },
};
