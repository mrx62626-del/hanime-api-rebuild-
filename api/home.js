// ─── GET /api/home ────────────────────────────────────────────────────────────
// Returns spotlight, trending, latest episode, top-upcoming, top-10, and genres.
// Vercel Edge Runtime — no heavy compute, just fetch + parse.

export const config = { runtime: "edge" };

import { scrapeHome } from "../util/scraper.js";
import { jsonResponse, errorResponse } from "../util/helper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  // Only GET
  if (req.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const data = await scrapeHome();
    return jsonResponse(data, CONFIG.CACHE.HOME);
  } catch (err) {
    console.error("[/api/home]", err);
    return errorResponse(err.message || "Failed to scrape home page");
  }
}
