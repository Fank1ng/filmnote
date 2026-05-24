const memCache = new Map<string, unknown>();
const MEM_MAX = 500;

export function cacheGet(key: string): any {
  if (!memCache.has(key)) return undefined;
  const val = memCache.get(key);
  memCache.delete(key);
  memCache.set(key, val);
  return val;
}

export function cacheSet(key: string, value: unknown): void {
  if (memCache.size >= MEM_MAX) {
    const oldestKey = memCache.keys().next().value;
    if (oldestKey !== undefined) memCache.delete(oldestKey);
  }
  memCache.set(key, value);
}

export function getMemCacheSize(): number {
  return memCache.size;
}
