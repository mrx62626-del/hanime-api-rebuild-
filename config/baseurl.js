// ─── HiAnime Base URL Config ─────────────────────────────────────────────────
// Primary domain: hianime.re  |  Backup: aniwatch.re

const PRIMARY = "https://hianime.re";
const BACKUP  = "https://aniwatch.re";

// Active domain — swap to BACKUP if primary goes down
const BASE = PRIMARY;

export const BASE_URL = BASE;

// ── Page URLs ─────────────────────────────────────────────────────────────────

export const URLS = {
  // Static
  home:          () => `${BASE}/home`,
  search:        (q, page = 1) => `${BASE}/search?keyword=${encodeURIComponent(q)}&page=${page}`,
  searchSuggest: (q)          => `${BASE}/ajax/search/suggest?keyword=${encodeURIComponent(q)}`,

  // Anime detail
  animeInfo:  (id)  => `${BASE}/anime/${id}`,
  animeWatch: (id)  => `${BASE}/${id}`,

  // Lists & browsing
  category:  (name, page = 1) => `${BASE}/${name}?page=${page}`,
  genre:     (name, page = 1) => `${BASE}/genre/${name}?page=${page}`,
  producer:  (name, page = 1) => `${BASE}/producer/${name}?page=${page}`,
  azList:    (opt, page = 1)  => `${BASE}/az-list/${opt}?page=${page}`,

  // Episodes & servers
  episodes:       (animeId)        => `${BASE}/ajax/v2/episode/list/${animeId}`,
  episodeServers: (episodeId)      => `${BASE}/ajax/v2/episode/servers?episodeId=${episodeId}`,
  episodeSources: (serverId, type) => `${BASE}/ajax/v2/episode/sources?id=${serverId}`,

  // Schedule
  schedule: (date) => `${BASE}/ajax/schedule/list?tzOffset=-330&date=${date}`,

  // Qtip (hover info card)
  qtip: (id) => `${BASE}/ajax/anime/tip?id=${id}`,
};
