// ─── HiAnime API — Hono Server ────────────────────────────────────────────────

import { Hono }        from "hono";
import { cors }        from "hono/cors";
import { serve }       from "@hono/node-server";

import { logger }      from "./util/logger.js";

// ── Routes ────────────────────────────────────────────────────────────────────
import { homeRouter }             from "./routes/home.js";
import { animeRouter }            from "./routes/anime.js";
import { episodesRouter }         from "./routes/episodes.js";
import { searchRouter }           from "./routes/search.js";
import { searchSuggestionRouter } from "./routes/searchSuggestion.js";
import { categoryRouter }         from "./routes/category.js";
import { genreRouter }            from "./routes/genre.js";
import { producerRouter }         from "./routes/producer.js";
import { azlistRouter }           from "./routes/azlist.js";
import { scheduleRouter }         from "./routes/schedule.js";
import { serversRouter }          from "./routes/servers.js";
import { sourcesRouter }          from "./routes/sources.js";
import { qtipRouter }             from "./routes/qtip.js";

// ── App ───────────────────────────────────────────────────────────────────────

const app = new Hono();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  : ["*"];

app.use(
  "/api/*",
  cors({
    origin:         allowedOrigins.includes("*") ? "*" : allowedOrigins,
    allowMethods:   ["GET", "OPTIONS"],
    allowHeaders:   ["Content-Type"],
    exposeHeaders:  ["Cache-Control"],
  })
);

// ── Request logging via Pino ──────────────────────────────────────────────────
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info(
    {
      method: c.req.method,
      path:   new URL(c.req.url).pathname,
      status: c.res.status,
      ms,
    },
    `${c.req.method} ${new URL(c.req.url).pathname} ${c.res.status} ${ms}ms`
  );
});

// ── Mount API routes ──────────────────────────────────────────────────────────

// Direct routes (query-param style — identical to original api/ folder)
app.route("/api/home",              homeRouter);
app.route("/api/anime",             animeRouter);
app.route("/api/episodes",          episodesRouter);
app.route("/api/search",            searchRouter);
app.route("/api/search-suggestion", searchSuggestionRouter);
app.route("/api/category",          categoryRouter);
app.route("/api/genre",             genreRouter);
app.route("/api/producer",          producerRouter);
app.route("/api/azlist",            azlistRouter);
app.route("/api/schedule",          scheduleRouter);
app.route("/api/servers",           serversRouter);
app.route("/api/sources",           sourcesRouter);
app.route("/api/qtip",              qtipRouter);

// ── v2 alias routes (matching original vercel.json rewrites) ──────────────────
app.route("/api/v2/hianime/home",                    homeRouter);
app.route("/api/v2/hianime/search",                  searchRouter);
app.route("/api/v2/hianime/search/suggestion",       searchSuggestionRouter);
app.route("/api/v2/hianime/schedule",                scheduleRouter);
app.route("/api/v2/hianime/servers",                 serversRouter);
app.route("/api/v2/hianime/sources",                 sourcesRouter);
app.route("/api/v2/hianime/episodes",                episodesRouter);

// Path-param v2 routes — Hono handles these natively
app.get("/api/v2/hianime/anime/:id", async (c) => {
  // Forward to anime handler with id query param
  const id = c.req.param("id");
  const raw = c.req.query("raw");
  const url = new URL(c.req.url);
  url.pathname = "/api/anime";
  url.searchParams.set("id", id);
  if (raw) url.searchParams.set("raw", raw);
  return animeRouter.fetch(new Request(url.toString(), c.req.raw), c.env);
});

app.get("/api/v2/hianime/anime/:animeId/episodes", async (c) => {
  const id  = c.req.param("animeId");
  const raw = c.req.query("raw");
  const url = new URL(c.req.url);
  url.pathname = "/api/episodes";
  url.searchParams.set("id", id);
  if (raw) url.searchParams.set("raw", raw);
  return episodesRouter.fetch(new Request(url.toString(), c.req.raw), c.env);
});

app.get("/api/v2/hianime/azlist/:sort", async (c) => {
  const sort = c.req.param("sort");
  const url  = new URL(c.req.url);
  url.pathname = "/api/azlist";
  url.searchParams.set("sort", sort);
  return azlistRouter.fetch(new Request(url.toString(), c.req.raw), c.env);
});

app.get("/api/v2/hianime/category/:name", async (c) => {
  const name = c.req.param("name");
  const url  = new URL(c.req.url);
  url.pathname = "/api/category";
  url.searchParams.set("name", name);
  return categoryRouter.fetch(new Request(url.toString(), c.req.raw), c.env);
});

app.get("/api/v2/hianime/genre/:name", async (c) => {
  const name = c.req.param("name");
  const url  = new URL(c.req.url);
  url.pathname = "/api/genre";
  url.searchParams.set("name", name);
  return genreRouter.fetch(new Request(url.toString(), c.req.raw), c.env);
});

app.get("/api/v2/hianime/producer/:name", async (c) => {
  const name = c.req.param("name");
  const url  = new URL(c.req.url);
  url.pathname = "/api/producer";
  url.searchParams.set("name", name);
  return producerRouter.fetch(new Request(url.toString(), c.req.raw), c.env);
});

app.get("/api/v2/hianime/qtip/:id", async (c) => {
  const id  = c.req.param("id");
  const url = new URL(c.req.url);
  url.pathname = "/api/qtip";
  url.searchParams.set("id", id);
  return qtipRouter.fetch(new Request(url.toString(), c.req.raw), c.env);
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (c) =>
  c.json({ status: "ok", ts: new Date().toISOString() })
);

// ── Root ─────────────────────────────────────────────────────────────────────
app.get("/", (c) =>
  c.json({
    name:    "HiAnime API (Hono)",
    version: "2.0.0",
    docs:    "See README.md for endpoint reference",
    routes: [
      "GET /api/home[?raw=1]",
      "GET /api/anime?id=<slug>[&raw=1]",
      "GET /api/episodes?id=<slug>[&raw=1]",
      "GET /api/search?q=<query>[&page=1&raw=1]",
      "GET /api/search-suggestion?q=<query>",
      "GET /api/category?name=<category>[&page=1&raw=1]",
      "GET /api/genre?name=<genre>[&page=1&raw=1]",
      "GET /api/producer?name=<producer>[&page=1&raw=1]",
      "GET /api/azlist?sort=<sort>[&page=1&raw=1]",
      "GET /api/schedule[?date=YYYY-MM-DD&raw=1]",
      "GET /api/servers?episodeId=<id>",
      "GET /api/sources?serverId=<id>",
      "GET /api/qtip?id=<numericId>",
    ],
  })
);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.notFound((c) =>
  c.json({ success: false, data: null, error: "Route not found" }, 404)
);

// ── Global error handler ──────────────────────────────────────────────────────
app.onError((err, c) => {
  logger.error({ err }, "Unhandled error");
  return c.json({ success: false, data: null, error: err.message || "Internal server error" }, 500);
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "3000", 10);

serve({ fetch: app.fetch, port: PORT }, (info) => {
  logger.info(`🎌 HiAnime API (Hono) listening on http://localhost:${info.port}`);
  logger.info(`   ?raw=1 supported on: home, anime, episodes, search, category, genre, producer, azlist, schedule`);
});

export default app;
