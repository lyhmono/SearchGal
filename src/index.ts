import { handleSearchRequestStream, PLATFORMS_GAL, PLATFORMS_PATCH, getPlatformHealth } from "./core";
import type { Platform } from "./types";

// ──────────────────────────────────────────────
//  环境类型 & 常量
// ──────────────────────────────────────────────
export interface Env {
  SEARCHGAL_KV?: KVNamespace;
  [key: string]: unknown;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const MAX_KEYWORD_LEN = 100;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 30;

// ── 限流 ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) { rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS }); return false; }
  if (entry.count >= RATE_MAX_REQUESTS) return true;
  entry.count++; return false;
}

// ── 响应工具 ──
function jsonResponse(body: object, status: number, extra?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS, ...extra },
  });
}
function errorResponse(msg: string, status: number): Response {
  return jsonResponse({ error: msg, type: "error" }, status);
}

// ──────────────────────────────────────────────
//  首页 HTML 模板
// ──────────────────────────────────────────────
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<title>SearchGAL · Gal资源聚合搜索</title>
<meta name="description" content="聚合搜索 32+ Galgame 资源平台，SSE 流式返回结果，免登录直链下载">
<meta name="theme-color" content="#0f0a1e">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta property="og:title" content="SearchGAL · Gal资源聚合搜索">
<meta property="og:description" content="聚合搜索 32+ Galgame 资源平台，一键发现资源">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%238b5cf6'/><stop offset='100%25' stop-color='%236366f1'/></linearGradient></defs><circle cx='50' cy='50' r='45' fill='url(%23g)' opacity='.15'/><text y='.72em' font-size='52' text-anchor='middle' fill='url(%23g)'>🔍</text></svg>">

<style>
/* ═══════════════════════════════════════════
   DESIGN SYSTEM
   ═══════════════════════════════════════════ */
:root {
  /* bg */
  --bg-deep: #0a0614;
  --bg-mid: #120c22;
  --bg-elevated: rgba(255,255,255,0.03);
  --bg-card: rgba(255,255,255,0.04);
  --bg-input: rgba(255,255,255,0.05);
  --border: rgba(255,255,255,0.07);
  --border-hover: rgba(255,255,255,0.13);
  /* text */
  --text: #ebe7f5;
  --text-2: #9d95b5;
  --text-3: #635d78;
  /* accent */
  --accent: #818cf8;
  --accent-2: #a78bfa;
  --accent-3: #c084fc;
  --accent-glow: rgba(129,140,248,0.2);
  --accent-strong: rgba(129,140,248,0.35);
  /* semantic */
  --link: #93b4f8;
  --error: #f87171;
  --success: #34d399;
  --warn: #fbbf24;
  --error-bg: rgba(248,113,113,0.07);
  /* tags */
  --tag-green-bg: rgba(52,211,153,0.13);
  --tag-green: #6ee7b7;
  --tag-amber-bg: rgba(251,191,36,0.13);
  --tag-amber: #fcd34d;
  --tag-gray-bg: rgba(255,255,255,0.06);
  --tag-gray: #9d95b5;
  --tag-red-bg: rgba(248,113,113,0.1);
  /* skeleton */
  --skel-base: rgba(255,255,255,0.035);
  --skel-shine: rgba(255,255,255,0.09);
  /* shadow */
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.25);
  --shadow-md: 0 8px 30px rgba(0,0,0,0.35);
  --shadow-glow: 0 8px 40px rgba(99,102,241,0.12);
  /* radius */
  --r-sm: 8px; --r: 14px; --r-lg: 18px; --r-full: 999px;
  /* layout */
  --header-h: 0px;
}
@media (prefers-color-scheme: light) {
  :root {
    --bg-deep: #f4f2fa;
    --bg-mid: #eae6f5;
    --bg-elevated: rgba(255,255,255,0.5);
    --bg-card: rgba(255,255,255,0.7);
    --bg-input: rgba(255,255,255,0.85);
    --border: rgba(0,0,0,0.06);
    --border-hover: rgba(0,0,0,0.11);
    --text: #1b1828;
    --text-2: #5c5678;
    --text-3: #a19bb5;
    --accent-glow: rgba(99,102,241,0.1);
    --accent-strong: rgba(99,102,241,0.2);
    --link: #4f46e5;
    --error: #dc2626;
    --error-bg: rgba(220,38,38,0.05);
    --tag-green-bg: rgba(16,185,129,0.1);
    --tag-green: #059669;
    --tag-amber-bg: rgba(245,158,11,0.1);
    --tag-amber: #d97706;
    --tag-gray-bg: rgba(0,0,0,0.05);
    --tag-gray: #6b7280;
    --skel-base: rgba(0,0,0,0.04);
    --skel-shine: rgba(0,0,0,0.08);
    --shadow-sm: 0 2px 8px rgba(0,0,0,0.05);
    --shadow-md: 0 8px 30px rgba(0,0,0,0.08);
    --shadow-glow: 0 8px 40px rgba(99,102,241,0.06);
  }
}

/* ═══════════════════════════════════════════
   RESET & BASE
   ═══════════════════════════════════════════ */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{
  font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',sans-serif;
  background:var(--bg-deep);color:var(--text);
  min-height:100vh;overflow-x:hidden;
  transition:background 0.5s,color 0.5s;
  -webkit-tap-highlight-color:transparent;
}

