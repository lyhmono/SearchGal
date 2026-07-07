// 单个搜索结果
export interface SearchResultItem {
  name: string;
  url: string;
  tags?: string[];
}

// 平台搜索的返回值
export interface PlatformSearchResult {
  items: SearchResultItem[];
  count: number;
  error?: string;
}

// 平台对象的接口
export interface Platform {
  name: string;
  color: string;
  tags: string[];
  magic: boolean;
  timeoutMs?: number;
  search: (game: string) => Promise<PlatformSearchResult>;
}

// SSE 事件流中的数据结构
export interface StreamResult {
  name: string;
  color: string;
  tags: string[];
  items: SearchResultItem[];
  error?: string;
}

export interface StreamProgress {
  completed: number;
  total: number;
}

// Cloudflare Workers 环境接口
export interface Env {
  SEARCHGAL_KV?: KVNamespace;
  SEARCHGAL_RATELIMIT?: RateLimit;
  BG_API_URL?: string;
  // Worker 自调用（Service Binding）：指向自身，用于服务端 fan-out 分批触发独立调用。
  // 仅在 wrangler.toml 配置了 [[services]] binding = "SELF" 时存在。
  SELF?: Fetcher;
  [k: string]: unknown;
}
