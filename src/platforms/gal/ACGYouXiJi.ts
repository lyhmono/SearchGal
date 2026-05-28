import type { Platform, PlatformSearchResult } from "../../types";
import { searchHtmlSite } from "./htmlSearch";

const BASE_URL = "https://acgyx.us/";

async function searchACGYouXiJi(game: string): Promise<PlatformSearchResult> {
  return searchHtmlSite(game, {
    baseUrl: BASE_URL,
    searchUrl: (keyword) => `${BASE_URL}?s=${encodeURIComponent(keyword)}`,
  });
}

const ACGYouXiJi: Platform = {
  name: "ACG游戏姬",
  color: "lime",
  tags: ["NoReq", "MixDrive"],
  magic: false,
  search: searchACGYouXiJi,
};

export default ACGYouXiJi;
