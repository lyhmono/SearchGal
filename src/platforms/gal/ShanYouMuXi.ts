import type { Platform, PlatformSearchResult } from "../../types";
import { searchHtmlSite } from "./htmlSearch";

const BASE_URL = "https://symxyx.com/";

async function searchShanYouMuXi(game: string): Promise<PlatformSearchResult> {
  return searchHtmlSite(game, {
    baseUrl: BASE_URL,
    searchUrl: (keyword) => `${BASE_URL}?s=${encodeURIComponent(keyword)}`,
  });
}

const ShanYouMuXi: Platform = {
  name: "山有木兮",
  color: "yellow",
  tags: ["NoReq", "magic"],
  magic: true,
  search: searchShanYouMuXi,
};

export default ShanYouMuXi;
