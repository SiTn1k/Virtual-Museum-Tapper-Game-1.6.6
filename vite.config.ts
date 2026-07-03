import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Include lucide-react in pre-bundling for faster cold starts
    include: ['lucide-react'],
  },
  build: {
    // Don't auto-inject scripts - we control script order in index.html
    injectScript: false,
    // Enable CSS code splitting for better caching
    cssCodeSplit: true,
    // Increase chunk size warning limit for better visibility
    chunkSizeWarningLimit: 500,
  },
});
