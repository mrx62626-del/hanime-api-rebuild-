// ─── HiAnime Scraper ─────────────────────────────────────────────────────────
// All scraping logic is identical to the original.
// Only the import paths are updated to reflect the new src/ layout.

import * as cheerio from "cheerio";
import {
  fetchPage, fetchHTML, fetchJSON,
  clean, extractId, extractWatchId,
} from "./helper.js";
import {
  formatFilmCard,
  formatSpotlight,
  formatTrendingItem,
  formatAnifBlockItem,
  formatTop10Item,
  formatMostPopular,
  formatAnimeInfo,
  formatRecommendedAnime,
  formatRelatedAnime,
  formatEpisode,
  formatServer,
  formatSearchSuggestion,
  parseTotalPages,
} from "./format.js";
import { URLS, BASE_URL } from "../config/baseurl.js";

// ── Home Page ─────────────────────────────────────────────────────────────────

export async function scrapeHome() {
  const html = await fetchPage(URLS.home());
  const $    = cheerio.load(html);

  const spotlightAnimes = [];
  $("#slider .swiper-slide .deslide-item").each((i, el) => {
    spotlightAnimes.push(formatSpotlight($(el), $, i + 1));
  });

  const trendingAnimes = [];
  $("#trending-home .swiper-slide .inner").each((i, el) => {
    trendingAnimes.push(formatTrendingItem($(el), $, i + 1));
  });

  const featuredCols = $("#anime-featured .col-xl-3");
  const parseAnifBlock = (colIndex) => {
    const list = [];
    featuredCols.eq(colIndex).find(".anif-block-ul li").each((_, el) => {
      list.push(formatAnifBlockItem($(el), $));
    });
    return list;
  };

  const mostPopularAnimes     = parseAnifBlock(0);
  const mostFavoriteAnimes    = parseAnifBlock(1);
  const topAiringAnimes       = parseAnifBlock(2);
  const latestCompletedAnimes = parseAnifBlock(3);

  const latestEpisodeAnimes = [];
  $("#recent-update .flw-item").each((_, el) => {
    latestEpisodeAnimes.push(formatFilmCard($(el), $));
  });

  const topUpcomingAnimes = [];
  $("#main-content .block_area_home").each((_, el) => {
    if ($(el).find(".cat-heading").text().trim().includes("Top Upcoming")) {
      $(el).find(".flw-item").each((__, fe) => {
        topUpcomingAnimes.push(formatFilmCard($(fe), $));
      });
    }
  });

  const top10Animes = {
    today: parseTop10($, "top-viewed-day"),
    week:  parseTop10($, "top-viewed-week"),
    month: parseTop10($, "top-viewed-month"),
  };

  const genres = scrapeGenreList($);

  return {
    spotlightAnimes,
    trendingAnimes,
    latestEpisodeAnimes,
    topUpcomingAnimes,
    top10Animes,
    mostPopularAnimes,
    mostFavoriteAnimes,
    topAiringAnimes,
    latestCompletedAnimes,
    genres,
  };
}

// ── Top 10 sidebar ────────────────────────────────────────────────────────────

function parseTop10($, tabId) {
  const list = [];
  $(`#${tabId} li`).each((i, el) => {
    list.push(formatTop10Item($(el), $, i + 1));
  });
  return list;
}

// ── Genres list ──────────────────────────────────────────────────────────────

