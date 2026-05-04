// ─── GET /api/episodes ────────────────────────────────────────────────────────
//
// Supports two calling conventions:
//
//   1. Path param  (via vercel.json rewrite):
//      GET /api/v2/hianime/anime/:animeId/episodes
//      → internally rewritten to GET /api/episodes?id=:animeId
//
//   2. Query param (direct / legacy):
//      GET /api/episodes?id=bleach-yaa9n
//
// Response:
// {
//   success: true,
//   data: {
//     totalEpisodes: 366,
//     episodes: [
//       { number: 1, title: "The Day I Became a Shinigami", episodeId: "bleach-yaa9n?ep=1", isFiller: false },
//       ...
//     ]
//   }
// }
//
// Implementation note:
//   The episode list is scraped in two server-side HTTP steps — no browser AJAX:
//   Step 1: Fetch /anime/:animeId  →  parse numeric id from .pc-fav[data-id]
//           (falls back to /watch/:animeId → #main-wrapper[data-id])
//   Step 2: Fetch /ajax/v2/episode/list/{numericId}  →  parse JSON { html:"…" }
//           →  run Cheerio on the HTML fragment to extract .ssl-item nodes

export const config = { runtime: "edge" };

import { scrapeEpisodes, scrapeAnimeNumericId } from "../util/scraper.js";
import { errorResponse, jsonResponse } from "../util/helper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();

  if (!id) {
    return errorResponse("Missing required param: id (anime slug)", 400);
  }

  try {
    // Step 1 — resolve the numeric site id from the anime detail page
    const numericId = await scrapeAnimeNumericId(id);

    // Step 2 — scrape the episode list via HTML parsing (not browser AJAX)
    const data = await scrapeEpisodes(numericId);

    return jsonResponse(data, CONFIG.CACHE.EPISODES);
  } catch (err) {
    console.error("[/api/episodes]", err);
    return errorResponse(err.message || "Failed to fetch episodes");
  }
}
