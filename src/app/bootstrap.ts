import { initSupabaseClient } from '../api/supabase.js';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function bootstrapVueApp(): void {
  try {
    initSupabaseClient();
  } catch (error) {
    console.error('Supabase init error:', error);
    const authError = document.getElementById('authError');
    if (authError) authError.textContent = '初始化失败：' + errorMessage(error);
  }
}

export function showBootstrapError(error: unknown): void {
  console.error('FilmNote bootstrap failed:', error);
  const authError = document.getElementById('authError');
  if (authError) authError.textContent = '启动失败：' + errorMessage(error);
}
