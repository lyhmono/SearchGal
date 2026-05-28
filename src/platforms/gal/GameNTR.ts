import type { Platform, PlatformSearchResult } from "../../types";
import { searchHtmlSite } from "./htmlSearch";

const BASE_URL = "https://www.gamentr.com/";

async function searchGameNTR(game: string): Promise<PlatformSearchResult> {
  return searchHtmlSite(game, {
    baseUrl: BASE_URL,
    searchUrl: (keyword) => `${BASE_URL}?s=${encodeURIComponent(keyword)}`,
  });
}

const GameNTR: Platform = {
  name: "牛头人游戏社",
  color: "lime",
  tags: ["NoReq", "MixDrive"],
  magic: false,
  search: searchGameNTR,
};

export default GameNTR;
