// ─── HiAnime API Config ───────────────────────────────────────────────────────

export const CONFIG = {
  // Cheerio parse options
  PARSE_OPTIONS: { xmlMode: false },

  // Default pagination
  DEFAULT_PAGE: 1,

  // Request headers to mimic a real browser
  REQUEST_HEADERS: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Upgrade-Insecure-Requests": "1",
  },

  // AJAX headers for XHR endpoints
  AJAX_HEADERS: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Accept-Language": "en-US,en;q=0.9",
  },

  // Cache TTLs (seconds) — used in Vercel Edge cache headers
  CACHE: {
    HOME: 60 * 5,          // 5 min
    SEARCH: 60 * 2,        // 2 min
    ANIME_INFO: 60 * 30,   // 30 min
    EPISODES: 60 * 10,     // 10 min
    SERVERS: 60 * 5,       // 5 min
    SOURCES: 60 * 2,       // 2 min
    CATEGORY: 60 * 5,      // 5 min
    GENRE: 60 * 10,        // 10 min
    SCHEDULE: 60 * 15,     // 15 min
    AZ_LIST: 60 * 60,      // 1 hour
  },

  // Valid anime categories on hianime
  CATEGORIES: [
    "subbed-anime",
    "dubbed-anime",
    "recently-added",
    "most-popular",
    "most-favorite",
    "completed",
    "recently-updated",
    "top-airing",
    "top-upcoming",
    "movie",
    "special",
    "ova",
    "ona",
    "tv",
    "latest-episode",
  ],

  // Valid servers
  SERVERS: {
    VidStreaming: "vidstreaming",
    MegaCloud: "megacloud",
    StreamSB: "streamsb",
    StreamTape: "streamtape",
  },

  // Valid AZ sort options
  AZ_SORT_OPTIONS: [
    "all", "other", "0-9",
    "a","b","c","d","e","f","g","h","i","j","k","l","m",
    "n","o","p","q","r","s","t","u","v","w","x","y","z",
  ],
};
