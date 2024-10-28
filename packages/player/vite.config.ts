import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tailwindcss from 'tailwindcss';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const scichartVersion = require('./node_modules/scichart/package.json').version;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/scichart/_wasm/scichart2d.data',
          dest: 'assets',
          rename: `scichart2d-${scichartVersion}.data`,
        },
        {
          src: 'node_modules/scichart/_wasm/scichart2d.wasm',
          dest: 'assets',
          rename: `scichart2d-${scichartVersion}.wasm`,
        },
      ],
    }),
  ],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          scichart: ['scichart'],
        },
      },
    },
  },
});
