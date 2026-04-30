// ─── GET /api/azlist ──────────────────────────────────────────────────────────
// Query params:
//   sort  {string}  One of: all | other | 0-9 | a … z  (default: "all")
//   page  {number}  Page number (default: 1)

export const config = { runtime: "edge" };

import { scrapeAZList } from "../util/scraper.js";
import { jsonResponse, errorResponse, intParam } from "../util/helper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort")?.trim().toLowerCase() || "all";
  const page = intParam(searchParams.get("page"), 1);

  if (!CONFIG.AZ_SORT_OPTIONS.includes(sort)) {
    return errorResponse(
      `Invalid sort option. Valid: ${CONFIG.AZ_SORT_OPTIONS.join(", ")}`,
      400
    );
  }

  try {
    const data = await scrapeAZList(sort, page);
    return jsonResponse(data, CONFIG.CACHE.AZ_LIST);
  } catch (err) {
    console.error("[/api/azlist]", err);
    return errorResponse(err.message || "Failed to fetch AZ list");
  }
}
