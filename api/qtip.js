// ─── GET /api/qtip ────────────────────────────────────────────────────────────
// Query params:
//   id  {string}  Numeric anime ID shown in data-tip attributes (required)
//                 e.g. "1057"
//
// Returns the lightweight hover-card info (name, poster, type, episodes, score).

export const config = { runtime: "edge" };

import { scrapeQtip } from "../util/scraper.js";
import { jsonResponse, errorResponse } from "../util/helper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();

  if (!id) return errorResponse("Missing required query param: id", 400);

  try {
    const data = await scrapeQtip(id);
    return jsonResponse(data, CONFIG.CACHE.ANIME_INFO);
  } catch (err) {
    console.error("[/api/qtip]", err);
    return errorResponse(err.message || "Failed to fetch qtip info");
  }
}
