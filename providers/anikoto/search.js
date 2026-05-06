import { get } from '../../utils/http.js';
import { parseSearchFromHtml } from './parser.js';
import { BASE_URLS } from '../../constants/baseurl.js';

const BASE = BASE_URLS.anikoto;

const GENRE_MAP = {
  'action': '1', 'adventure': '2', 'cars': '538', 'comedy': '8',
  'dementia': '453', 'demons': '119', 'drama': '62', 'ecchi': '214',
  'fantasy': '3', 'game': '180', 'harem': '215', 'historical': '70',
  'horror': '222', 'isekai': '74', 'josei': '404', 'kids': '46',
  'magic': '203', 'martial-arts': '114', 'mecha': '123', 'military': '125',
  'music': '242', 'mystery': '57', 'parody': '162', 'police': '136',
  'psychological': '73', 'romance': '28', 'samurai': '163', 'school': '14',
  'sci-fi': '12', 'seinen': '50', 'shoujo': '252', 'shoujo-ai': '235',
  'shounen': '15', 'shounen-ai': '233', 'slice-of-life': '35', 'space': '124',
  'sports': '29', 'super-power': '16', 'supernatural': '9', 'thriller': '54',
  'unknown': '32', 'vampire': '58',
};

function resolveGenreId(value) {
  if (!value) return value;
  const str = String(value).trim().toLowerCase();
  if (/^\d+$/.test(str)) return str;
  return GENRE_MAP[str] !== undefined ? GENRE_MAP[str] : str;
}

function resolveGenres(params) {
  const key = 'genre[]';
  if (!params[key]) return;
  if (Array.isArray(params[key])) {
    params[key] = params[key].map(resolveGenreId);
  } else {
    params[key] = resolveGenreId(params[key]);
  }
}

export async function query(q, page = 1, filters = {}) {
  const params = { keyword: q, page, ...filters };
  resolveGenres(params);
  const html = await get(`${BASE}/filter`, { params });
  const result = parseSearchFromHtml(html);
  return { ...result, searchQuery: q, searchFilters: filters };
}

export async function browse(filters = {}, page = 1) {
  const { keyword, ...rest } = filters;
  const params = { keyword: keyword || '', page, ...rest };
  resolveGenres(params);
  const html = await get(`${BASE}/filter`, { params });
  const result = parseSearchFromHtml(html);
  return { ...result, filters: { keyword: keyword || null, ...rest } };
}
