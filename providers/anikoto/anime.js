// providers/anikoto/anime.js
import { get } from '../../utils/http.js';
import {
  parseHome, parseAnime, parseListPage, parseNavMenu, parseIndex,
  parseEpisodesFromJson, parseAnimeFromJson, parseAzListFromHtml, mergeAnimeData,
} from './parser.js';
import { BASE_URLS } from '../../constants/baseurl.js';

const BASE = BASE_URLS.anikoto;
const API_BASE = BASE_URLS.anikotoApi;

export async function getHome() { return parseHome(await get(`${BASE}/home`)); }
export async function getIndex() { return parseIndex(await get(`${BASE}/`)); }

export async function getById(id) {
  const isNumeric = /^\d+$/.test(id);
  let jsonData = null, htmlData = null, numericId = isNumeric ? id : null;

  // Try JSON API
  if (numericId) {
    try { jsonData = parseAnimeFromJson(await get(`${API_BASE}/series/${numericId}`)); } catch {}
  }

  // Try HTML scraper
  try {
    htmlData = parseAnime(await get(`${BASE}/watch/${numericId || id}`));
    if (!numericId && htmlData.anime.animeId) numericId = htmlData.anime.animeId;
  } catch {}

  // If HTML gave us a numeric ID but JSON wasn't tried yet
  if (!jsonData && numericId && !isNumeric) {
    try { jsonData = parseAnimeFromJson(await get(`${API_BASE}/series/${numericId}`)); } catch {}
  }

  if (jsonData || htmlData) return mergeAnimeData(jsonData, htmlData);
  throw new Error(`Failed to fetch anime "${id}" from all sources`);
}

export async function getAzList(sort = 'all', page = 1) {
  const path = sort === 'all' ? '/az-list' : `/az-list/${sort}`;
  return parseAzListFromHtml(await get(`${BASE}${path}`, { params: page > 1 ? { page } : {} }));
}

export async function getGenre(name, page = 1, sort = null) {
  return parseListPage(await get(`${BASE}/genre/${name}`, { params: { page, ...(sort && { sort }) } }));
}

export async function getCategory(name, page = 1, sort = null) {
  return parseListPage(await get(`${BASE}/${name}`, { params: { page, ...(sort && { sort }) } }));
}

export async function getType(name, page = 1, sort = null) {
  return parseListPage(await get(`${BASE}/type/${name.toLowerCase()}`, { params: { page, ...(sort && { sort }) } }));
}

export async function getNavMenu(providerName = 'anikoto') {
  return parseNavMenu(await get(`${BASE}/home`), providerName);
}

export async function getEpisodes(id) {
  let numericId = /^\d+$/.test(id) ? id : null;
  if (!numericId) {
    try { numericId = parseAnime(await get(`${BASE}/watch/${id}`)).anime.animeId; } catch {}
  }
  if (numericId) {
    return parseEpisodesFromJson(await get(`${API_BASE}/series/${numericId}`));
  }
  throw new Error(`Could not determine numeric ID for "${id}"`);
}

export async function getEpisode(id, epNum) {
  const { totalEpisodes, malId, alId, episodes } = await getEpisodes(id);
  const ep = episodes.find(e => e.number === parseInt(epNum, 10));
  if (!ep) throw new Error(`Episode ${epNum} not found. Total: ${totalEpisodes}.`);
  return { malId, alId, episode: ep };
}
