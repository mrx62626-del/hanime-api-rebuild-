// ─── Helper Utilities ─────────────────────────────────────────────────────────

import { CONFIG } from "../config/config.js";

/**
 * Fetch a full HTML page with browser-like headers.
 * Used for: /anime/:slug, /watch/:slug, and any page that returns
 * full HTML (not a JSON wrapper).
 */
export async function fetchPage(url) {
  const res = await fetch(url, { headers: CONFIG.REQUEST_HEADERS });
  if (!res.ok) throw new Error(`Fetch failed [${res.status}]: ${url}`);
  return res.text();
}

/**
 * Fetch an endpoint that returns JSON { html: "…" } or { status, html: "…" }
 * and return the inner HTML string ready for Cheerio.
 *
 * This is the scraping alternative to jQuery/browser AJAX:
 * we call the endpoint server-side and parse the HTML fragment ourselves.
 *
 * Falls back to treating the entire response body as HTML if no "html" key
 * is present (some endpoints return raw HTML directly).
 */
export async function fetchHTML(url) {
  const res = await fetch(url, { headers: CONFIG.AJAX_HEADERS });
  if (!res.ok) throw new Error(`Fetch failed [${res.status}]: ${url}`);

  const contentType = res.headers.get("content-type") || "";

  // JSON wrapper: { html: "…" }  or  { status: true, html: "…" }
  if (contentType.includes("application/json") || contentType.includes("text/json")) {
    const data = await res.json();
    return data.html || data.content || "";
  }

  // Try to parse as JSON anyway (some servers omit content-type)
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return data.html || data.content || text;
  } catch (_) {
    // Response was raw HTML
    return text;
  }
}

/**
 * Fetch JSON from an endpoint and return the parsed object.
 * Only used for endpoints that return structured JSON data
 * (e.g. episode sources which returns { type, server, link }).
 */
export async function fetchJSON(url) {
  const res = await fetch(url, { headers: CONFIG.AJAX_HEADERS });
  if (!res.ok) throw new Error(`Fetch failed [${res.status}]: ${url}`);
  return res.json();
}

/**
 * Extract the anime slug-id from a full hianime URL or relative href.
 * e.g. "/anime/bleach-yaa9n" → "bleach-yaa9n"
 *      "https://hianime.re/watch/bleach-yaa9n" → "bleach-yaa9n"
 */
export function extractId(href = "") {
  return href.replace(/^.*\/(anime|watch)\//, "").split("?")[0].trim();
}

/**
 * Extract only the slug portion from a watch URL with episode query.
 * e.g. "/watch/bleach-yaa9n?ep=1" → "bleach-yaa9n"
 */
export function extractWatchId(href = "") {
  return href.replace(/^.*\/watch\//, "").split("?")[0].trim();
}

/**
 * Parse an integer query param, with a fallback default.
 */
export function intParam(val, fallback = 1) {
  const n = parseInt(val, 10);
  return isNaN(n) || n < 1 ? fallback : n;
}

/**
 * Sanitise a string from the DOM — trims whitespace, collapses internal spaces.
 */
export function clean(str = "") {
  return str.replace(/\s+/g, " ").trim();
}

/**
 * Build a standard JSON error response for Edge functions.
 */
export function errorResponse(message, status = 500) {
  return Response.json(
    { success: false, data: null, error: message },
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

/**
 * Build a standard success JSON response with optional CDN caching.
 * @param {*} data     - the payload
 * @param {number} ttl - Cache-Control max-age in seconds (0 = no-store)
 */
export function jsonResponse(data, ttl = 0) {
  const cacheHeader =
    ttl > 0
      ? `public, s-maxage=${ttl}, stale-while-revalidate=${Math.floor(ttl / 2)}`
      : "no-store";

  return Response.json(
    { success: true, data },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": cacheHeader,
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

/**
 * Parse the tick counts (sub/dub/raw episode counts) from a film card element.
 * Returns { sub, dub, raw } — all numbers or null.
 */
export function parseTicks($el, $) {
  const sub  = parseInt($el.find(".tick-sub").text().trim(), 10)  || null;
  const dub  = parseInt($el.find(".tick-dub").text().trim(), 10)  || null;
  const raw  = parseInt($el.find(".tick-eps").text().trim(), 10)  || null;
  return { sub, dub, raw };
}

/**
 * Validate and sanitise a date string (YYYY-MM-DD).
 * Returns today's date string if input is invalid.
 */
export function safeDate(dateStr = "") {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  return dateStr;
}