/* 动态光晕背景 */
.bg-aurora{
  position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;
}
.bg-aurora::before,.bg-aurora::after{
  content:'';position:absolute;border-radius:50%;filter:blur(120px);opacity:0.5;
}
.bg-aurora::before{
  width:70vw;height:70vw;max-width:800px;max-height:800px;
  background:rgba(139,92,246,0.12);
  top:-20%;left:-10%;animation:aurora1 18s ease-in-out infinite;
}
.bg-aurora::after{
  width:60vw;height:60vw;max-width:700px;max-height:700px;
  background:rgba(59,130,246,0.1);
  bottom:-15%;right:-10%;animation:aurora2 22s ease-in-out infinite;
}
@keyframes aurora1{
  0%,100%{transform:translate(0,0) scale(1)}
  33%{transform:translate(8vw,6vh) scale(1.15)}
  66%{transform:translate(-4vw,-4vh) scale(0.9)}
}
@keyframes aurora2{
  0%,100%{transform:translate(0,0) scale(1)}
  50%{transform:translate(-10vw,-8vh) scale(1.2)}
}

/* 网格 */
.bg-grid{
  position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0.025;
  background-image:linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px);
  background-size:64px 64px;
}
@media (prefers-color-scheme: light){.bg-grid{opacity:0.04}}

/* ═══════════════════════════════════════════
   LAYOUT
   ═══════════════════════════════════════════ */
.app{
  position:relative;z-index:1;
  max-width:1200px;margin:0 auto;
  padding:clamp(1rem,3vw,2.5rem) clamp(0.8rem,2.5vw,2rem) 5rem;
}
/* 桌面端两栏 */
@media(min-width:1024px){
  .app{padding-top:2rem}
}

/* ═══════════════════════════════════════════
   HEADER
   ═══════════════════════════════════════════ */
.header{text-align:center;margin-bottom:clamp(1.2rem,3vw,2rem)}
.logo-link{text-decoration:none;display:inline-block;cursor:pointer}
.logo{
  display:inline-flex;align-items:center;gap:0.35rem;
  font-size:clamp(1.8rem,5vw,3rem);font-weight:800;letter-spacing:-0.04em;
  background:linear-gradient(135deg,var(--accent-2),var(--accent) 45%,var(--accent-3));
  background-size:200% auto;-webkit-background-clip:text;
  -webkit-text-fill-color:transparent;background-clip:text;
  animation:logoShine 5s linear infinite;
}
@keyframes logoShine{to{background-position:200% center}}
.logo .icon{font-size:0.75em;-webkit-text-fill-color:initial}
.tagline{color:var(--text-2);font-size:clamp(0.82rem,1.8vw,0.95rem);margin-top:0.25rem;letter-spacing:0.03em}

/* ═══════════════════════════════════════════
   SEARCH TABS
   ═══════════════════════════════════════════ */
.search-tabs{
  display:inline-flex;gap:0;margin-bottom:0.8rem;
  background:var(--bg-elevated);border-radius:var(--r-full);
  padding:3px;border:1px solid var(--border);
}
.search-tab{
  padding:0.45rem 1.2rem;border-radius:var(--r-full);border:none;
  background:transparent;color:var(--text-2);cursor:pointer;
  font-size:0.85rem;font-weight:500;font-family:inherit;
  transition:all 0.25s;white-space:nowrap;
}
.search-tab.active{
  background:linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.2));
  color:var(--text);box-shadow:0 2px 8px rgba(99,102,241,0.15);
}
.search-tab:hover:not(.active){color:var(--text);background:rgba(255,255,255,0.03)}
.search-tab .tab-badge{
  font-size:0.7rem;margin-left:0.3rem;opacity:0.5;
}

/* ═══════════════════════════════════════════
   SEARCH BAR
   ═══════════════════════════════════════════ */
.search-wrapper{position:relative;max-width:620px;margin:0 auto 0.6rem}
.search-form{display:flex;gap:0.5rem}
.input-wrap{
  flex:1;position:relative;display:flex;align-items:center;
  background:var(--bg-input);backdrop-filter:blur(24px);
  border:1.5px solid var(--border);border-radius:var(--r-full);
  transition:all 0.3s cubic-bezier(0.22,1,0.36,1);
  overflow:hidden;
}
.input-wrap:focus-within{
  border-color:var(--accent);background:rgba(255,255,255,0.08);
  box-shadow:0 0 0 4px var(--accent-glow),0 0 0 1px var(--accent) inset;
}
.input-wrap .search-icon{
  position:absolute;left:1rem;font-size:1.05rem;color:var(--text-3);
  pointer-events:none;transition:all 0.3s;
}
.input-wrap:focus-within .search-icon{color:var(--accent);transform:scale(1.1)}
#searchInput{
  width:100%;padding:0.9rem 3rem 0.9rem 2.7rem;border:none;border-radius:inherit;
  background:transparent;color:var(--text);font-size:clamp(0.9rem,2vw,1rem);
  outline:none;font-family:inherit;
}
#searchInput::placeholder{color:var(--text-3)}
#searchInput[readonly]{opacity:0.5;cursor:not-allowed}
.input-clear{
  position:absolute;right:0.5rem;width:30px;height:30px;border-radius:50%;
  border:none;background:transparent;color:var(--text-3);
  cursor:pointer;font-size:1.2rem;display:none;align-items:center;justify-content:center;
  transition:all 0.2s;line-height:1;padding:0;
}
.input-clear:hover{background:rgba(255,255,255,0.1);color:var(--text)}
.input-clear.visible{display:flex}

