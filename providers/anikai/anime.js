import { get } from '../../utils/http.js';
import {
  parseAnime,
  parseHome,
  parseAzList,
  parseListPage,
  parseNavMenu,
  buildEpisodeSources,
} from './parser.js';
import { BASE_URLS } from '../../constants/baseurl.js';

const BASE = BASE_URLS.anikai;

export async function getHome() {
  const html = await get(`${BASE}/home`);
  return parseHome(html);
}

export async function getById(id) {
  const html = await get(`${BASE}/watch/${id}`);
  return parseAnime(html);
}

export async function getAzList(sortOption = 'all', page = 1) {
  const path = sortOption === 'all' ? '/az-list' : `/az-list/${sortOption}`;
  const html = await get(`${BASE}${path}`, { params: { page } });
  return parseAzList(html);
}

export async function getGenre(name, page = 1, sort = null) {
  const params = { page };
  if (sort) params.sort = sort;
  const html = await get(`${BASE}/genres/${name}`, { params });
  return parseListPage(html);
}

export async function getCategory(name, page = 1, sort = null) {
  // categories: movie, tv, ova, ona, special, new-releases, updates, ongoing, recent, completed, upcoming
  const params = { page };
  if (sort) params.sort = sort;
  const html = await get(`${BASE}/${name}`, { params });
  return parseListPage(html);
}

// ─── Type pages ───────────────────────────────────────────────────────────────
// Types use the same top-level URL pattern as categories (/ova, /tv, /movie etc.)
// and produce the same HTML structure — parseListPage handles both identically.
// getType is a named alias so routes can be semantically distinct.

export async function getType(name, page = 1, sort = null) {
  const params = { page };
  if (sort) params.sort = sort;
  const html = await get(`${BASE}/${name}`, { params });
  return parseListPage(html);
}

// ─── Nav menu ─────────────────────────────────────────────────────────────────
// Returns the full header/nav structure (genres, types, links, brand, search)
// by fetching the home page and parsing its nav — available on every page.

export async function getNavMenu(providerName = 'anikai') {
  const html = await get(`${BASE}/home`);
  return parseNavMenu(html, providerName);
}

// ─── Episodes ─────────────────────────────────────────────────────────────────
// The episode list on anikai.to is injected by JS into an empty
// <section class="episode-section"></section> — there is no scrapeable
// static HTML or public AJAX endpoint for it.
//
// Instead we derive the episode list entirely from data that parseAnime
// already returns from the watch page:
//   - anime.episodesTotal  → total number of episodes
//   - anime.episodes.sub   → how many sub episodes exist
//   - anime.episodes.dub   → how many dub episodes exist
//   - anime.malId / alId   → used to build megaplay.buzz src URLs
//   - anime.name           → used as episode title fallback
//
// Streaming src URLs are built for every episode using the three
// megaplay.buzz strategies (mal / ani) — no aniwatch ep-id required.

export async function getEpisodes(id) {
  const { anime } = await getById(id);

  const total   = anime.episodesTotal || anime.episodes.sub || anime.episodes.dub || 0;
  const subCount = anime.episodes.sub || 0;
  const dubCount = anime.episodes.dub || 0;
  const malId   = anime.malId  || null;
  const alId    = anime.alId   || null;
  const name    = anime.name   || id;

  if (!total) {
    throw new Error(`No episode count available for "${id}".`);
  }

  const episodes = [];

  for (let n = 1; n <= total; n++) {
    const title   = `${name} - Episode ${n}`;
    const hasSub  = n <= subCount;
    const hasDub  = n <= dubCount;
    const sources = buildEpisodeSources(n, malId, alId, hasSub, hasDub);

    episodes.push({ number: n, title, isFiller: false, hasSub, hasDub, sources });
  }

  return {
    totalEpisodes: total,
    malId,
    alId,
    episodes,
  };
}

// ─── Single episode detail ────────────────────────────────────────────────────

export async function getEpisode(id, epNum) {
  const { totalEpisodes, malId, alId, episodes } = await getEpisodes(id);
  const n  = parseInt(epNum, 10);
  const ep = episodes.find((e) => e.number === n);

  if (!ep) {
    throw new Error(`Episode ${n} not found for "${id}". Total episodes: ${totalEpisodes}.`);
  }

  return { malId, alId, episode: ep };
}
