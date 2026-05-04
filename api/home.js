// ─── GET /api/home ────────────────────────────────────────────────────────────
// Returns the full home page data matching the canonical response schema.
// Vercel Edge Runtime — no heavy compute, just fetch + parse.

export const config = { runtime: "edge" };

import { scrapeHome } from "../util/scraper.js";
import { CONFIG } from "../config/config.js";

// ── Response helpers (inline to avoid import bloat) ──────────────────────────

function ok(data, ttl = 0) {
  const cache = ttl > 0
    ? `public, s-maxage=${ttl}, stale-while-revalidate=${Math.floor(ttl / 2)}`
    : "no-store";

  return Response.json(
    { success: true, data },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": cache,
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

function err(message, status = 500) {
  return Response.json(
    { success: false, data: null, error: message },
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req) {
  if (req.method !== "GET") {
    return err("Method not allowed", 405);
  }

  try {
    const raw = await scrapeHome();

    // ── Map scraped data → canonical schema ──────────────────────────────

    const data = {
      genres: raw.genres,

      // Hero slider
      spotlightAnimes: raw.spotlightAnimes.map((a) => ({
        id:          a.id,
        name:        a.name,
        jname:       a.jname,
        poster:      a.poster,
        description: a.description,
        rank:        a.rank,
        otherInfo:   a.otherInfo,
        episodes: {
          sub: a.episodes.sub,
          dub: a.episodes.dub,
        },
      })),

      // Trending carousel
      trendingAnimes: raw.trendingAnimes.map((a) => ({
        id:     a.id,
        name:   a.name,
        poster: a.poster,
        rank:   a.rank,
      })),

      // Latest Episode grid
      latestEpisodeAnimes: raw.latestEpisodeAnimes.map((a) => ({
        id:     a.id,
        name:   a.name,
        poster: a.poster,
        type:   a.type,
        episodes: {
          sub: a.episodes.sub,
          dub: a.episodes.dub,
        },
      })),

      // Top Upcoming grid
      topUpcomingAnimes: raw.topUpcomingAnimes.map((a) => ({
        id:       a.id,
        name:     a.name,
        poster:   a.poster,
        duration: a.duration,
        type:     a.type,
        rating:   a.rating,
        episodes: {
          sub: a.episodes.sub,
          dub: a.episodes.dub,
        },
      })),

      // Top 10 sidebar (Most Viewed)
      top10Animes: {
        today: raw.top10Animes.today.map((a) => ({
          id:     a.id,
          name:   a.name,
          poster: a.poster,
          rank:   a.rank,
          episodes: {
            sub: a.episodes.sub,
            dub: a.episodes.dub,
          },
        })),
        week: raw.top10Animes.week.map((a) => ({
          id:     a.id,
          name:   a.name,
          poster: a.poster,
          rank:   a.rank,
          episodes: {
            sub: a.episodes.sub,
            dub: a.episodes.dub,
          },
        })),
        month: raw.top10Animes.month.map((a) => ({
          id:     a.id,
          name:   a.name,
          poster: a.poster,
          rank:   a.rank,
          episodes: {
            sub: a.episodes.sub,
            dub: a.episodes.dub,
          },
        })),
      },

      // anif-block column 1 ("Popular")
      mostPopularAnimes: raw.mostPopularAnimes.map((a) => ({
        id:     a.id,
        name:   a.name,
        poster: a.poster,
        type:   a.type,
        episodes: {
          sub: a.episodes.sub,
          dub: a.episodes.dub,
        },
      })),

      // anif-block column 2 ("New Release" — mapped as mostFavorite)
      mostFavoriteAnimes: raw.mostFavoriteAnimes.map((a) => ({
        id:     a.id,
        name:   a.name,
        poster: a.poster,
        type:   a.type,
        episodes: {
          sub: a.episodes.sub,
          dub: a.episodes.dub,
        },
      })),

      // anif-block column 3 ("Top Airing")
      topAiringAnimes: raw.topAiringAnimes.map((a) => ({
        id:     a.id,
        name:   a.name,
        jname:  a.jname,
        poster: a.poster,
      })),

      // anif-block column 4 ("Completed")
      latestCompletedAnimes: raw.latestCompletedAnimes.map((a) => ({
        id:     a.id,
        name:   a.name,
        poster: a.poster,
        type:   a.type,
        episodes: {
          sub: a.episodes.sub,
          dub: a.episodes.dub,
        },
      })),
    };

    return ok(data, CONFIG.CACHE.HOME);
  } catch (e) {
    console.error("[/api/home]", e);
    return err(e.message || "Failed to scrape home page");
  }
}
