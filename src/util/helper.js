// ─── Helper Utilities ─────────────────────────────────────────────────────────

import axios from "axios";
import { CONFIG } from "../config/config.js";
import { logger } from "./logger.js";

// ── Axios instances ────────────────────────────────────────────────────────────

/** Axios instance for full HTML page requests (browser-like headers). */
const pageClient = axios.create({
  headers:        CONFIG.REQUEST_HEADERS,
  timeout:        15_000,
  // Decompress gzip/br automatically
  decompress:     true,
  // Don't throw on non-2xx so we can inspect the status ourselves
  validateStatus: (s) => s < 600,
});

/** Axios instance for AJAX/XHR endpoints. */
const ajaxClient = axios.create({
  headers:        CONFIG.AJAX_HEADERS,
  timeout:        10_000,
  decompress:     true,
  validateStatus: (s) => s < 600,
});

// Shared response interceptor for error logging
function okOrThrow(res, url) {
  if (res.status >= 400) {
    throw new Error(`Fetch failed [${res.status}]: ${url}`);
  }
  return res;
}

// ── Public fetch helpers ───────────────────────────────────────────────────────

/**
 * Fetch a full HTML page with browser-like headers.
 * Returns the raw HTML string.
 */
export async function fetchPage(url) {
  logger.debug({ url }, "fetchPage");
  const res = await pageClient.get(url, { responseType: "text" });
  okOrThrow(res, url);
  return res.data;
}

/**
 * Fetch an endpoint that returns JSON { html: "…" } or raw HTML.
 * Returns an HTML string ready for Cheerio.
 */
export async function fetchHTML(url) {
  logger.debug({ url }, "fetchHTML");
  const res = await ajaxClient.get(url);
  okOrThrow(res, url);

  // If axios already parsed it as an object (JSON content-type)
  if (typeof res.data === "object" && res.data !== null) {
    return res.data.html || res.data.content || "";
  }

  // Try to parse as JSON anyway (some servers omit content-type)
  const text = String(res.data);
  try {
    const parsed = JSON.parse(text);
    return parsed.html || parsed.content || text;
  } catch {
    return text;
  }
}

/**
 * Fetch JSON from an endpoint and return the parsed object.
 */
export async function fetchJSON(url) {
  logger.debug({ url }, "fetchJSON");
  const res = await ajaxClient.get(url);
  okOrThrow(res, url);
  return typeof res.data === "object" ? res.data : JSON.parse(res.data);
}

/**
 * Fetch raw HTML bytes from a URL (for the ?raw=1 feature).
 * Returns the complete HTML string exactly as received.
 */
export async function fetchRawHTML(url) {
  logger.debug({ url }, "fetchRawHTML");
  const res = await pageClient.get(url, { responseType: "text" });
  okOrThrow(res, url);
  return res.data;
}

// ── String / DOM helpers ───────────────────────────────────────────────────────

/** Extract the anime slug-id from a full hianime URL or relative href. */
export function extractId(href = "") {
  return href.replace(/^.*\/(anime|watch)\//, "").split("?")[0].trim();
}

/** Extract only the slug from a watch URL with episode query. */
export function extractWatchId(href = "") {
  return href.replace(/^.*\/watch\//, "").split("?")[0].trim();
}

/** Parse an integer query param, with a fallback default. */
export function intParam(val, fallback = 1) {
  const n = parseInt(val, 10);
  return isNaN(n) || n < 1 ? fallback : n;
}

/** Sanitise a string from the DOM — trims whitespace, collapses internal spaces. */
export function clean(str = "") {
  return str.replace(/\s+/g, " ").trim();
}

/**
 * Parse the tick counts (sub/dub/raw episode counts) from a film card element.
 * Returns { sub, dub, raw } — all numbers or null.
 */
export function parseTicks($el, $) {
  const sub = parseInt($el.find(".tick-sub").text().trim(), 10) || null;
  const dub = parseInt($el.find(".tick-dub").text().trim(), 10) || null;
  const raw = parseInt($el.find(".tick-eps").text().trim(), 10) || null;
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

// ── Hono response helpers ─────────────────────────────────────────────────────
// These return plain objects; Hono context methods (c.json / c.text) are used
// directly in route handlers, so helpers here just build the payload shape.

/**
 * Standard success payload.
 */
export function okPayload(data) {
  return { success: true, data };
}

/**
 * Standard error payload.
 */
export function errPayload(message) {
  return { success: false, data: null, error: message };
}

/**
 * Build Cache-Control header value.
 */
export function cacheControl(ttl = 0) {
  if (ttl <= 0) return "no-store";
  return `public, s-maxage=${ttl}, stale-while-revalidate=${Math.floor(ttl / 2)}`;
}
