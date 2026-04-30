// ─── GET /api/genre ───────────────────────────────────────────────────────────
// Query params:
//   name  {string}  Genre slug (required) e.g. "action" | "romance" | "isekai"
//   page  {number}  Page number (default: 1)

export const config = { runtime: "edge" };

import { scrapeGenre } from "../util/scraper.js";
import { jsonResponse, errorResponse, intParam } from "../util/helper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim().toLowerCase();
  const page = intParam(searchParams.get("page"), 1);

  if (!name) return errorResponse("Missing required query param: name", 400);

  try {
    const data = await scrapeGenre(name, page);
    return jsonResponse(data, CONFIG.CACHE.GENRE);
  } catch (err) {
    console.error("[/api/genre]", err);
    return errorResponse(err.message || "Failed to fetch genre page");
  }
}
