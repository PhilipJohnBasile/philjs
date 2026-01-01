# @philjs/poem

Poem web framework integration for PhilJS applications. Connect your Rust Poem backend with PhilJS frontend components for type-safe, high-performance full-stack development.

## Installation

```bash
npm install @philjs/poem
# or
yarn add @philjs/poem
# or
pnpm add @philjs/poem
```

**Rust (Cargo.toml):**
```toml
[dependencies]
philjs-poem = "0.1"
poem = "1.3"
```

## Basic Usage

**TypeScript:**
```tsx
import { createPoemClient, usePoemQuery } from '@philjs/poem';

const client = createPoemClient({
  baseUrl: 'http://localhost:3000',
});

function Users() {
  const { data, isLoading } = usePoemQuery('/api/users');

  if (isLoading) return <div>Loading...</div>;
  return <UserList users={data} />;
}
```

**Rust:**
```rust
use philjs_poem::{PhilJSHandler, generate_types};
use poem::{Route, Server};

#[derive(Serialize, TypeScript)]
struct User {
    id: u64,
    name: String,
}

#[handler]
async fn get_users() -> Json<Vec<User>> {
    Json(fetch_users().await)
}

fn main() {
    generate_types!("./frontend/src/types");

    let app = Route::new()
        .at("/api/users", get(get_users));
    Server::bind("0.0.0.0:3000").run(app);
}
```

## Features

- **Type Generation** - Auto-generate TypeScript types from Rust structs
- **API Client** - Type-safe API client for Poem endpoints
- **SSR Support** - Server-side rendering with Poem
- **WebSocket** - Real-time communication via WebSockets
- **File Upload** - Multipart file upload handling
- **Authentication** - JWT and session auth integration
- **OpenAPI** - Automatic OpenAPI spec generation
- **Middleware** - CORS, compression, logging middleware
- **Error Handling** - Unified error types across stack
- **Hot Reload** - Development hot reloading

## React Hooks

| Hook | Description |
|------|-------------|
| `usePoemQuery` | Fetch data from Poem endpoint |
| `usePoemMutation` | POST/PUT/DELETE mutations |
| `usePoemWebSocket` | WebSocket connection |
| `usePoemAuth` | Authentication state |

## CLI Tools

```bash
# Generate TypeScript types from Rust
npx philjs-poem generate-types

# Start development server with hot reload
npx philjs-poem dev
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./middleware, ./extractors, ./endpoints, ./responses, ./websocket, ./openapi, ./ssr
- Source files: packages/philjs-poem/src/index.ts, packages/philjs-poem/src/middleware.ts, packages/philjs-poem/src/extractors.ts, packages/philjs-poem/src/endpoints.ts, packages/philjs-poem/src/responses.ts, packages/philjs-poem/src/websocket.ts, packages/philjs-poem/src/openapi.ts, packages/philjs-poem/src/ssr.ts

### Public API
- Direct exports: AuthExtractor, AuthExtractorConfig, AuthUser, BroadcastChannel, BroadcastManager, CORSMiddleware, CORSMiddlewareConfig, CRUDOptions, CompressionMiddleware, CompressionMiddlewareConfig, CookieExtractor, DEFAULT_WS_OPTIONS, DataExtractor, EndpointBuilder, EndpointDefinition, ErrorResponse, FileResponse, FormExtractor, GeneratedRustCode, HeadManager, HeaderExtractor, HtmlResponse, HttpMethod, JsonExtractor, JsonExtractorConfig, JsonResponse, LiveViewSocketBuilder, MiddlewareAction, MiddlewareComposer, MiddlewareHandler, MultipartExtractor, MultipartFile, OAuthFlow, OpenAPIBuilder, OpenAPIDataType, OpenAPIEndpointBuilder, OpenAPINumberFormat, OpenAPIParameter, OpenAPIParameterIn, OpenAPIRequestBody, OpenAPISecurityScheme, OpenAPISpec, OpenAPIStringFormat, OperationBuilder, PathExtractor, PoemAppBuilder, PresenceEntry, PresenceState, PresenceTracker, QueryExtractor, QueryExtractorConfig, RateLimitMiddleware, RateLimitMiddlewareConfig, RedirectResponse, RouteGroup, RustHandlerOptions, RustTypeMapping, SSRCache, SSRChunk, SSRContext, SSRContextData, SSRContextExtractor, SSRDocument, SSRHead, SSRLink, SSRMiddleware, SSRMiddlewareConfig, SSRPageOptions, SSRRenderOptions, SSRRenderer, SSRResult, SecurityMiddleware, SecurityMiddlewareConfig, SecuritySchemeType, StreamResponse, TracingMiddleware, TracingMiddlewareConfig, WebSocketConfig, apiEndpoint, arraySchema, auth, booleanSchema, composeMiddleware, configureWebSocket, createBroadcastManager, createCORSMiddleware, createCompressionMiddleware, createExtractor, createHeadManager, createLiveViewSocket, createPoemApp, createPresenceTracker, createRateLimitMiddleware, createSSRCache, createSSRDocument, createSSRMiddleware, createSSRRenderer, createSecurityMiddleware, createTracingMiddleware, crud, endpoint, error, file, generateCrudAPI, generateFullRustAPI, generateRustAPI, generateRustDbService, generateRustErrorTypes, generateRustHandler, generateRustRequestStruct, generateRustResponseEnum, generateRustValidationHelpers, group, healthCheck, html, integerSchema, json, mapToRustType, numberSchema, objectSchema, openapi, operation, optionalAuth, query, readinessProbe, redirect, refSchema, renderDocument, renderToString, rustCodeGenerators, ssrContext, ssrPage, ssrPages, stream, stringSchema
- Re-exported names: // from endpoints - excluding openapi to avoid conflict
  EndpointBuilder, // from extractors - excluding json to avoid conflict
  Extractor, AuthExtractor, AuthExtractorConfig, AuthUser, CRUDOptions, CookieExtractor, DataExtractor, EndpointDefinition, FormExtractor, GeneratedRustCode, HeaderExtractor, HttpMethod, JsonExtractor, JsonExtractorConfig, MultipartExtractor, MultipartFile, OpenAPIEndpointBuilder, PathExtractor, QueryExtractor, QueryExtractorConfig, RouteGroup, RustHandlerOptions, RustTypeMapping, SSRContextData, SSRContextExtractor, SSRPageOptions, apiEndpoint, auth, createExtractor, crud, endpoint, endpointsOpenapi, extractorJson, generateCrudAPI, generateFullRustAPI, generateRustAPI, generateRustDbService, generateRustErrorTypes, generateRustHandler, generateRustRequestStruct, generateRustResponseEnum, generateRustValidationHelpers, group, healthCheck, mapToRustType, optionalAuth, query, readinessProbe, rustCodeGenerators, ssrContext, ssrPage, ssrPages
- Re-exported modules: ./endpoints.js, ./extractors.js, ./middleware.js, ./openapi.js, ./responses.js, ./ssr.js, ./types.js, ./websocket.js
<!-- API_SNAPSHOT_END -->

## License

MIT
