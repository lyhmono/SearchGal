import { fetchClient } from "../../utils/httpClient";
import type { Platform, PlatformSearchResult, SearchResultItem } from "../../types";

// 2026-10 复核：站点由 gamebus001.com 整体迁移至 gamebus001.cc（旧域名 301 至新域名），
// 且搜索接口新增必填 page 参数——必须是数字字符串（传数字会 400 Validation failed）。
const API_URL = "https://gamebus001.cc/api/product/search";
const BASE_URL = "https://gamebus001.cc";

interface GameBusItem {
  id: number;
  title: string;
}

interface GameBusResponse {
  code: number;
  message?: string;
  data?: {
    list?: GameBusItem[];
    total?: number;
  };
}

async function searchGameBus(game: string): Promise<PlatformSearchResult> {
  const searchResult: PlatformSearchResult = {
    count: 0,
    items: [],
  };

  try {
    const response = await fetchClient(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        keyword: game,
        page: "1", // 注意：必须是字符串，数字会触发 400 Validation failed
      }),
    });

    if (!response.ok) {
      throw new Error(`资源平台 SearchAPI 响应异常状态码 ${response.status}`);
    }

    const data = await response.json() as GameBusResponse;

    if (data.code !== 200) {
      throw new Error(`API 返回异常：${data.message}`);
    }

    const items: SearchResultItem[] = (data.data?.list ?? []).map((item) => ({
      name: item.title.trim(),
      url: `${BASE_URL}/product/${item.id}`,
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

const GameBus: Platform = {
  name: "GameBus",
  color: "lime",
  tags: ["NoReq", "MixDrive"],
  magic: false,
  search: searchGameBus,
};

export default GameBus;
