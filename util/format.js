// ─── Format / Transform Helpers ───────────────────────────────────────────────
// These functions receive a Cheerio root ($) + element and return plain objects.

import { clean, extractId, extractWatchId, parseTicks } from "../util/helper.js";
import { BASE_URL } from "../config/baseurl.js";

// ── Film Card (used on home grids: Latest Episode, Top Upcoming, Search…) ────
export function formatFilmCard($item, $) {
  const poster  = $item.find(".film-poster");
  const detail  = $item.find(".film-detail");
  const anchor  = detail.find("a.d-title");
  const href    = anchor.attr("href") || "";
  const id      = extractId(href);

  const watchHref = poster.find("a").first().attr("href") || "";
  const watchUrl  = watchHref
    ? (watchHref.startsWith("http") ? watchHref : `${BASE_URL}${watchHref}`)
    : null;

  return {
    id,
    name:      clean(anchor.text()),
    jname:     anchor.attr("data-jp") || null,
    poster:    poster.find("img").attr("data-src") || poster.find("img").attr("src") || null,
    type:      clean(detail.find(".fdi-item").first().text()) || null,
    duration:  clean(detail.find(".fdi-duration").text()) || null,
    rating:    clean(poster.find(".tick-pg").text()) || null,
    episodes:  parseTicks(poster, $),
    watchUrl,
  };
}

// ── Spotlight / Hero Slider ────────────────────────────────────────────────────
export function formatSpotlight($item, $, rank) {
  const watchAnchor = $item.find(".desi-buttons a").first();
  const href        = watchAnchor.attr("href") || "";
  const nameEl      = $item.find(".desi-head-title");

  const otherInfo = [];
  $item.find(".sc-detail .scd-item").each((_, el) => {
    const t = clean($(el).text());
    if (t) otherInfo.push(t);
  });

  return {
    rank,
    id:          extractWatchId(href),
    name:        clean(nameEl.text()),
    jname:       nameEl.attr("data-jp") || null,
    description: clean($item.find(".desi-description").text()),
    poster:      $item.find(".deslide-cover-img img").attr("data-src") || null,
    otherInfo,
    episodes: {
      sub: parseInt($item.find(".tick-sub").text(), 10) || null,
      dub: parseInt($item.find(".tick-dub").text(), 10) || null,
    },
  };
}

// ── Trending Carousel Item ─────────────────────────────────────────────────────
export function formatTrendingItem($item, $, rank) {
  const anchor  = $item.find("a.film-poster, .film-poster a").first();
  const href    = anchor.attr("href") || "";
  const nameEl  = $item.find(".film-title, .film-name").first();

  return {
    rank,
    id:     extractId(href),
    name:   clean(nameEl.text()),
    jname:  nameEl.attr("data-jp") || nameEl.find("[data-jp]").attr("data-jp") || null,
    poster: $item.find("img").attr("data-src") || $item.find("img").attr("src") || null,
  };
}

// ── Anif-Block List Item (Popular / Most Favorite / Top Airing / Completed) ──
export function formatAnifBlockItem($item, $) {
  const posterEl = $item.find(".film-poster");
  const anchor   = $item.find("h3.film-name a.d-title, .film-name a").first();
  const href     = anchor.attr("href") || "";
  const id       = extractId(href);

  const parseTick = (selector) => {
    const raw = $item.find(selector).clone().children("i").remove().end().text().trim();
    const first = raw.split("/")[0].replace(/\D/g, "");
    return parseInt(first, 10) || null;
  };

  return {
    id,
    name:   clean(anchor.text()),
    jname:  anchor.attr("data-jp") || null,
    poster: posterEl.find("img").attr("data-src") || posterEl.find("img").attr("src") || null,
    type:   clean($item.find(".fd-infor .fdi-item").first().text()) || null,
    episodes: {
      sub: parseTick(".tick-sub"),
      dub: parseTick(".tick-dub"),
    },
  };
}

// ── Top 10 Sidebar Item ───────────────────────────────────────────────────────
export function formatTop10Item($item, $, rank) {
  const anchor = $item.find(".film-detail .film-name a").first();
  const href   = anchor.attr("href") || "";

  const sub = parseInt(
    $item.find(".tick-sub").clone().children("i").remove().end().text().trim(), 10
  ) || null;
  const dub = parseInt(
    $item.find(".tick-dub").clone().children("i").remove().end().text().trim(), 10
  ) || null;

  return {
    rank,
    id:     extractId(href),
    name:   clean(anchor.text()),
    poster: $item.find(".film-poster img").attr("data-src") ||
            $item.find(".film-poster img").attr("src") || null,
    episodes: { sub, dub },
  };
}

