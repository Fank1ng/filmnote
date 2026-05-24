import { initSupabaseClient } from '../api/supabase.js';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function bootstrapVueApp(): void {
  initSupabaseClient();
}

export function showBootstrapError(error: unknown, root: HTMLElement): void {
  console.error('FilmNote bootstrap failed:', error);
  root.textContent = `启动失败：${errorMessage(error)}`;
  root.style.minHeight = '100vh';
  root.style.display = 'grid';
  root.style.placeItems = 'center';
  root.style.color = '#d4a853';
  root.style.background = '#0f0f0f';
}
