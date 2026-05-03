// ─── Format / Transform Helpers ───────────────────────────────────────────────
// These functions receive a Cheerio root ($) + element and return plain objects.

import { clean, extractId, extractWatchId, parseTicks } from "../util/helper.js";
import { BASE_URL } from "../config/baseurl.js";

// ── Film Card (used on home, search, category, genre, etc.) ───────────────────

export function formatFilmCard($item, $) {
  const poster  = $item.find(".film-poster");
  const detail  = $item.find(".film-detail");
  const anchor  = detail.find("a.d-title");
  const href    = anchor.attr("href") || "";
  const id      = extractId(href);
  const watchHref = poster.find("a").first().attr("href") || "";

  let watchUrl = null;
  if (watchHref) {
    watchUrl = watchHref.startsWith("http") ? watchHref : `${BASE_URL}${watchHref}`;
  }

  return {
    id,
    name:      clean(anchor.text()),
    jname:     anchor.attr("data-jp") || null,
    poster:    poster.find("img").attr("data-src") || poster.find("img").attr("src") || null,
    type:      clean(detail.find(".fdi-item").first().text()),
    duration:  clean(detail.find(".fdi-duration").text()) || null,
    rating:    clean(poster.find(".tick-pg").text()) || null,
    episodes:  parseTicks(poster, $),
    watchUrl,
  };
}

// ── Spotlight / Hero Slider ────────────────────────────────────────────────────

export function formatSpotlight($item, $, rank) {
  // The "Watch Now" button is the first <a> inside .desi-buttons
  const watchAnchor = $item.find(".desi-buttons a").first();
  const href        = watchAnchor.attr("href") || "";
  const nameEl      = $item.find(".desi-head-title");

  return {
    rank,
    id:          extractWatchId(href),
    name:        clean(nameEl.text()),
    jname:       nameEl.attr("data-jp") || null,
    description: clean($item.find(".desi-description").text()),
    poster:      $item.find(".deslide-cover-img img").attr("data-src") || null,
    // banner = same cover image (hianime doesn't expose a separate banner field)
    banner:      $item.find(".deslide-cover-img img").attr("data-src") || null,
    type:        clean($item.find(".scd-item").first().text()),
    duration:    clean($item.find(".scd-item").eq(1).text()),
    rating:      clean($item.find(".quality").text()) || null,
    episodes: {
      sub: parseInt($item.find(".tick-sub").text(), 10) || null,
      dub: parseInt($item.find(".tick-dub").text(), 10) || null,
    },
  };
}

// ── Trending Item ──────────────────────────────────────────────────────────────

export function formatTrendingItem($item, $, rank) {
  // Trending carousel HTML: .inner > .number (.film-title.d-title[data-jp]) + .film-poster > a[href]
  const anchor = $item.find(".film-poster a, a.film-poster").first();
  const href   = anchor.attr("href") || "";
  // Title is in .film-title for the carousel (not .film-name)
  const nameEl = $item.find(".film-title, .film-name").first();
  return {
    rank,
    id:     extractId(href),
    name:   clean(nameEl.text()),
    jname:  nameEl.attr("data-jp") || nameEl.find("[data-jp]").attr("data-jp") || null,
    poster: $item.find("img").attr("data-src") || $item.find("img").attr("src") || null,
  };
}

// ── Most Popular Anime (sidebar trending list) ────────────────────────────────

