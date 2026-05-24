import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig, type Plugin } from 'vite';

const staticFiles = [
  'movie-rater.html',
  '.nojekyll',
];

function copyStaticFiles(): Plugin {
  return {
    name: 'filmnote-copy-static-files',
    apply: 'build',
    async closeBundle() {
      await Promise.all(
        staticFiles.map(async file => {
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
  plugins: [vue(), copyStaticFiles()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
