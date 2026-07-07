import type { Env, Platform, PlatformSearchResult } from "./types";

import platformsGal from "./platforms/gal";
import platformsPatch from "./platforms/patch";
import { setDefaultTimeout, DEFAULT_TIMEOUT_MS } from "./utils/httpClient";

const DEFAULT_CONCURRENCY = 6;     // Cloudflare 优化：默认 6 个并发；可经 SEARCHGAL_CONCURRENCY 环境变量覆盖
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN = 120_000;
const CACHE_TTL_RESULT_SECONDS = 1_800;

// ── 日志 ──
// 默认 "warn"：只保留 warn/error，抑制高频的 info 日志（生产环境日志量降 ~90%，
// Cloudflare Observability 按量计费，少打日志=省钱）。设 LOG_LEVEL="info"/"debug"
// （或用 ENVIRONMENT="dev"）可开启完整日志用于排查。
type LogLevel = "info" | "warn" | "error";
const LOG_RANK: Record<LogLevel, number> = { info: 1, warn: 2, error: 3 };
let LOG_LEVEL: LogLevel = "warn";
function resolveLogLevel(env?: Env): LogLevel {
  const raw = String(env?.LOG_LEVEL ?? env?.ENVIRONMENT ?? "warn").toLowerCase();
  if (raw === "info" || raw === "debug" || raw === "dev" || raw === "trace") return "info";
  if (raw === "error" || raw === "fatal") return "error";
  return "warn";
}
// 并发数可经 SEARCHGAL_CONCURRENCY 环境变量覆盖（免费计划可调低以规避 CPU 时间限制）
function resolveConcurrency(env?: Env): number {
  const raw = Number(env?.SEARCHGAL_CONCURRENCY);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_CONCURRENCY;
}
// 单平台超时（毫秒）可经 SEARCHGAL_TIMEOUT_MS 环境变量覆盖；同步下发到 fetchClient 作为唯一超时源
function resolveTimeout(env?: Env): number {
  const raw = Number(env?.SEARCHGAL_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_TIMEOUT_MS;
}
function log(level: LogLevel, message: string) {
  if (LOG_RANK[level] >= LOG_RANK[LOG_LEVEL]) {
    if (level === "error") console.error(JSON.stringify({ message, level }));
    else console.log(JSON.stringify({ message, level }));
  }
}

// ── 熔断器 ──
interface Breaker { failures: number; until: number; lastError: string }
const breakers = new Map<string, Breaker>();

function isOpen(name: string): boolean {
  const b = breakers.get(name);
  if (!b) return false;
  if (Date.now() > b.until) { breakers.delete(name); return false; }
  return true;
}
function ok(name: string) { breakers.delete(name); }
function fail(name: string, err: string) {
  const b = breakers.get(name) || { failures: 0, until: 0, lastError: "" };
  b.failures++; b.lastError = err;
  if (b.failures >= BREAKER_THRESHOLD) {
    b.until = Date.now() + BREAKER_COOLDOWN;
    log("warn", `熔断: ${name} (连续${b.failures}次)`);
  }
  breakers.set(name, b);
}

export function getPlatformHealth(): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  for (const [k, v] of breakers) r[k] = { failures: v.failures, lastError: v.lastError, open: isOpen(k), cooldown: Math.max(0, Math.ceil((v.until - Date.now()) / 1000)) };
  return r;
}

// ── 并发控制 ──
async function eachLimit<T, R>(items: T[], fn: (item: T, i: number) => Promise<R>, limit: number): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  const worker = async () => { while (idx < items.length) { const i = idx++; out[i] = await fn(items[i], i); } };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

// ── 核心搜索流 ──
function fmt(data: object) { return JSON.stringify(data) + "\n"; }

// ponytail: 平台集合是编译期常量，哈希代价极低，不需要 WeakMap 记忆化
function hashPlatformSet(platforms: Platform[]): string {
  let hash = 5381;
  for (const platform of platforms) {
    const name = platform.name.toLowerCase();
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) + hash) ^ name.charCodeAt(i);
    }
  }
  return (hash >>> 0).toString(36);
}

function cacheKey(game: string, platforms: Platform[]): string {
  return `search:v2:${hashPlatformSet(platforms)}:${game.toLowerCase().trim()}`;
}

// 尝试从 KV 读取缓存
async function getCache(env: Env, key: string): Promise<object[] | null> {
  if (!env.SEARCHGAL_KV) return null;
  try {
    const cached = await env.SEARCHGAL_KV.get(key, "json");
    return cached as object[] | null;
  } catch {
    return null;
  }
}