/* history dropdown */
.history-dropdown{
  display:none;position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:30;
  background:var(--bg-card);backdrop-filter:blur(28px);
  border:1px solid var(--border);border-radius:var(--r);
  overflow:hidden;box-shadow:var(--shadow-md);
}
.history-dropdown.show{display:block;animation:fadeSlideIn 0.2s ease-out}
.history-item{
  padding:0.65rem 1.1rem;cursor:pointer;font-size:0.9rem;
  color:var(--text);border-bottom:1px solid var(--border);
  display:flex;justify-content:space-between;align-items:center;
  transition:background 0.15s;
}
.history-item:last-child{border-bottom:none}
.history-item:hover{background:rgba(129,140,248,0.06)}
.history-item .del-btn{
  background:none;border:none;color:var(--text-3);cursor:pointer;
  font-size:1rem;padding:0.15rem 0.4rem;border-radius:4px;line-height:1;
  transition:all 0.15s;
}
.history-item .del-btn:hover{color:var(--error);background:var(--error-bg)}
.history-clear{
  padding:0.5rem;text-align:center;font-size:0.78rem;color:var(--text-3);
  cursor:pointer;transition:color 0.15s;border-top:1px solid var(--border);
}
.history-clear:hover{color:var(--error)}

.platform-count{
  text-align:center;font-size:0.76rem;color:var(--text-3);margin-bottom:1.2rem;
}
.platform-count b{color:var(--accent-2);font-weight:600}

/* ═══════════════════════════════════════════
   BUTTONS
   ═══════════════════════════════════════════ */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:0.3rem;
  border:none;font-weight:600;cursor:pointer;font-family:inherit;
  transition:all 0.25s cubic-bezier(0.22,1,0.36,1);
  position:relative;overflow:hidden;white-space:nowrap;
}
.btn-primary{
  padding:0.9rem 1.8rem;border-radius:var(--r-full);
  background:linear-gradient(135deg,#6366f1,#8b5cf6);
  color:#fff;font-size:clamp(0.85rem,1.8vw,0.95rem);
  box-shadow:0 4px 20px rgba(99,102,241,0.3);
  letter-spacing:0.01em;
}
.btn-primary:hover{transform:translateY(-1.5px);box-shadow:0 8px 28px rgba(99,102,241,0.45)}
.btn-primary:active{transform:scale(0.95)}
.btn-primary:disabled{opacity:0.45;cursor:not-allowed;transform:none;box-shadow:none}
/* ripple */
.btn-primary::after{
  content:'';position:absolute;inset:0;border-radius:inherit;
  background:radial-gradient(circle at center,rgba(255,255,255,0.35) 0%,transparent 70%);
  opacity:0;transform:scale(0.4);transition:all 0.5s;
}
.btn-primary:active::after{opacity:1;transform:scale(2.5);transition:all 0s}

.btn-ghost{
  background:transparent;border:1.5px solid var(--border);
  color:var(--text-2);padding:0.4rem 1rem;font-size:0.8rem;border-radius:var(--r-sm);
}
.btn-ghost:hover{background:var(--bg-elevated);border-color:var(--border-hover);color:var(--text)}

/* ═══════════════════════════════════════════
   STATS BAR
   ═══════════════════════════════════════════ */
.stats-bar{
  display:none;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;
  margin-bottom:0.7rem;font-size:0.82rem;color:var(--text-2);
  animation:fadeSlideIn 0.3s ease-out;
}
@keyframes fadeSlideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.stats-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:0.25rem;vertical-align:middle}
.stats-dot.ok{background:var(--success);box-shadow:0 0 6px var(--success)}
.stats-dot.err{background:var(--error);box-shadow:0 0 6px var(--error)}

/* ═══════════════════════════════════════════
   PROGRESS
   ═══════════════════════════════════════════ */
.progress-wrap{display:flex;align-items:center;gap:0.6rem;margin-bottom:1.2rem}
.progress-track{
  flex:1;height:3px;border-radius:2px;background:var(--bg-elevated);overflow:hidden;
}
.progress-fill{
  height:100%;border-radius:2px;
  background:linear-gradient(90deg,var(--accent),var(--accent-2),var(--accent-3));
  background-size:200% 100%;transition:width 0.35s ease;
  animation:progressShimmer 2s linear infinite;
}
@keyframes progressShimmer{to{background-position:200% 0}}
.progress-fill.done{animation:none;background:var(--success)}
#progressText{min-width:70px;font-size:0.82rem;color:var(--text-2);text-align:right}

/* ═══════════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════════ */
.skeleton-card{
  background:var(--bg-card);backdrop-filter:blur(12px);
  border:1px solid var(--border);border-radius:var(--r);
  padding:1.1rem;animation:fadeSlideIn 0.35s ease-out both;
  content-visibility:auto;contain-intrinsic-size:0 130px;
}
.skel-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.7rem}
.skel-dot{width:10px;height:10px;border-radius:50%;background:var(--skel-shine);flex-shrink:0}
.skel-line{
  height:12px;border-radius:6px;margin-bottom:0.5rem;
  background:linear-gradient(90deg,var(--skel-base) 25%,var(--skel-shine) 50%,var(--skel-base) 75%);
  background-size:200% 100%;animation:shimmer 1.5s infinite;
}
.skel-line.w30{width:30%}.skel-line.w50{width:50%}.skel-line.w70{width:70%}.skel-line.w90{width:90%}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* ═══════════════════════════════════════════
   RESULTS GRID
   ═══════════════════════════════════════════ */
