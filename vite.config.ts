import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { mediapipe } from 'vite-plugin-mediapipe';
import clean from 'vite-plugin-clean';
import { createHtmlPlugin } from 'vite-plugin-html';
import fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  base: './',
  plugins: [
    (clean as any)({
      targetFiles: ['dist']
    }),
    mediapipe({
      "pose.js": [
        "Pose"
      ],
      "hands.js": [
        "Hands"
      ],
      "selfie_segmentation.js": [
        "SelfieSegmentation"
      ]
    }),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/@tensorflow-models', dest: 'node_modules' },
        { src: 'node_modules/@tensorflow', dest: 'node_modules' },
        { src: 'node_modules/@mediapipe', dest: 'node_modules' },
      ]
    }),
    react(),
    createHtmlPlugin({
      inject: {
        data: {
          title: pkg.build.productName,
          ownerName: pkg.build.ownerName
        }
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 10 * 1024,
    rollupOptions: {
      external: ['electron', 'electron-updater', 'electron-log']
    }
  }
})