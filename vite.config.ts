import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import commonjs from '@rollup/plugin-commonjs';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'node_modules/@tensorflow', dest: 'node_modules/@tensorflow' },
        { src: 'node_modules/@mediapipe', dest: 'node_modules/@mediapipe' },
      ]
    }),
    react(),
    commonjs({
      include: /node_modules\/(@tensorflow|@mediapipe)/
    })
  ],
  build: {
    chunkSizeWarningLimit: 10 * 1024,
  }
})