#results{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:0.9rem;
}
@media(min-width:1400px){#results{grid-template-columns:repeat(3,1fr)}}

/* ═══════════════════════════════════════════
   PLATFORM CARD
   ═══════════════════════════════════════════ */
.platform-card{
  position:relative;background:var(--bg-card);backdrop-filter:blur(16px);
  border:1px solid var(--border);border-radius:var(--r-lg);
  overflow:hidden;transition:all 0.35s cubic-bezier(0.22,1,0.36,1);
  content-visibility:auto;contain-intrinsic-size:0 200px;
  animation:cardIn 0.45s cubic-bezier(0.16,1,0.3,1) both;
}
/* 左侧色条 */
.platform-card::before{
  content:'';position:absolute;left:0;top:12px;bottom:12px;width:3px;
  border-radius:0 3px 3px 0;opacity:0.7;transition:all 0.35s;
  background:var(--card-accent,transparent);
}
.platform-card:hover{transform:translateY(-3px);border-color:var(--border-hover);box-shadow:var(--shadow-glow)}
.platform-card:hover::before{opacity:1;box-shadow:0 0 12px currentColor}
.platform-card.error-card{border-color:rgba(248,113,113,0.2)}
.platform-card.error-card::before{background:var(--error)!important}

@keyframes cardIn{
  from{opacity:0;transform:translateY(20px) scale(0.97)}
  to{opacity:1;transform:translateY(0) scale(1)}
}

/* card header */
.platform-header{
  display:flex;align-items:center;gap:0.6rem;
  padding:0.8rem 1rem 0.8rem 1.2rem;
  background:rgba(255,255,255,0.02);
  border-bottom:1px solid var(--border);
  cursor:default;
}
.platform-dot{
  display:inline-block;width:10px;height:10px;border-radius:50%;flex-shrink:0;position:relative;
}
.platform-dot::after{
  content:'';position:absolute;inset:-3px;border-radius:50%;
  background:inherit;opacity:0.25;filter:blur(5px);
}
.platform-name{font-weight:600;font-size:0.93rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.platform-count-badge{
  margin-left:auto;font-size:0.72rem;color:var(--text-3);
  background:var(--bg-elevated);padding:0.15rem 0.5rem;border-radius:var(--r-full);
  white-space:nowrap;flex-shrink:0;
}
.platform-tags{margin-left:0.3rem;display:flex;gap:0.25rem;flex-wrap:wrap;flex-shrink:0}

/* tags */
.tag{font-size:0.7rem;padding:0.15rem 0.5rem;border-radius:var(--r-full);font-weight:500;white-space:nowrap;letter-spacing:0.01em}
.tag-green{background:var(--tag-green-bg);color:var(--tag-green)}
.tag-amber{background:var(--tag-amber-bg);color:var(--tag-amber)}
.tag-gray{background:var(--tag-gray-bg);color:var(--tag-gray)}
.tag-red{background:var(--tag-red-bg);color:var(--error)}

/* card body */
.platform-body{padding:0.5rem 0.9rem 0.8rem 1.2rem}
.platform-body .empty-text{color:var(--text-3);font-style:italic;margin:0.3rem 0;font-size:0.88rem}
.platform-body .error-text{color:var(--error);font-size:0.85rem;padding:0.2rem 0}

/* link list */
.result-list{list-style:none}
.result-list li{
  display:flex;align-items:center;gap:0.35rem;
  padding:0.38rem 0.4rem;border-radius:var(--r-sm);
  transition:background 0.15s;position:relative;
}
.result-list li:hover{background:rgba(129,140,248,0.05)}
.result-list li+li{border-top:1px solid rgba(255,255,255,0.025)}
.result-list a{
  color:var(--link);text-decoration:none;font-size:0.9rem;
  flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  transition:color 0.15s;
}
.result-list a:hover{color:var(--accent-2);text-decoration:underline;text-underline-offset:3px}
.result-list li::before{
  content:'';width:4px;height:4px;border-radius:50%;background:var(--accent);
  flex-shrink:0;opacity:0.4;
}
.copy-btn{
  background:transparent;border:none;color:var(--text-3);cursor:pointer;
  font-size:0.8rem;padding:0.2rem 0.35rem;border-radius:4px;
  transition:all 0.2s;flex-shrink:0;line-height:1;opacity:0;
}
.result-list li:hover .copy-btn,.copy-btn.mobile-visible{opacity:1}
.copy-btn:hover{color:var(--link);background:rgba(255,255,255,0.06)}
.copy-btn.copied{color:var(--success)}

.btn-load-more{
  display:block;width:100%;margin-top:0.45rem;padding:0.4rem;
  border-radius:var(--r-sm);border:1px solid var(--border);
  background:transparent;color:var(--link);cursor:pointer;
  font-size:0.83rem;font-family:inherit;transition:all 0.2s;
}
.btn-load-more:hover{background:rgba(79,70,229,0.08);color:var(--accent-2)}

/* ═══════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════ */
.empty-state{
  text-align:center;padding:3.5rem 1rem;grid-column:1/-1;
  animation:fadeSlideIn 0.4s ease-out;
}
.empty-icon{font-size:3.5rem;display:block;margin-bottom:0.8rem;opacity:0.5}
.empty-state h3{font-size:1.1rem;color:var(--text-2);margin-bottom:0.3rem;font-weight:500}
.empty-state p{color:var(--text-3);font-size:0.88rem}

/* ═══════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════ */
.toast{
  position:fixed;bottom:clamp(1.5rem,4vw,2.5rem);left:50%;transform:translateX(-50%) translateY(120px);
  background:var(--bg-card);backdrop-filter:blur(24px);
  border:1px solid var(--border);border-radius:var(--r-full);
  padding:0.6rem 1.4rem;color:var(--text);font-size:0.85rem;
  box-shadow:var(--shadow-md);z-index:100;
  transition:transform 0.4s cubic-bezier(0.16,1,0.3,1);
  pointer-events:none;display:flex;align-items:center;gap:0.45rem;white-space:nowrap;
}
.toast.show{transform:translateX(-50%) translateY(0)}
.toast-icon{font-size:1rem}

/* ═══════════════════════════════════════════
   BACK TO TOP
   ═══════════════════════════════════════════ */
.back-to-top{
  position:fixed;bottom:clamp(1rem,3vw,1.5rem);right:clamp(0.8rem,2.5vw,1.5rem);
  width:42px;height:42px;border-radius:50%;z-index:50;
  background:var(--bg-card);backdrop-filter:blur(16px);
  border:1px solid var(--border);color:var(--text-2);
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  font-size:1.2rem;transition:all 0.3s;opacity:0;visibility:hidden;transform:translateY(10px);
  box-shadow:var(--shadow-sm);
}
.back-to-top.visible{opacity:1;visibility:visible;transform:translateY(0)}
.back-to-top:hover{background:rgba(129,140,248,0.1);color:var(--accent);border-color:var(--accent)}

/* ═══════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════ */
.kbd-hint{text-align:center;font-size:0.73rem;color:var(--text-3);margin-top:2.5rem;opacity:0.7}
.kbd-hint kbd{
  display:inline-block;padding:0.12rem 0.45rem;border-radius:4px;
  background:var(--bg-elevated);border:1px solid var(--border);
  font-family:inherit;font-size:inherit;margin:0 0.12rem;font-weight:500;
}
.footer{text-align:center;margin-top:0.6rem;font-size:0.7rem;color:var(--text-3);opacity:0.5}

/* ═══════════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════════ */

/* Tablet */
@media(max-width:1023px){
  #results{grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
}

/* Mobile */
@media(max-width:640px){
  .app{padding:0.8rem 0.7rem 4rem}
  .header{margin-bottom:1rem}
  .search-form{flex-direction:column;gap:0.5rem}
  .btn-primary{width:100%;padding:0.85rem}
  #results{grid-template-columns:1fr}
  .platform-header{flex-wrap:wrap}
  .platform-body{padding-left:1rem;padding-right:0.7rem}
  .platform-header{padding-left:1rem;padding-right:0.7rem}
  .result-list a{white-space:normal;overflow:visible;text-overflow:unset;font-size:0.88rem}
  .copy-btn{opacity:1} /* mobile always show */
  .kbd-hint{display:none}
  .back-to-top{width:38px;height:38px;bottom:1rem;right:0.8rem}
  .platform-count{font-size:0.72rem}
}

/* Very small screens */
@media(max-width:380px){
  .search-tab{padding:0.35rem 0.8rem;font-size:0.78rem}
  #searchInput{font-size:0.85rem}
  .tag{font-size:0.65rem;padding:0.12rem 0.4rem}
}

/* Touch devices */
@media(hover:none){
  .copy-btn{opacity:0.7}
  .platform-card:hover{transform:none;box-shadow:none}
  .btn-primary:hover{transform:none}
}
</style>
</head>
<body>
<div class="bg-aurora"></div>
<div class="bg-grid"></div>

<div class="app">
  <!-- HEADER -->
  <header class="header">
    <a class="logo-link" onclick="clearResults();document.getElementById('searchInput').focus()" title="点击重置">
      <h1 class="logo"><span class="icon">🔍</span>SearchGAL</h1>
    </a>
    <p class="tagline">聚合搜索 · 实时流式 · 多端适配</p>
  </header>

  <!-- SEARCH TABS -->
  <div style="text-align:center">
    <div class="search-tabs" id="searchTabs" role="tablist" aria-label="搜索类型">
      <button class="search-tab active" data-mode="gal" role="tab" aria-selected="true">
        🎮 资源搜索<span class="tab-badge">31</span>
      </button>
      <button class="search-tab" data-mode="patch" role="tab" aria-selected="false">
        🩹 补丁搜索<span class="tab-badge">2</span>
      </button>
    </div>
  </div>

  <!-- SEARCH BAR -->
  <div class="search-wrapper" id="searchWrapper">
    <form class="search-form" id="searchForm" autocomplete="off">
      <div class="input-wrap" id="inputWrap">
        <span class="search-icon">🔎</span>
        <input type="text" name="game" id="searchInput"
               placeholder="输入 Galgame 名称，如：千恋万花"
               required autofocus maxlength="100"
               aria-label="搜索关键词" autocomplete="off">
        <button type="button" class="input-clear" id="inputClear" aria-label="清空">&times;</button>
      </div>
      <button type="submit" class="btn btn-primary" id="submitBtn" aria-label="开始搜索">
        🔍 搜索
      </button>
    </form>
    <div class="history-dropdown" id="historyDropdown" role="listbox"></div>
  </div>
  <p class="platform-count">已接入 <b>31</b> 个资源站 + <b>2</b> 个补丁站 · 实时聚合</p>

  <!-- STATS -->
  <div class="stats-bar" id="statsBar">
    <span id="statsText"></span>
    <button class="btn btn-ghost" onclick="clearResults()" aria-label="清空">清空结果</button>
  </div>

  <!-- PROGRESS -->
  <div class="progress-wrap" aria-live="polite">
    <div class="progress-track">
      <div class="progress-fill" id="progressFill" style="width:0%"></div>
    </div>
    <span id="progressText">就绪</span>
  </div>

  <!-- RESULTS -->
  <main id="results" role="region" aria-label="搜索结果"></main>

  <!-- EMPTY STATE (hidden initially) -->

  <!-- FOOTER -->
  <div class="kbd-hint" aria-label="快捷键">
    <kbd>Enter</kbd> 搜索 &nbsp;<kbd>Esc</kbd> 清空 &nbsp;<kbd>/</kbd> 聚焦
  </div>
  <p class="footer">SearchGAL · 资源索引工具 · 请支持正版</p>
</div>

<!-- BACK TO TOP -->
<button class="back-to-top" id="backToTop" aria-label="回到顶部" title="回到顶部">↑</button>

<!-- TOAST -->
<div class="toast" id="toast"><span class="toast-icon"></span><span id="toastMsg"></span></div>

<script>
/* ═══════════════════════════════════════
   DOM REFS
   ═══════════════════════════════════════ */
var $=function(id){return document.getElementById(id)};
var searchForm=$('searchForm'),searchInput=$('searchInput'),submitBtn=$('submitBtn'),
    inputClear=$('inputClear'),historyDD=$('historyDropdown'),
    progressFill=$('progressFill'),progressText=$('progressText'),
    resultsEl=$('results'),statsBar=$('statsBar'),statsText=$('statsText'),
    toast=$('toast'),toastMsg=$('toastMsg'),backToTop=$('backToTop');

/* ═══════════════════════════════════════
   STATE
   ═══════════════════════════════════════ */
var searchMode='gal',buffer='',isSearching=false,startTime=0,
    resultCount=0,errorCount=0,lastSearchTime=0,totalPlatforms=0,
    COOLDOWN=2000,SHOW_LIMIT=8,HISTORY_KEY='searchgal_hist2',MAX_HISTORY=5,toastTimer=null;

/* ═══════════════════════════════════════
   SEARCH MODE TABS
   ═══════════════════════════════════════ */
$('searchTabs').addEventListener('click',function(e){
  var tab=e.target.closest('.search-tab');if(!tab||isSearching)return;
  searchMode=tab.dataset.mode;
  this.querySelectorAll('.search-tab').forEach(function(t){t.classList.remove('active');t.setAttribute('aria-selected','false')});
  tab.classList.add('active');tab.setAttribute('aria-selected','true');
  clearResults();searchInput.focus();
});

/* ═══════════════════════════════════════
   INPUT CLEAR
   ═══════════════════════════════════════ */
function updateClearBtn(){inputClear.classList.toggle('visible',searchInput.value.length>0)}
searchInput.addEventListener('input',updateClearBtn);
inputClear.addEventListener('click',function(){searchInput.value='';updateClearBtn();searchInput.focus();clearResults()});

/* ═══════════════════════════════════════
   TOAST
   ═══════════════════════════════════════ */
function showToast(msg,icon){icon=icon||'✅';toast.querySelector('.toast-icon').textContent=icon;toastMsg.textContent=msg;
  toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){toast.classList.remove('show')},2000)}

