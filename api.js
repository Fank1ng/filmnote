// ===== CONFIG =====
var SUPABASE_URL = 'https://rkkakwmxzipxmofgrlwa.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJra2Frd214emlweG1vZmdybHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjQ2NjUsImV4cCI6MjA5Mjk0MDY2NX0.r3L82v1z2QBmIkg2KbyD6S_dT0bAomIZ7cU4sS6vdNo';
var TMDB_IMG = 'https://image.tmdb.org/t/p/w185';
var TMDB_PROXY = 'https://filmnote.lccf1223.workers.dev';
var SESSION_KEY = '__filmnote_session';
function tmdbFetch(path, opts = {}) {
  if (TMDB_PROXY) return fetch(TMDB_PROXY + '/tmdb' + path, opts);
  return Promise.reject(new Error('TMDB proxy is not configured'));
}

var WEIGHTS = { story:0.25, character:0.20, visual:0.15, editing:0.10, sound:0.10, emotion:0.20 };
var DIM_LABELS = { story:'故事与剧本', character:'角色与表演', visual:'导演与视觉', editing:'剪辑与节奏', sound:'声音与配乐', emotion:'情感共鸣' };

// ===== SUPABASE =====
var db;
try {
  db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

} catch(e) {
  console.error('Supabase init error:', e);
  document.getElementById('authError').textContent = '初始化失败：'+e.message;
}

window.FilmNoteAPI = window.FilmNoteAPI || {};
