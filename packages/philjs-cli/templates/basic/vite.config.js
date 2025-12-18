import { defineConfig } from 'vite';
import { philJSPlugin } from 'philjs-cli';
export default defineConfig({
    plugins: [philJSPlugin()],
    server: {
        port: 3000,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});
//# sourceMappingURL=vite.config.js.map