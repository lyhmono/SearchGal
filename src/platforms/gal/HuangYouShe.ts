import type { Platform, PlatformSearchResult } from "../../types";
import { searchHtmlSite } from "./htmlSearch";

const BASE_URL = "https://www.hgshe.com/";

async function searchHuangYouShe(game: string): Promise<PlatformSearchResult> {
  return searchHtmlSite(game, {
    baseUrl: BASE_URL,
    searchUrl: (keyword) => `${BASE_URL}?s=${encodeURIComponent(keyword)}`,
  });
}

const HuangYouShe: Platform = {
  name: "黄油社",
  color: "lime",
  tags: ["NoReq", "MixDrive"],
  magic: false,
  search: searchHuangYouShe,
};

export default HuangYouShe;