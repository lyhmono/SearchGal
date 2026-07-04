import type { Env, Platform, PlatformSearchResult } from "./types";

import platformsGal from "./platforms/gal";
import platformsPatch from "./platforms/patch";

const PLATFORM_TIMEOUT_MS = 12_000;  // Cloudflare 优化：12秒超时
const CONCURRENCY = 6;             // Cloudflare 优化：6个并发
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN = 120_000;
const CACHE_TTL_RESULT_SECONDS = 1_800;
const CACHE_TTL_EMPTY_SECONDS = 600;

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
    console.log(JSON.stringify({ message: `熔断: ${name} (连续${b.failures}次)`, level: "warn" }));
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

// 生成缓存 key
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

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("超时")), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
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
  console.log(JSON.stringify({ message: `搜索: ${game}`, level: "info" }));
  const enc = new TextEncoder();
  let done = 0;

  // 检查 KV 缓存
  if (env?.SEARCHGAL_KV) {
    const key = cacheKey(game, platforms);
    const cached = await getCache(env, key);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      console.log(JSON.stringify({ message: `缓存命中: ${game}`, level: "info" }));
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
  let hasDegradedResult = false;
  const wr = (d: object) => { collectedEvents.push(d); lock = lock.then(() => writer.write(enc.encode(fmt(d)))); return lock; };

  // 标记熔断
  const items = platforms.map(p => ({ p, skip: isOpen(p.name) }));
  const total = items.length;
  await wr({ total });

  // 发送跳过
  for (const it of items) {
    if (!it.skip) continue;
    done++;
    hasDegradedResult = true;
    const b = breakers.get(it.p.name);
    await wr({ progress: { completed: done, total }, result: { name: it.p.name, color: "#555", tags: [...it.p.tags, "breaker"], items: [], error: "已熔断 · " + (b?.lastError || "未知") } });
  }

  const active = items.filter(it => !it.skip);

  await eachLimit(active, async (it) => {
    const p = it.p; const t0 = Date.now();
    try {
      const res = await withTimeout<PlatformSearchResult>(p.search(game), p.timeoutMs ?? PLATFORM_TIMEOUT_MS);
      const ms = Date.now() - t0; done++;
      if (res.error) { hasDegradedResult = true; fail(p.name, res.error); console.log(JSON.stringify({ message: `${p.name} 错误(${ms}ms): ${res.error}`, level: "error" })); await wr({ progress: { completed: done, total }, result: { name: p.name, color: "red", tags: p.tags, items: res.items, error: res.error } }); }
      else { ok(p.name); if (res.count > 0) { hasResultItems = true; console.log(JSON.stringify({ message: `${p.name} ${res.count}条(${ms}ms)`, level: "info" })); await wr({ progress: { completed: done, total }, result: { name: p.name, color: p.color, tags: p.tags, items: res.items } }); } else { await wr({ progress: { completed: done, total } }); } }
    } catch (e) { hasDegradedResult = true; done++; const ms = Date.now() - t0; const msg = e instanceof Error ? e.message : String(e); fail(p.name, msg); console.log(JSON.stringify({ message: `${p.name} 异常(${ms}ms): ${msg}`, level: "error" })); await wr({ progress: { completed: done, total } }); }
  }, CONCURRENCY);

  await wr({ done: true });
  
  // 写入 KV 缓存（用 ctx.waitUntil 异步写入，不阻塞响应返回）
  if (env?.SEARCHGAL_KV && collectedEvents.length > 0 && !hasDegradedResult) {
    const key = cacheKey(game, platforms);
    const ttlSeconds = hasResultItems ? CACHE_TTL_RESULT_SECONDS : CACHE_TTL_EMPTY_SECONDS;
    const cachePromise = setCache(env, key, collectedEvents, ttlSeconds);
    if (ctx) {
      ctx.waitUntil(cachePromise);
    } else {
      await cachePromise;
    }
    console.log(JSON.stringify({ message: `已缓存: ${game} (${ttlSeconds}s)`, level: "info" }));
  } else if (hasDegradedResult) {
    console.log(JSON.stringify({ message: `跳过缓存: ${game} (结果不完整)`, level: "warn" }));
  }
}

export const PLATFORMS_GAL = platformsGal;
export const PLATFORMS_PATCH = platformsPatch;
