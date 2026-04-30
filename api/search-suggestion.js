// ─── GET /api/search-suggestion ───────────────────────────────────────────────
// Query params:
//   q  {string}  Partial search keyword (required)
//
// Returns a list of quick-match suggestion items from the hianime AJAX endpoint.

export const config = { runtime: "edge" };

import { scrapeSearchSuggestions } from "../util/scraper.js";
import { jsonResponse, errorResponse } from "../util/helper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) return errorResponse("Missing required query param: q", 400);

  try {
    const data = await scrapeSearchSuggestions(q);
    return jsonResponse(data, CONFIG.CACHE.SEARCH);
  } catch (err) {
    console.error("[/api/search-suggestion]", err);
    return errorResponse(err.message || "Suggestion fetch failed");
  }
}
