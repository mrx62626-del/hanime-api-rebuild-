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
  mergeAnimeData,
} from './parser.js';
import { BASE_URLS } from '../../constants/baseurl.js';

const BASE = BASE_URLS.anikoto;           // https://anikototv.to
const API_BASE = BASE_URLS.anikotoApi;    // https://anikotoapi.site

// ─── Home Page ───────────────────────────────────────────────────────
export async function getHome() {
  const html = await get(`${BASE}/home`);
  return parseHome(html);
}

// ─── Index / Landing Page ────────────────────────────────────────────
export async function getIndex() {
  const html = await get(`${BASE}/`);
  return parseIndex(html);
}

// ─── Anime Detail (Combined: JSON API + HTML scraper) ───────────────
export async function getById(id) {
  const isNumeric = /^\d+$/.test(id);
  let jsonData = null;
  let htmlData = null;
  let numericId = isNumeric ? id : null;

  // ── Step 1: Try JSON API ──────────────────────────────────────────
  if (numericId) {
    try {
      const jsonUrl = `${API_BASE}/series/${numericId}`;
      const raw = await get(jsonUrl);
      jsonData = parseAnimeFromJson(raw);
    } catch (e) {
      // JSON API failed, will rely on HTML
    }
  }

  // ── Step 2: Try HTML scraper ──────────────────────────────────────
  try {
    const fetchId = numericId || id;
    const html = await get(`${BASE}/watch/${fetchId}`);
    htmlData = parseAnime(html);

    // If we didn't have a numeric ID before, extract it from HTML
    if (!numericId && htmlData.anime.animeId) {
      numericId = htmlData.anime.animeId;
    }
  } catch (e) {
    // HTML scraper failed
  }

  // ── Step 3: If HTML gave us a numeric ID but JSON wasn't tried ────
  if (!jsonData && numericId && !isNumeric) {
    try {
      const jsonUrl = `${API_BASE}/series/${numericId}`;
      const raw = await get(jsonUrl);
      jsonData = parseAnimeFromJson(raw);
    } catch (e) {
      // Both failed
    }
  }

  // ── Step 4: Merge results ─────────────────────────────────────────
  if (jsonData || htmlData) {
    return mergeAnimeData(jsonData, htmlData);
  }

  throw new Error(`Failed to fetch anime "${id}" from all sources`);
}

// ─── A-Z List ────────────────────────────────────────────────────────
export async function getAzList(sortOption = 'all', page = 1) {
  const path = sortOption === 'all' ? '/az-list' : `/az-list/${sortOption}`;
  const params = {};
  if (page > 1) params.page = page;
  const html = await get(`${BASE}${path}`, { params });
  return parseAzListFromHtml(html);
}

// ─── Genre ───────────────────────────────────────────────────────────
export async function getGenre(name, page = 1, sort = null) {
  const params = { page };
  if (sort) params.sort = sort;
  const html = await get(`${BASE}/genre/${name}`, { params });
  return parseListPage(html);
}

// ─── Category ────────────────────────────────────────────────────────
export async function getCategory(name, page = 1, sort = null) {
  const params = { page };
  if (sort) params.sort = sort;
  const html = await get(`${BASE}/${name}`, { params });
  return parseListPage(html);
}

// ─── Type ────────────────────────────────────────────────────────────
export async function getType(name, page = 1, sort = null) {
  const params = { page };
  if (sort) params.sort = sort;
  const html = await get(`${BASE}/type/${name.toLowerCase()}`, { params });
  return parseListPage(html);
}

// ─── Nav Menu ────────────────────────────────────────────────────────
export async function getNavMenu(providerName = 'anikoto') {
  const html = await get(`${BASE}/home`);
  return parseNavMenu(html, providerName);
}

// ─── Episodes (always from JSON API) ─────────────────────────────────
export async function getEpisodes(id) {
  const isNumeric = /^\d+$/.test(id);
  let numericId = isNumeric ? id : null;

  // If slug, try to get numeric ID from HTML first
  if (!numericId) {
    try {
      const html = await get(`${BASE}/watch/${id}`);
      const parsed = parseAnime(html);
      numericId = parsed.anime.animeId;
    } catch (e) {
      // Will try slug directly
    }
  }

  // Try JSON API with numeric ID
  if (numericId) {
    try {
      const jsonUrl = `${API_BASE}/series/${numericId}`;
      const data = await get(jsonUrl);
      return parseEpisodesFromJson(data);
    } catch (e) {
      throw new Error(`Failed to fetch episodes for "${id}": ${e.message}`);
    }
  }

  throw new Error(`Could not determine numeric ID for episodes of "${id}"`);
}

// ─── Single Episode ──────────────────────────────────────────────────
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