// ── Most Popular Anime (trending sidebar on anime detail page) ────────────────
export function formatMostPopular($item, $) {
  const anchor = $item.find("a.d-title, .film-name a").first();
  const href   = anchor.attr("href") || "";
  const poster = $item.find("img").attr("data-src") || $item.find("img").attr("src") || null;

  const epsRaw = clean($item.find(".fdi-item").eq(1).text()).replace(/[^\d]/g, "");
  const eps    = parseInt(epsRaw, 10) || null;

  const subRaw = $item.find(".tick-sub").first().clone().children("i").remove().end().text().trim();
  const dubRaw = $item.find(".tick-dub").first().clone().children("i").remove().end().text().trim();
  const sub    = parseInt(subRaw, 10) || eps || null;
  const dub    = parseInt(dubRaw, 10) || null;

  return {
    id:     extractId(href),
    name:   clean(anchor.text()),
    jname:  anchor.attr("data-jp") || null,
    poster,
    type:   clean($item.find(".fdi-item").first().text()) || null,
    episodes: { sub, dub },
  };
}

// ── Anime Info Page ────────────────────────────────────────────────────────────
export function formatAnimeInfo($, id) {
  const get = (head) => {
    let val = null;
    $(".anisc-info .item").each((_, el) => {
      const headText = $(el).find(".item-head").text().trim().toLowerCase();
      if (headText.startsWith(head.toLowerCase())) {
        const byName = clean($(el).find(".name").first().text());
        const byLink = clean($(el).find("a").first().text());
        const byText = clean($(el).find(".text").first().text());
        val = byName || byLink || byText || null;
      }
    });
    return val;
  };

  const getList = (head) => {
    const items = [];
    $(".anisc-info .item").each((_, el) => {
      const headText = $(el).find(".item-head").text().trim().toLowerCase();
      if (headText.startsWith(head.toLowerCase())) {
        $(el).find("a").each((__, a) => {
          const t = clean($(a).text());
          if (t) items.push(t);
        });
        if (!items.length) {
          $(el).find(".name").each((__, n) => {
            const t = clean($(n).text());
            if (t) items.push(t);
          });
        }
      }
    });
    return items;
  };

  const nameEl = $(".anisc-detail .film-name, .anisc-detail h2.film-name").first();
  const name   = clean(nameEl.text()) || null;
  const jname  = nameEl.attr("data-jname") || nameEl.attr("data-jp") || null;

  const statsEl = $(".anisc-detail .film-stats .tick");
  const rating  = clean(statsEl.find(".tick-pg").text()) || null;
  const quality = clean(statsEl.find(".tick-quality").text()) || null;

  const subEps = parseInt(
    statsEl.find(".tick-sub").clone().children("i").remove().end().text().trim(), 10
  ) || null;
  const dubEps = parseInt(
    statsEl.find(".tick-dub").clone().children("i").remove().end().text().trim(), 10
  ) || null;

  const itemSpans = [];
  statsEl.find("span.item").each((_, el) => {
    const t = clean($(el).text());
    if (t) itemSpans.push(t);
  });
  const statType     = itemSpans[0] || null;
  const statDuration = itemSpans[1] || get("Duration") || null;

  const poster =
    $(".anis-content .film-poster img").attr("data-src") ||
    $(".anis-content .film-poster img").attr("src") ||
    $(".anisc-poster img").attr("data-src") ||
    $(".anisc-poster img").attr("src") ||
    null;

  const description = clean($(".film-description .text").text()) || null;

  const info = {
    id,
    name,
    jname,
    poster,
    description,
    stats: {
      rating,
      quality,
      episodes: { sub: subEps, dub: dubEps },
      type:     statType,
      duration: statDuration,
    },
    promotionalVideos:   [],
    characterVoiceActor: [],
  };

  const moreInfo = {
    aired:     get("Aired") || null,
    premiered: get("Premiered") || null,
    duration:  get("Duration") || null,
    status:    get("Status") || null,
    malscore:  get("MAL Score") || null,
    genres:    getList("Genre"),
    studios:   getList("Studio"),
    producers: getList("Producer"),
  };

  const seasons = [];
  $(".os-list .os-item, .os-list a.os-item").each((_, el) => {
    const $el  = $(el);
    const a    = $el.is("a") ? $el : $el.find("a").first();
    const href = a.attr("href") || "";
    seasons.push({
      id:        extractId(href),
      name:      clean($el.find(".title, .name").text()) || clean(a.text()) || null,
      title:     a.attr("title") || clean(a.text()) || null,
      poster:    $el.find("img").attr("data-src") || $el.find("img").attr("src") || null,
      isCurrent: $el.hasClass("active") || $el.hasClass("selected"),
    });
  });

  return { info, moreInfo, seasons };
}

