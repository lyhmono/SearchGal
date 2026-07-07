import type { Env, Platform, StreamResult } from "./types";

import platformsGal from "./platforms/gal";
import platformsPatch from "./platforms/patch";
import { setDefaultTimeout, DEFAULT_TIMEOUT_MS } from "./utils/httpClient";

const DEFAULT_CONCURRENCY = 6;     // Cloudflare 优化：默认 6 个并发；可经 SEARCHGAL_CONCURRENCY 环境变量覆盖
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN = 120_000;
export const CACHE_TTL_RESULT_SECONDS = 1_800;

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

// ── 核心搜索流 ──

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

export function cacheKey(game: string, platforms: Platform[]): string {
  return `search:v2:${hashPlatformSet(platforms)}:${game.toLowerCase().trim()}`;
}

// 尝试从 KV 读取缓存
export async function getCache(env: Env, key: string): Promise<object[] | null> {
  if (!env.SEARCHGAL_KV) return null;
  try {
    const cached = await env.SEARCHGAL_KV.get(key, "json");
    return cached as object[] | null;
  } catch {
    return null;
  }
}

// 写入缓存
export async function setCache(env: Env, key: string, data: object[], ttlSeconds: number): Promise<void> {
  if (!env.SEARCHGAL_KV) return;
  try {
    await env.SEARCHGAL_KV.put(key, JSON.stringify(data), { expirationTtl: ttlSeconds });
  } catch (e) {
    console.error("Cache write failed:", e);
  }
}

// ── 批处理收集式搜索（供 fan-out 子调用 /__batch 使用）──
// 直接返回结果数组（不做 SSE 流式），每个调用拥有专属 50 子请求预算，
// 从而把 37+ 平台拆成多批触发多次调用，在免费计划下突破「单次调用 50 子请求」硬上限。
// 关键点：每个 /__batch 调用都是一次【独立】Worker 调用，拥有自己专属的 50 子请求预算，
// 因此把 37+ 平台拆成多批触发多次调用，就能在免费计划下突破「单次调用 50 子请求」硬上限。
export async function runPlatformsCollect(
  game: string, platforms: Platform[], env?: Env
): Promise<StreamResult[]> {
  LOG_LEVEL = resolveLogLevel(env);
  setDefaultTimeout(resolveTimeout(env));
  const concurrency = resolveConcurrency(env);
  const out: StreamResult[] = new Array(platforms.length);
  let idx = 0;
  const worker = async () => {
    while (idx < platforms.length) {
      const i = idx++;
      const p = platforms[i];
      if (isOpen(p.name)) {
        const b = breakers.get(p.name);
        out[i] = { name: p.name, color: "#555", tags: [...p.tags, "breaker"], items: [], error: "已熔断 · " + (b?.lastError || "未知") };
        continue;
      }
      const t0 = Date.now();
      try {
        const res = await p.search(game);
        const ms = Date.now() - t0;
        if (res.error) { fail(p.name, res.error); log("error", `${p.name} 错误(${ms}ms): ${res.error}`); out[i] = { name: p.name, color: "red", tags: p.tags, items: res.items, error: res.error }; }
        else { ok(p.name); if (res.count > 0) log("info", `${p.name} ${res.count}条(${ms}ms)`); out[i] = { name: p.name, color: p.color, tags: p.tags, items: res.items }; }
      } catch (e) {
        const ms = Date.now() - t0;
        const msg = e instanceof Error ? e.message : String(e);
        fail(p.name, msg); log("error", `${p.name} 异常(${ms}ms): ${msg}`);
        out[i] = { name: p.name, color: "red", tags: p.tags, items: [], error: msg };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, platforms.length) }, () => worker()));
  return out;
}

// 单批平台数量：免费计划单次调用硬上限 50 子请求，需为每个平台预留重定向等额外子请求。
// 默认 8（即便单平台平均 2~3 子请求，单批也远低于 50）。可用 SEARCHGAL_BATCH_SIZE 覆盖（上限 20）。
export function resolveBatchSize(env?: Env): number {
  const raw = Number(env?.SEARCHGAL_BATCH_SIZE);
  return Number.isFinite(raw) && raw > 0 ? Math.min(Math.floor(raw), 20) : 8;
}

export const PLATFORMS_GAL = platformsGal;
export const PLATFORMS_PATCH = platformsPatch;
