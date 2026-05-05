import { load, text, attr, each, num } from '../../utils/dom.js';

// ─── Pagination helpers ───────────────────────────────────────────────────────
// The site uses rel="last" and rel="next" links in pagination.
// ul.pagination > li.page-item.active holds the current page number.
// The rel="last" anchor holds the last page number.

function getLastPage($) {
  const lastHref = $('ul.pagination .page-item a[rel="last"]').attr('href');
  if (lastHref) {
    const m = lastHref.match(/page=(\d+)/);
    if (m) return parseInt(m[1], 10);
  }
  // Fallback: highest numbered page-link
  let max = 1;
  $('ul.pagination .page-item .page-link').each((_, el) => {
    const n = parseInt($(el).text().trim(), 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return max;
}

function getCurrentPage($) {
  const active = $('ul.pagination .page-item.active .page-link').text().trim();
  return parseInt(active, 10) || 1;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function parseEpisodes($, ctx) {
  return {
    sub: num($(ctx).find('span.sub').text().trim()) || null,
    dub: num($(ctx).find('span.dub').text().trim()) || null,
  };
}

// Parses a standard aitem card (search, AZ, genre, category pages)
// Structure: .aitem > .inner > a.poster[href] + a.title + .info span b (type)
function parseAitem($, el) {
  const href   = attr($, 'a.poster', 'href', el) || attr($, 'a', 'href', el);
  const id     = href ? href.replace('/watch/', '').split('#')[0].trim() : null;
  const name   = attr($, 'a.title', 'title', el) || text($, 'a.title', el) || text($, 'h6.title', el);
  const jname  = attr($, 'a.title, h6.title', 'data-jp', el) || null;
  const poster = attr($, 'img.lazyload', 'data-src', el) || attr($, 'img', 'src', el);
  const eps    = parseEpisodes($, el);

  // Type is the last <b> whose text is not purely numeric
  let type = null;
  $(el).find('.info span b').each((_, b) => {
    const t = $(b).text().trim();
    if (t && isNaN(parseInt(t, 10))) type = t;
  });

  return { id, name, jname, poster, type, episodes: eps };
}

function parseGenreList($) {
  return each($, 'header .nav-menu ul li ul.c4 li a', el => el.text().trim()).filter(Boolean);
}

// ─── syncData helper ──────────────────────────────────────────────────────────
// Extracts the embedded JSON from <script id="syncData"> on watch pages.
// Returns: { animeId, malId, alId, animeName, seriesUrl, currentEpisode }
// Used by both parseAnime and parseSyncData (episode fetch path).

export function parseSyncData(html) {
  const $ = load(html);
  try {
    const sync = JSON.parse($('#syncData').text());
    return {
      animeId:        sync.anime_id   || null,
      malId:          sync.mal_id     ? String(sync.mal_id) : null,
      alId:           sync.al_id      ? String(sync.al_id)  : null,
      animeName:      sync.name       || null,
      seriesUrl:      sync.series_url || null,
      currentEpisode: sync.episode    || null,
    };
  } catch (_) {
    return { animeId: null, malId: null, alId: null, animeName: null, seriesUrl: null, currentEpisode: null };
  }
}

// ─── Episode list (AJAX fragment) ─────────────────────────────────────────────
// Endpoint: GET /ajax/episode/list/{anime_id}
// Returns an HTML fragment (not a full page) with .ep-item elements.
//
// Known .ep-item structure (anikai / aniwatch):
//   <a class="ep-item" href="/watch/{slug}?ep={ep_id}"
//      data-number="{number}" data-title="{title or empty}"
//      data-filler="{0|1}">
//     <span>{number}</span>
//   </a>
//
// We build the aniwatch-style episodeId: "{slug}?ep={ep_id}" for use with
// the megaplay.buzz stream/s-2 endpoint.

export function parseEpisodeList(html, animeName) {
  const $ = load(html);

  const episodes = [];
  $('a.ep-item').each((_, el) => {
    const $el     = $(el);
    const href    = $el.attr('href') || '';                        // e.g. /watch/bleach-re3j?ep=213
    const epId    = href.replace('/watch/', '').trim();            // bleach-re3j?ep=213  (aniwatch ep id)
    const numRaw  = $el.attr('data-number') || $el.find('span').first().text().trim();
    const number  = parseInt(numRaw, 10) || null;
    const rawTitle = ($el.attr('data-title') || '').trim();
    const title   = rawTitle || (animeName && number ? `${animeName} - ${number}` : `Episode ${number ?? '?'}`);
    const isFiller = $el.attr('data-filler') === '1';

    episodes.push({ number, title, episodeId: epId, isFiller });
  });

  return episodes;
}

// ─── Build streaming sources for one episode ──────────────────────────────────
// megaplay.buzz supports three lookup strategies (try in order):
//   1. s-2/{aniwatch-ep-id}/{lang}   — most precise, requires ep-id from AJAX list
//   2. mal/{mal-id}/{ep-num}/{lang}  — fallback when only MAL id is available
//   3. ani/{al-id}/{ep-num}/{lang}   — fallback when only AniList id is available
//
// We always build all available src URLs; callers decide which to use.

const EMBED_BASE = 'https://megaplay.buzz';

export function buildEpisodeSources(epId, number, malId, alId) {
  const sources = {};

  // Strategy 1 — aniwatch / s-2 (most reliable)
  if (epId) {
    sources.sub = `${EMBED_BASE}/stream/s-2/${encodeURIComponent(epId)}/sub`;
    sources.dub = `${EMBED_BASE}/stream/s-2/${encodeURIComponent(epId)}/dub`;
  } else if (malId && number) {
    // Strategy 2 — MAL id
    sources.sub = `${EMBED_BASE}/stream/mal/${malId}/${number}/sub`;
    sources.dub = `${EMBED_BASE}/stream/mal/${malId}/${number}/dub`;
  } else if (alId && number) {
    // Strategy 3 — AniList id
    sources.sub = `${EMBED_BASE}/stream/ani/${alId}/${number}/sub`;
    sources.dub = `${EMBED_BASE}/stream/ani/${alId}/${number}/dub`;
  }

  // Always attach MAL + AniList fallback src when ids are available
  if (malId && number) {
    sources.malSub = `${EMBED_BASE}/stream/mal/${malId}/${number}/sub`;
    sources.malDub = `${EMBED_BASE}/stream/mal/${malId}/${number}/dub`;
  }
  if (alId && number) {
    sources.aniSub = `${EMBED_BASE}/stream/ani/${alId}/${number}/sub`;
    sources.aniDub = `${EMBED_BASE}/stream/ani/${alId}/${number}/dub`;
  }

  return sources;
}

// ─── Home page ────────────────────────────────────────────────────────────────

export function parseHome(html) {
  const $ = load(html);

  const genres = parseGenreList($);

  // Spotlight — #featured .swiper-slide
  // poster comes from the slide's style="background-image: url(...)"
  // genres come from the last <span> in .info (plain text, comma-separated)
  // rank doesn't exist on this site
  const spotlightAnimes = each($, '#featured .swiper-wrapper .swiper-slide', (el, i) => {
    const href  = attr($, 'a.watch-btn', 'href', el);
    const id    = href ? href.replace('/watch/', '').trim() : null;
    const name  = text($, 'p.title', el);
    const jname = attr($, 'p.title', 'data-jp', el);
    const description = text($, 'p.desc', el);
    const poster = el.attr('style')?.match(/url\(([^)]+)\)/)?.[1] || null;
    const rating = text($, '.mics div:first-child span', el);
    const eps    = parseEpisodes($, el);
    const type   = text($, '.info span b', el);

    // Genres: last plain <span> in .info (e.g. "Adventure, Fantasy, Shounen")
    const genreText = el.find('.info > span:not(.sub):not(.dub)').filter((_, s) => !$(s).find('b').length).last().text().trim();
    const animeGenres = genreText ? genreText.split(',').map(g => g.trim()).filter(Boolean) : [];

    const otherInfo = [
      text($, '.mics div:nth-child(2) span', el),
      text($, '.mics div:nth-child(3) span', el),
      type,
    ].filter(Boolean);

    return { id, name, jname, poster, description, rating, rank: i + 1, otherInfo, genres: animeGenres, episodes: eps };
  });

  // Latest episode updates — #latest-updates .aitem
  const latestEpisodeAnimes = each($, '#latest-updates .aitem', (el) => {
    const href   = attr($, 'a.poster', 'href', el);
    const id     = href?.replace('/watch/', '').split('#')[0] || null;
    const name   = attr($, 'a.title', 'title', el) || text($, 'a.title', el);
    const jname  = attr($, 'a.title', 'data-jp', el) || null;
    const poster = attr($, 'img.lazyload', 'data-src', el);
    const eps    = parseEpisodes($, el);
    let type = null;
    $(el).find('.info span b').each((_, b) => {
      const t = $(b).text().trim();
      if (t && isNaN(parseInt(t, 10))) type = t;
    });
    return { id, name, jname, poster, type, episodes: eps };
  });

  // alist-group swiper — each swiper-slide is a named section
  // slide 0 = New Releases, slide 1 = Upcoming, slide 2 = Completed (varies)
  function parseAlistSection(sectionTitle) {
    let result = [];
    $('div.swiper.alist-group .swiper-wrapper .swiper-slide').each((_, slide) => {
      const title = $(slide).find('.shead .stitle').text().trim();
      if (title.toLowerCase() === sectionTitle.toLowerCase()) {
        result = each($, '.aitem', $(slide), (el) => {
          const href   = el.attr('href');
          const id     = href ? href.replace('/watch/', '').trim() : null;
          const name   = attr($, 'h6.title', 'title', el) || text($, 'h6.title', el);
          const jname  = attr($, 'h6.title', 'data-jp', el) || null;
          const poster = attr($, 'img.lazyload', 'data-src', el);
          const eps    = parseEpisodes($, el);
          let type = null;
          $(el).find('.info span b').each((_, b) => {
            const t = $(b).text().trim();
            if (t && isNaN(parseInt(t, 10))) type = t;
          });
          return { id, name, jname, poster, type, episodes: eps };
        });
      }
    });
    return result;
  }

  const newReleases = parseAlistSection('New Releases');
  const topUpcomingAnimes = parseAlistSection('Upcoming');

  // Top trending — sidebar #trending-anime
  // Tabs: data-id="trending" (now), "day", "week", "month"
  function parseTopAnimes(tabId) {
    return each($, `.aitem-col.top-anime[data-id="${tabId}"] .aitem`, (el) => {
      const href   = el.attr('href');
      const id     = href ? href.replace('/watch/', '').trim() : null;
      const rank   = num(text($, '.num', el));
      const name   = text($, '.title', el);
      const jname  = attr($, '.title', 'data-jp', el) || null;
      const poster = el.attr('style')?.match(/url\(([^)]+)\)/)?.[1] || null;
      const eps    = parseEpisodes($, el);
      return { id, name, jname, poster, rank, episodes: eps };
    });
  }

  const top10Animes = {
    today: parseTopAnimes('trending'),
    day:   parseTopAnimes('day'),
    week:  parseTopAnimes('week'),
    month: parseTopAnimes('month'),
  };

  return {
    genres,
    spotlightAnimes,
    latestEpisodeAnimes,
    newReleases,
    topUpcomingAnimes,
    top10Animes,
  };
}

// ─── Search / Browser ─────────────────────────────────────────────────────────

export function parseSearch(html) {
  const $ = load(html);

  const animes = each($, '.aitem-wrapper.regular .aitem', (el) => parseAitem($, el));

  // Total count: ".shead.justify span:last-child" e.g. "184 anime"
  const totalText = $('.shead.justify span:last-child').text().replace(/[^0-9]/g, '');
  const totalCount = num(totalText);

  const cur  = getCurrentPage($);
  const last = getLastPage($);

  return {
    animes,
    currentPage: cur,
    totalPages:  last,
    hasNextPage: cur < last,
    totalCount,
  };
}

// ─── AZ List ──────────────────────────────────────────────────────────────────

export function parseAzList(html) {
  const $ = load(html);

  const sortOption = $('#az-filters li a.active').text().trim() || 'all';
  const animes = each($, '.aitem-wrapper.regular .aitem', (el) => parseAitem($, el));
  const cur  = getCurrentPage($);
  const last = getLastPage($);

  return {
    sortOption,
    animes,
    currentPage: cur,
    totalPages:  last,
    hasNextPage: cur < last,
  };
}

// ─── Genre / Type / Category list pages ──────────────────────────────────────

export function parseListPage(html) {
  const $ = load(html);

  const title = $('.shead.justify .stitle').first().text().trim() || null;
  const animes = each($, '.aitem-wrapper.regular .aitem', (el) => parseAitem($, el));
  const cur  = getCurrentPage($);
  const last = getLastPage($);

  return {
    title,
    animes,
    currentPage: cur,
    totalPages:  last,
    hasNextPage: cur < last,
  };
}

// ─── Anime detail / watch page ────────────────────────────────────────────────

export function parseAnime(html) {
  const $ = load(html);

  // ID — prefer canonical link, fallback to syncData
  let id = $('link[rel="canonical"]').attr('href')?.replace('https://anikai.to/watch/', '').trim() || null;

  // Parse syncData — used for animeId (AJAX key) and fallback id
  let animeId = null;
  try {
    const sync = JSON.parse($('#syncData').text());
    animeId = sync.anime_id || null;
    if (!id) {
      id = sync.series_url?.replace('https://anikai.to/watch/', '') || null;
    }
  } catch (_) {}

  const name   = text($, 'h1.title');
  const jname  = text($, 'small.al-title') || attr($, 'h1.title', 'data-jp') || null;
  const poster = attr($, '.poster img[itemprop="image"]', 'src');
  const description = text($, '.desc.text-expand');
  const rating = text($, '.info .rating');
  const type   = text($, '.info span b');
  const malId  = attr($, '#watch-page', 'data-mal-id');
  const alId   = attr($, '#watch-page', 'data-al-id');

  const episodes = {
    sub: num($('.info .sub').first().text().trim()),
    dub: num($('.info .dub').first().text().trim()),
  };

  // ─── Detail rows ─────────────────────────────────────────────────────────
  // Structure: .detail > div > div  (each div = "Label: <span>value</span>")
  // Some values have nested spans (e.g. MAL score) or external text (aired dates)

  function getDetailDiv(label) {
    let found = null;
    $('.main-entity .detail > div > div').each((_, el) => {
      if ($(el).text().trim().startsWith(label)) {
        found = $(el);
        return false; // break
      }
    });
    return found;
  }

  function detailLinks(label) {
    const div = getDetailDiv(label);
    if (!div) return [];
    return div.find('a').map((_, a) => $(a).text().trim()).get().filter(Boolean);
  }

  function detailText(label) {
    const div = getDetailDiv(label);
    if (!div) return null;
    // Get only the direct text of the first <span> (not nested spans)
    const span = div.find('> span').first();
    if (!span.length) return null;
    // Use the span's own text (clone, remove child elements, get text)
    const cloned = span.clone();
    cloned.find('span').remove();
    const val = cloned.text().trim() || span.find('a').first().text().trim() || null;
    return val || null;
  }

  function detailFullText(label) {
    const div = getDetailDiv(label);
    if (!div) return null;
    // Full text of the div minus the label prefix
    return div.text().replace(label, '').trim() || null;
  }

  // Genres: links inside "Genres:" div span
  const genres = detailLinks('Genres:');

  // Studios / Producers
  const studios   = detailLinks('Studios:');
  const producers = detailLinks('Producers:');

  // Premiered: anchor text inside span
  const premieredDiv = getDetailDiv('Premiered:');
  const premiered = premieredDiv ? premieredDiv.find('a').first().text().trim() || null : null;

  // Date aired: full div text minus label (includes " to date" outside span)
  const aired = detailFullText('Date aired:')?.replace('Date aired:', '').trim() || null;

  const status   = detailText('Status:');
  const duration = detailText('Duration:');
  const episodes_total = detailText('Episodes:');
  const broadcast = detailText('Broadcast:');
  const country  = detailLinks('Country:')[0] || null;

  // MAL score: "7.99 by 1,247,520 users" — get only the score number + users text
  const malDiv = getDetailDiv('MAL:');
  let score = null;
  if (malDiv) {
    const span = malDiv.find('> span').first();
    // score = first text node of span
    const scoreNode = span.contents().filter((_, n) => n.nodeType === 3).first().text().trim();
    const usersText = span.find('.text-muted').text().trim();
    if (scoreNode) score = usersText ? `${scoreNode} ${usersText}` : scoreNode;
  }

  const synonyms = jname;
  const japanese = jname;

  // ─── Related (sidebar #related-anime) ────────────────────────────────────
  // Structure: #related-anime .aitem-col a.aitem[style="background-image:url(...)"]
  // Inside: .detail > .title[data-jp] + .info > span.sub, span.dub, span>b (type), span>b.text-muted (relation)
  const related = each($, '#related-anime .aitem-col a.aitem', (el) => {
    const href    = el.attr('href');
    const rId     = href ? href.replace('/watch/', '').trim() : null;
    const rName   = text($, '.title', el);
    const rJname  = attr($, '.title', 'data-jp', el) || null;
    const rPoster = el.attr('style')?.match(/url\('([^']+)'\)/)?.[1] || null;
    const rEps    = parseEpisodes($, el);

    let rType = null;
    let relationType = null;
    $(el).find('.info span b').each((_, b) => {
      const t = $(b).text().trim();
      if (!t) return;
      if ($(b).hasClass('text-muted')) {
        relationType = t;
      } else if (isNaN(parseInt(t, 10))) {
        rType = t;
      }
    });

    return { id: rId, name: rName, jname: rJname, poster: rPoster, type: rType, relationType, episodes: rEps };
  });

  // ─── Recommended (second sidebar-section without #related-anime id) ───────
  const recommended = each($, '.sidebar-section:not(#related-anime) .aitem-col a.aitem', (el) => {
    const href    = el.attr('href');
    const rId     = href ? href.replace('/watch/', '').trim() : null;
    const rName   = text($, '.title', el);
    const rJname  = attr($, '.title', 'data-jp', el) || null;
    const rPoster = el.attr('style')?.match(/url\('([^']+)'\)/)?.[1] || null;
    const rEps    = parseEpisodes($, el);
    let rType = null;
    $(el).find('.info span b').each((_, b) => {
      const t = $(b).text().trim();
      if (t && !$(b).hasClass('text-muted') && isNaN(parseInt(t, 10))) rType = t;
    });
    return { id: rId, name: rName, jname: rJname, poster: rPoster, type: rType, episodes: rEps };
  });

  // ─── Seasons (#seasons .swiper-wrapper .swiper-slide.aitem) ──────────────
  // Structure: .swiper-slide.aitem > .inner > a.poster[href] > img[src]
  //            + .detail > span (label) + .btn (episodes text)
  const seasons = each($, '#seasons .swiper-wrapper .swiper-slide.aitem', (el) => {
    const href    = attr($, 'a.poster', 'href', el);
    const sId     = href ? href.replace('/watch/', '').trim() : null;
    const sPoster = attr($, 'a.poster img', 'src', el);
    const sLabel  = text($, '.detail span', el);
    const sEpsText = text($, '.detail .btn', el);
    const isActive = el.hasClass('active');
    return { id: sId, label: sLabel, episodes: sEpsText, poster: sPoster, isCurrent: isActive };
  });

  return {
    anime: {
      id, animeId, name, jname, synonyms, japanese,
      poster, description, type, rating,
      episodes, duration, premiered, aired,
      broadcast, status, score,
      episodesTotal: num(episodes_total),
      country,
      genres, studios, producers,
      malId, alId,
    },
    related,
    recommended,
    seasons,
  };
}
