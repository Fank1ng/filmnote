import { onBeforeUnmount, onMounted } from 'vue';
import { clearBrowserInterval, scheduleBrowserInterval } from '../browser.js';

export function useIntervalFn(callback: () => void, delayMs: number): void {
  let timer: number | null = null;

  onMounted(() => {
    timer = scheduleBrowserInterval(callback, delayMs);
  });

  onBeforeUnmount(() => {
    clearBrowserInterval(timer);
    timer = null;
  });
}
