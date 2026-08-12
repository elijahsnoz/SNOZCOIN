import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// This app builds into ../assets/universe-build and is loaded by universe.html
// via a plain <script type="module"> tag — no dev server involved in production,
// no bundler knowledge required by the rest of the (zero-build) static site.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../assets/universe-build',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'universe.js',
        chunkFileNames: 'universe-[name].js',
        assetFileNames: 'universe-[name][extname]',
      },
    },
  },
})
