import { fetchClient } from "../../utils/httpClient";
import type { Platform, PlatformSearchResult, SearchResultItem } from "../../types";

const BASE_URL = "https://bbs.acgrx.com";

/**
 * 萌幻ACG 适配器
 * 
 * 搜索方式：爬取首页及前 N 页帖子列表，本地匹配关键词。
 * 原因：该站搜索功能为纯前端 JS 实现，服务端 /search/ 不返回过滤结果。
 * 
 * 站点规模：452 页 × ~52 条/页 ≈ 23,500 条帖子。
 * 本适配器爬取前 MAX_PAGES 页（约 1,560 条），分 3 批并行拉取以平衡覆盖率和速度。
 * 超时：每页 fetch 允许 15 秒，分批串行避免瞬时并发过高。
 */

const MAX_PAGES = 30;
const BATCH_SIZE = 10;

async function searchAcgrx(game: string): Promise<PlatformSearchResult> {
  const searchResult: PlatformSearchResult = {
    count: 0,
    items: [],
  };

  try {
    const query = game.toLowerCase();
    const seen = new Set<string>();
    const items: SearchResultItem[] = [];

    // 生成待爬页码列表（首页 + page/2/ ~ page/MAX_PAGES/）
    const pages: number[] = [1];
    for (let p = 2; p <= MAX_PAGES; p++) {
      pages.push(p);
    }

    // 分批拉取，每批 BATCH_SIZE 个并行
    for (let i = 0; i < pages.length; i += BATCH_SIZE) {
      const batch = pages.slice(i, i + BATCH_SIZE);
      const htmls = await Promise.all(
        batch.map(async (pageNum) => {
          const url = pageNum === 1 ? BASE_URL : `${BASE_URL}/page/${pageNum}/`;
          try {
            const resp = await fetchClient(url, { timeoutMs: 15_000 });
            if (!resp.ok) return null;
            return await resp.text();
          } catch {
            return null; // 单页失败不拖垮整批
          }
        })
      );

      for (const html of htmls) {
        if (!html) continue;

        // 匹配帖子链接和标题
        const regex = /class="post-title"[^>]*href="(https:\/\/bbs\.acgrx\.com\/[^"]+\.html)"[^>]*title="([^"]*)"/g;
        let match;

        while ((match = regex.exec(html)) !== null) {
          const postUrl = match[1];
          let title = match[2]
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"');

          // 跳过广告赞助链接
          if (postUrl.includes("afengy.app") || postUrl.includes("mofacga.com")) {
            continue;
          }

          if (!seen.has(postUrl) && title.toLowerCase().includes(query)) {
            seen.add(postUrl);
            items.push({ name: title, url: postUrl });
          }
        }
      }

      // 如果单批内已找到 50 条以上结果，提前结束
      if (items.length >= 50) break;
    }

    searchResult.items = items;
    searchResult.count = items.length;
  } catch (error) {
    if (error instanceof Error) {
      searchResult.error = error.message;
    } else {
      searchResult.error = "An unknown error occurred";
    }
    searchResult.count = -1;
  }

  return searchResult;
}

const Acgrx: Platform = {
  name: "萌幻ACG",
  color: "lime",
  tags: ["NoReq"],
  magic: false,
  search: searchAcgrx,
};

export default Acgrx;