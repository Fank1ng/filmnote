import { onBeforeUnmount, onMounted } from 'vue';

export function useDocumentEvent<K extends keyof DocumentEventMap>(
  type: K,
  listener: (event: DocumentEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): void {
  onMounted(() => {
    document.addEventListener(type, listener, options);
  });
  onBeforeUnmount(() => {
    document.removeEventListener(type, listener, options);
  });
}
