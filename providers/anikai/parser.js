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
  return each($, '#menu ul li ul.c4 li a', el => el.text().trim()).filter(Boolean);
}

// ─── Nav menu (full header structure) ────────────────────────────────────────
// Extracts genres, types, and quick-links from the nav menu present on every page.
// Selector map (confirmed from live HTML):
//   Genres  → #menu ul li ul.c4 li a   (href: /genres/action)
//   Types   → #menu ul li ul.c1 li a   (href: /ova, /tv, /movie ...)
//   Links   → #menu > ul > li > a[href] (href: /new-releases, /updates ...)
//
// providerName is passed in so every url is rewritten to the API path:
//   /genres/action  →  /api/v2/{provider}/genre/action
//   /ova            →  /api/v2/{provider}/type/ova
//   /new-releases   →  /api/v2/{provider}/category/new-releases

// Known type slugs used by the site as top-level paths (ul.c1)
const TYPE_SLUGS = new Set(['movie', 'tv', 'ova', 'ona', 'special', 'music']);

// Known category slugs that map to /category/:name
const CATEGORY_SLUGS = new Set([
  'new-releases', 'updates', 'ongoing', 'recent',
  'completed', 'upcoming', 'most-popular', 'most-favorite',
  'subbed-anime', 'dubbed-anime', 'recently-updated', 'recently-added',
  'top-upcoming', 'top-airing',
]);

function toApiUrl(siteHref, providerName) {
  if (!siteHref || siteHref === 'javascript:;') return null;

  const base = `/api/v2/${providerName}`;

  // /genres/action  →  /api/v2/{p}/genre/action
  const genreMatch = siteHref.match(/^\/genres\/(.+)$/);
  if (genreMatch) return `${base}/genre/${genreMatch[1]}`;

  // /az-list or /az-list/A  →  /api/v2/{p}/azlist or /api/v2/{p}/azlist/A
  const azMatch = siteHref.match(/^\/az-list\/?(.*)$/);
  if (azMatch !== null) {
    return azMatch[1] ? `${base}/azlist/${azMatch[1]}` : `${base}/azlist`;
  }

  // /watch/some-id  →  /api/v2/{p}/anime/some-id
  const watchMatch = siteHref.match(/^\/watch\/(.+)$/);
  if (watchMatch) return `${base}/anime/${watchMatch[1]}`;

  // strip leading slash to get the slug
  const slug = siteHref.replace(/^\//, '');

  if (TYPE_SLUGS.has(slug))     return `${base}/type/${slug}`;
  if (CATEGORY_SLUGS.has(slug)) return `${base}/category/${slug}`;

  // fallback: keep as-is (e.g. /random, /watch2gether)
  return siteHref;
}

export function parseNavMenu(html, providerName = 'anikai') {
  const $ = load(html);

  const genres = each($, '#menu ul li ul.c4 li a', (el) => ({
    name: el.text().trim(),
    url:  toApiUrl(el.attr('href'), providerName),
  })).filter(g => g.name);

  const types = each($, '#menu ul li ul.c1 li a', (el) => ({
    name: el.text().trim(),
    url:  toApiUrl(el.attr('href'), providerName),
  })).filter(t => t.name);

  // Direct top-level <li><a href="..."> links (not javascript:; parents of sub-menus)
  const links = [];
  $('#menu > ul > li > a').each((_, a) => {
    const href = $(a).attr('href');
    const name = $(a).clone().find('i').remove().end().text().trim();
    if (href && href !== 'javascript:;' && name) {
      const parentLi = $(a).parent('li');
      const isMobileOnly = parentLi.hasClass('d-block') && parentLi.hasClass('d-md-none');
      if (!isMobileOnly) links.push({ name, url: toApiUrl(href, providerName) });
    }
  });

  const brand = {
    link: $('header .brand').attr('href') || '/home',
    logo: $('header .brand img').attr('src') || null,
  };

  const w2g    = $('header a.w2g-btn').attr('href') || null;
  const random = $('header a.shuffle-btn').attr('href') || null;

  return {
    brand,
    buttons: { menu: true, search: true, watch2gether: w2g, random },
    search: {
      action:      `${`/api/v2/${providerName}`}/search`,
      placeholder: $('header form input[name="keyword"]').attr('placeholder') || 'Search anime',
      filter_link: `${`/api/v2/${providerName}`}/search`,
    },
    menu: { genres, types, links },
    language: ['en', 'jp'],
  };
}

// ─── Episode streaming sources ────────────────────────────────────────────────
// Builds megaplay.buzz embed URLs for a given episode number.
// Two strategies are always attempted (mal + ani) when ids are present.
// hasSub / hasDub flags control which language variants are included.
//
// Endpoint patterns:
//   https://megaplay.buzz/stream/mal/{mal-id}/{ep-num}/{lang}
//   https://megaplay.buzz/stream/ani/{al-id}/{ep-num}/{lang}

const EMBED_BASE = 'https://megaplay.buzz';

export function buildEpisodeSources(epNum, malId, alId, hasSub = true, hasDub = false) {
  const sources = {};

  if (malId) {
    if (hasSub) sources.sub    = `${EMBED_BASE}/stream/mal/${malId}/${epNum}/sub`;
    if (hasDub) sources.dub    = `${EMBED_BASE}/stream/mal/${malId}/${epNum}/dub`;
  }

  if (alId) {
    if (hasSub) sources.aniSub = `${EMBED_BASE}/stream/ani/${alId}/${epNum}/sub`;
    if (hasDub) sources.aniDub = `${EMBED_BASE}/stream/ani/${alId}/${epNum}/dub`;
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
        result = [];
        $(slide).find('.aitem').each((_, item) => {
          const el = $(item);
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
          result.push({ id, name, jname, poster, type, episodes: eps });
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

  // syncData — grab animeId (site-internal short key) alongside the slug fallback
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
