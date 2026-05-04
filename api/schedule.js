// ─── GET /api/schedule ────────────────────────────────────────────────────────
// Query params:
//   date  {string}  Date in YYYY-MM-DD format (default: today)
//
// Returns the airing schedule for the given date.

export const config = { runtime: "edge" };

import { scrapeSchedule } from "../util/scraper.js";
import { jsonResponse, errorResponse, safeDate } from "../util/helper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  const { searchParams } = new URL(req.url);
  const date = safeDate(searchParams.get("date") || "");

  try {
    const data = await scrapeSchedule(date);
    return jsonResponse(data, CONFIG.CACHE.SCHEDULE);
  } catch (err) {
    console.error("[/api/schedule]", err);
    return errorResponse(err.message || "Failed to fetch schedule");
  }
}
