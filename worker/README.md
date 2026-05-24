# FilmNote Worker

Cloudflare Worker for TMDB proxying, detail aggregation, recommendation scoring, KV cache warming, and the scheduled IMDb Top100 refresh.

## Commands

```bash
npm run typecheck
npm run test
npm run deploy
```

If local Node cannot validate the Cloudflare API certificate chain but `curl` can, run deploy with the system CA bundle instead of disabling TLS verification:

```bash
NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem CLOUDFLARE_API_TOKEN=... npm run deploy
```

Do not commit API tokens or `.dev.vars` files.
