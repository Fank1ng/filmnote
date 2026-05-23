export function getJsonCache<T = unknown>(key: string, fallback: T | null = null): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn('Cache read failed:', key, error);
    return fallback;
  }
}

export function setJsonCache(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('Cache write failed:', key, error);
    return false;
  }
}

export function installCacheNamespace(target: Window = window): void {
  target.FilmNoteCache = {
    getJsonCache,
    setJsonCache,
  };
}