// ── Recommended Anime ─────────────────────────────────────────────────────────
export function formatRecommendedAnime($item, $) {
  const poster = $item.find(".film-poster");
  const detail = $item.find(".film-detail");
  const anchor = detail.find("a.d-title").first();
  const href   = anchor.attr("href") || "";

  const subRaw = $item.find(".tick-sub").clone().children("i").remove().end().text().trim();
  const dubRaw = $item.find(".tick-dub").clone().children("i").remove().end().text().trim();

  return {
    id:       extractId(href),
    name:     clean(anchor.text()),
    jname:    anchor.attr("data-jp") || null,
    poster:   poster.find("img").attr("data-src") || poster.find("img").attr("src") || null,
    duration: clean(detail.find(".fdi-duration").text()) || null,
    type:     clean(detail.find(".fdi-item").first().text()) || null,
    rating:   clean(poster.find(".tick-pg").text()) || null,
    episodes: {
      sub: parseInt(subRaw, 10) || null,
      dub: parseInt(dubRaw, 10) || null,
    },
  };
}

// ── Related Anime ─────────────────────────────────────────────────────────────
export function formatRelatedAnime($item, $) {
  const anchor = $item.find("a.d-title, .film-name a").first();
  const href   = anchor.attr("href") || "";
  const detail = $item.find(".film-detail");
  const poster = $item.find(".film-poster");

  const subRaw = $item.find(".tick-sub").clone().children("i").remove().end().text().trim();
  const dubRaw = $item.find(".tick-dub").clone().children("i").remove().end().text().trim();

  return {
    id:       extractId(href),
    name:     clean(anchor.text()),
    jname:    anchor.attr("data-jp") || null,
    poster:   $item.find("img").attr("data-src") || $item.find("img").attr("src") || null,
    duration: clean(detail.find(".fdi-duration").text()) || null,
    type:     clean($item.find(".fdi-item").first().text()) || null,
    rating:   clean(poster.find(".tick-pg").text()) || null,
    episodes: {
      sub: parseInt(subRaw, 10) || null,
      dub: parseInt(dubRaw, 10) || null,
    },
  };
}

// ── Episode ───────────────────────────────────────────────────────────────────
//
// Scraped from .ssl-item nodes in the HTML fragment returned by
// /ajax/v2/episode/list/{numericId}.
//
// Node attributes (verified against watch.html):
//   data-number  → episode number  (e.g. "1")
//   data-id      → episodeId       (e.g. "bleach-yaa9n?ep=213")
//   class        → includes "ssl-item-filler" for filler episodes
//
// Child structure:
//   a[href="/watch/bleach-yaa9n?ep=213"]
//     > .ssli-detail > .ssli-order  (episode number fallback)
//                    > .ep-name     (episode title)

export function formatEpisode($item, $) {
  // Prefer data-id attribute — it's the canonical episodeId
  const dataId = $item.attr("data-id") || "";
  const href   = $item.find("a").first().attr("href") || "";

  // episodeId = "slug?ep=N" format (e.g. "bleach-yaa9n?ep=213")
  const episodeId = dataId
    ? dataId
    : href.replace(/^.*\/watch\//, "").trim();

  // Episode number: prefer data-number, fall back to .ssli-order text
  const dataNumber = parseInt($item.attr("data-number"), 10);
  const orderNum   = parseInt($item.find(".ssli-order").text().trim(), 10);
  const number     = (!isNaN(dataNumber) && dataNumber > 0) ? dataNumber
                   : (!isNaN(orderNum)   && orderNum   > 0) ? orderNum
                   : null;

  // Title
  const title = clean($item.find(".ep-name, .ssli-detail .ep-name").text()) || null;

  // Filler flag
  const isFiller = $item.hasClass("ssl-item-filler");

  return { number, title, episodeId, isFiller };
}

// ── Server ────────────────────────────────────────────────────────────────────
export function formatServer($item, $) {
  return {
    serverId:   $item.attr("data-id") || null,
    serverName: clean($item.text()),
  };
}

// ── Search Suggestion ─────────────────────────────────────────────────────────
export function formatSearchSuggestion($item, $) {
  const anchor = $item.find("a").first();
  const href   = anchor.attr("href") || $item.find("[href]").attr("href") || "";
  return {
    id:     extractId(href),
    name:   clean($item.find(".film-name, .name, .title").first().text() || anchor.text()),
    jname:  $item.find("[data-jp]").attr("data-jp") || null,
    poster: $item.find("img").attr("data-src") || $item.find("img").attr("src") || null,
    type:   clean($item.find(".fdi-item").first().text()) || null,
  };
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function parseTotalPages($) {
  const lastPage = $(".pagination .page-item:last-child a").attr("href") || "";
  const match    = lastPage.match(/page=(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}