// 写入缓存
async function setCache(env: Env, key: string, data: object[], ttlSeconds: number): Promise<void> {
  if (!env.SEARCHGAL_KV) return;
  try {
    await env.SEARCHGAL_KV.put(key, JSON.stringify(data), { expirationTtl: ttlSeconds });
  } catch (e) {
    console.error("Cache write failed:", e);
  }
}

export async function handleSearchRequestStream(
  game: string, platforms: Platform[], writer: WritableStreamDefaultWriter<Uint8Array>,
  env?: Env, ctx?: ExecutionContext
): Promise<void> {
  LOG_LEVEL = resolveLogLevel(env);
  setDefaultTimeout(resolveTimeout(env));
  const concurrency = resolveConcurrency(env);
  log("info", `搜索: ${game}`);
  const enc = new TextEncoder();
  let done = 0;

  // 检查 KV 缓存
  if (env?.SEARCHGAL_KV) {
    const key = cacheKey(game, platforms);
    const cached = await getCache(env, key);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      log("info", `缓存命中: ${game}`);
      // 重放缓存的 SSE 事件（直接序列化，不使用 fmt）
      for (const event of cached) {
        await writer.write(enc.encode(JSON.stringify(event) + "\n"));
      }
      return; // 直接返回，无需实际搜索
    }
  }

  // 写锁
  let lock: Promise<void> = Promise.resolve();
  const collectedEvents: object[] = [];
  let hasResultItems = false;
  const wr = (d: object) => { collectedEvents.push(d); lock = lock.then(() => writer.write(enc.encode(fmt(d))).catch(() => {})); return lock; };

  // 标记熔断
  const items = platforms.map(p => ({ p, skip: isOpen(p.name) }));
  const total = items.length;
  await wr({ total });

  // 发送跳过
  for (const it of items) {
    if (!it.skip) continue;
    done++;
    const b = breakers.get(it.p.name);
    await wr({ progress: { completed: done, total }, result: { name: it.p.name, color: "#555", tags: [...it.p.tags, "breaker"], items: [], error: "已熔断 · " + (b?.lastError || "未知") } });
  }

  const active = items.filter(it => !it.skip);

  await eachLimit(active, async (it) => {
    const p = it.p; const t0 = Date.now();
    try {
      const res = await p.search(game);
      const ms = Date.now() - t0; done++;
      if (res.error) { fail(p.name, res.error); log("error", `${p.name} 错误(${ms}ms): ${res.error}`); await wr({ progress: { completed: done, total }, result: { name: p.name, color: "red", tags: p.tags, items: res.items, error: res.error } }); }
      else {
        ok(p.name);
        if (res.count > 0) { hasResultItems = true; log("info", `${p.name} ${res.count}条(${ms}ms)`); }
        // 即使 0 结果也下发 result 事件（items 为空数组），前端据此在左侧列表显示该平台（灰色「空结果」态），
        // 让用户能区分「搜了没结果」与「没搜」。hasResultItems 仍只在有条目时置真，空结果不缓存逻辑不受影响。
        await wr({ progress: { completed: done, total }, result: { name: p.name, color: p.color, tags: p.tags, items: res.items } });
      }
    } catch (e) { done++; const ms = Date.now() - t0; const msg = e instanceof Error ? e.message : String(e); fail(p.name, msg); log("error", `${p.name} 异常(${ms}ms): ${msg}`); await wr({ progress: { completed: done, total } }); }
  }, concurrency);

  await wr({ done: true });
  
  // 写入 KV 缓存（用 ctx.waitUntil 异步写入，不阻塞响应返回）
  // 只要拿到结果条目（hasResultItems）就缓存，即使个别平台超时/报错也照常缓存，
  // 解决原来「任一平台失败则整次不缓存」导致的命中率过低问题。
  if (env?.SEARCHGAL_KV && collectedEvents.length > 0 && hasResultItems) {
    const key = cacheKey(game, platforms);
    // 仅缓存有意义的最终事件（total / result / done），丢弃纯进度的 progress 事件，减小 KV 体积
    const toCache = collectedEvents.filter((e) => "total" in e || "result" in e || "done" in e);
    const cachePromise = setCache(env, key, toCache, CACHE_TTL_RESULT_SECONDS);
    if (ctx) {
      ctx.waitUntil(cachePromise);
    } else {
      await cachePromise;
    }
    log("info", `已缓存: ${game} (${CACHE_TTL_RESULT_SECONDS}s)`);
  } else if (collectedEvents.length > 0 && !hasResultItems) {
    log("warn", `跳过缓存: ${game} (无结果条目)`);
  }
}

export const PLATFORMS_GAL = platformsGal;
export const PLATFORMS_PATCH = platformsPatch;
