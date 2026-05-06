// api/index.js
import { Hono } from 'hono';
import { handle } from '@hono/node-server/vercel';
import { getProvider } from '../core/providerManager.js';

const app = new Hono();

// ─── Root ────────────────────────────────────────────────────────────────────
app.get('/', (c) => c.json({
  status: 'ok',
  message: 'Anime API',
  providers: ['anikai', 'anikoto'],
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
  }
}));

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
    const data = await p.anime.getHome();
    return ok(c, data);
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Index / landing page ─────────────────────────────────────────────────────
app.get('/api/v2/:provider/index', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    const data = await p.anime.getIndex();
    return ok(c, data);
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Anime detail ─────────────────────────────────────────────────────────────
app.get('/api/v2/:provider/anime/:animeId', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    const data = await p.anime.getById(c.req.param('animeId'));
    return ok(c, data);
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Episode list ─────────────────────────────────────────────────────────────
app.get('/api/v2/:provider/anime/:animeId/episodes', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    const data = await p.anime.getEpisodes(c.req.param('animeId'));
    return ok(c, data);
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Single episode ───────────────────────────────────────────────────────────
app.get('/api/v2/:provider/anime/:animeId/ep/:number', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    const data = await p.anime.getEpisode(c.req.param('animeId'), c.req.param('number'));
    return ok(c, data);
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Search ───────────────────────────────────────────────────────────────────
app.get('/api/v2/:provider/search', async (c) => {
  try {
    const q = c.req.query('q');
    if (!q) return err(c, 'Missing query parameter: q', 400);
    
    const p = await getProvider(c.req.param('provider'));
    const page = parseInt(c.req.query('page') || '1', 10);
    
    // Extract all filters except q, page, provider
    const { q: _q, page: _p, provider: _pr, ...filters } = Object.fromEntries(
      Object.entries(c.req.query()).filter(([k]) => !['q', 'page', 'provider'].includes(k))
    );
    
    const data = await p.search.query(q, page, filters);
    return ok(c, data);
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Browse ───────────────────────────────────────────────────────────────────
app.get('/api/v2/:provider/browse', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    const page = parseInt(c.req.query('page') || '1', 10);
    
    const { page: _p, provider: _pr, ...filters } = Object.fromEntries(
      Object.entries(c.req.query()).filter(([k]) => !['page', 'provider'].includes(k))
    );
    
    const data = await p.search.browse(filters, page);
    return ok(c, data);
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
    const data = await p.anime.getAzList(sort, page);
    return ok(c, data);
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/v2/:provider/azlist', async (c) => {
  try {
    const p = await getProvider(c.req.param('provider'));
    const page = parseInt(c.req.query('page') || '1', 10);
    const data = await p.anime.getAzList('all', page);
    return ok(c, data);
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
    const data = await p.anime.getGenre(name, page, sort);
    return ok(c, { 
      genreName: data.title || name, 
      animes: data.animes, 
      currentPage: data.currentPage, 
      totalPages: data.totalPages, 
      hasNextPage: data.hasNextPage 
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
    const data = await p.anime.getCategory(name, page, sort);
    return ok(c, { 
      category: data.title || name, 
      animes: data.animes, 
      currentPage: data.currentPage, 
      totalPages: data.totalPages, 
      hasNextPage: data.hasNextPage 
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
    const data = await p.anime.getType(name, page, sort);
    return ok(c, { 
      type: data.title || name, 
      animes: data.animes, 
      currentPage: data.currentPage, 
      totalPages: data.totalPages, 
      hasNextPage: data.hasNextPage 
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
    const data = await p.anime.getNavMenu(providerName);
    return ok(c, { header: data });
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Shorthand routes (no provider prefix → uses defaultProvider) ────────────
app.get('/api/home', async (c) => {
  const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
  try {
    return ok(c, { provider: name, ...(await p.anime.getHome()) });
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/index', async (c) => {
  const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
  try {
    return ok(c, { provider: name, ...(await p.anime.getIndex()) });
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/search', async (c) => {
  const q = c.req.query('q');
  if (!q) return err(c, 'Missing q', 400);
  const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
  const page = parseInt(c.req.query('page') || '1', 10);
  try {
    return ok(c, { provider: name, ...(await p.search.query(q, page)) });
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/browse', async (c) => {
  const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
  const page = parseInt(c.req.query('page') || '1', 10);
  const { page: _p, provider: _pr, ...filters } = Object.fromEntries(
    Object.entries(c.req.query()).filter(([k]) => !['page', 'provider'].includes(k))
  );
  try {
    return ok(c, { provider: name, ...(await p.search.browse(filters, page)) });
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/anime/:id', async (c) => {
  const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
  try {
    return ok(c, { provider: name, ...(await p.anime.getById(c.req.param('id'))) });
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/anime/:id/episodes', async (c) => {
  const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
  try {
    return ok(c, { provider: name, ...(await p.anime.getEpisodes(c.req.param('id'))) });
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/anime/:id/ep/:number', async (c) => {
  const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
  try {
    return ok(c, { provider: name, ...(await p.anime.getEpisode(c.req.param('id'), c.req.param('number'))) });
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/genre/:name', async (c) => {
  const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
  const pg = parseInt(c.req.query('page') || '1', 10);
  const sort = c.req.query('sort') || null;
  try {
    const d = await p.anime.getGenre(c.req.param('name'), pg, sort);
    return ok(c, { provider: name, ...d });
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/category/:name', async (c) => {
  const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
  const pg = parseInt(c.req.query('page') || '1', 10);
  const sort = c.req.query('sort') || null;
  try {
    const d = await p.anime.getCategory(c.req.param('name'), pg, sort);
    return ok(c, { provider: name, ...d });
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/type/:name', async (c) => {
  const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
  const pg = parseInt(c.req.query('page') || '1', 10);
  const sort = c.req.query('sort') || null;
  try {
    const d = await p.anime.getType(c.req.param('name'), pg, sort);
    return ok(c, { provider: name, type: d.title, animes: d.animes, currentPage: d.currentPage, totalPages: d.totalPages, hasNextPage: d.hasNextPage });
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/azlist/:sort', async (c) => {
  const { name, provider: p } = await getProviderWithFallback(c.req.query('provider'));
  const pg = parseInt(c.req.query('page') || '1', 10);
  try {
    return ok(c, { provider: name, ...(await p.anime.getAzList(c.req.param('sort'), pg)) });
  } catch (e) {
    return err(c, e.message);
  }
});

app.get('/api/nav', async (c) => {
  const providerName = c.req.query('provider') || 'anikoto';
  try {
    const p = await getProvider(providerName);
    return ok(c, { provider: providerName, header: await p.anime.getNavMenu(providerName) });
  } catch (e) {
    return err(c, e.message);
  }
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.onError((error, c) => {
  console.error('[FATAL]', error);
  return err(c, error.message);
});

// ─── Export ───────────────────────────────────────────────────────────────────
export default handle(app);
