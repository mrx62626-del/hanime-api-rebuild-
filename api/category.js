// ─── GET /api/category ────────────────────────────────────────────────────────
// Query params:
//   name  {string}  Category slug (required)
//              e.g. "subbed-anime" | "dubbed-anime" | "most-popular"
//                   "recently-added" | "top-airing" | "movie" | "tv" …
//   page  {number}  Page number (default: 1)

export const config = { runtime: "edge" };

import { scrapeCategory } from "../util/scraper.js";
import { jsonResponse, errorResponse, intParam } from "../util/helper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim().toLowerCase();
  const page = intParam(searchParams.get("page"), 1);

  if (!name) return errorResponse("Missing required query param: name", 400);

  if (!CONFIG.CATEGORIES.includes(name)) {
    return errorResponse(
      `Invalid category. Valid options: ${CONFIG.CATEGORIES.join(", ")}`,
      400
    );
  }

  try {
    const data = await scrapeCategory(name, page);
    return jsonResponse(data, CONFIG.CACHE.CATEGORY);
  } catch (err) {
    console.error("[/api/category]", err);
    return errorResponse(err.message || "Failed to fetch category");
  }
}
