import type { Platform, PlatformSearchResult } from "../../types";
import { searchHtmlSite } from "./htmlSearch";

const BASE_URL = "https://2gouacg.com/";

async function searchErGouACG(game: string): Promise<PlatformSearchResult> {
  return searchHtmlSite(game, {
    baseUrl: BASE_URL,
    searchUrl: (keyword) => `${BASE_URL}?s=${encodeURIComponent(keyword)}`,
  });
}

const ErGouACG: Platform = {
  name: "二狗ACG",
  color: "lime",
  tags: ["NoReq", "MixDrive"],
  magic: false,
  search: searchErGouACG,
};

export default ErGouACG;
