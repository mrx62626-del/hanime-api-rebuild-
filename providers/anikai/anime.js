import { get } from '../../utils/http.js';
import {
  parseAnime,
  parseHome,
  parseAzList,
  parseListPage,
  parseSyncData,
  parseEpisodeList,
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

export async function getGenre(name, page = 1) {
  const html = await get(`${BASE}/genres/${name}`, { params: { page } });
  return parseListPage(html);
}

export async function getCategory(name, page = 1) {
  // categories: movie, tv, ova, ona, special, new-releases, updates, ongoing, recent, completed, upcoming
  const html = await get(`${BASE}/${name}`, { params: { page } });
  return parseListPage(html);
}

// ─── Episodes ─────────────────────────────────────────────────────────────────
// Flow:
//   1. Fetch watch page for the anime slug (same as getById) to extract
//      animeId (site-internal short id), malId, alId, animeName from syncData.
//   2. Use animeId to call the AJAX episode-list endpoint which returns an
//      HTML fragment of .ep-item anchors.
//   3. Parse the fragment → array of { number, title, episodeId, isFiller }.
//   4. Attach streaming src URLs (megaplay.buzz) to each episode.

export async function getEpisodes(id) {
  // Step 1 — get watch page meta
  const watchHtml = await get(`${BASE}/watch/${id}`);
  const { animeId, malId, alId, animeName } = parseSyncData(watchHtml);

  if (!animeId) {
    throw new Error(`Could not resolve animeId for "${id}". The watch page may have changed.`);
  }

  // Step 2 — fetch AJAX episode list (HTML fragment)
  const listHtml = await get(`${BASE}/ajax/episode/list/${animeId}`);

  // Step 3 — parse episode items
  const episodes = parseEpisodeList(listHtml, animeName);

  // Step 4 — attach streaming sources to every episode
  const episodesWithSrc = episodes.map((ep) => ({
    ...ep,
    sources: buildEpisodeSources(ep.episodeId, ep.number, malId, alId),
  }));

  return {
    totalEpisodes: episodesWithSrc.length,
    malId,
    alId,
    episodes: episodesWithSrc,
  };
}

// ─── Single episode detail ────────────────────────────────────────────────────
// Returns one episode entry (same shape as getEpisodes items) by episode number.

export async function getEpisode(id, epNum) {
  const { episodes, malId, alId } = await getEpisodes(id);
  const n = parseInt(epNum, 10);
  const ep = episodes.find((e) => e.number === n);

  if (!ep) {
    throw new Error(`Episode ${n} not found for anime "${id}".`);
  }

  return { malId, alId, episode: ep };
}
