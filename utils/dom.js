import * as cheerio from 'cheerio';

export function load(html) {
  return cheerio.load(html);
}

export function text($, selector, ctx = null) {
  const el = ctx ? $(selector, ctx) : $(selector);
  return el.first().text().trim() || null;
}

export function attr($, selector, attribute, ctx = null) {
  const el = ctx ? $(selector, ctx) : $(selector);
  return el.first().attr(attribute) || null;
}

export function each($, selector, fn) {
  const results = [];
  $(selector).each((i, el) => results.push(fn($(el), i)));
  return results;
}

export function num(str) {
  const n = parseInt(str?.trim(), 10);
  return isNaN(n) ? null : n;
}
