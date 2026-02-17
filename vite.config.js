import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@crestron/ch5-crcomlib/build_bundles/umd/cr-com-lib.js',
          dest: '',
        },
        {
          src: 'node_modules/@crestron/ch5-webxpanel/dist/umd/index.js',
          dest: '',
        },
        {
          src: 'node_modules/@crestron/ch5-webxpanel/dist/umd/d4412f0cafef4f213591.worker.js',
          dest: '',
        },
        {
          src: 'config/contract.cse2j',
          dest: 'config',
        },
      ],
    }),
  ],
});
