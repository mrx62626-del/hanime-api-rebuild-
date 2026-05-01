// ─── Format / Transform Helpers ───────────────────────────────────────────────
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

// ── Spotlight / Hero Slider (home page) ───────────────────────────────────────
export function formatSpotlight($item, $, rank) {
  const anchor  = $item.find("a.desi-buttons").first();
  const href    = $item.find(".desi-buttons").first().attr("href") || anchor.attr("href") || "";
  const nameEl  = $item.find(".desi-head-title");
  
  return {
    rank,
    id:          extractWatchId(href),
    name:        clean(nameEl.text()),
    jname:       nameEl.attr("data-jp") || null,
    description: clean($item.find(".desi-description").text()),
    poster:      $item.find(".deslide-cover-img img").attr("data-src") || null,
    banner:      $item.find(".slide-bg, [data-src]").first().attr("data-src") || null,
    type:        clean($item.find(".scd-item").first().text()),
    duration:    clean($item.find(".scd-item").eq(1).text()),
    rating:      clean($item.find(".quality").text()) || null,
    episodes: {
      sub: parseInt($item.find(".tick-sub").text(), 10) || null,      dub: parseInt($item.find(".tick-dub").text(), 10) || null,
    },
  };
}

// ── Trending Item (home page sidebar charts) ───────────────────────────────────
export function formatTrendingItem($item, $, rank) {
  const anchor = $item.find("a").first();
  const href   = anchor.attr("href") || "";
  
  return {
    rank,
    id:     extractId(href),
    name:   clean($item.find(".film-name").text()),
    jname:  $item.find(".film-name a").attr("data-jp") || null,
    poster: $item.find("img").attr("data-src") || null,
  };
}

// ── Anime Info Page ────────────────────────────────────────────────────────────
export function formatAnimeInfo($, id) {
  const get = (head) => {
    let val = null;
    $(".anisc-info .item").each((_, el) => {
      const headText = $(el).find(".item-head").text().trim();
      if (headText.startsWith(head)) {
        // Try standard selectors first
        val = clean($(el).find(".name, .text, a").first().text());
        // Fallback: grab direct text nodes after the header
        if (!val) {
          val = clean($(el).contents().filter((i, n) => n.nodeType === 3).text());
        }
      }
    });
    return val;
  };

  const getList = (head) => {
    const items = [];
    $(".anisc-info .item").each((_, el) => {
      if ($(el).find(".item-head").text().trim().startsWith(head)) {
        $(el).find("a").each((_, a) => {
          const txt = clean($(a).text());
          if (txt) items.push(txt);
        });
      }
    });
    return items;
  };
  const nameEl = $(".dynamic-name, .film-name").first();
  const posterEl = $(".film-poster img").first();
  const descEl = $(".description-content .text, #synopsis-content .text, .film-description").first();

  return {
    id,
    name:        clean(nameEl.text()),
    jname:       nameEl.attr("data-jname") || nameEl.attr("data-jp") || null,
    poster:      posterEl.attr("data-src") || posterEl.attr("src") || null,
    description: clean(descEl.text()),
    type:        clean($(".film-stats .tick-rate").text()) || clean($(".film-stats .tick").first().text()) || "",
    status:      get("Status"),
    rating:      clean($(".film-stats .tick-pg").text()) || null,
    quality:     clean($(".film-stats .tick-quality").text()) || null,
    episodes: {
      sub: parseInt(clean($(".film-stats .tick-sub").text()), 10) || null,
      dub: parseInt(clean($(".film-stats .tick-dub").text()), 10) || null,
    },
    duration:    get("Duration"),
    premiered:   get("Premiered"),
    aired:       get("Aired"),
    score:       get("MAL Score"),
    studios:     getList("Studios"),
    producers:   getList("Producers"),
    genres:      getList("Genres"),
    synonyms:    get("Synonyms"),
    japanese:    get("Japanese"),
  };
}

// ── Episode List ───────────────────────────────────────────────────────────────
export function formatEpisode($ep, $) {
  return {
    number:    parseInt($ep.attr("data-number"), 10) || null,
    id:        $ep.attr("data-id") || null,
    slug:      clean($ep.attr("title") || $ep.find(".ssli-detail .ep-name").text()),
    isFiller:  $ep.hasClass("ssl-item-filler"),
  };
}

// ── Server Item ────────────────────────────────────────────────────────────────
export function formatServer($el, $) {
  return {
    serverId:   $el.attr("data-id") || null,
    serverName: clean($el.find("a").text()),
    type:       $el.attr("data-type") || null,
  };
}

// ── Search Result Item ─────────────────────────────────────────────────────────export function formatSearchSuggestion($item, $) {
  const href   = $item.find("a").attr("href") || "";
  const poster = $item.find("img").attr("src") || $item.find("img").attr("data-src") || null;
  
  return {
    id:     extractId(href),
    name:   clean($item.find(".title, .film-name").text()),
    jname:  $item.find("[data-jp]").attr("data-jp") || null,
    poster,
    type:   clean($item.find(".media-type, .fdi-item").text()) || null,
  };
}

// ── Genre / Category Pagination ────────────────────────────────────────────────
export function parseTotalPages($) {
  const last = $(".pre-pagination .page-item:last-child a, [title='Last']").attr("href") || "";
  const match = last.match(/page=(\d+)/);
  if (match) return parseInt(match[1], 10);
  
  const items = $(".pre-pagination .page-item a").length;
  return items > 0 ? items : 1;
}
