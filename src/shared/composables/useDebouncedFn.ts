import { onBeforeUnmount } from 'vue';
import { clearBrowserTimeout, scheduleBrowserTimeout } from '../browser.js';

export function useDebouncedFn(callback: (value: string) => void, delayMs: number): (value: string) => void {
  let timer: number | null = null;

  onBeforeUnmount(() => {
    clearBrowserTimeout(timer);
    timer = null;
  });

  return (value: string) => {
    clearBrowserTimeout(timer);
    timer = scheduleBrowserTimeout(() => callback(value), delayMs);
  };
}
