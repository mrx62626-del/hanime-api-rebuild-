import { Hono } from 'hono';
import { handle } from '@hono/node-server/vercel';
import { getProvider } from '../core/providerManager.js';

const app = new Hono();

// ─── Root ────────────────────────────────────────────────────────────────────

app.get('/', (c) => c.json({
  status: 'ok',
  message: 'AnimeKai API',
  providers: ['anikai', 'hianime'],
  defaultProvider: 'anikai',
  docs: 'See README.md for endpoint documentation',
}));

// ─── Helper ──────────────────────────────────────────────────────────────────

function ok(c, data) {
  return c.json({ success: true, data });
}

function err(c, message, status = 500) {
  return c.json({ success: false, error: message }, status);
}

async function provider(c) {
  return await getProvider(c.req.query('provider'));
}

// ─── Home ─────────────────────────────────────────────────────────────────────
// GET /api/v2/anikai/home

app.get('/api/v2/:provider/home', async (c) => {
  const p = await getProvider(c.req.param('provider'));
  const data = await p.anime.getHome();
  return ok(c, data);
});

// ─── Anime detail ─────────────────────────────────────────────────────────────
// GET /api/v2/anikai/anime/:animeId

app.get('/api/v2/:provider/anime/:animeId', async (c) => {
  const p = await getProvider(c.req.param('provider'));
  const data = await p.anime.getById(c.req.param('animeId'));
  return ok(c, data);
});

// ─── Episode list ─────────────────────────────────────────────────────────────
// GET /api/v2/anikai/anime/:animeId/episodes
// Returns all episodes with streaming src URLs attached.

app.get('/api/v2/:provider/anime/:animeId/episodes', async (c) => {
  const p = await getProvider(c.req.param('provider'));
  const data = await p.anime.getEpisodes(c.req.param('animeId'));
  return ok(c, data);
});

// ─── Single episode ───────────────────────────────────────────────────────────
// GET /api/v2/anikai/anime/:animeId/ep/:number
// Returns one episode by number with streaming src URLs.

app.get('/api/v2/:provider/anime/:animeId/ep/:number', async (c) => {
  const p = await getProvider(c.req.param('provider'));
  const data = await p.anime.getEpisode(c.req.param('animeId'), c.req.param('number'));
  return ok(c, data);
});

// ─── Search ───────────────────────────────────────────────────────────────────
// GET /api/v2/anikai/search?q=&page=&type=&status=&sort=&genre=...

app.get('/api/v2/:provider/search', async (c) => {
  const q = c.req.query('q');
  if (!q) return err(c, 'Missing query parameter: q', 400);
  const p = await getProvider(c.req.param('provider'));
  const page = parseInt(c.req.query('page') || '1', 10);
  const { q: _q, page: _p, provider: _pr, ...filters } = Object.fromEntries(
    Object.entries(c.req.query()).filter(([k]) => !['q', 'page', 'provider'].includes(k))
  );
  const data = await p.search.query(q, page, filters);
  return ok(c, data);
});

// ─── AZ List ──────────────────────────────────────────────────────────────────
// GET /api/v2/anikai/azlist/:sortOption?page=

app.get('/api/v2/:provider/azlist/:sortOption', async (c) => {
  const p    = await getProvider(c.req.param('provider'));
  const sort = c.req.param('sortOption');
  const page = parseInt(c.req.query('page') || '1', 10);
  const data = await p.anime.getAzList(sort, page);
  return ok(c, data);
});

app.get('/api/v2/:provider/azlist', async (c) => {
  const p    = await getProvider(c.req.param('provider'));
  const page = parseInt(c.req.query('page') || '1', 10);
  const data = await p.anime.getAzList('all', page);
  return ok(c, data);
});

// ─── Genre ────────────────────────────────────────────────────────────────────
// GET /api/v2/anikai/genre/:name?page=

app.get('/api/v2/:provider/genre/:name', async (c) => {
  const p    = await getProvider(c.req.param('provider'));
  const name = c.req.param('name');
  const page = parseInt(c.req.query('page') || '1', 10);
  const data = await p.anime.getGenre(name, page);
  return ok(c, { genreName: data.title, animes: data.animes, currentPage: data.currentPage, totalPages: data.totalPages, hasNextPage: data.hasNextPage });
});