/* ═══════════════════════════════════════
   BACK TO TOP
   ═══════════════════════════════════════ */
function updateBackToTop(){backToTop.classList.toggle('visible',window.scrollY>500)}
window.addEventListener('scroll',updateBackToTop,{passive:true});
backToTop.addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'})});

/* ═══════════════════════════════════════
   HISTORY
   ═══════════════════════════════════════ */
function getHistory(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')}catch(e){return[]}}
function saveHistory(kw){var h=getHistory();h=[kw].concat(h.filter(function(k){return k!==kw})).slice(0,MAX_HISTORY);try{localStorage.setItem(HISTORY_KEY,JSON.stringify(h))}catch(e){}}
function removeHistory(kw,e){e.stopPropagation();var h=getHistory().filter(function(k){return k!==kw});try{localStorage.setItem(HISTORY_KEY,JSON.stringify(h))}catch(e){};renderHistoryDD()}
function clearAllHistory(){try{localStorage.removeItem(HISTORY_KEY)}catch(e){};renderHistoryDD()}

function renderHistoryDD(){
  var h=getHistory();if(!h.length){historyDD.classList.remove('show');return}
  var html='';h.forEach(function(kw){html+='<div class="history-item" data-kw="'+kw.replace(/"/g,'&quot;')+'"><span>'+kw+'</span><button class="del-btn" data-del="'+kw.replace(/"/g,'&quot;')+'" aria-label="删除">&times;</button></div>'});
  html+='<div class="history-clear">清除全部历史</div>';historyDD.innerHTML=html;historyDD.classList.add('show');
  historyDD.querySelectorAll('.history-item').forEach(function(el){
    el.addEventListener('click',function(){searchInput.value=el.getAttribute('data-kw');updateClearBtn();historyDD.classList.remove('show');searchForm.dispatchEvent(new Event('submit'))})});
  historyDD.querySelectorAll('.del-btn').forEach(function(btn){btn.addEventListener('click',function(e){removeHistory(btn.getAttribute('data-del'),e)})});
  var ca=historyDD.querySelector('.history-clear');if(ca)ca.addEventListener('click',clearAllHistory)
}

/* ═══════════════════════════════════════
   CLIPBOARD
   ═══════════════════════════════════════ */
function copyLink(url,btn){
  function done(){if(btn){btn.textContent='✓';btn.classList.add('copied');setTimeout(function(){btn.textContent='📋';btn.classList.remove('copied')},1500)}showToast('链接已复制')}
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(url).then(done).catch(function(){showToast('复制失败','⚠️')})}
  else{var ta=document.createElement('textarea');ta.value=url;ta.style.cssText='position:fixed;left:-9999px';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done()}catch(e){showToast('复制失败','⚠️')};document.body.removeChild(ta)}
}

