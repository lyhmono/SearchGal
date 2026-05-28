import type { Platform, PlatformSearchResult } from "../../types";
import { searchHtmlSite } from "./htmlSearch";

const BASE_URL = "https://www.acggw.me/";

async function searchACGGangWan(game: string): Promise<PlatformSearchResult> {
  return searchHtmlSite(game, {
    baseUrl: BASE_URL,
    searchUrl: (keyword) => `${BASE_URL}?s=${encodeURIComponent(keyword)}`,
  });
}

const ACGGangWan: Platform = {
  name: "ACG港湾",
  color: "lime",
  tags: ["NoReq", "MixDrive"],
  magic: false,
  search: searchACGGangWan,
};

export default ACGGangWan;