// ─── Category ─────────────────────────────────────────────────────────────────
// GET /api/v2/anikai/category/:name?page=
// categories: movie, tv, ova, ona, special, new-releases, updates, ongoing, recent, completed, upcoming

app.get('/api/v2/:provider/category/:name', async (c) => {
  const p    = await getProvider(c.req.param('provider'));
  const name = c.req.param('name');
  const page = parseInt(c.req.query('page') || '1', 10);
  const data = await p.anime.getCategory(name, page);
  return ok(c, { category: data.title, animes: data.animes, currentPage: data.currentPage, totalPages: data.totalPages, hasNextPage: data.hasNextPage });
});

// ─── Type ──────────────────────────────────────────────────────────────────────
// GET /api/v2/anikai/type/:name?page=
// types: movie, tv, ova, ona, special

app.get('/api/v2/:provider/type/:name', async (c) => {
  const p    = await getProvider(c.req.param('provider'));
  const name = c.req.param('name');
  const page = parseInt(c.req.query('page') || '1', 10);
  const data = await p.anime.getType(name, page);
  return ok(c, { type: data.title, animes: data.animes, currentPage: data.currentPage, totalPages: data.totalPages, hasNextPage: data.hasNextPage });
});

// ─── Nav menu ─────────────────────────────────────────────────────────────────
// GET /api/v2/anikai/nav

app.get('/api/v2/:provider/nav', async (c) => {
  const providerName = c.req.param('provider');
  const p = await getProvider(providerName);
  const data = await p.anime.getNavMenu(providerName);
  return ok(c, { header: data });
});

// ─── Shorthand routes (no provider prefix → uses default) ────────────────────

app.get('/api/home',           async (c) => { const p = await provider(c); return ok(c, await p.anime.getHome()); });
app.get('/api/search',         async (c) => { const p = await provider(c); const q = c.req.query('q'); if (!q) return err(c, 'Missing q', 400); const page = parseInt(c.req.query('page') || '1', 10); return ok(c, await p.search.query(q, page)); });
app.get('/api/anime/:id',      async (c) => { const p = await provider(c); return ok(c, await p.anime.getById(c.req.param('id'))); });
app.get('/api/anime/:id/episodes', async (c) => { const p = await provider(c); return ok(c, await p.anime.getEpisodes(c.req.param('id'))); });
app.get('/api/anime/:id/ep/:number', async (c) => { const p = await provider(c); return ok(c, await p.anime.getEpisode(c.req.param('id'), c.req.param('number'))); });
app.get('/api/genre/:name',    async (c) => { const p = await provider(c); const pg = parseInt(c.req.query('page') || '1', 10); const d = await p.anime.getGenre(c.req.param('name'), pg); return ok(c, d); });
app.get('/api/category/:name', async (c) => { const p = await provider(c); const pg = parseInt(c.req.query('page') || '1', 10); const d = await p.anime.getCategory(c.req.param('name'), pg); return ok(c, d); });
app.get('/api/type/:name',     async (c) => { const p = await provider(c); const pg = parseInt(c.req.query('page') || '1', 10); const d = await p.anime.getType(c.req.param('name'), pg); return ok(c, { type: d.title, animes: d.animes, currentPage: d.currentPage, totalPages: d.totalPages, hasNextPage: d.hasNextPage }); });
app.get('/api/azlist/:sort',   async (c) => { const p = await provider(c); const pg = parseInt(c.req.query('page') || '1', 10); return ok(c, await p.anime.getAzList(c.req.param('sort'), pg)); });
app.get('/api/nav',            async (c) => { const pName = c.req.query('provider') || 'anikai'; const p = await getProvider(pName); return ok(c, { header: await p.anime.getNavMenu(pName) }); });

// ─── Error handler ────────────────────────────────────────────────────────────

app.onError((error, c) => {
  console.error(error);
  return err(c, error.message);
});

// ─── Export ───────────────────────────────────────────────────────────────────

export default handle(app);
