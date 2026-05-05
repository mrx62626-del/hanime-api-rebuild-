import * as anikai from '../providers/anikai/index.js';
import * as hianime from '../providers/hianime/index.js';
import { config } from './config.js';

const providers = {
  anikai,
  hianime,
};

export function getProvider(name) {
  const key = name || config.defaultProvider;
  const provider = providers[key];
  if (!provider) throw new Error(`Provider "${key}" not found. Available: ${Object.keys(providers).join(', ')}`);
  return provider;
}

export async function getProviderWithFallback(name) {
  const order = name ? [name] : [config.defaultProvider, ...Object.keys(providers).filter(p => p !== config.defaultProvider)];
  for (const key of order) {
    if (providers[key]) return { provider: providers[key], name: key };
  }
  throw new Error('No providers available');
}

export function listProviders() {
  return Object.keys(providers);
}
