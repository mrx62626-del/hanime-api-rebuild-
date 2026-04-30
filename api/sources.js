// ─── GET /api/sources ─────────────────────────────────────────────────────────
// Query params:
//   serverId  {string}  The data-id from a server item in /api/servers (required)
//
// Returns the raw stream link + type from the hianime AJAX sources endpoint.
// Note: the returned `link` may be an embed URL that requires further resolution
// by a player (megacloud / vidstreaming etc.) — that is outside scope here.

export const config = { runtime: "edge" };

import { scrapeEpisodeSources } from "../util/scraper.js";
import { jsonResponse, errorResponse } from "../util/helper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  const { searchParams } = new URL(req.url);
  const serverId = searchParams.get("serverId")?.trim();

  if (!serverId) return errorResponse("Missing required query param: serverId", 400);

  try {
    const data = await scrapeEpisodeSources(serverId);
    return jsonResponse(data, CONFIG.CACHE.SOURCES);
  } catch (err) {
    console.error("[/api/sources]", err);
    return errorResponse(err.message || "Failed to fetch sources");
  }
}
