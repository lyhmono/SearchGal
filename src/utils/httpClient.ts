export const DEFAULT_TIMEOUT_MS = 12_000; // 与 core 原 PLATFORM_TIMEOUT_MS 对齐：fetchClient 作为唯一超时源，避免双重超时竞态
let defaultTimeoutMs = DEFAULT_TIMEOUT_MS;

// 允许在运行时根据部署环境覆盖默认超时（如免费计划下调以规避 CPU 时间限制）。
// 注意：这是模块级全局，在 Cloudflare 单 isolate 内对所有请求共享；同一部署下配置一致时无害。
export function setDefaultTimeout(ms: number) {
  if (Number.isFinite(ms) && ms > 0) defaultTimeoutMs = Math.floor(ms);
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
};

type FetchOptions = RequestInit & {
  cf?: {
    cacheEverything?: boolean;
    cacheTtl?: number;
    cacheTtlByStatus?: Record<string, number>;
  };
  timeoutMs?: number;
  // 兼容上游绅士天堂等适配器：Node/Docker 运行时下跳过 TLS 证书校验；
  // Cloudflare Workers 无 process.env，此选项为无操作空转。
  insecure?: boolean;
};

/**
 * 一个封装了原生 fetch 并增加了超时功能的 HTTP 客户端。
 * 超时限制覆盖连接、响应头及响应体读取全过程（15s 上游默认，本项目默认 12s 且可运行时覆盖）。
 * GET 请求启用 CF 边缘缓存（cacheEverything），热门关键词重复搜索时直接命中边缘节点。
 * @param url 请求的 URL。
 * @param options fetch 的请求选项。
 * @returns 返回一个 Promise<Response>。
 */
export async function fetchClient(
  url: string | URL,
  options: FetchOptions = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  // 调用方取消时透传取消原因，避免被误报成「请求超时」
  const onAbort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) onAbort();
  else options.signal?.addEventListener("abort", onAbort, { once: true });

  // insecure 仅在 Node/Docker 运行时有效（Workers 无 process，自然跳过）
  let prevUnauthorized: string | undefined;
  if (options.insecure && typeof process !== "undefined" && process.env) {
    prevUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  const finalOptions: FetchOptions = {
    ...options,
    headers: {
      ...HEADERS,
      ...options.headers,
    },
    signal: controller.signal,
  };

  // 仅对 GET 请求启用边缘缓存（POST 不被 CF 缓存，加了也无害但显式跳过更清晰）
  if (!options.method || options.method === "GET") {
    // 只对 2xx 命中边缘缓存；4xx/5xx 一律 TTL=0 不缓存，
    // 避免上游源站短暂故障时，错误响应被边缘节点复用长达 5 分钟。
    finalOptions.cf = {
      cacheEverything: true,
      cacheTtlByStatus: { "200-299": 300, "404": 0, "500-599": 0 },
    };
  }

  try {
    const response = await fetch(url, finalOptions);
    const body = response.body ? await response.arrayBuffer() : null;
    const buffered = new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
    // Response 构造器不接受 URL；保留重定向后的地址以正确生成站点链接。
    Object.defineProperty(buffered, "url", { value: response.url });
    Object.defineProperty(buffered, "redirected", { value: response.redirected });
    return buffered;
  } catch (error) {
    if (timedOut) throw new Error("资源平台 SearchAPI 请求超时", { cause: error });
    // 把 Cloudflare 的网络错误码（ERR_TLS_CERT_ALTNAME_INVALID / ENOTFOUND / ECONNREFUSED 等）
    // 提到消息里，停用平台时能直接写清原因，不用再猜。
    const code = (error as { cause?: { code?: string } })?.cause?.code;
    if (error instanceof Error && !options.signal?.aborted) {
      if (code) throw new Error(`资源平台 SearchAPI 网络错误 ${code}`, { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", onAbort);
    if (options.insecure && typeof process !== "undefined" && process.env) {
      if (prevUnauthorized !== undefined) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevUnauthorized;
      } else {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      }
    }
  }
}
