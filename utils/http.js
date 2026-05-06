// utils/http.js
import axios from 'axios';
import { config } from '../core/config.js';

const client = axios.create({
  timeout: config.timeout,
  headers: config.headers,
});

// Separate client for anikotoapi.site (JSON API)
const apiClient = axios.create({
  timeout: config.timeout,
  headers: {
    ...config.headers,
    'Accept': 'application/json',
    'Origin': 'https://anikototv.to',
    'Referer': 'https://anikototv.to/',
  },
});

export async function get(url, options = {}) {
  // Use different client based on URL
  const isApiSite = url.includes('anikotoapi.site');
  const clientToUse = isApiSite ? apiClient : client;
  const res = await clientToUse.get(url, options);
  return res.data;
}
