export function downloadJsonFile(payload: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function scrollToPageTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function appRedirectUrl(): string {
  return window.location.origin + window.location.pathname;
}

export function scheduleBrowserTimeout(callback: () => void, delayMs: number): number {
  return window.setTimeout(callback, delayMs);
}

export function clearBrowserTimeout(timer: number | null): void {
  if (timer) window.clearTimeout(timer);
}

export function scheduleBrowserInterval(callback: () => void, delayMs: number): number {
  return window.setInterval(callback, delayMs);
}

export function clearBrowserInterval(timer: number | null): void {
  if (timer) window.clearInterval(timer);
}

export function highlightElementById(id: string, className: string, durationMs: number): boolean {
  const element = document.getElementById(id);
  if (!element) return false;
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.classList.add(className);
  scheduleBrowserTimeout(() => element.classList.remove(className), durationMs);
  return true;
}

export const browserSessionStorage = {
  get(key: string): string | null {
    return sessionStorage.getItem(key);
  },
  set(key: string, value: string): void {
    sessionStorage.setItem(key, value);
  },
  remove(key: string): void {
    sessionStorage.removeItem(key);
  },
};

export function onDocumentVisible(callback: () => void): () => void {
  const onVisibility = () => {
    if (!document.hidden) callback();
  };
  document.addEventListener('visibilitychange', onVisibility);
  return () => document.removeEventListener('visibilitychange', onVisibility);
}
