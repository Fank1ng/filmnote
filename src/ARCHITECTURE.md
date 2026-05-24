# FilmNote Frontend Architecture

FilmNote is now a Vue 3 + TypeScript + Pinia application. The runtime entry is `src/main.ts`, which initializes app configuration and Supabase, mounts `App.vue`, and lets Vue own the full UI tree.

## Runtime

- `index.html` contains only the Vue root, stylesheet, Supabase UMD client, and Vite module entry.
- `src/app/bootstrap.ts` initializes frontend configuration and the Supabase client.
- `src/app/session.ts` restores Supabase auth state, manages profile/session-token checks, and refreshes Pinia data.
- `src/app/data-sync.ts` is the shared refresh path for entries, season ratings, profiles, watchlist, blocked movies, Couple state, and queue.

## State And Features

- Pinia stores are the source of truth for session, entries, lists, discover, Couple, UI state, list controls, and stats controls.
- Feature modules under `src/features/` render Vue-native search, ratings, list, discover, Couple, stats, auth, account, and import/export flows.
- API modules under `src/api/` are the only database mutation/read layer for Supabase-backed features.
- Shared UI, scoring, TMDB detail/cache helpers, media actions, and pagination live under `src/shared/`.

## Legacy Removal

The former plain-script runtime, cache shim, recommendation shim, bridge, state sync, and feature adapter layer have been removed from the runtime. New behavior should be implemented with explicit imports, Pinia state, and typed API helpers.
