// api/index.js
import { Hono } from 'hono';
import { handle } from '@hono/node-server/vercel';
import { getProvider, getProviderWithFallback } from '../core/providerManager.js';
import { withCache, TTL, cacheStats } from '../utils/cache.js';
import { serve } from '@hono/node-server';
import * as cheerio from 'cheerio';

const app = new Hono();

// ─── Root ────────────────────────────────────────────────────────────────────
app.get('/', (c) => c.json({
  status: 'ok',
  message: 'Anime API',
  providers: ['anikai', 'anikoto', 'miruro'],
  defaultProvider: 'anikoto',
  docs: 'See README.md for endpoint documentation',
  endpoints: {
    anime: '/api/v2/{provider}/anime/{id}',
    episodes: '/api/v2/{provider}/anime/{id}/episodes',
    episode: '/api/v2/{provider}/anime/{id}/ep/{number}',
    search: '/api/v2/{provider}/search?q=',
    browse: '/api/v2/{provider}/browse',
    home: '/api/v2/{provider}/home',
    index: '/api/v2/{provider}/index',
    genre: '/api/v2/{provider}/genre/{name}',
    category: '/api/v2/{provider}/category/{name}',
    type: '/api/v2/{provider}/type/{name}',
    azlist: '/api/v2/{provider}/azlist/{sort}',
    nav: '/api/v2/{provider}/nav',
    miruro: {
      note: 'Miruro routes served by the Python runtime — all responses use { success, data } format',
      home: '/api/v2/miruro/home',
      index: '/api/v2/miruro/index',
      nav: '/api/v2/miruro/nav',
      search: '/api/v2/miruro/search?query=',
      suggestions: '/api/v2/miruro/suggestions?query=',
      filter: '/api/v2/miruro/filter',
      spotlight: '/api/v2/miruro/spotlight',
      trending: '/api/v2/miruro/trending',
      popular: '/api/v2/miruro/popular',
      upcoming: '/api/v2/miruro/upcoming',
      recent: '/api/v2/miruro/recent',
      schedule: '/api/v2/miruro/schedule',
      info: '/api/v2/miruro/info/{anilist_id}',
      characters: '/api/v2/miruro/anime/{anilist_id}/characters',
      relations: '/api/v2/miruro/anime/{anilist_id}/relations',
      recommendations: '/api/v2/miruro/anime/{anilist_id}/recommendations',
      episodes: '/api/v2/miruro/episodes/{anilist_id}',
      sources: '/api/v2/miruro/sources',
      watch: '/api/v2/miruro/watch/{provider}/{anilist_id}/{category}/{slug}',
    }
  }
}));

// ─── Cache stats (optional debug endpoint) ───────────────────────────────────
app.get('/api/cache/stats', (c) => c.json({ success: true, data: cacheStats() }));

// ─── Helper ──────────────────────────────────────────────────────────────────

function ok(c, data) {
  return c.json({ success: true, data });
}

function err(c, message, status = 500) {
  console.error(`[ERROR] ${message}`);
  return c.json({ success: false, error: message }, status);
}

