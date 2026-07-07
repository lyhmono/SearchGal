import { fetchClient } from "../../utils/httpClient";
import type { Platform, PlatformSearchResult, SearchResultItem } from "../../types";

const API_URL = "https://dayalt.top/wp-json/wp/v2/posts";
const BASE_URL = "https://dayalt.top";

interface DaYaTuiJianPost {
  id: number;
  title: {
    rendered: string;
  };
  link: string;
}

async function searchDaYaTuiJian(game: string): Promise<PlatformSearchResult> {
  const searchResult: PlatformSearchResult = {
    count: 0,
    items: [],
  };

  try {
    const url = new URL(API_URL);
    url.searchParams.set("search", game);
    url.searchParams.set("per_page", "20");
    url.searchParams.set("_embed", "");

    const response = await fetchClient(url);
    if (!response.ok) {
      throw new Error(`资源平台 SearchAPI 响应异常状态码 ${response.status}`);
    }

    const posts = await response.json() as DaYaTuiJianPost[];

    const items: SearchResultItem[] = posts.map((post) => ({
      name: post.title.rendered.trim(),
      url: post.link,
    }));

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

const DaYaTuiJian: Platform = {
  name: "大丫推荐",
  color: "lime",
  tags: ["NoReq", "MixDrive"],
  magic: false,
  search: searchDaYaTuiJian,
};

export default DaYaTuiJian;