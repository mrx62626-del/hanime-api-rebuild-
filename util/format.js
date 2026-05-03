// ─── Format / Transform Helpers ───────────────────────────────────────────────
// These functions receive a Cheerio root ($) + element and return plain objects.

import { clean, extractId, extractWatchId, parseTicks } from "../util/helper.js";
import { BASE_URL } from "../config/baseurl.js";

// ── Film Card (used on home grids: Latest Episode, Top Upcoming, Search…) ────
// HTML structure:
//   .flw-item > .film-poster (img[data-src], .tick ltr/rtl, a.film-poster-ahref)
//              + .film-detail (h3.film-name > a.d-title[href][data-jp],
//                              .fd-infor > .fdi-item, .fdi-duration)

export function formatFilmCard($item, $) {
  const poster  = $item.find(".film-poster");
  const detail  = $item.find(".film-detail");
  const anchor  = detail.find("a.d-title");
  const href    = anchor.attr("href") || "";
  const id      = extractId(href);

  // Watch URL: the poster anchor wrapping the image goes to /watch/…
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
// HTML: .deslide-item > .deslide-cover (.deslide-cover-img > img[data-src])
//                     + .deslide-item-content (.desi-sub-text, .desi-head-title[data-jp],
//                       .sc-detail > .scd-item[], .desi-description, .desi-buttons > a[href])

export function formatSpotlight($item, $, rank) {
  // "Watch Now" is the first <a> inside .desi-buttons
  const watchAnchor = $item.find(".desi-buttons a").first();
  const href        = watchAnchor.attr("href") || "";
  const nameEl      = $item.find(".desi-head-title");

  // otherInfo = all .scd-item texts (type, duration, quality, sub/dub counts…)
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
// HTML: #trending-home .swiper-slide .inner
//         > .number (span rank + div.film-title.d-title[data-jp])
//         + a.film-poster[href] > img[src]  (note: src not data-src in trending)

export function formatTrendingItem($item, $, rank) {
  // The poster anchor is <a class="film-poster" href="/watch/…">
  const anchor  = $item.find("a.film-poster, .film-poster a").first();
  const href    = anchor.attr("href") || "";
  // Title is in .film-title (carousel) — fall back to .film-name for other usages
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
// HTML: li > .film-poster[data-tip] > a[href] > img[data-src]
//          + .film-detail > h3.film-name > a.d-title[href][data-jp]
//                         + .fd-infor > .fdi-item (type)
//                                    + .tick-item.tick-sub (e.g. "12/ 4")
//                                    + .tick-item.tick-dub (e.g. "?/ 1")
//                                    + .fdi-duration

export function formatAnifBlockItem($item, $) {
  const posterEl = $item.find(".film-poster");
  const anchor   = $item.find("h3.film-name a.d-title, .film-name a").first();
  const href     = anchor.attr("href") || "";
  const id       = extractId(href);

  // Sub/dub texts are like "12/ 4" (total_eps/ new_eps) or "?/ 3"
  // We want the total count (first number before "/")
  const parseTick = (selector) => {
    const raw = $item.find(selector).clone().children("i").remove().end().text().trim();
    // e.g. "12/ 4" → split on "/" → "12" → parseInt
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

// ── Top 10 Sidebar Item (Most Viewed — Day / Week / Month tabs) ───────────────
// HTML: li > .film-number > span (rank)
//          + .film-poster > img[data-src]   (no anchor — poster is not linked)
//          + .film-detail > h3.film-name > a[href][data-jp]
//                         + .fd-infor > .tick > .tick-sub, .tick-dub, .tick-eps

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

// ── Most Popular Anime (sidebar trending list on anime detail page) ────────────

export function formatMostPopular($item, $) {
  const anchor = $item.find("a.d-title, .film-name a").first();
  const href   = anchor.attr("href") || "";
  const poster = $item.find("img").attr("data-src") || $item.find("img").attr("src") || null;

  const epsText = clean($item.find(".fdi-item").eq(1).text()).replace(/[^\d]/g, "");
  const eps     = parseInt(epsText, 10) || null;

  const subRaw = $item.find(".tick-sub").first().clone().children("i").remove().end().text();
  const dubRaw = $item.find(".tick-dub").first().clone().children("i").remove().end().text();
  const sub    = parseInt(subRaw.trim(), 10) || eps || null;
  const dub    = parseInt(dubRaw.trim(), 10) || null;

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
      if ($(el).find(".item-head").text().trim().startsWith(head)) {
        const byName = $(el).find(".name").first().text();
        const byText = $(el).find(".text").first().text();
        val = clean(byName || byText) || null;
      }
    });
    return val;
  };

  const getList = (head) => {
    const items = [];
    $(".anisc-info .item").each((_, el) => {
      if ($(el).find(".item-head").text().trim().startsWith(head)) {
        $(el).find("a").each((__, a) => {
          const t = clean($(a).text());
          if (t) items.push(t);
        });
      }
    });
    return items;
  };

  const nameEl   = $(".anisc-detail .film-name");
  const statsEl  = $(".anisc-detail .film-stats");

  const info = {
    id,
    name:        clean(nameEl.text()),
    jname:       nameEl.attr("data-jp") || null,
    poster:      $(".anis-content .film-poster img").attr("data-src") ||
                 $(".anis-content .film-poster img").attr("src") || null,
    description: clean($(".film-description .text").text()),
    stats: {
      rating:   clean(statsEl.find(".tick-pg, .item.item-rating span.film-badge").text()) || null,
      quality:  clean(statsEl.find(".tick-quality, .quality").text()) || null,
      episodes: {
        sub: parseInt(statsEl.find(".tick-sub").text(), 10) || null,
        dub: parseInt(statsEl.find(".tick-dub").text(), 10) || null,
      },
      type:     clean(statsEl.find(".item.item-quality, span.item:not(.item-rating):not(.item-quality)").last().text()) || null,
      duration: get("Duration"),
    },
  };

  const moreInfo = {
    aired:       get("Aired"),
    premiered:   get("Premiered"),
    duration:    get("Duration"),
    status:      get("Status"),
    malscore:    get("MAL Score"),
    genres:      getList("Genre"),
    studios:     getList("Studio"),
    producers:   getList("Producer"),
  };

  // Seasons on the main page (if present)
  const seasons = [];
  $(".os-list .os-item").each((_, el) => {
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

  return { info, moreInfo, seasons };
}

// ── Recommended Anime ─────────────────────────────────────────────────────────

export function formatRecommendedAnime($item, $) {
  const poster  = $item.find(".film-poster");
  const detail  = $item.find(".film-detail");
  const anchor  = detail.find("a.d-title").first();
  const href    = anchor.attr("href") || "";

  return {
    id:     extractId(href),
    name:   clean(anchor.text()),
    jname:  anchor.attr("data-jp") || null,
    poster: poster.find("img").attr("data-src") || poster.find("img").attr("src") || null,
    type:   clean(detail.find(".fdi-item").first().text()) || null,
    episodes: {
      sub: parseInt($item.find(".tick-sub").text(), 10) || null,
      dub: parseInt($item.find(".tick-dub").text(), 10) || null,
    },
  };
}

// ── Related Anime ─────────────────────────────────────────────────────────────

export function formatRelatedAnime($item, $) {
  const anchor = $item.find("a.d-title, .film-name a").first();
  const href   = anchor.attr("href") || "";
  return {
    id:     extractId(href),
    name:   clean(anchor.text()),
    jname:  anchor.attr("data-jp") || null,
    poster: $item.find("img").attr("data-src") || $item.find("img").attr("src") || null,
    type:   clean($item.find(".fdi-item").first().text()) || null,
    episodes: {
      sub: parseInt($item.find(".tick-sub").text(), 10) || null,
      dub: parseInt($item.find(".tick-dub").text(), 10) || null,
    },
  };
}

// ── Episode ───────────────────────────────────────────────────────────────────

export function formatEpisode($item, $) {
  const href = $item.find("a").attr("href") || "";
  return {
    number:    parseInt($item.attr("data-number"), 10) || null,
    title:     clean($item.find(".ssli-detail .ep-name").text()) || null,
    episodeId: href.replace(/^.*\/watch\//, "").trim(),
    isFiller:  $item.hasClass("ssl-item-filler"),
  };
}

// ── Server ────────────────────────────────────────────────────────────────────

export function formatServer($item, $) {
  return {
    serverId: $item.attr("data-id") || null,
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