/* ═══════════════════════════════════════
   SKELETON
   ═══════════════════════════════════════ */
function showSkeletons(count){
  resultsEl.querySelectorAll('.skeleton-card').forEach(function(el){el.remove()});
  var frag=document.createDocumentFragment();count=Math.min(count,6);
  for(var i=0;i<count;i++){var card=document.createElement('div');card.className='skeleton-card';
    card.innerHTML='<div class="skel-header"><div class="skel-dot"></div><div class="skel-line w30"></div></div><div class="skel-line w90"></div><div class="skel-line w70"></div><div class="skel-line w50"></div>';
    card.style.animationDelay=(i*0.06)+'s';frag.appendChild(card)}
  resultsEl.appendChild(frag)
}

/* ═══════════════════════════════════════
   STATE MGMT
   ═══════════════════════════════════════ */
function setSearching(active){
  isSearching=active;submitBtn.disabled=active;searchInput.readOnly=active;
  if(active){resultsEl.innerHTML='';progressFill.style.width='0%';progressFill.classList.remove('done');
    progressText.textContent='搜索中...';statsBar.style.display='none';startTime=Date.now();
    resultCount=0;errorCount=0;totalPlatforms=0;historyDD.classList.remove('show')}
  else{progressFill.classList.add('done');statsBar.style.display='flex';updateStats()}
}

