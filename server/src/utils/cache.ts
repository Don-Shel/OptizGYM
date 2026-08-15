import NodeCache from 'node-cache';

// Standard TTL of 5 minutes (300 seconds)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const getFromCache = <T>(key: string): T | undefined => {
  return cache.get<T>(key);
};

export const setToCache = <T>(key: string, value: T, ttl?: number): boolean => {
  if (ttl) {
    return cache.set(key, value, ttl);
  }
  return cache.set(key, value);
};

export const removeFromCache = (key: string): number => {
  return cache.del(key);
};

export const clearCache = (): void => {
  cache.flushAll();
};

export default cache;
