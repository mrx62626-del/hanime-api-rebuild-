import axios from 'axios';
import { config } from '../core/config.js';

const client = axios.create({
  timeout: config.timeout,
  headers: config.headers,
});

const apiClient = axios.create({
  timeout: config.timeout,
  headers: {
    ...config.headers,
    'Accept': 'application/json',
  },
});

export async function get(url, options = {}) {
  try {
    const isApiSite = url.includes('anikotoapi.site');
    const useClient = isApiSite ? apiClient : client;
    const res = await useClient.get(url, options);
    return res.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Request failed with status code ${error.response.status} for ${url}`);
    }
    throw error;
  }
}
