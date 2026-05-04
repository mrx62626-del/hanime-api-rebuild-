// ─── GET /api/anime ───────────────────────────────────────────────────────────
// Query params:
//   id  {string}  Anime slug-id, e.g. "bleach-yaa9n" (required)
//
// Response shape:
// {
//   success: true,
//   data: {
//     anime: [{ info, moreInfo }],
//     mostPopularAnimes: [...],
//     recommendedAnimes: [...],
//     relatedAnimes: [...],
//     seasons: [...],
//   }
// }

export const config = { runtime: "edge" };

import { scrapeAnimeInfo } from "../util/scraper.js";
import { CONFIG } from "../config/config.js";

export default async function handler(req) {
  if (req.method !== "GET") {
    return Response.json(
      { success: false, data: null, error: "Method not allowed" },
      { status: 405 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();

  if (!id) {
    return Response.json(
      { success: false, data: null, error: "Missing required query param: id" },
      { status: 400 }
    );
  }

  try {
    const data = await scrapeAnimeInfo(id);
    const ttl  = CONFIG.CACHE.ANIME_INFO;
    const cacheHeader =
      ttl > 0
        ? `public, s-maxage=${ttl}, stale-while-revalidate=${Math.floor(ttl / 2)}`
        : "no-store";

    return Response.json(
      { success: true, data },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": cacheHeader,
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("[/api/anime]", err);
    return Response.json(
      { success: false, data: null, error: err.message || "Failed to fetch anime info" },
      { status: 500 }
    );
  }
}
