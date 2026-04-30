// ─── GET /api/anime ───────────────────────────────────────────────────────────
// Query params:
//   id  {string}  Anime slug-id, e.g. "bleach-yaa9n" (required)
//
// Returns full anime metadata + related list.

export const config = { runtime: "edge" };

import { scrapeAnimeInfo } from "../util/scraper.js";
import { jsonResponse, errorResponse } from "../util/helper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();

  if (!id) return errorResponse("Missing required query param: id", 400);

  try {
    const data = await scrapeAnimeInfo(id);
    return jsonResponse(data, CONFIG.CACHE.ANIME_INFO);
  } catch (err) {
    console.error("[/api/anime]", err);
    return errorResponse(err.message || "Failed to fetch anime info");
  }
}
