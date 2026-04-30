// ─── GET /api/servers ─────────────────────────────────────────────────────────
// Query params:
//   episodeId  {string}  The numeric episode ID from /api/episodes (required)
//                        e.g. "230" (not the slug "ep-1")
//
// Returns sub / dub / raw server lists for the episode.

export const config = { runtime: "edge" };

import { scrapeEpisodeServers } from "../util/scraper.js";
import { jsonResponse, errorResponse } from "../util/helper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  const { searchParams } = new URL(req.url);
  const episodeId = searchParams.get("episodeId")?.trim();

  if (!episodeId) return errorResponse("Missing required query param: episodeId", 400);

  try {
    const data = await scrapeEpisodeServers(episodeId);
    return jsonResponse(data, CONFIG.CACHE.SERVERS);
  } catch (err) {
    console.error("[/api/servers]", err);
    return errorResponse(err.message || "Failed to fetch servers");
  }
}