// ─── Home ─────────────────────────────────────────────────────────────────────
app.get('/api/v2/:provider/home', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    return withCache(c, TTL.HOME, () => p.anime.getHome());
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Search ───────────────────────────────────────────────────────────────
app.get('/api/v2/:provider/search', async (c) => {

  try {

    const providerName =
      c.req.param('provider');

    const query =
      c.req.query('q');

    if (!query) {

      return c.json({

        success: false,

        message:
          'Missing search query'

      }, 400);
    }

    // ---------------------------------
    // Anikoto search
    // ---------------------------------

    if (providerName === 'anikoto') {

      const url =
        `https://anikoto.cz/filter?keyword=${encodeURIComponent(query)}`;

      const response =
        await fetch(url, {
      
          headers: {
      
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
      
            'Accept':
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      
            'Accept-Language':
              'en-US,en;q=0.9',
      
            'Referer':
              'https://anikoto.cz/',
      
            'Origin':
              'https://anikoto.cz',
      
            'Cache-Control':
              'no-cache',
      
            'Pragma':
              'no-cache'
          }
        });

      const html =
        await response.text();

      const $ =
        cheerio.load(html);

      const results = [];

      // ---------------------------------
      // Parse anime cards
      // ---------------------------------

$('a').each((i, el) => {

  const href =
    $(el).attr('href') || '';

  // Match anime URLs only
  if (
    href.includes('/anime/')
  ) {

    const title =
      $(el)
      .attr('title')
      ||
      $(el)
      .text()
      .trim();

    const img =
      $(el)
      .find('img');

    const poster =
      img.attr('data-src')
      ||
      img.attr('src')
      ||
      '';

    const id =
      href
        .split('/anime/')
        .pop()
        ?.replace(/\//g, '')
      || '';

    // Avoid duplicates
    if (
      id &&
      !results.some(
        a => a.id === id
      )
    ) {

      results.push({

        id,

        title,

        poster
      });
    }
  }
});

return c.json({

  success: true,

  data: results
});
    }
    // ---------------------------------
    // Unsupported provider
    // ---------------------------------

    return c.json({

      success: false,

      message:
        'Provider search unsupported'

    }, 400);

  } catch (e) {

    console.error(
      '[SEARCH ERROR]',
      e
    );

    return c.json({

      success: false,

      message:
        e.message

    }, 500);
  }
});

// ─── Index / landing page ─────────────────────────────────────────────────────
app.get('/api/v2/:provider/index', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    return withCache(c, TTL.HOME, () => p.anime.getIndex());
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Anime detail ─────────────────────────────────────────────────────────────
app.get('/api/v2/:provider/anime/:animeId', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    return withCache(c, TTL.ANIME, () => p.anime.getById(c.req.param('animeId')));
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Episode list ─────────────────────────────────────────────────────────────
app.get('/api/v2/:provider/anime/:animeId/episodes', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    return withCache(c, TTL.EPISODES, () => p.anime.getEpisodes(c.req.param('animeId')));
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Single episode ───────────────────────────────────────────────────────────
// ─── Single episode ───────────────────────────────────────────────────────────
app.get('/api/v2/:provider/anime/:animeId/ep/:number', async (c) => {

  try {

    const p =
      await getProvider(
        c.req.param('provider')
      );

    return withCache(c, TTL.EPISODE, async () => {

      const animeId =
        c.req.param('animeId');

      const episodeNumber =
        c.req.param('number');

      // --------------------------------------------------
      // Fetch episode data
      // --------------------------------------------------

      const episodeData =
        await p.anime.getEpisode(
          animeId,
          episodeNumber
        );

      console.log(
        '[FULL RAW]',
        JSON.stringify(
          episodeData,
          null,
          2
        )
      );

      // --------------------------------------------------
      // Direct Megaplay sources
      // --------------------------------------------------

      const subUrl =
        episodeData?.episode
          ?.sources
          ?.sub
        || null;

      const dubUrl =
        episodeData?.episode
          ?.sources
          ?.dub
        || null;

      // --------------------------------------------------
      // Final response
      // --------------------------------------------------

      return {

        animeId,

        episode:
          episodeNumber,

        iframe:
          subUrl
          || dubUrl
          || null,

        preferredServers: {

          sub: subUrl
            ? [
                {
                  quality: 'SUB',
                  url: subUrl
                }
              ]
            : [],

          dub: dubUrl
            ? [
                {
                  quality: 'DUB',
                  url: dubUrl
                }
              ]
            : []
        }
      };

    });

  } catch (e) {

    return err(c, e.message);

  }

});
// ─── AZ List ──────────────────────────────────────────────────────────────────
app.get('/api/v2/:provider/azlist/:sortOption', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    const sort = c.req.param('sortOption');
    const page = parseInt(c.req.query('page') || '1', 10);
    return withCache(c, TTL.AZLIST, () => p.anime.getAzList(sort, page));
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/v2/:provider/azlist', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    const page = parseInt(c.req.query('page') || '1', 10);
    return withCache(c, TTL.AZLIST, () => p.anime.getAzList('all', page));
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Genre ────────────────────────────────────────────────────────────────────
app.get('/api/v2/:provider/genre/:name', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    const name = c.req.param('name');
    const page = parseInt(c.req.query('page') || '1', 10);
    const sort = c.req.query('sort') || null;
    return withCache(c, TTL.GENRE, async () => {
      const data = await p.anime.getGenre(name, page, sort);
      return { 
        genreName: data.title || name, 
        animes: data.animes, 
        currentPage: data.currentPage, 
        totalPages: data.totalPages, 
        hasNextPage: data.hasNextPage 
      };
    });
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Category ─────────────────────────────────────────────────────────────────
app.get('/api/v2/:provider/category/:name', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    const name = c.req.param('name');
    const page = parseInt(c.req.query('page') || '1', 10);
    const sort = c.req.query('sort') || null;
    return withCache(c, TTL.GENRE, async () => {
      const data = await p.anime.getCategory(name, page, sort);
      return { 
        category: data.title || name, 
        animes: data.animes, 
        currentPage: data.currentPage, 
        totalPages: data.totalPages, 
        hasNextPage: data.hasNextPage 
      };
    });
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Type ──────────────────────────────────────────────────────────────────────
app.get('/api/v2/:provider/type/:name', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    const name = c.req.param('name');
    const page = parseInt(c.req.query('page') || '1', 10);
    const sort = c.req.query('sort') || null;
    return withCache(c, TTL.GENRE, async () => {
      const data = await p.anime.getType(name, page, sort);
      return { 
        type: data.title || name, 
        animes: data.animes, 
        currentPage: data.currentPage, 
        totalPages: data.totalPages, 
        hasNextPage: data.hasNextPage 
      };
    });
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Nav menu ─────────────────────────────────────────────────────────────────
app.get('/api/v2/:provider/nav', async (c) => {
  try {
    const providerName = c.req.param('provider');
    const p = await getProvider(providerName);
    return withCache(c, TTL.NAV, async () => {
      const data = await p.anime.getNavMenu(providerName);
      return { header: data };
    });
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Shorthand routes (no provider prefix → uses defaultProvider) ────────────
app.get('/api/home', async (c) => {
  try {
    const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
    return withCache(c, TTL.HOME, async () => ({
      provider: name,
      ...(await p.anime.getHome()),
    }));
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/index', async (c) => {
  try {
    const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
    return withCache(c, TTL.HOME, async () => ({
      provider: name,
      ...(await p.anime.getIndex()),
    }));
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/search', async (c) => {
  const q = c.req.query('q');
  if (!q) return err(c, 'Missing q', 400);
  try {
    const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
    const page = parseInt(c.req.query('page') || '1', 10);
    return withCache(c, TTL.SEARCH, async () => ({
      provider: name,
      ...(await p.search.query(q, page)),
    }));
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/browse', async (c) => {
  try {
    const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
    const page = parseInt(c.req.query('page') || '1', 10);
    const { page: _p, provider: _pr, ...filters } = Object.fromEntries(
      Object.entries(c.req.query()).filter(([k]) => !['page', 'provider'].includes(k))
    );
    return withCache(c, TTL.BROWSE, async () => ({
      provider: name,
      ...(await p.search.browse(filters, page)),
    }));
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/anime/:id', async (c) => {
  try {
    const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
    return withCache(c, TTL.ANIME, async () => ({
      provider: name,
      ...(await p.anime.getById(c.req.param('id'))),
    }));
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/anime/:id/episodes', async (c) => {
  try {
    const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
    return withCache(c, TTL.EPISODES, async () => ({
      provider: name,
      ...(await p.anime.getEpisodes(c.req.param('id'))),
    }));
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/anime/:id/ep/:number', async (c) => {
  try {
    const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
    return withCache(c, TTL.EPISODE, async () => ({
      provider: name,
      ...(await p.anime.getEpisode(c.req.param('id'), c.req.param('number'))),
    }));
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/genre/:name', async (c) => {
  try {
    const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
    const pg = parseInt(c.req.query('page') || '1', 10);
    const sort = c.req.query('sort') || null;
    return withCache(c, TTL.GENRE, async () => {
      const d = await p.anime.getGenre(c.req.param('name'), pg, sort);
      return { provider: name, ...d };
    });
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/category/:name', async (c) => {
  try {
    const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
    const pg = parseInt(c.req.query('page') || '1', 10);
    const sort = c.req.query('sort') || null;
    return withCache(c, TTL.GENRE, async () => {
      const d = await p.anime.getCategory(c.req.param('name'), pg, sort);
      return { provider: name, ...d };
    });
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/type/:name', async (c) => {
  try {
    const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
    const pg = parseInt(c.req.query('page') || '1', 10);
    const sort = c.req.query('sort') || null;
    return withCache(c, TTL.GENRE, async () => {
      const d = await p.anime.getType(c.req.param('name'), pg, sort);
      return { provider: name, type: d.title, animes: d.animes, currentPage: d.currentPage, totalPages: d.totalPages, hasNextPage: d.hasNextPage };
    });
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/azlist/:sort', async (c) => {
  try {
    const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
    const pg = parseInt(c.req.query('page') || '1', 10);
    return withCache(c, TTL.AZLIST, async () => ({
      provider: name,
      ...(await p.anime.getAzList(c.req.param('sort'), pg)),
    }));
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/nav', async (c) => {
  const providerName = c.req.query('provider') || 'anikoto';
  try {
    const p = await getProvider(providerName);
    return withCache(c, TTL.NAV, async () => ({
      provider: providerName,
      header: await p.anime.getNavMenu(providerName),
    }));
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Miruro routes (Python runtime handles /api/v2/miruro/* via vercel.json) ──
// vercel.json routes ^/api/v2/miruro/(.*) → providers/miruro/api.py BEFORE
// reaching this Hono handler, so these requests never arrive here in production.

// ─── Error handler ────────────────────────────────────────────────────────────
app.onError((error, c) => {
  console.error('[FATAL]', error);
  return err(c, error.message);
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  console.log(`Server is running on port ${port}`);
  serve({
    fetch: app.fetch,
    port: Number(port)
  });
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default handle(app);
