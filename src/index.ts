import { handleSearchRequestStream, PLATFORMS_GAL, PLATFORMS_PATCH, getPlatformHealth } from "./core";
import type { Env, Platform } from "./types";
import { HTML } from "./html";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const RATE_WIN = 60_000, RATE_MAX = 30;
const limits = new Map<string, { n: number; at: number }>();
function limited(ip: string) {
  const t = Date.now(), e = limits.get(ip);
  if (!e || t > e.at) { limits.set(ip, { n: 1, at: t + RATE_WIN }); return false; }
  if (e.n >= RATE_MAX) return true;
  e.n++;
  return false;
}

function j(body: object, st: number) {
  return new Response(JSON.stringify(body), { status: st, headers: { "Content-Type": "application/json", ...CORS } });
}
function err(msg: string, st: number) { return j({ error: msg }, st); }

// ═════════════════════════════════════════════
//  Server
// ═════════════════════════════════════════════

async function handleSearch(req: Request, ctx: ExecutionContext, plats: Platform[], env: Env): Promise<Response> {
  let game = "";
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    game = params.get("game") || "";
    if (!game) { try { game = String(JSON.parse(text).game || ""); } catch {} }
  } catch { return err("无法解析请求体", 400); }
  game = game.trim();
  if (!game) return err("请输入游戏名称", 400);
  if (game.length > 100) return err("关键词过长", 400);
  game = game.replace(/[\x00-\x1F\x7F]/g, "");

  const { readable, writable } = new TransformStream();
  const w = writable.getWriter();
  const enc = new TextEncoder();
  ctx.waitUntil(
    handleSearchRequestStream(game, plats, w, env)
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

    // 首页 HTML
    if (req.method === "GET" && (p === "/" || p === "/index.html")) {
      const ck = new Request(u.origin + "/__html_v3", req), cache = caches.default;
      const hit = await cache.match(ck); if (hit) return hit;
      const r = new Response(HTML, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public,max-age=3600,s-maxage=86400", "CDN-Cache-Control": "public,max-age=86400", "Vary": "Accept-Encoding", "X-Content-Type-Options": "nosniff" } });
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
      if (limited(ip)) return err("请求过于频繁", 429);
      if (p === "/gal") return handleSearch(req, ctx, PLATFORMS_GAL, env);
      if (p === "/patch") return handleSearch(req, ctx, PLATFORMS_PATCH, env);
    }

    return new Response("Not Found", { status: 404 });
  },
};
