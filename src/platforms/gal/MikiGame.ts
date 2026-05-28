import type { Platform, PlatformSearchResult } from "../../types";
import { searchHtmlSite } from "./htmlSearch";

const BASE_URL = "https://game.mikiacg.org/";

async function searchMikiGame(game: string): Promise<PlatformSearchResult> {
  return searchHtmlSite(game, {
    baseUrl: BASE_URL,
    searchUrl: (keyword) => `${BASE_URL}search/${encodeURIComponent(keyword)}/`,
  });
}

const MikiGame: Platform = {
  name: "咪咔Game",
  color: "lime",
  tags: ["NoReq", "MixDrive"],
  magic: false,
  search: searchMikiGame,
};

export default MikiGame;