function scrapeGenreList($) {
  const genres = [];
  $(".block_area-genres .sb-genre-list li a").each((_, el) => {
    const name = clean($(el).text());
    if (name) genres.push(name);
  });
  if (!genres.length) {
    $(".nav-item a[href*='/genre/']").each((_, el) => {
      genres.push(clean($(el).text()));
    });
  }
  return [...new Set(genres)];
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function scrapeSearch(query, page = 1, filters = {}) {
  let url = URLS.search(query, page);
  for (const [k, v] of Object.entries(filters)) {
    if (v) url += `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`;
  }
  const html = await fetchPage(url);
  const $    = cheerio.load(html);

  const animes = [];
  $(".flw-item").each((_, el) => animes.push(formatFilmCard($(el), $)));

  const totalPages = parseTotalPages($);
  const totalCount = parseInt(
    clean($(".pre-pagination ~ .cat-heading").text()).replace(/\D/g, ""), 10
  ) || animes.length;

  return { query, page, totalPages, totalCount, animes };
}

// ── Search Suggestions ────────────────────────────────────────────────────────

export async function scrapeSearchSuggestions(query) {
  const html = await fetchHTML(URLS.searchSuggest(query));
  const $    = cheerio.load(html);

  const suggestions = [];
  $(".nav-item, li").each((_, el) => {
    const item = formatSearchSuggestion($(el), $);
    if (item.id) suggestions.push(item);
  });

  return { query, suggestions };
}

// ── Anime Info (full detail page) ─────────────────────────────────────────────

export async function scrapeAnimeInfo(animeId) {
  const html = await fetchPage(URLS.animeInfo(animeId));
  const $    = cheerio.load(html);

  const { info, moreInfo, seasons: pageSeason } = formatAnimeInfo($, animeId);

  const recommendedAnimes = [];
  $(".block_area_category .flw-item").each((_, el) =>
    recommendedAnimes.push(formatRecommendedAnime($(el), $))
  );

  const mostPopularAnimes = [];
  const seenIds = new Set();
  $(".cbox-realtime li, .block_area-realtime .anif-block-ul li").each((_, el) => {
    const item = formatMostPopular($(el), $);
    if (item.id && !seenIds.has(item.id)) {
      seenIds.add(item.id);
      mostPopularAnimes.push(item);
    }
  });

  let numericId =
    $("#main-wrapper").attr("data-id") ||
    $(".pc-item.pc-fav[data-id]").attr("data-id") ||
    $(".favourite[data-fetch='true']").attr("data-id") ||
    null;

  if (!numericId) {
    numericId = await scrapeAnimeNumericId(animeId).catch(() => null);
  }

  const [relatedAnimes, promotionalVideos, characterVoiceActor, ajaxSeasons] =
    await Promise.all([
      numericId ? scrapeRelatedAnimes(numericId).catch(() => []) : [],
      numericId ? scrapePromoVideos(numericId).catch(() => [])   : [],
      numericId ? scrapeCharacterVoiceActors(numericId).catch(() => []) : [],
      numericId && pageSeason.length === 0
        ? scrapeSeasons(numericId).catch(() => [])
        : Promise.resolve([]),
    ]);

  info.promotionalVideos   = promotionalVideos;
  info.characterVoiceActor = characterVoiceActor;

  const seasons = pageSeason.length > 0 ? pageSeason : ajaxSeasons;

  return {
    anime: [{ info, moreInfo }],
    mostPopularAnimes,
    recommendedAnimes,
    relatedAnimes,
    seasons,
  };
}

// ── Related Animes ────────────────────────────────────────────────────────────

export async function scrapeRelatedAnimes(numericId) {
  const html = await fetchHTML(`${BASE_URL}/ajax/anime/related?id=${numericId}`);
  const $    = cheerio.load(html);
  const related = [];
  $(".flw-item").each((_, el) => related.push(formatRelatedAnime($(el), $)));
  return related;
}

// ── Promotional Videos ────────────────────────────────────────────────────────

export async function scrapePromoVideos(numericId) {
  const html = await fetchHTML(`${BASE_URL}/ajax/anime/videos?id=${numericId}`);
  const $    = cheerio.load(html);
  const videos = [];

  $(".item, .block-slide-item, li").each((_, el) => {
    const title     = clean($(el).find(".title, .name, h4").text()) || undefined;
    const source    = $(el).find("a").attr("href") || $(el).attr("data-src") || undefined;
    const thumbnail = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || undefined;
    if (source || thumbnail) videos.push({ title, source, thumbnail });
  });

  return videos;
}

// ── Character + Voice Actors ──────────────────────────────────────────────────

export async function scrapeCharacterVoiceActors(numericId) {
  const html = await fetchHTML(`${BASE_URL}/ajax/character/list/${numericId}`);
  const $    = cheerio.load(html);
  const cast = [];

  const parsePerInfo = ($pi) => {
    const a    = $pi.find("a").first();
    const href = a.attr("href") || "";
    return {
      id:     extractId(href),
      poster: $pi.find("img").attr("data-src") || $pi.find("img").attr("src") || null,
      name:   clean($pi.find(".pi-name a, .name").first().text()),
      cast:   clean($pi.find(".pi-cast, .cast").text()) || null,
    };
  };

  $(".bac-item, .cast-item").each((_, el) => {
    const chars  = $(el).find(".per-info.ltr, .character");
    const voices = $(el).find(".per-info.rtl, .voice-actor");
    if (chars.length && voices.length) {
      cast.push({
        character:  parsePerInfo(chars.first()),
        voiceActor: parsePerInfo(voices.first()),
      });
    }
  });

  return cast;
}

// ── Seasons ───────────────────────────────────────────────────────────────────

export async function scrapeSeasons(numericId) {
  const html = await fetchHTML(`${BASE_URL}/ajax/anime/season/list/${numericId}`);
  const $    = cheerio.load(html);
  const seasons = [];

  $(".os-item, .ss-item").each((_, el) => {
    const a    = $(el).find("a").first();
    const href = a.attr("href") || "";
    seasons.push({
      id:        extractId(href),
      name:      clean($(el).find(".title, .name").text()) || clean(a.text()),
      title:     a.attr("title") || clean(a.text()) || null,
      poster:    $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || null,
      isCurrent: $(el).hasClass("active") || $(el).hasClass("selected"),
    });
  });

  return seasons;
}

// ── Resolve Numeric ID ────────────────────────────────────────────────────────

export async function scrapeAnimeNumericId(slug) {
  try {
    const html = await fetchPage(URLS.animeInfo(slug));
    const $    = cheerio.load(html);
    const id =
      $(".pc-item.pc-fav[data-id]").attr("data-id") ||
      $(".favourite[data-fetch='true']").attr("data-id") ||
      $("#main-wrapper").attr("data-id") ||
      null;
    if (id) return id;
  } catch (_) { /* fall through */ }

  const html = await fetchPage(URLS.animeWatch(slug));
  const $    = cheerio.load(html);
  const id =
    $("#main-wrapper").attr("data-id") ||
    $(".pc-item.pc-fav[data-id]").attr("data-id") ||
    $(".favourite[data-fetch='true']").attr("data-id") ||
    null;

  if (!id) throw new Error(`Could not resolve numeric ID for: ${slug}`);
  return id;
}

// ── Episodes ──────────────────────────────────────────────────────────────────

export async function scrapeEpisodes(numericId) {
  const html = await fetchHTML(URLS.episodes(numericId));
  const $    = cheerio.load(html);

  const episodes = [];
  $(".ssl-item.ep-item, .ssl-item").each((_, el) => {
    const ep = formatEpisode($(el), $);
    if (ep.number !== null) episodes.push(ep);
  });

  return { totalEpisodes: episodes.length, episodes };
}

// ── Episode Servers ───────────────────────────────────────────────────────────

export async function scrapeEpisodeServers(episodeId) {
  const html = await fetchHTML(URLS.episodeServers(episodeId));
  const $    = cheerio.load(html);

  const parse = (selector) => {
    const list = [];
    $(selector).each((_, el) => list.push(formatServer($(el), $)));
    return list;
  };

  return {
    episodeId,
    sub: parse(".ps_-block.ps_-block-sub .server-item"),
    dub: parse(".ps_-block.ps_-block-dub .server-item"),
    raw: parse(".ps_-block.ps_-block-raw .server-item"),
  };
}

// ── Episode Sources ───────────────────────────────────────────────────────────

export async function scrapeEpisodeSources(serverId) {
  const data = await fetchJSON(URLS.episodeSources(serverId));
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
  const $    = cheerio.load(html);
  const animes = [];
  $(".flw-item").each((_, el) => animes.push(formatFilmCard($(el), $)));
  return { category, page, totalPages: parseTotalPages($), animes };
}

// ── Genre ─────────────────────────────────────────────────────────────────────

export async function scrapeGenre(genre, page = 1) {
  const html = await fetchPage(URLS.genre(genre, page));
  const $    = cheerio.load(html);
  const animes = [];
  $(".flw-item").each((_, el) => animes.push(formatFilmCard($(el), $)));
  return { genre, page, totalPages: parseTotalPages($), animes };
}

// ── Producer ──────────────────────────────────────────────────────────────────

export async function scrapeProducer(producer, page = 1) {
  const html = await fetchPage(URLS.producer(producer, page));
  const $    = cheerio.load(html);
  const animes = [];
  $(".flw-item").each((_, el) => animes.push(formatFilmCard($(el), $)));
  return { producer, page, totalPages: parseTotalPages($), animes };
}

// ── AZ List ───────────────────────────────────────────────────────────────────

export async function scrapeAZList(sortOption = "all", page = 1) {
  const html = await fetchPage(URLS.azList(sortOption, page));
  const $    = cheerio.load(html);
  const animes = [];
  $(".flw-item").each((_, el) => animes.push(formatFilmCard($(el), $)));
  return { sortOption, page, totalPages: parseTotalPages($), animes };
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export async function scrapeSchedule(date) {
  const html = await fetchHTML(URLS.schedule(date));
  const $    = cheerio.load(html);

  const scheduled = [];
  $(".ssl-item, li[data-id]").each((_, el) => {
    scheduled.push({
      id:       $(el).attr("data-id") || null,
      name:     clean($(el).find(".film-name, .name").text()),
      time:     clean($(el).find(".time, .ani-detail").text()),
      airingAt: $(el).attr("data-airing-at") || null,
    });
  });

  return { date, scheduled };
}

// ── Qtip ─────────────────────────────────────────────────────────────────────

export async function scrapeQtip(animeId) {
  const html = await fetchHTML(URLS.qtip(animeId));
  const $    = cheerio.load(html);

  return {
    animeId,
    name:   clean($(".film-name, .d-title").first().text()),
    poster: $("img").first().attr("src") || $("img").first().attr("data-src") || null,
    type:   clean($(".fdi-item").first().text()),
    episodes: {
      sub: parseInt($(".tick-sub").text(), 10) || null,
      dub: parseInt($(".tick-dub").text(), 10) || null,
    },
    score: clean($(".score").text()) || null,
  };
}
