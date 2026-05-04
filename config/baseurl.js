// ─── HiAnime Base URL Config ─────────────────────────────────────────────────
const PRIMARY = "https://anikototv.to";
const BACKUP  = "https://aniwatch.re";

// Active domain — swap to BACKUP if primary goes down
const BASE = PRIMARY;

export const BASE_URL = BASE;

export const URLS = {
  // Static
  home:          () => `${BASE}/home`,
  search:        (q, page = 1) => `${BASE}/search?keyword=${encodeURIComponent(q)}&page=${page}`,
  searchSuggest: (q)           => `${BASE}/ajax/search/suggest?keyword=${encodeURIComponent(q)}`,

  // Anime detail
  animeInfo:  (id) => `${BASE}/anime/${id}`,
  animeWatch: (id) => `${BASE}/watch/${id}`,

  // AJAX
  relatedAnimes:   (numericId) => `${BASE}/ajax/anime/related?id=${numericId}`,
  promoVideos:     (numericId) => `${BASE}/ajax/anime/videos?id=${numericId}`,
  characterActors: (numericId) => `${BASE}/ajax/character/list/${numericId}`,
  seasons:         (numericId) => `${BASE}/ajax/anime/season/list/${numericId}`,

  // Lists & browsing
  category:  (name, page = 1) => `${BASE}/${name}?page=${page}`,
  genre:     (name, page = 1) => `${BASE}/genre/${name}?page=${page}`,
  producer:  (name, page = 1) => `${BASE}/producer/${name}?page=${page}`,
  azList:    (opt, page = 1)  => `${BASE}/az-list/${opt}?page=${page}`,

  // Episodes & servers
  episodes:       (animeId)   => `${BASE}/ajax/v2/episode/list/${animeId}`,
  episodeServers: (episodeId) => `${BASE}/ajax/v2/episode/servers?episodeId=${episodeId}`,
  episodeSources: (serverId)  => `${BASE}/ajax/v2/episode/sources?id=${serverId}`,

  // Schedule
  schedule: (date) => `${BASE}/ajax/schedule/list?tzOffset=-330&date=${date}`,

  // Qtip
  qtip: (id) => `${BASE}/ajax/anime/tip?id=${id}`,
};
