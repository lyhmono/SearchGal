import { fetchClient } from "../../utils/httpClient";
import type { Platform, PlatformSearchResult, SearchResultItem } from "../../types";

const BASE_URL = "https://bbs.acgrx.com";

/**
 * 萌幻ACG 适配器
 * 
 * 搜索方式：爬取首页及前 N 页帖子列表，本地匹配关键词。
 * 原因：该站搜索功能为纯前端 JS 实现，服务端 /search/ 不返回过滤结果。
 * 
 * 性能：每次搜索爬首页 + 前 5 页（约 250 篇帖子），本地过滤。
 * 超时：每页 fetch 允许 60 秒（比默认 12 秒长，因为要多页爬取），在 fetchClient 调用处传入。
 */

const MAX_PAGES = 5; // 爬首页 + 前 4 页，平衡速度和覆盖率

async function searchAcgrx(game: string): Promise<PlatformSearchResult> {
  const searchResult: PlatformSearchResult = {
    count: 0,
    items: [],
  };

  try {
    const query = game.toLowerCase();
    const seen = new Set<string>();
    const items: SearchResultItem[] = [];

    // 并行爬取多页
    const urls: string[] = [BASE_URL];
    for (let page = 2; page <= MAX_PAGES; page++) {
      urls.push(`${BASE_URL}/page/${page}/`);
    }

    const responses = await Promise.all(
      urls.map(async (url) => {
        const resp = await fetchClient(url, { timeoutMs: 60_000 });
        if (!resp.ok) return null;
        return resp.text();
      })
    );

    for (const html of responses) {
      if (!html) continue;

      // 匹配帖子链接和标题
      // 格式: class="post-title" href="https://bbs.acgrx.com/game/xxx.html" title="..."
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
