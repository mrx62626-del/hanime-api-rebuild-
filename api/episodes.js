// ─── GET /api/episodes ────────────────────────────────────────────────────────
// Query params:
//   id  {string}  Anime slug-id, e.g. "bleach-yaa9n" (required)
//
// Internally resolves the numeric site ID from the watch page, then fetches
// the AJAX episode list.

export const config = { runtime: "edge" };

import { scrapeEpisodes, scrapeAnimeNumericId } from "../util/scraper.js";
import { jsonResponse, errorResponse } from "../util/helper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();

  if (!id) return errorResponse("Missing required query param: id", 400);

  try {
    // Resolve numeric ID from the slug (one extra fetch, but necessary)
    const numericId = await scrapeAnimeNumericId(id);
    const data = await scrapeEpisodes(numericId);
    return jsonResponse(data, CONFIG.CACHE.EPISODES);
  } catch (err) {
    console.error("[/api/episodes]", err);
    return errorResponse(err.message || "Failed to fetch episodes");
  }
}
