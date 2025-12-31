/**
 * Vite configuration for multi-framework islands example
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteMultiFramework } from '@philjs/islands/vite-multi-framework';

export default defineConfig({
  plugins: [
    // Framework plugins
    react(),
    vue(),
    svelte(),

    // PhilJS multi-framework plugin
    viteMultiFramework({
      // Auto-detect frameworks from imports
      frameworks: ['react', 'vue', 'svelte'],

      // Islands directory
      islandsDir: 'src/islands',

      // Generate manifest for production
      generateManifest: true,

      // Split code by framework
      splitByFramework: true,

      // Auto-inject client directives
      autoInjectDirectives: true,

      // Enable debug logging
      debug: true
    })
  ],

  build: {
    // Optimize for production
    target: 'esnext',
    minify: 'esbuild',

    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-vue': ['vue'],
          'vendor-svelte': ['svelte']
        }
      }
    }
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'vue',
      'svelte'
    ]
  },

  server: {
    port: 3000,
    open: true
  }
});
