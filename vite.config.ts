import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const legacyFiles = [
  'app.js',
  'tmdb-cache.js',
  'recommend-ui.js',
  'movie-rater.html',
  '.nojekyll',
];

function copyLegacyFiles(): Plugin {
  return {
    name: 'filmnote-copy-legacy-files',
    apply: 'build',
    async closeBundle() {
      await Promise.all(
        legacyFiles.map(async file => {
          const from = resolve(__dirname, file);
          const to = resolve(__dirname, 'dist', file);
          await mkdir(dirname(to), { recursive: true });
          await copyFile(from, to);
        }),
      );
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [copyLegacyFiles()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
