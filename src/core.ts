import type { Platform, PlatformSearchResult, StreamProgress, StreamResult } from "./types";
import platformsGal from "./platforms/gal";
import platformsPatch from "./platforms/patch";

// ═══════════════════════════════════════════════
//  常量
// ═══════════════════════════════════════════════
const PLATFORM_TIMEOUT_MS = 18_000;       // 单平台超时
const CONCURRENCY_LIMIT = 8;              // 并发上限（避免 31 平台同时打满 TCP 连接）
const BREAKER_THRESHOLD = 3;              // 连续失败 N 次 → 熔断
const BREAKER_COOLDOWN_MS = 120_000;      // 熔断冷却 2 分钟

// ═══════════════════════════════════════════════
//  熔断器 (Circuit Breaker) — 自动跳过故障平台
// ═══════════════════════════════════════════════
interface BreakerEntry {
  failures: number;
  until: number;   // 熔断解除时间戳
  lastError: string;
}

const breakerMap = new Map<string, BreakerEntry>();

/** 检查平台是否被熔断 */
function isCircuitOpen(name: string): boolean {
  const entry = breakerMap.get(name);
  if (!entry) return false;
  if (Date.now() > entry.until) {
    breakerMap.delete(name);
    return false;
  }
  return true;
}

/** 记录成功 → 重置熔断计数 */
function recordSuccess(name: string): void {
  breakerMap.delete(name);
}

/** 记录失败 → 累计，达到阈值则熔断 */
function recordFailure(name: string, error: string): void {
  const existing = breakerMap.get(name);
  const entry: BreakerEntry = existing
    ? { failures: existing.failures + 1, until: existing.until, lastError: error }
    : { failures: 1, until: 0, lastError: error };

  if (entry.failures >= BREAKER_THRESHOLD) {
    entry.until = Date.now() + BREAKER_COOLDOWN_MS;
    console.log(JSON.stringify({
      message: `熔断器触发: ${name} (连续 ${entry.failures} 次失败，冷却 ${BREAKER_COOLDOWN_MS / 1000}s)`,
      level: "warn",
    }));
  }
  breakerMap.set(name, entry);
}

/** 导出平台健康状态（供 /health 端点） */
export function getPlatformHealth(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [name, entry] of breakerMap) {
    result[name] = {
      failures: entry.failures,
      lastError: entry.lastError,
      circuitOpen: isCircuitOpen(name),
      cooldownRemaining: Math.max(0, Math.ceil((entry.until - Date.now()) / 1000)),
    };
  }
  return result;
}

// ═══════════════════════════════════════════════
//  并发控制：限制同时进行的平台搜索数量
// ═══════════════════════════════════════════════
async function mapWithConcurrency<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ═══════════════════════════════════════════════
//  核心搜索流
// ═══════════════════════════════════════════════
function formatStreamEvent(data: object): string {
  return `${JSON.stringify(data)}\n`;
}

export async function handleSearchRequestStream(
  game: string,
  platforms: Platform[],
  writer: WritableStreamDefaultWriter<Uint8Array>,
): Promise<void> {
  console.log(JSON.stringify({ message: `搜索关键词: ${game}`, level: "info" }));

  const encoder = new TextEncoder();
  let completed = 0;

  // ── 写锁 ──
  let writeLock: Promise<void> = Promise.resolve();
  function safeWrite(data: object): Promise<void> {
    writeLock = writeLock.then(() => writer.write(encoder.encode(formatStreamEvent(data))));
    return writeLock;
  }

  // ── 预过滤：标记熔断平台 ──
  const activePlatforms: { platform: Platform; skipped: boolean }[] = platforms.map((p) => {
    const skipped = isCircuitOpen(p.name);
    if (skipped) {
      console.log(JSON.stringify({ message: `跳过熔断平台: ${p.name}`, level: "warn" }));
    }
    return { platform: p, skipped };
  });

  const total = activePlatforms.length;
  await safeWrite({ total });

  // 立即发送被跳过的平台（不占用并发槽位）
  for (const item of activePlatforms) {
    if (item.skipped) {
      completed++;
      const breakerEntry = breakerMap.get(item.platform.name);
      await safeWrite({
        progress: { completed, total } satisfies StreamProgress,
        result: {
          name: item.platform.name,
          color: "#555",
          tags: [...item.platform.tags, "breaker"],
          items: [],
          error: `已熔断 · ${breakerEntry?.lastError ?? "未知错误"}`,
        } satisfies StreamResult,
      });
    }
  }

  // ── 并发搜索（限流 8 并发） ──
  const searchableItems = activePlatforms.filter((item) => !item.skipped);

  /** 搜索单个平台并写入结果 */
  async function searchOne(item: { platform: Platform; skipped: boolean }): Promise<void> {
    const platform = item.platform;
    const startMs = Date.now();

    try {
      const result = await Promise.race([
        platform.search(game),
        new Promise<PlatformSearchResult>((_, reject) =>
          setTimeout(() => reject(new Error("搜索超时")), PLATFORM_TIMEOUT_MS)
        ),
      ]);
      const elapsed = Date.now() - startMs;
      completed++;

      if (result.error) {
        recordFailure(platform.name, result.error);
        console.log(JSON.stringify({
          message: `平台 ${platform.name} 错误 (${elapsed}ms): ${result.error}`,
          level: "error",
        }));
        await safeWrite({
          progress: { completed, total } satisfies StreamProgress,
          result: {
            name: platform.name, color: "red", tags: platform.tags,
            items: result.items, error: result.error,
          } satisfies StreamResult,
        });
      } else {
        recordSuccess(platform.name);
        if (result.count > 0) {
          console.log(JSON.stringify({
            message: `平台 ${platform.name} 返回 ${result.count} 条 (${elapsed}ms)`,
            level: "info",
          }));
          await safeWrite({
            progress: { completed, total } satisfies StreamProgress,
            result: {
              name: platform.name, color: platform.color, tags: platform.tags,
              items: result.items,
            } satisfies StreamResult,
          });
        } else {
          await safeWrite({ progress: { completed, total } satisfies StreamProgress });
        }
      }
    } catch (e) {
      completed++;
      const elapsed = Date.now() - startMs;
      const errMsg = e instanceof Error ? e.message : String(e);
      recordFailure(platform.name, errMsg);
      console.log(JSON.stringify({
        message: `平台 ${platform.name} 内部错误 (${elapsed}ms): ${errMsg}`,
        level: "error",
      }));
      await safeWrite({ progress: { completed, total } satisfies StreamProgress });
    }
  }

  // 并发执行（受限 8 并发）
  await mapWithConcurrency(searchableItems, searchOne, CONCURRENCY_LIMIT);

  // 结束
  await safeWrite({ done: true });
}

export const PLATFORMS_GAL = platformsGal;
export const PLATFORMS_PATCH = platformsPatch;
