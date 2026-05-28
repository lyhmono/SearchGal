import type { Platform, PlatformSearchResult } from "../../types";
import { searchHtmlSite } from "./htmlSearch";

const BASE_URL = "http://www.loioy.com/";

async function searchLoioy(game: string): Promise<PlatformSearchResult> {
  return searchHtmlSite(game, {
    baseUrl: BASE_URL,
    searchUrl: (keyword) => `${BASE_URL}?s=${encodeURIComponent(keyword)}`,
  });
}

const Loioy: Platform = {
  name: "Loioy",
  color: "yellow",
  tags: ["NoReq", "magic"],
  magic: true,
  search: searchLoioy,
};

export default Loioy;
