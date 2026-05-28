import type { Platform, PlatformSearchResult } from "../../types";
import { searchHtmlSite } from "./htmlSearch";

const BASE_URL = "https://galgames.vip/";

async function searchHuangXingYouXiKu(game: string): Promise<PlatformSearchResult> {
  return searchHtmlSite(game, {
    baseUrl: BASE_URL,
    searchUrl: (keyword) => `${BASE_URL}?s=${encodeURIComponent(keyword)}`,
  });
}

const HuangXingYouXiKu: Platform = {
  name: "煌星游戏库",
  color: "lime",
  tags: ["NoReq", "MixDrive"],
  magic: false,
  search: searchHuangXingYouXiKu,
};

export default HuangXingYouXiKu;
