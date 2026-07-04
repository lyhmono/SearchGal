const TIMEOUT_SECONDS = 15;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 (From www.searchgal.top) (https://github.com/Moe-Sakura/SearchGal)",
};

type FetchOptions = RequestInit & { cf?: { cacheEverything?: boolean; cacheTtl?: number } };

/**
 * 一个封装了原生 fetch 并增加了超时功能的 HTTP 客户端。
 * GET 请求启用 CF 边缘缓存（cacheEverything），热门关键词重复搜索时直接命中边缘节点。
 * @param url 请求的 URL。
 * @param options fetch 的请求选项。
 * @returns 返回一个 Promise<Response>。
 */
export async function fetchClient(
  url: string | URL,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_SECONDS * 1000);

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
    finalOptions.cf = { cacheEverything: true, cacheTtl: 300 };
  }

  try {
    const response = await fetch(url, finalOptions);
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`资源平台 SearchAPI 请求超时`, { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}