export function formatMostPopular($item, $) {
  const anchor = $item.find("a.d-title, .film-name a").first();
  const href   = anchor.attr("href") || "";
  const poster = $item.find("img").attr("data-src") || $item.find("img").attr("src") || null;

  // episodes from .fd-infor — e.g. "TV · ? Eps · 24 MIN"
  const epsText = clean($item.find(".fdi-item").eq(1).text()).replace(/[^\d]/g, "");
  const eps     = parseInt(epsText, 10) || null;

  // ticks for sub/dub if present
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
  // ── Helpers ──
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
        const anchors = $(el).find("a");
        if (anchors.length > 0) {
          anchors.each((_, a) => { const t = clean($(a).text()); if (t) items.push(t); });
        } else {
          const raw = clean($(el).find(".name").text());
          if (raw) raw.split(",").forEach((s) => { const t = s.trim(); if (t) items.push(t); });
        }
      }
    });
    return items;
  };

  // ── Core fields ──
  const posterEl    = $(".anisc-poster .film-poster img, .anis-content .film-poster img").first();
  const poster      = posterEl.attr("data-src") || posterEl.attr("src") || null;

  const description = clean(
    $("#synopsis-content").text() ||
    $(".film-description .text").first().text() ||
    $(".anisc-info .item .text").first().text()
  ) || null;

  // ── Stats — scoped strictly to #ani_detail to avoid sidebar pollution ──
  const tickScope = $("#ani_detail .film-stats .tick");

  const subRaw    = tickScope.find(".tick-sub").first().clone().children("i").remove().end().text();
  const dubRaw    = tickScope.find(".tick-dub").first().clone().children("i").remove().end().text();
  const ratingRaw = clean(tickScope.find(".tick-pg").first().text());
  const rating    = (ratingRaw && ratingRaw !== "?") ? ratingRaw : null;
  const quality   = clean(tickScope.find(".tick-quality").first().text()) || null;
  const type      = clean($("#ani_detail .film-stats .tick .item").first().text()) || null;
  const duration  = get("Duration");

  // ── Promotional Videos ──
  const promotionalVideos = [];
  $(".anisc-content .block-slide .item, .block-promotions .item, [data-src*='youtube'], .promo-item").each((_, el) => {
    const title     = clean($(el).find(".title, .name").text()) || undefined;
    const source    = $(el).find("a").attr("href") || $(el).attr("data-src") || undefined;
    const thumbnail = $(el).find("img").attr("data-src") || $(el).find("img").attr("src") || undefined;
    if (source || thumbnail) promotionalVideos.push({ title, source, thumbnail });
  });

  // ── Character + Voice Actor ──
  const characterVoiceActor = [];
  $(".block-actors-content .bac-item, .cast-item").each((_, el) => {
    const chars  = $(el).find(".per-info.ltr, .character");
    const voices = $(el).find(".per-info.rtl, .voice-actor");

    const parsePerInfo = ($pi) => {
      const a    = $pi.find("a");
      const href = a.attr("href") || "";
      return {
        id:     extractId(href),
        poster: $pi.find("img").attr("data-src") || $pi.find("img").attr("src") || null,
        name:   clean($pi.find(".pi-name a, .name").first().text()),
        cast:   clean($pi.find(".pi-cast, .cast").text()) || null,
      };
    };

    if (chars.length && voices.length) {
      characterVoiceActor.push({
        character:  parsePerInfo(chars.first()),
        voiceActor: parsePerInfo(voices.first()),
      });
    }
  });

  // ── Seasons ──
  const seasons = [];
  $(".os-list .os-item, .ss-list .ss-item").each((_, el) => {
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

  // ── Build info object ──
  const info = {
    id,
    name:        clean($(".film-name.dynamic-name").text()),
    poster,
    description,
    stats: {
      rating,
      quality,
      episodes: {
        sub: parseInt(subRaw.trim(), 10) || null,
        dub: parseInt(dubRaw.trim(), 10) || null,
      },
      type,
      duration,
    },
    promotionalVideos,
    characterVoiceActor,
  };

  // ── moreInfo object ──
  const moreInfo = {
    japanese:  get("Japanese"),
    synonyms:  get("Synonyms"),
    aired:     get("Aired"),
    premiered: get("Premiered"),
    duration,
    status:    get("Status"),
    malscore:  get("MAL Score"),
    genres:    getList("Genres"),
    studios:   getList("Studios"),
    producers: getList("Producers"),
  };

  return { info, moreInfo, seasons };
}

// ── Recommended Anime (from .block_area_category .flw-item) ───────────────────

export function formatRecommendedAnime($item, $) {
  const poster = $item.find(".film-poster");
  const detail = $item.find(".film-detail");
  const anchor = detail.find("a.d-title");
  const href   = anchor.attr("href") || "";

  const subRaw = poster.find(".tick-sub").first().clone().children("i").remove().end().text();
  const dubRaw = poster.find(".tick-dub").first().clone().children("i").remove().end().text();
  const ratingRaw = clean(poster.find(".tick-pg").text());

  return {
    id:       extractId(href),
    name:     clean(anchor.text()),
    jname:    anchor.attr("data-jp") || null,
    poster:   poster.find("img").attr("data-src") || poster.find("img").attr("src") || null,
    duration: clean(detail.find(".fdi-duration").text()) || null,
    type:     clean(detail.find(".fdi-item").first().text()) || null,
    rating:   (ratingRaw && ratingRaw !== "?") ? ratingRaw : null,
    episodes: {
      sub: parseInt(subRaw.trim(), 10) || null,
      dub: parseInt(dubRaw.trim(), 10) || null,
    },
  };
}

// ── Related Anime (from .flw-item on related AJAX response) ───────────────────

export function formatRelatedAnime($item, $) {
  return formatRecommendedAnime($item, $); // same DOM shape
}

// ── Episode List ───────────────────────────────────────────────────────────────

export function formatEpisode($ep, $) {
  return {
    number:   parseInt($ep.attr("data-number"), 10) || null,
    id:       $ep.attr("data-id") || null,
    slug:     clean($ep.attr("title") || $ep.find(".ssli-detail .ep-name").text()),
    isFiller: $ep.hasClass("ssl-item-filler"),
  };
}

// ── Server Item ────────────────────────────────────────────────────────────────

export function formatServer($el, $) {
  return {
    serverId:   $el.attr("data-id")   || null,
    serverName: clean($el.find("a").text()),
    type:       $el.attr("data-type") || null,
  };
}

// ── Search Suggestion ──────────────────────────────────────────────────────────

export function formatSearchSuggestion($item, $) {
  const href   = $item.find("a").attr("href") || "";
  const poster = $item.find("img").attr("src") || $item.find("img").attr("data-src") || null;
  return {
    id:    extractId(href),
    name:  clean($item.find(".title, .film-name").text()),
    jname: $item.find("[data-jp]").attr("data-jp") || null,
    poster,
    type:  clean($item.find(".media-type, .fdi-item").text()) || null,
  };
}

// ── Genre / Category Pagination ────────────────────────────────────────────────

export function parseTotalPages($) {
  const last  = $(".pre-pagination .page-item:last-child a, [title='Last']").attr("href") || "";
  const match = last.match(/page=(\d+)/);
  if (match) return parseInt(match[1], 10);
  const items = $(".pre-pagination .page-item a").length;
  return items > 0 ? items : 1;
}
