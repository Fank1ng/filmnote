# FilmNote Frontend Architecture

The frontend is migrating from a single legacy script to native ES modules.

## Current Phase

`src/main.ts` is the only HTML entrypoint. It installs shared globals for legacy compatibility, initializes Supabase, then loads the existing legacy scripts in their original order:

1. `tmdb-cache.js`
2. `recommend-ui.js`
3. `app.js`

This keeps current behavior stable while new code gains a clear module boundary.

Vite is now the development and production build path:

- `npm run dev`: local development server.
- `npm run typecheck`: TypeScript checks for the new `src/` architecture layer.
- `npm run build`: typecheck plus production bundle into `dist/`.

GitHub Pages deploys the generated `dist/` artifact.

## Module Direction

- `config/`: constants and deployment configuration.
- `api/`: Supabase and remote API access.
- `core/`: shared application state and cross-feature coordination.
- `shared/`: DOM helpers, UI helpers, cache, scoring, TMDB helpers, pure utilities.
- `features/`: business domains such as auth, ratings, list, discover, couple, stats, and import/export.

## Migration Rules

- Do not add new behavior directly to `app.js` when a suitable `src/features/*` module exists.
- Move low-risk pure functions first, then API calls, then event/render logic.
- Keep DOM ids and CSS classes stable until the feature owning them has been fully migrated.
- Prefer explicit imports for new code. Use `window.FilmNote*` only for temporary legacy compatibility.
- Keep TypeScript coverage focused on `src/` until legacy behavior has been migrated out of `app.js`.
