// ─── GET /api/search ──────────────────────────────────────────────────────────
// Query params:
//   q        {string}  Search keyword (required)
//   page     {number}  Page number (default: 1)
//   type     {string}  Filter: tv | movie | ova | ona | special | music
//   status   {string}  Filter: airing | complete | upcoming
//   rated    {string}  Filter: g | pg | pg-13 | r | r+ | rx
//   score    {string}  Filter: appalling | horrible | ... | masterpiece
//   season   {string}  Filter: spring | summer | fall | winter
//   language {string}  Filter: sub | dub | sub-&-dub
//   start_date {string} YYYY-MM-DD
//   end_date   {string} YYYY-MM-DD
//   sort     {string}  Filter: default | recently-added | score etc.
//   genres   {string}  Comma-separated genre slugs

export const config = { runtime: "edge" };

import { scrapeSearch } from "../util/scraper.js";
import { jsonResponse, errorResponse, intParam } from "../util/helper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  if (req.method !== "GET") return errorResponse("Method not allowed", 405);

  const { searchParams } = new URL(req.url);
  const q    = searchParams.get("q")?.trim();
  const page = intParam(searchParams.get("page"), 1);

  if (!q) return errorResponse("Missing required query param: q", 400);

  // Collect any extra filter params to forward
  const filters = {};
  const filterKeys = ["type","status","rated","score","season","language","start_date","end_date","sort","genres"];
  for (const k of filterKeys) {
    const v = searchParams.get(k);
    if (v) filters[k] = v;
  }

  try {
    const data = await scrapeSearch(q, page, filters);
    return jsonResponse(data, CONFIG.CACHE.SEARCH);
  } catch (err) {
    console.error("[/api/search]", err);
    return errorResponse(err.message || "Search failed");
  }
}
