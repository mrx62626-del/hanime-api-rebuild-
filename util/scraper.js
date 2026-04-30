// ─── HiAnime Scraper ─────────────────────────────────────────────────────────
// All scraping functions. Each returns a plain JS object ready to be JSON-serialised.

import * as cheerio from "cheerio";
import { fetchPage, fetchJSON, clean, extractId, extractWatchId } from "./helper.js";
import {
  formatFilmCard,
  formatSpotlight,
  formatTrendingItem,
  formatAnimeInfo,
  formatEpisode,
  formatServer,
  formatSearchSuggestion,
  parseTotalPages,
} from "./format.js";
import { URLS } from "../config/baseurl.js";

// ── Home Page ─────────────────────────────────────────────────────────────────

export async function scrapeHome() {
  const html = await fetchPage(URLS.home());
  const $ = cheerio.load(html);

  // Spotlight
  const spotlight = [];
  $(".swiper-slide .deslide-item").each((i, el) => {
    spotlight.push(formatSpotlight($(el), $, i + 1));
  });

  // Trending
  const trending = [];
  $(".anif-block-ul li").each((i, el) => {
    trending.push(formatTrendingItem($(el), $, i + 1));
  });

  // Helper to parse a grid section
  const parseSection = (selector) => {
    const list = [];
    $(selector).find(".flw-item").each((_, el) => list.push(formatFilmCard($(el), $)));
    return list;
  };

  return {
    spotlight,
    trending,
    latestEpisode:   parseSection("#main-content .block_area:nth-child(1)"),
    topUpcoming:     parseSection("#main-content .block_area:nth-child(2)"),
    top10: {
      today:   parseSideChart($, "tab-today"),
      week:    parseSideChart($, "tab-week"),
      month:   parseSideChart($, "tab-month"),
    },
    genres: scrapeGenreList($),
  };
}

function parseSideChart($, tabId) {
  const list = [];
  $(`#${tabId} li`).each((i, el) => {
    const anchor = $(el).find("a").first();
    const href   = anchor.attr("href") || "";
    list.push({
      rank:   i + 1,
      id:     extractId(href),
      name:   clean($(el).find(".film-name").text()),
      episodes: {
        sub: parseInt($(el).find(".tick-sub").text(), 10) || null,
        dub: parseInt($(el).find(".tick-dub").text(), 10) || null,
      },
    });
  });
  return list;
}

