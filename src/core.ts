import type { Platform, PlatformSearchResult, StreamProgress, StreamResult } from "./types";
import type { Env } from "./types";

import platformsGal from "./platforms/gal";
import platformsPatch from "./platforms/patch";

const PLATFORM_TIMEOUT_MS = 12_000;
const CONCURRENCY = 6;
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN = 120_000;
const CACHE_TTL_SECONDS = 300;

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

function cacheKey(game: string, platformCount: number): string {
  return `search:${game.toLowerCase().trim()}:${platformCount}`;
}

async function getCache(env: Env, key: string): Promise<object[] | null> {
  if (!env.SEARCHGAL_KV) return null;
  try { return await env.SEARCHGAL_KV.get(key, "json") as object[] | null; } catch { return null; }
}

async function setCache(env: Env, key: string, data: object[]): Promise<void> {
  if (!env.SEARCHGAL_KV) return;
  try { await env.SEARCHGAL_KV.put(key, JSON.stringify(data), { expirationTtl: CACHE_TTL_SECONDS }); } catch (e) { console.error("Cache write failed:", e); }
}

// ── 相关性评分 ──
function scoreItem(title: string, query: string): number {
  const t = (title || "").toLowerCase();
  const q = (query || "").toLowerCase().trim();
  if (!t || !q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 70;
  const qw = q.split(/\s+/).filter(Boolean);
  let ws = 0;
  for (const w of qw) { if (t.includes(w)) ws += 30; }
  if (ws > 0) return Math.min(ws, 65);
  return 10;
}

export async function handleSearchRequestStream(
  game: string, platforms: Platform[], writer: WritableStreamDefaultWriter<Uint8Array>,
  env?: Env
): Promise<void> {
  console.log(JSON.stringify({ message: `搜索: ${game}`, level: "info" }));
  const enc = new TextEncoder();
  let done = 0;

  // KV 缓存
  if (env?.SEARCHGAL_KV) {
    const key = cacheKey(game, platforms.length);
    const cached = await getCache(env, key);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      console.log(JSON.stringify({ message: `缓存命中: ${game}`, level: "info" }));
      for (const event of cached) { await writer.write(enc.encode(JSON.stringify(event) + "\n")); }
      return;
    }
  }

  let lock: Promise<void> = Promise.resolve();
  const collectedEvents: object[] = [];
  const wr = (d: object) => { collectedEvents.push(d); lock = lock.then(() => writer.write(enc.encode(fmt(d)))); return lock; };

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
      // 重试逻辑：失败时最多重试 1 次
      let res: PlatformSearchResult | null = null;
      let lastErr: string | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          res = await Promise.race([p.search(game), new Promise<PlatformSearchResult>((_, rj) => setTimeout(() => rj(new Error("超时")), PLATFORM_TIMEOUT_MS))]);
          if (!res.error) break; // 成功，跳出重试
          lastErr = res.error;
          if (attempt < 1) await new Promise(r => setTimeout(r, 500)); // 失败等待 500ms 再重试
        } catch (e) {
          lastErr = e instanceof Error ? e.message : String(e);
          if (attempt < 1) await new Promise(r => setTimeout(r, 500));
        }
      }
      if (!res) {
        // 两次都失败，构造错误结果
        res = { items: [], count: 0, error: lastErr || "请求失败" };
      }
      const ms = Date.now() - t0; done++;
      if (res.error) {
        fail(p.name, res.error);
        console.log(JSON.stringify({ message: `${p.name} 错误(${ms}ms): ${res.error}`, level: "error" }));
        await wr({ progress: { completed: done, total }, result: { name: p.name, color: "red", tags: p.tags, items: [], error: res.error } });
      } else {
        ok(p.name);
        if (res.count > 0) {
          console.log(JSON.stringify({ message: `${p.name} ${res.count}条(${ms}ms)`, level: "info" }));
          const scoredItems = (res.items || []).map(it => ({ ...it, _score: scoreItem(it.title || it.name || "", game) }));
          await wr({ progress: { completed: done, total }, result: { name: p.name, color: p.color, tags: p.tags, items: scoredItems } });
        } else {
          await wr({ progress: { completed: done, total } });
        }
      }
    } catch (e) {
      done++; const ms = Date.now() - t0; const msg = e instanceof Error ? e.message : String(e);
      fail(p.name, msg);
      console.log(JSON.stringify({ message: `${p.name} 异常(${ms}ms): ${msg}`, level: "error" }));
      await wr({ progress: { completed: done, total } });
    }
  }, CONCURRENCY);

  await wr({ done: true });

  // 写入 KV 缓存
  if (env?.SEARCHGAL_KV && collectedEvents.length > 0) {
    const key = cacheKey(game, platforms.length);
    await setCache(env, key, collectedEvents);
    console.log(JSON.stringify({ message: `已缓存: ${game}`, level: "info" }));
  }
}

export const PLATFORMS_GAL = platformsGal;
export const PLATFORMS_PATCH = platformsPatch;
