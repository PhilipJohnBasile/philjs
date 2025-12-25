import { defineConfig } from 'vite';
export default defineConfig({
    build: {
        outDir: 'dist',
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
    server: {
        port: 8080,
    },
});
//# sourceMappingURL=vite.config.js.map