import type { Platform, PlatformSearchResult } from "../../types";
import { searchHtmlSite } from "./htmlSearch";

const BASE_URL = "https://www.galgamedawanjia.com/";

async function searchGalgameDaWanJia(game: string): Promise<PlatformSearchResult> {
  return searchHtmlSite(game, {
    baseUrl: BASE_URL,
    searchUrl: (keyword) => `${BASE_URL}?s=${encodeURIComponent(keyword)}`,
  });
}

const GalgameDaWanJia: Platform = {
  name: "Galgame大玩家",
  color: "lime",
  tags: ["NoReq", "MixDrive"],
  magic: false,
  search: searchGalgameDaWanJia,
};

export default GalgameDaWanJia;