function updateStats(){
  var elapsed=((Date.now()-startTime)/1000).toFixed(1);
  var h='<span class="stats-dot ok"></span>已搜索 <b>'+resultCount+'</b> 个平台';
  if(errorCount>0)h+=' · <span class="stats-dot err"></span><b>'+errorCount+'</b> 错误';
  h+=' · '+elapsed+'s';statsText.innerHTML=h
}

window.clearResults=function(){
  resultsEl.innerHTML='';statsBar.style.display='none';progressText.textContent='就绪';
  progressFill.style.width='0%';progressFill.classList.remove('done');totalPlatforms=0
}

/* ═══════════════════════════════════════
   TAG COLOR MAPPER
   ═══════════════════════════════════════ */
function tagClass(t){
  if(t==='breaker')return'tag-red';
  if(t==='NoReq'||t==='SuDrive'||t==='NoSplDrive')return'tag-green';
  if(t==='magic'||t==='SplDrive'||t==='BTmag'||t==='MixDrive')return'tag-amber';
  return'tag-gray'
}

/* ═══════════════════════════════════════
   SUBMIT
   ═══════════════════════════════════════ */
searchForm.addEventListener('submit',function(e){
  e.preventDefault();var game=searchInput.value.trim();if(!game||isSearching)return;
  var now=Date.now();if(now-lastSearchTime<COOLDOWN)return;lastSearchTime=now;
  setSearching(true);saveHistory(game);
  // 手动构建 FormData（不能依赖 form 自动收集，因为 setSearching 会 disabled 输入框）
  var fd=new FormData();fd.append('game',game);

  fetch('/'+searchMode,{method:'POST',body:fd}).then(function(res){
    if(!res.ok)return res.json().then(function(err){throw new Error(err.error||'搜索失败 ('+res.status+')')});
    var reader=res.body.getReader(),decoder=new TextDecoder();buffer='';
    function pump(){return reader.read().then(function(r){
      if(r.value){buffer+=decoder.decode(r.value,{stream:true});var lines=buffer.split('\\n');buffer=lines.pop()||'';
        lines.forEach(function(l){if(!l.trim())return;try{processMsg(JSON.parse(l))}catch(err){console.warn('跳过:',l.slice(0,80))}})}
      if(r.done){if(buffer.trim())try{processMsg(JSON.parse(buffer))}catch(e){}
        if(resultsEl.children.length===0)showEmpty();setSearching(false);return}
      return pump()
    })}
    return pump()
  }).catch(function(err){
    resultsEl.innerHTML='<div class="empty-state"><span class="empty-icon">⚠️</span><h3>搜索出错</h3><p>'+err.message+'</p></div>';
    progressText.textContent='失败';setSearching(false)
  })
});

/* ═══════════════════════════════════════
   SSE PROCESS
   ═══════════════════════════════════════ */
function processMsg(d){
  if(typeof d.total==='number'&&!d.progress){totalPlatforms=d.total;progressText.textContent='0/'+totalPlatforms;showSkeletons(Math.min(totalPlatforms,6));return}
  if(d.progress){var c=d.progress.completed,t=d.progress.total;if(!totalPlatforms)totalPlatforms=t;
    progressFill.style.width=(c/t*100)+'%';progressText.textContent=c+'/'+t;
    if(d.result){resultsEl.querySelectorAll('.skeleton-card').forEach(function(el){el.remove()});addCard(d.result);resultCount++;if(d.result.error)errorCount++}}
  if(d.done){resultsEl.querySelectorAll('.skeleton-card').forEach(function(el){el.remove()});if(!resultsEl.children.length)showEmpty()}
}

function showEmpty(){resultsEl.innerHTML='<div class="empty-state"><span class="empty-icon">📭</span><h3>没有找到相关资源</h3><p>试试缩短关键词，或使用中文名称</p></div>';progressText.textContent='无结果'}

/* ═══════════════════════════════════════
   CARD RENDER
   ═══════════════════════════════════════ */
