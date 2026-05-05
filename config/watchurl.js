// ─── Watch URL + Video Source Config ─────────────────────────────────────────
//
// watchUrl     — Primary anime site whose /watch/{slug} pages are scraped.
//                Anikoto pages expose anilist_id in the banner background-image
//                and episode counts in .bmeta — no inline episode list (Type 1).
//
// hiAnimeUrl   — Used to fetch the /ajax/v2/episode/list/{siteId} endpoint
//                for episode title lists when watchUrl IS hianime.re (Type 2).
//                When watchUrl is anikoto, this is NOT used (different ID space).
//
// videoSrc     — Streaming URL builders using anilist_id from the banner image.
//
// Streaming URL format:
//   sub → https://megaplay.buzz/stream/ani/{anilist_id}/{episode_num}/sub
//   dub → https://megaplay.buzz/stream/ani/{anilist_id}/{episode_num}/dub

// ── Primary watch site ────────────────────────────────────────────────────────
// Switch between "https://anikototv.to" and "https://hianime.re" here.
const WATCH_URL   = "https://anikototv.to";
const HIANIME_URL = "https://hianime.re";

// ── Streaming base ────────────────────────────────────────────────────────────
const MEGAPLAY_BASE = "https://megaplay.buzz/stream/ani";

export const WATCH_CONFIG = {
  // Site whose /watch/{slug} HTML pages are scraped for anilistId / episode data
  watchUrl: WATCH_URL,

  // HiAnime base — used exclusively for /ajax/v2/episode/list/{numericId}
  // (only relevant when watchUrl === HIANIME_URL)
  hiAnimeUrl: HIANIME_URL,

  // ── Streaming URL builders ────────────────────────────────────────────────
  videoSrc: {
    /**
     * Full sub stream URL for a specific episode.
     * @param {number} anilistId  — extracted from banner bg-image
     * @param {number} episodeNum — episode number
     * @returns {string}  e.g. "https://megaplay.buzz/stream/ani/169755/1/sub"
     */
    sub: (anilistId, episodeNum) =>
      `${MEGAPLAY_BASE}/${anilistId}/${episodeNum}/sub`,

    /**
     * Full dub stream URL for a specific episode.
     */
    dub: (anilistId, episodeNum) =>
      `${MEGAPLAY_BASE}/${anilistId}/${episodeNum}/dub`,

    /**
     * Template strings for episode-list responses.
     * Replace {ep} client-side with the actual episode number.
     */
    subTemplate: (anilistId) => `${MEGAPLAY_BASE}/${anilistId}/{ep}/sub`,
    dubTemplate: (anilistId) => `${MEGAPLAY_BASE}/${anilistId}/{ep}/dub`,
  },
};
