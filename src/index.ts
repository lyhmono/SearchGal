import { handleSearchRequestStream, PLATFORMS_GAL, PLATFORMS_PATCH, getPlatformHealth } from "./core";
import type { Env, Platform } from "./types";
import { HTML } from "./html";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const RATE_WIN = 60_000, RATE_MAX = 30;
const limits = new Map<string, { n: number; at: number }>();
let lastLimitSweep = 0;

function limited(ip: string) {
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
      const ck = new Request(u.origin + "/__html_v4", req), cache = caches.default;
      // const hit = await cache.match(ck); if (hit) return hit; // 禁用缓存
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
      if (limited(ip)) return err("请求过于频繁", 429);
      if (p === "/gal") return handleSearch(req, ctx, PLATFORMS_GAL, env);
      if (p === "/patch") return handleSearch(req, ctx, PLATFORMS_PATCH, env);
    }

    // 背景图片代理（避免广告拦截器）
    if (req.method === "GET" && p === "/api/bg") {
      const t = u.searchParams.get("t") || Date.now().toString();
      const apiUrl = "https://api.yppp.net/api.php?t=" + t;
      try {
        const resp = await fetch(apiUrl, { redirect: "follow" });
        if (!resp.ok) throw new Error("API error: " + resp.status);
        const headers = new Headers();
        headers.set("Content-Type", resp.headers.get("Content-Type") || "image/*");
        headers.set("Cache-Control", "public, max-age=3600");
        headers.set("Access-Control-Allow-Origin", "*");
        return new Response(resp.body, { status: 200, headers });
      } catch (e) {
        console.error("背景图片代理失败:", e);
        return new Response("Not Found", { status: 404 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
