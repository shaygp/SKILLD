import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'inject-buffer-global',
      transformIndexHtml(html) {
        const inline = `import { Buffer as B } from 'buffer'; import P from 'process'; (globalThis).Buffer = (globalThis).Buffer || B; (globalThis).global = (globalThis).global || globalThis; (globalThis).process = (globalThis).process || P;`;
        return html.replace(
          '<head>',
          `<head>\n    <script type="module">${inline}</script>`,
        );
      },
    },
  ],
  server: {
    proxy: {
      '/superteam-api': {
        target: 'https://superteam.fun',
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/superteam-api/, '/api'),
      },
    },
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: [
      { find: 'buffer', replacement: 'buffer' },
      { find: 'events', replacement: 'events' },
      { find: 'stream', replacement: 'stream-browserify' },
      { find: 'crypto', replacement: 'crypto-browserify' },
      { find: 'util', replacement: 'util' },
      { find: /^process$/, replacement: 'process/browser' },
    ],
  },
  optimizeDeps: {
    include: [
      '@solana/web3.js',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-react-ui',
      '@solana/wallet-adapter-wallets',
      '@bonfida/spl-name-service',
      '@magicblock-labs/ephemeral-rollups-sdk',
      'sas-lib',
      'gill',
      'buffer',
      'events',
      'process',
      'stream-browserify',
      'crypto-browserify',
      'util',
    ],
  },
});
