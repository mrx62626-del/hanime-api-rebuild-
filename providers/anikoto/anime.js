// providers/anikoto/anime.js
import { get } from '../../utils/http.js';
import {
  parseHome,
  parseAnime,
  parseListPage,
  parseNavMenu,
  parseIndex,
  parseEpisodesFromJson,
  parseAnimeFromJson,
  parseAzListFromHtml,
} from './parser.js';
import { BASE_URLS } from '../../constants/baseurl.js';

const BASE = BASE_URLS.anikoto;           // https://anikototv.to
const API_BASE = BASE_URLS.anikotoApi;    // https://anikotoapi.site

// ─── Home Page ─────────────────────────────────────────────────────────
export async function getHome() {
  const html = await get(`${BASE}/home`);
  return parseHome(html);
}

// ─── Index / Landing Page ───────────────────────────────────────────────
export async function getIndex() {
  const html = await get(`${BASE}/`);
  return parseIndex(html);
}

// ─── Anime Detail ──────────────────────────────────────────────────────
export async function getById(id) {
  try {
    // Try JSON API first (most reliable for anikoto)
    const jsonUrl = `${API_BASE}/series/${id}`;
    const data = await get(jsonUrl);
    return parseAnimeFromJson(data);
  } catch (e) {
    // Fallback to HTML scraping from watch page
    try {
      const html = await get(`${BASE}/watch/${id}`);
      return parseAnime(html);
    } catch (err) {
      throw new Error(`Failed to fetch anime details for "${id}": ${err.message}`);
    }
  }
}

// ─── A-Z List ───────────────────────────────────────────────────────────
export async function getAzList(sortOption = 'all', page = 1) {
  const path = sortOption === 'all' ? '/az-list' : `/az-list/${sortOption}`;
  const params = {};
  if (page > 1) params.page = page;
  const html = await get(`${BASE}${path}`, { params });
  return parseAzListFromHtml(html);
}

// ─── Genre ──────────────────────────────────────────────────────────────
export async function getGenre(name, page = 1, sort = null) {
  const params = { page };
  if (sort) params.sort = sort;
  const html = await get(`${BASE}/genre/${name}`, { params });
  return parseListPage(html);
}

// ─── Category ───────────────────────────────────────────────────────────
export async function getCategory(name, page = 1, sort = null) {
  const params = { page };
  if (sort) params.sort = sort;
  // Categories with status prefix need full path
  const path = name.startsWith('status/') ? `/${name}` : `/${name}`;
  const html = await get(`${BASE}${path}`, { params });
  return parseListPage(html);
}

// ─── Type ───────────────────────────────────────────────────────────────
export async function getType(name, page = 1, sort = null) {
  const params = { page };
  if (sort) params.sort = sort;
  const html = await get(`${BASE}/type/${name.toLowerCase()}`, { params });
  return parseListPage(html);
}

// ─── Nav Menu ───────────────────────────────────────────────────────────
export async function getNavMenu(providerName = 'anikoto') {
  const html = await get(`${BASE}/home`);
  return parseNavMenu(html, providerName);
}

// ─── Episodes ──────────────────────────────────────────────────────────
export async function getEpisodes(id) {
  try {
    const jsonUrl = `${API_BASE}/series/${id}`;
    const data = await get(jsonUrl);
    return parseEpisodesFromJson(data);
  } catch (e) {
    throw new Error(`Failed to fetch episodes for "${id}": ${e.message}`);
  }
}

// ─── Single Episode ────────────────────────────────────────────────────
export async function getEpisode(id, epNum) {
  const episodesData = await getEpisodes(id);
  const n = parseInt(epNum, 10);
  const ep = episodesData.episodes.find((e) => e.number === n);

  if (!ep) {
    throw new Error(
      `Episode ${n} not found for "${id}". Total episodes: ${episodesData.totalEpisodes}.`
    );
  }

  return {
    malId: episodesData.malId,
    alId: episodesData.alId,
    episode: ep,
  };
}
