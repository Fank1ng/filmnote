import { installConfigGlobals } from './config/constants.js';
import * as coupleApi from './api/couple-api.js';
import * as entriesApi from './api/entries-api.js';
import * as listApi from './api/list-api.js';
import * as profileApi from './api/profile-api.js';
import { initSupabaseClient, installApiNamespace } from './api/supabase.js';
import { installStateNamespace } from './core/state.js';
import { installCacheNamespace } from './shared/cache.js';
import { installDomNamespace } from './shared/dom.js';
import { installScoringNamespace } from './shared/scoring.js';
import { installTmdbNamespace } from './shared/tmdb.js';
import { installUtilsNamespace } from './shared/utils.js';

const LEGACY_SCRIPTS = [
  'tmdb-cache.js?v=20260518',
  'recommend-ui.js?v=20260518',
  'app.js?v=20260523-movie-edit-restore',
];

function loadLegacyScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function bootstrap(): Promise<void> {
  installConfigGlobals();
  installApiNamespace();
  Object.assign(window.FilmNoteAPI ?? {}, {
    couple: coupleApi,
    entries: entriesApi,
    lists: listApi,
    profiles: profileApi,
  });
  installStateNamespace();
  installCacheNamespace();
  installDomNamespace();
  installScoringNamespace();
  installTmdbNamespace();
  installUtilsNamespace();

  try {
    initSupabaseClient();
  } catch (error) {
    console.error('Supabase init error:', error);
    const authError = document.getElementById('authError');
    if (authError) authError.textContent = '初始化失败：' + errorMessage(error);
  }

  window.FilmNoteRecommendUI = window.FilmNoteRecommendUI || {};

  for (const src of LEGACY_SCRIPTS) {
    await loadLegacyScript(src);
  }
}

bootstrap().catch(error => {
  console.error('FilmNote bootstrap failed:', error);
  const authError = document.getElementById('authError');
  if (authError) authError.textContent = '启动失败：' + errorMessage(error);
});
