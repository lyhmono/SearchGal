import { fetchClient } from "../../utils/httpClient";
import type { PlatformSearchResult, SearchResultItem } from "../../types";

interface HtmlSearchOptions {
  baseUrl: string;
  searchUrl: (game: string) => string;
}

export function decodeHtml(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html: string): string {
  return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForMatch(text: string): string {
  return decodeHtml(text)
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

function sameHost(url: URL, base: URL): boolean {
  return url.hostname.replace(/^www\./, "") === base.hostname.replace(/^www\./, "");
}

function isLikelyPost(url: URL): boolean {
  const path = url.pathname.toLowerCase();
  const query = url.search.toLowerCase();
  if (path === "/" || path === "") return false;
  if (path.includes("/category/") || path.includes("/tag/") || path.includes("/author/")) return false;
  if (path.includes("/user/") || path.includes("/login") || path.includes("/register")) return false;
  if (path.includes("/page/") || path.includes("/series/") || path.includes("/tags")) return false;
  if (query.includes("page_id=") || query.includes("tag=")) return false;
  return true;
}

export async function searchHtmlSite(game: string, options: HtmlSearchOptions): Promise<PlatformSearchResult> {
  const searchResult: PlatformSearchResult = {
    count: 0,
    items: [],
  };

  try {
    const base = new URL(options.baseUrl);
    const response = await fetchClient(options.searchUrl(game));

    if (!response.ok) {
      throw new Error(`资源平台 SearchAPI 响应异常状态码 ${response.status}`);
    }

    const html = await response.text();
    const query = normalizeForMatch(game);
    const seen = new Set<string>();
    const items: SearchResultItem[] = [];
    const matches = html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);

    for (const match of matches) {
      const rawUrl = decodeHtml(match[1]);
      const name = stripTags(match[2]);
      if (!rawUrl || !name) continue;

      const url = new URL(rawUrl, base);
      if (!sameHost(url, base) || !isLikelyPost(url)) continue;
      if (!normalizeForMatch(name).includes(query)) continue;

      const normalizedUrl = url.href.split("#")[0];
      if (seen.has(normalizedUrl)) continue;
      seen.add(normalizedUrl);
      items.push({ name, url: normalizedUrl });
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
