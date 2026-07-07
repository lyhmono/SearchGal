import { fetchClient } from "../../utils/httpClient";
import type { Platform, PlatformSearchResult, SearchResultItem } from "../../types";

const API_URL = "https://gamebus001.com/api/product/search";

interface GameBusItem {
  id: number;
  title: string;
}

interface GameBusResponse {
  code: number;
  message: string;
  data: {
    list: GameBusItem[];
    total: number;
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
      url: `https://gamebus001.com/product/${item.id}`,
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