// api/index.js  –  Vercel Serverless (Node.js 18+)
// All HiAnime endpoints are handled here via simple path routing.
// No framework needed – just native Request/Response (Web API).

import { HiAnime } from "aniwatch";

const scraper = new HiAnime.Scraper();

// ─── tiny helpers ────────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "s-maxage=60, stale-while-revalidate=30",
    },
  });
}

function error(message, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function q(url, key) {
  return url.searchParams.get(key) ?? "";
}

// ─── router ──────────────────────────────────────────────────────────────────

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "GET")
    return error("Only GET requests are supported.", 405);

  const url = new URL(req.url);

  // Strip leading /api  →  work with clean path segments
  const rawPath = url.pathname.replace(/^\/api/, "").replace(/\/$/, "") || "/";
  const parts = rawPath.split("/").filter(Boolean); // e.g. ["home"] or ["anime","one-piece-odmau"]

  try {
    // ── GET /api  →  index / docs ────────────────────────────────────────────
    if (rawPath === "/" || rawPath === "") {
      return json({
        name: "HiAnime Scraper API",
        version: "1.0.0",
        endpoints: endpointDocs(),
      });
    }

    // ── GET /api/home ────────────────────────────────────────────────────────
    if (rawPath === "/home") {
      const data = await scraper.getHomePage();
      return json(data);
    }

    // ── GET /api/search?q=&page= ──────────────────────────────────────────────
    if (rawPath === "/search") {
      const query = q(url, "q");
      if (!query) return error("Query param `q` is required.");
      const page = parseInt(q(url, "page")) || 1;
      // pass remaining query params as filter object
      const { q: _q, page: _p, ...filters } = Object.fromEntries(url.searchParams);
      const data = await scraper.search(query, page, filters);
      return json(data);
    }

    // ── GET /api/search/suggestion?q= ────────────────────────────────────────
    if (rawPath === "/search/suggestion") {
      const query = q(url, "q");
      if (!query) return error("Query param `q` is required.");
      const data = await scraper.searchSuggestions(query);
      return json(data);
    }

    // ── GET /api/anime/:id ────────────────────────────────────────────────────
    if (parts[0] === "anime" && parts.length === 2) {
      const data = await scraper.getInfo(parts[1]);
      return json(data);
    }

    // ── GET /api/anime/:id/episodes ──────────────────────────────────────────
    if (parts[0] === "anime" && parts[1] && parts[2] === "episodes") {
      const data = await scraper.getEpisodes(parts[1]);
      return json(data);
    }

    // ── GET /api/anime/:id/next-episode-schedule ─────────────────────────────
    if (
      parts[0] === "anime" &&
      parts[1] &&
      parts[2] === "next-episode-schedule"
    ) {
      const data = await scraper.getNextEpisodeSchedule(parts[1]);
      return json(data);
    }

    // ── GET /api/episode/servers?animeEpisodeId= ──────────────────────────────
    if (rawPath === "/episode/servers") {
      const epId = q(url, "animeEpisodeId");
      if (!epId) return error("Query param `animeEpisodeId` is required.");
      const data = await scraper.getEpisodeServers(epId);
      return json(data);
    }

    // ── GET /api/episode/sources?animeEpisodeId=&server=&category= ────────────
    if (rawPath === "/episode/sources") {
      const epId = q(url, "animeEpisodeId");
      if (!epId) return error("Query param `animeEpisodeId` is required.");
      const server = q(url, "server") || HiAnime.Servers.VidStreaming;
      const category = q(url, "category") || "sub";
      const data = await scraper.getEpisodeSources(epId, server, category);
      return json(data);
    }

    // ── GET /api/category/:name?page= ─────────────────────────────────────────
    if (parts[0] === "category" && parts[1]) {
      const page = parseInt(q(url, "page")) || 1;
      const data = await scraper.getCategoryAnime(parts[1], page);
      return json(data);
    }

    // ── GET /api/genre/:name?page= ────────────────────────────────────────────
    if (parts[0] === "genre" && parts[1]) {
      const page = parseInt(q(url, "page")) || 1;
      const data = await scraper.getGenreAnime(parts[1], page);
      return json(data);
    }

    // ── GET /api/producer/:name?page= ─────────────────────────────────────────
    if (parts[0] === "producer" && parts[1]) {
      const page = parseInt(q(url, "page")) || 1;
      const data = await scraper.getProducerAnimes(parts[1], page);
      return json(data);
    }

    // ── GET /api/azlist/:sortOption?page= ─────────────────────────────────────
    if (parts[0] === "azlist" && parts[1]) {
      const page = parseInt(q(url, "page")) || 1;
      const data = await scraper.getAZList(parts[1], page);
      return json(data);
    }

    // ── GET /api/schedule?date=YYYY-MM-DD&tzOffset= ───────────────────────────
    if (rawPath === "/schedule") {
      const date = q(url, "date");
      if (!date) return error("Query param `date` is required (YYYY-MM-DD).");
      const tzOffset = parseInt(q(url, "tzOffset")) || -330;
      const data = await scraper.getEstimatedSchedule(date, tzOffset);
      return json(data);
    }

    // ── GET /api/qtip/:animeId ────────────────────────────────────────────────
    if (parts[0] === "qtip" && parts[1]) {
      const data = await scraper.getQtipInfo(parts[1]);
      return json(data);
    }

    // ── 404 ───────────────────────────────────────────────────────────────────
    return error(`Unknown endpoint: ${rawPath}`, 404);
  } catch (err) {
    console.error("[hianime-api]", err);
    return error(err?.message ?? "Internal server error.", 500);
  }
}

// ─── docs payload ────────────────────────────────────────────────────────────

function endpointDocs() {
  return [
    { method: "GET", path: "/api/home",                             description: "Home page – spotlight, trending, latest, genres" },
    { method: "GET", path: "/api/search?q={query}&page={n}",        description: "Full-text anime search with optional filters" },
    { method: "GET", path: "/api/search/suggestion?q={query}",      description: "Live search suggestions / autocomplete" },
    { method: "GET", path: "/api/anime/{id}",                       description: "Full info for an anime by its slug-id" },
    { method: "GET", path: "/api/anime/{id}/episodes",              description: "Episode list for an anime" },
    { method: "GET", path: "/api/anime/{id}/next-episode-schedule", description: "Next episode air-date schedule" },
    { method: "GET", path: "/api/episode/servers?animeEpisodeId={id}",                           description: "Available servers for an episode" },
    { method: "GET", path: "/api/episode/sources?animeEpisodeId={id}&server={s}&category={sub|dub|raw}", description: "Streaming sources / M3U8 for an episode" },
    { method: "GET", path: "/api/category/{name}?page={n}",         description: "Category listing (e.g. most-popular, top-airing)" },
    { method: "GET", path: "/api/genre/{name}?page={n}",            description: "Genre listing (e.g. action, romance)" },
    { method: "GET", path: "/api/producer/{name}?page={n}",         description: "Producer / studio listing" },
    { method: "GET", path: "/api/azlist/{all|a-z|0-9}?page={n}",    description: "A-Z sorted anime list" },
    { method: "GET", path: "/api/schedule?date=YYYY-MM-DD&tzOffset={n}", description: "Daily air schedule" },
    { method: "GET", path: "/api/qtip/{animeId}",                   description: "Quick-tip popup info for an anime" },
  ];
}