function scrapeGenreList($) {
  const genres = [];
  $(".nav-item a[href*='/genre/']").each((_, el) => {
    genres.push(clean($(el).text()));
  });
  return [...new Set(genres)];
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function scrapeSearch(query, page = 1, filters = {}) {
  let url = URLS.search(query, page);
  // Append extra filter params (type, status, season, etc.)
  for (const [k, v] of Object.entries(filters)) {
    if (v) url += `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
  }

  const html = await fetchPage(url);
  const $ = cheerio.load(html);

  const animes = [];
  $(".flw-item").each((_, el) => animes.push(formatFilmCard($(el), $)));

  const totalPages = parseTotalPages($);
  const totalCount = parseInt(
    clean($(".pre-pagination ~ .cat-heading").text()).replace(/\D/g, ""),
    10
  ) || animes.length;

  return { query, page, totalPages, totalCount, animes };
}

// ── Search Suggestions ────────────────────────────────────────────────────────

export async function scrapeSearchSuggestions(query) {
  const data = await fetchJSON(URLS.searchSuggest(query));
  const html = data.html || "";
  const $ = cheerio.load(html);

  const suggestions = [];
  $(".nav-item, li").each((_, el) => {
    const item = formatSearchSuggestion($(el), $);
    if (item.id) suggestions.push(item);
  });

  return { query, suggestions };
}

// ── Anime Info ─────────────────────────────────────────────────────────────────

export async function scrapeAnimeInfo(animeId) {
  const html = await fetchPage(URLS.animeInfo(animeId));
  const $ = cheerio.load(html);
  const info = formatAnimeInfo($, animeId);

  // Related / recommended animes shown on info page
  const related = [];
  $(".block_area_category .flw-item").each((_, el) =>
    related.push(formatFilmCard($(el), $))
  );

  return { anime: info, related };
}

// ── Episodes ──────────────────────────────────────────────────────────────────

export async function scrapeEpisodes(animeId) {
  // animeId here must be the numeric site ID, not the slug.
  // The watch page embeds it as data-id on #main-wrapper.
  // Callers should resolve it first via scrapeAnimeId().
  const data = await fetchJSON(URLS.episodes(animeId));
  const html = data.html || "";
  const $ = cheerio.load(html);

  const episodes = [];
  $(".ssl-item").each((_, el) => {
    episodes.push(formatEpisode($(el), $));
  });

  return { animeId, totalEpisodes: episodes.length, episodes };
}

/**
 * Resolve the numeric anime ID from the slug by fetching the watch page.
 */
export async function scrapeAnimeNumericId(slug) {
  const html = await fetchPage(URLS.animeWatch(slug));
  const $ = cheerio.load(html);
  const id = $("#main-wrapper").attr("data-id");
  if (!id) throw new Error(`Could not resolve numeric ID for: ${slug}`);
  return id;
}

// ── Episode Servers ───────────────────────────────────────────────────────────

export async function scrapeEpisodeServers(episodeId) {
  const data = await fetchJSON(URLS.episodeServers(episodeId));
  const html = data.html || "";
  const $ = cheerio.load(html);

  const parse = (selector) => {
    const list = [];
    $(selector).each((_, el) => list.push(formatServer($(el), $)));
    return list;
  };

  return {
    episodeId,
    sub:  parse(".ps_-block.ps_-block-sub .server-item"),
    dub:  parse(".ps_-block.ps_-block-dub .server-item"),
    raw:  parse(".ps_-block.ps_-block-raw .server-item"),
  };
}

// ── Episode Sources ───────────────────────────────────────────────────────────

export async function scrapeEpisodeSources(serverId) {
  const data = await fetchJSON(URLS.episodeSources(serverId));
  // Response shape: { type, link, server } — pass through directly
  return {
    serverId,
    type:   data.type   || null,
    server: data.server || null,
    link:   data.link   || null,
  };
}

// ── Category ──────────────────────────────────────────────────────────────────

export async function scrapeCategory(category, page = 1) {
  const html = await fetchPage(URLS.category(category, page));
  const $ = cheerio.load(html);

  const animes = [];
  $(".flw-item").each((_, el) => animes.push(formatFilmCard($(el), $)));

  return {
    category,
    page,
    totalPages: parseTotalPages($),
    animes,
  };
}

// ── Genre ─────────────────────────────────────────────────────────────────────

export async function scrapeGenre(genre, page = 1) {
  const html = await fetchPage(URLS.genre(genre, page));
  const $ = cheerio.load(html);

  const animes = [];
  $(".flw-item").each((_, el) => animes.push(formatFilmCard($(el), $)));

  return {
    genre,
    page,
    totalPages: parseTotalPages($),
    animes,
  };
}

// ── Producer ──────────────────────────────────────────────────────────────────

export async function scrapeProducer(producer, page = 1) {
  const html = await fetchPage(URLS.producer(producer, page));
  const $ = cheerio.load(html);

  const animes = [];
  $(".flw-item").each((_, el) => animes.push(formatFilmCard($(el), $)));

  return {
    producer,
    page,
    totalPages: parseTotalPages($),
    animes,
  };
}

// ── AZ List ───────────────────────────────────────────────────────────────────

export async function scrapeAZList(sortOption = "all", page = 1) {
  const html = await fetchPage(URLS.azList(sortOption, page));
  const $ = cheerio.load(html);

  const animes = [];
  $(".flw-item").each((_, el) => animes.push(formatFilmCard($(el), $)));

  return {
    sortOption,
    page,
    totalPages: parseTotalPages($),
    animes,
  };
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export async function scrapeSchedule(date) {
  const data = await fetchJSON(URLS.schedule(date));
  const html = data.html || "";
  const $ = cheerio.load(html);

  const scheduled = [];
  $(".ssl-item, li[data-id]").each((_, el) => {
    const id   = $(el).attr("data-id") || null;
    const time = clean($(el).find(".time, .ani-detail").text());
    const name = clean($(el).find(".film-name, .name").text());
    const airingAt = $(el).attr("data-airing-at") || null;
    scheduled.push({ id, name, time, airingAt });
  });

  return { date, scheduled };
}

// ── Qtip (hover info) ─────────────────────────────────────────────────────────

export async function scrapeQtip(animeId) {
  const data = await fetchJSON(URLS.qtip(animeId));
  const html = data.html || "";
  const $ = cheerio.load(html);

  return {
    animeId,
    name:    clean($(".film-name, .d-title").first().text()),
    poster:  $("img").first().attr("src") || $("img").first().attr("data-src") || null,
    type:    clean($(".fdi-item").first().text()),
    episodes: {
      sub: parseInt($(".tick-sub").text(), 10) || null,
      dub: parseInt($(".tick-dub").text(), 10) || null,
    },
    score:   clean($(".score").text()) || null,
  };
}
