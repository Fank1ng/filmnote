import assert from 'node:assert/strict';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { build } from 'esbuild';
import { Miniflare } from 'miniflare';

async function createWorker() {
  const outdir = join(process.cwd(), '.mf-test', `worker-smoke-${process.pid}-${Date.now()}`);
  const outfile = join(outdir, 'worker.mjs');
  await mkdir(outdir, { recursive: true });
  await build({
    entryPoints: ['src/index.ts'],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    target: 'es2022',
    sourcemap: false,
  });
  const mf = new Miniflare({
    modules: true,
    scriptPath: outfile,
    bindings: {
      ALLOWED_ORIGINS: 'null,http://localhost:8787',
      TMDB_API_KEY: 'test-key',
    },
    kvNamespaces: ['TMDB_CACHE'],
  });
  return {
    mf,
    async dispose() {
      await mf.dispose();
      await rm(outdir, { recursive: true, force: true });
    },
  };
}

test('Worker basic routes respond without TMDB network access', async () => {
  const worker = await createWorker();
  try {
    const health = await worker.mf.dispatchFetch('http://localhost/health');
    assert.equal(health.status, 200);
    const healthJson = await health.json();
    assert.equal(healthJson.status, 'ok');
    assert.equal(healthJson.kvConfigured, true);

    const preflight = await worker.mf.dispatchFetch('http://localhost/search', { method: 'OPTIONS' });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');

    const missingSearch = await worker.mf.dispatchFetch('http://localhost/search');
    assert.equal(missingSearch.status, 400);
    assert.equal((await missingSearch.json()).error, 'Missing query');

    const invalidType = await worker.mf.dispatchFetch('http://localhost/search?q=test&type=person');
    assert.equal(invalidType.status, 400);
    assert.equal((await invalidType.json()).error, 'Invalid search type');

    const missingRecommend = await worker.mf.dispatchFetch('http://localhost/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(missingRecommend.status, 400);
    assert.equal((await missingRecommend.json()).error, 'Missing entries or userId');

    const tooLarge = await worker.mf.dispatchFetch('http://localhost/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'x'.repeat(256 * 1024 + 1),
    });
    assert.equal(tooLarge.status, 413);

    const topRated = await worker.mf.dispatchFetch('http://localhost/toprated');
    assert.equal(topRated.status, 200);
    const topRatedJson = await topRated.json();
    assert.equal(Array.isArray(topRatedJson.results), true);
    assert.equal(topRatedJson.results.length >= 100, true);
  } finally {
    await worker.dispose();
  }
});
