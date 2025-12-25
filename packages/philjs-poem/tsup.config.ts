import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    middleware: 'src/middleware.ts',
    extractors: 'src/extractors.ts',
    endpoints: 'src/endpoints.ts',
    responses: 'src/responses.ts',
    websocket: 'src/websocket.ts',
    openapi: 'src/openapi.ts',
    ssr: 'src/ssr.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['philjs-core', 'philjs-ssr', 'philjs-liveview'],
});