function addCard(r){
  var card=document.createElement('div');card.className='platform-card';card.setAttribute('role','article');
  if(r.error)card.classList.add('error-card');

  // left accent
  if(r.color)card.style.setProperty('--card-accent',r.color);
  else if(r.error)card.style.setProperty('--card-accent','var(--error)');

  // header
  var hdr=document.createElement('div');hdr.className='platform-header';
  var dot=document.createElement('span');dot.className='platform-dot';dot.style.background=r.color||'#888';dot.setAttribute('aria-hidden','true');
  var nm=document.createElement('span');nm.className='platform-name';nm.textContent=r.name;
  hdr.appendChild(dot);hdr.appendChild(nm);

  // count badge
  if(!r.error&&r.items&&r.items.length){
    var badge=document.createElement('span');badge.className='platform-count-badge';badge.textContent=r.items.length+'条';hdr.appendChild(badge)}

  // tags
  if(r.tags&&r.tags.length){var tw=document.createElement('div');tw.className='platform-tags';
    r.tags.forEach(function(t){var s=document.createElement('span');s.className='tag '+tagClass(t);s.textContent=t;tw.appendChild(s)});hdr.appendChild(tw)}
  card.appendChild(hdr);

  // body
  var body=document.createElement('div');body.className='platform-body';
  if(r.error){var ep=document.createElement('p');ep.className='error-text';ep.textContent='⚠️ '+r.error;body.appendChild(ep)}
  else if(r.items&&r.items.length){
    var all=r.items,ul=document.createElement('ul');ul.className='result-list';ul.setAttribute('role','list');
    function render(exp){ul.innerHTML='';var items=exp?all:all.slice(0,SHOW_LIMIT);
      items.forEach(function(item){var li=document.createElement('li');li.setAttribute('role','listitem');
        var a=document.createElement('a');a.href=item.url;a.textContent=item.name;a.target='_blank';a.rel='noopener noreferrer';li.appendChild(a);
        var cb=document.createElement('button');cb.className='copy-btn';cb.textContent='📋';cb.title='复制链接';cb.setAttribute('aria-label','复制');
        cb.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();copyLink(item.url,cb)});li.appendChild(cb);ul.appendChild(li)})}
    render(false);body.appendChild(ul);
    if(all.length>SHOW_LIMIT){var lb=document.createElement('button');lb.className='btn-load-more';lb.textContent='查看全部 '+all.length+' 个结果';var exp=false;
      lb.addEventListener('click',function(){exp=!exp;render(exp);lb.textContent=exp?'收起':'查看全部 '+all.length+' 个结果'});body.appendChild(lb)}
  }else{card.classList.add('empty-card');var nr=document.createElement('p');nr.className='empty-text';nr.textContent='无结果';body.appendChild(nr)}
  card.appendChild(body);

  var skel=resultsEl.querySelector('.skeleton-card');if(skel)skel.replaceWith(card);else resultsEl.appendChild(card)
}

/* ═══════════════════════════════════════
   KEYBOARD
   ═══════════════════════════════════════ */
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){if(historyDD.classList.contains('show')){historyDD.classList.remove('show')}else if(!isSearching){searchForm.reset();updateClearBtn();clearResults()}}
  if(e.key==='/'&&document.activeElement!==searchInput&&!isSearching){e.preventDefault();searchInput.focus()}
});

/* ═══════════════════════════════════════
   HISTORY INTERACTION
   ═══════════════════════════════════════ */
searchInput.addEventListener('focus',function(){if(!isSearching)renderHistoryDD()});
searchInput.addEventListener('input',function(){updateClearBtn();if(!isSearching&&!searchInput.value.trim())renderHistoryDD();else historyDD.classList.remove('show')});
document.addEventListener('click',function(e){if(!historyDD.contains(e.target)&&e.target!==searchInput)historyDD.classList.remove('show')});

// init
updateClearBtn();
</script>
</body>
</html>`;

// ──────────────────────────────────────────────
//  核心: POST 搜索处理
// ──────────────────────────────────────────────
async function handleSearch(
  request: Request,
  ctx: ExecutionContext,
  platforms: Platform[],
): Promise<Response> {
  let game: string;
  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const fd = await request.formData();
      game = (fd.get("game") as string) ?? "";
    } else {
      const body = await request.json() as Record<string, unknown>;
      game = String(body.game ?? "");
    }
  } catch { return errorResponse("无法解析请求体", 400); }

  game = game.trim();
  if (!game) return errorResponse("请输入游戏名称", 400);
  if (game.length > MAX_KEYWORD_LEN) return errorResponse(`关键词过长，最多 ${MAX_KEYWORD_LEN} 字符`, 400);
  game = game.replace(/[\x00-\x1F\x7F]/g, "");

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  ctx.waitUntil(
    handleSearchRequestStream(game, platforms, writer)
      .catch((err) => {
        console.error("Streaming error:", err);
        writer.write(encoder.encode(JSON.stringify({ error: "搜索过程发生错误", done: true }) + "\n")).catch(() => {});
      })
      .finally(() => writer.close().catch(() => {}))
  );
  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Content-Type-Options": "nosniff",
      ...CORS_HEADERS,
    },
  });
}

// ──────────────────────────────────────────────
//  Cloudflare Worker 入口
// ──────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    // 首页 (Cache API)
    if (request.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
      const cacheKey = new Request(url.origin + "/__html_v2", request);
      const cache = caches.default;
      const cached = await cache.match(cacheKey);
      if (cached) return cached;
      const response = new Response(HTML_TEMPLATE, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
          "CDN-Cache-Control": "public, max-age=86400",
          "Vary": "Accept-Encoding",
          "X-Content-Type-Options": "nosniff",
        },
      });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    }

    // 健康检查
    if (request.method === "GET" && pathname === "/health") {
      const health = getPlatformHealth();
      const breakerCount = Object.keys(health).length;
      return jsonResponse({
        status: "ok", uptime: "Cloudflare Workers",
        platforms: { gal: PLATFORMS_GAL.length, patch: PLATFORMS_PATCH.length },
        circuitBreakers: breakerCount, breakerDetails: health,
        timestamp: new Date().toISOString(),
      }, 200);
    }

    // CORS
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

    // POST
    if (request.method === "POST") {
      const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
      if (isRateLimited(ip)) return errorResponse("请求过于频繁，请稍后再试", 429);
      switch (pathname) {
        case "/gal": return handleSearch(request, ctx, PLATFORMS_GAL);
        case "/patch": return handleSearch(request, ctx, PLATFORMS_PATCH);
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
