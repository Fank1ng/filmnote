export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rkkakwmxzipxmofgrlwa.supabase.co';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJra2Frd214emlweG1vZmdybHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNjQ2NjUsImV4cCI6MjA5Mjk0MDY2NX0.r3L82v1z2QBmIkg2KbyD6S_dT0bAomIZ7cU4sS6vdNo';
export const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';
export const TMDB_PROXY = import.meta.env.VITE_TMDB_PROXY || 'https://filmnote.lccf1223.workers.dev';
export const SESSION_KEY = '__filmnote_session';

export const WEIGHTS = {
  story: 0.25,
  character: 0.20,
  visual: 0.15,
  editing: 0.10,
  sound: 0.10,
  emotion: 0.20,
} as const;

export const DIM_LABELS = {
  story: '故事与剧本',
  character: '角色与表演',
  visual: '导演与视觉',
  editing: '剪辑与节奏',
  sound: '声音与配乐',
  emotion: '情感共鸣',
} as const;

export type RatingDim = keyof typeof WEIGHTS;
