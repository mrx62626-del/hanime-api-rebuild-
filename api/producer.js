// ─── GET /api/producer ────────────────────────────────────────────────────────
// Query params:
//   name  {string}  Producer slug (required) e.g. "toei-animation"
//   page  {number}  Page number (default: 1)

export const config = { runtime: "edge" };

import { scrapeProducer } from "../util/scraper.js";
import { jsonResponse, errorResponse, intParam } from "../util/helper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim().toLowerCase();
  const page = intParam(searchParams.get("page"), 1);

  if (!name) return errorResponse("Missing required query param: name", 400);

  try {
    const data = await scrapeProducer(name, page);
    return jsonResponse(data, CONFIG.CACHE.CATEGORY);
  } catch (err) {
    console.error("[/api/producer]", err);
    return errorResponse(err.message || "Failed to fetch producer page");
  }
}
