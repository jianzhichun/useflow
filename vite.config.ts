import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from "path";
import { mediapipe } from 'vite-plugin-mediapipe';


const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  base: './',
  plugins: [
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
    react()
  ],
  build: {
    chunkSizeWarningLimit: 10 * 1024,
  }
})