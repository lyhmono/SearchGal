import type { SearchEnv } from "../types";

/**
 * 从 Workers 的 env 绑定中读取搜索用密钥。
 * 上游版本还会回落到 process.env（Vercel/Netlify 运行时），本项目已收敛为 Workers-only，故不需要。
 */
export function resolveSearchEnv(binding?: Record<string, unknown>): SearchEnv {
  const token = binding?.TOUCHGAL_API_TOKEN;
  return {
    TOUCHGAL_API_TOKEN: typeof token === "string" && token.length > 0 ? token : undefined,
  };
}
