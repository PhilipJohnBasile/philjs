# @philjs/go

High-performance Go server adapter for PhilJS applications with SSR, edge functions, and API route support.

## Introduction

`@philjs/go` bridges the gap between your PhilJS frontend and a high-performance Go backend. It provides seamless integration for server-side rendering, API routes, static file serving, and WebSocket support - all powered by Go's exceptional performance characteristics.

The package includes:
- A TypeScript API for configuring and managing Go servers
- Code generation tools that convert TypeScript server functions to Go handlers
- A CLI for initializing, building, and running Go projects
- Built-in middleware for logging, CORS, rate limiting, and more

## Installation

```bash
npm install @philjs/go
# or
pnpm add @philjs/go
```

**Prerequisites:**
- Go 1.22 or later installed on your system
- Node.js 24 or later

## Features

### Server-Side Rendering (SSR)

Render your PhilJS components on the server for optimal performance and SEO:

```typescript
import { createGoServer } from '@philjs/go';

const server = await createGoServer({
  port: 3000,
  ssr: true,
  static: './dist',
});
```

The Go server handles SSR by communicating with the PhilJS runtime to render components and hydrate them on the client.

### Edge Function Support

Deploy to edge environments like Cloudflare Workers with edge-compatible mode:

```typescript
const server = await createGoServer({
  port: 3000,
  edge: true,  // Enables edge runtime compatibility
  ssr: true,
});
```

### API Routes

Define API routes in TypeScript that get compiled to Go handlers:

```typescript
// src/server/users/[id].ts
export async function GET(ctx: GoContext): Promise<GoResponse> {
  const { id } = ctx.request.params;
  // Handler logic here
  return {
    status: 200,
    body: { id, name: 'User' },
  };
}

export async function PUT(ctx: GoContext): Promise<GoResponse> {
  const { id } = ctx.request.params;
  const body = ctx.request.body;
  // Update logic here
  return {
    status: 200,
    body: { id, ...body },
  };
}
```

### Static File Serving

Serve static assets with automatic compression and caching:

```typescript
const server = await createGoServer({
  port: 3000,
  static: './dist',       // Static files directory
  compress: true,         // Enable gzip/brotli compression
});
```

### WebSocket Support

The Go server supports WebSocket connections for real-time applications. Configure CORS settings to enable WebSocket origins:

```typescript
const server = await createGoServer({
  port: 3000,
  cors: {
    origins: ['http://localhost:5173'],
    credentials: true,
  },
});
```

## Server Configuration

### GoServerConfig

The main configuration interface for the Go server:

```typescript
interface GoServerConfig {
  // Server port (default: 3000)
  port?: number;

  // Host to bind to (default: "0.0.0.0")
  host?: string;

  // Enable SSR (default: true)
  ssr?: boolean;

  // Static files directory
  static?: string;

  // API routes directory
  apiDir?: string;

  // Enable compression (default: true)
  compress?: boolean;

  // CORS configuration
  cors?: CorsConfig | boolean;

  // TLS configuration for HTTPS
  tls?: TlsConfig;

  // Request timeout in milliseconds (default: 30000)
  timeout?: number;

  // Maximum request body size (default: "10mb")
  maxBodySize?: string;

  // Enable HTTP/2 (default: true)
  http2?: boolean;

  // Edge runtime mode (Cloudflare Workers compatible)
  edge?: boolean;
}
```

### CorsConfig

Configure Cross-Origin Resource Sharing:

```typescript
interface CorsConfig {
  // Allowed origins (e.g., ["https://example.com"])
  origins?: string[];

  // Allowed HTTP methods
  methods?: string[];

  // Allowed headers
  headers?: string[];

  // Allow credentials (cookies, auth headers)
  credentials?: boolean;

  // Preflight cache duration in seconds
  maxAge?: number;
}
```

### TlsConfig

Enable HTTPS with TLS certificates:

```typescript
interface TlsConfig {
  cert: string;  // Path to certificate file
  key: string;   // Path to private key file
}
```

### Complete Configuration Example

```typescript
import { createGoServer, GoServerConfig } from '@philjs/go';

const config: GoServerConfig = {
  port: 8080,
  host: '0.0.0.0',
  ssr: true,
  static: './dist/client',
  apiDir: './src/server',
  compress: true,
  http2: true,
  timeout: 60000,
  maxBodySize: '50mb',
  cors: {
    origins: ['https://myapp.com', 'https://admin.myapp.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    headers: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
    maxAge: 86400,
  },
  tls: {
    cert: './certs/server.crt',
    key: './certs/server.key',
  },
};

const server = await createGoServer(config);
```

## API Reference

### createGoServer()

Creates and starts a Go server with the specified configuration.

```typescript
import { createGoServer } from '@philjs/go';

const server = await createGoServer({
  port: 3000,
  ssr: true,
  static: './dist',
});

// Server methods
server.isRunning();   // Check if server is running
await server.stop();  // Stop the server gracefully
await server.restart(); // Restart the server
```

### GoServer Class

The server instance provides lifecycle management:

```typescript
import { GoServer } from '@philjs/go';

const server = new GoServer({
  port: 3000,
  ssr: true,
});

// Start the server
await server.start();

// Check status
console.log(server.isRunning()); // true

// Graceful shutdown
await server.stop();

// Restart
await server.restart();
```

### buildGoServer()

Build the Go server binary for deployment:

```typescript
import { buildGoServer } from '@philjs/go';

const outputPath = await buildGoServer({
  outDir: './dist/go',
  goos: 'linux',      // Target OS: 'linux' | 'darwin' | 'windows'
  goarch: 'amd64',    // Target architecture: 'amd64' | 'arm64' | 'arm'
  mode: 'release',    // Build mode: 'debug' | 'release'
  cgo: false,         // Enable CGO (default: false)
  docker: true,       // Generate Docker image
  flags: ['-v'],      // Additional Go build flags
});

console.log(`Binary built at: ${outputPath}`);
```

### initGoProject()

Initialize a new Go project for PhilJS:

```typescript
import { initGoProject } from '@philjs/go';

await initGoProject('./my-app', {
  module: 'github.com/myuser/my-app',
  goVersion: '1.22',
  server: {
    port: 3000,
    ssr: true,
  },
});
```

### checkGoInstalled()

Verify Go installation:

```typescript
import { checkGoInstalled } from '@philjs/go';

const { installed, version } = await checkGoInstalled();
if (installed) {
  console.log(`Go ${version} is installed`);
} else {
  console.error('Go is not installed');
}
```

## Code Generation

The package includes powerful code generation that converts TypeScript server functions to idiomatic Go code.

### generateGoCode()

Generate Go handlers, types, and middleware from TypeScript:

```typescript
import { generateGoCode } from '@philjs/go/codegen';

await generateGoCode({
  srcDir: './src/server',     // TypeScript source directory
  outDir: './go',             // Go output directory
  module: 'github.com/myuser/my-app',
  router: true,               // Generate router code
  handlers: true,             // Generate handler stubs
  types: true,                // Generate Go types from TypeScript
  middleware: true,           // Generate middleware
  database: true,             // Generate database helpers
  dbDriver: 'postgres',       // Database driver: 'postgres' | 'mysql' | 'sqlite'
});
```

### watchAndGenerate()

Watch for changes and regenerate code automatically:

```typescript
import { watchAndGenerate } from '@philjs/go/codegen';

await watchAndGenerate({
  srcDir: './src/server',
  outDir: './go',
  module: 'github.com/myuser/my-app',
});
```

### Generated Code Structure

After running code generation, you get a complete Go project:

```
go/
  go.mod              # Go module file
  routes.go           # Router with all routes registered
  handlers/
    user_handlers.go  # Generated handlers for each resource
    handlers.go       # Handler index file
  types/
    types.go          # Go structs from TypeScript interfaces
  middleware/
    recovery.go       # Panic recovery middleware
    logger.go         # Request logging middleware
    cors.go           # CORS handling middleware
    validator.go      # Request validation middleware
    request_id.go     # Request ID tracking
    rate_limiter.go   # Rate limiting middleware
  db/
    db.go             # Database connection management
    query_builder.go  # Query builder helpers
  response/
    response.go       # JSON response helpers
```

## Type Definitions

### GoContext

The context object passed to handlers:

```typescript
interface GoContext {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: unknown;
    params: Record<string, string>;  // Path parameters
    query: Record<string, string>;   // Query parameters
  };
  env: Record<string, string>;  // Environment variables
}
```

### GoResponse

The response object returned from handlers:

```typescript
interface GoResponse {
  status?: number;                    // HTTP status code
  headers?: Record<string, string>;   // Response headers
  body?: unknown;                     // Response body (JSON serializable)
}
```

### GoRoute

Route definition:

```typescript
interface GoRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  path: string;
  handler: string;
}
```

### GoProjectConfig

Project configuration for initialization:

```typescript
interface GoProjectConfig {
  module: string;              // Go module name
  goVersion?: string;          // Go version (default: "1.22")
  server?: GoServerConfig;     // Server configuration
  build?: GoBuildOptions;      // Build configuration
  dependencies?: Record<string, string>;  // Additional Go dependencies
}
```

### GoBuildOptions

Build configuration:

```typescript
interface GoBuildOptions {
  outDir?: string;             // Output directory (default: "./dist/go")
  goos?: 'linux' | 'darwin' | 'windows';  // Target OS
  goarch?: 'amd64' | 'arm64' | 'arm';     // Target architecture
  mode?: 'debug' | 'release';  // Build mode (default: "release")
  cgo?: boolean;               // Enable CGO (default: false)
  flags?: string[];            // Additional build flags
  docker?: boolean;            // Generate Docker image
}
```

## CLI Usage

The package provides a CLI tool for common operations:

### Initialize a New Project

```bash
# Initialize in current directory
philjs-go init

# Initialize in a specific directory
philjs-go init my-app

# Specify module name
philjs-go init my-app --module github.com/myuser/my-app
```

### Development Server

```bash
# Start development server on default port
philjs-go dev

# Specify port and host
philjs-go dev --port 8080 --host localhost

# Watch mode with hot reload
philjs-go dev --watch
```

### Build for Production

```bash
# Basic build
philjs-go build

# Build with custom output directory
philjs-go build --output ./build

# Build Docker image
philjs-go build --docker
```

### Generate Go Code

```bash
# One-time generation
philjs-go generate

# Watch mode for continuous generation
philjs-go generate --watch

# Specify module name
philjs-go generate --module github.com/myuser/my-app
```

### CLI Options Reference

```
Usage:
  philjs-go <command> [options]

Commands:
  init [dir]     Initialize a new Go project
  build          Build the Go server binary
  dev            Start development server with hot reload
  generate       Generate Go code from server functions

Options:
  -h, --help     Show help message
  -p, --port     Server port (default: 3000)
  --host         Server host (default: 0.0.0.0)
  -o, --output   Output directory (default: ./dist/go)
  -m, --module   Go module name
  -w, --watch    Watch for changes
  --docker       Build Docker image
```

## Integration with PhilJS Apps

### Project Setup

1. Initialize your PhilJS project with Go support:

```bash
# Create PhilJS app
pnpm create philjs my-app
cd my-app

# Add Go support
pnpm add @philjs/go
philjs-go init --module github.com/myuser/my-app
```

2. Configure your `philjs.config.ts`:

```typescript
import { defineConfig } from '@philjs/build';

export default defineConfig({
  server: {
    adapter: '@philjs/go',
    port: 3000,
    ssr: true,
  },
});
```

### Server Function Pattern

Create server functions in `src/server/` that get compiled to Go:

```typescript
// src/server/api/users/index.ts
import type { GoContext, GoResponse } from '@philjs/go';

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

// GET /api/users - List users
export async function GET(ctx: GoContext): Promise<GoResponse> {
  const { page = '1', limit = '20' } = ctx.request.query;

  return {
    status: 200,
    body: {
      data: [],
      meta: { page: parseInt(page), limit: parseInt(limit) },
    },
  };
}

// POST /api/users - Create user
export async function POST(ctx: GoContext): Promise<GoResponse> {
  const body = ctx.request.body as CreateUserRequest;

  return {
    status: 201,
    body: {
      id: 1,
      name: body.name,
      email: body.email,
      createdAt: new Date(),
    },
  };
}
```

```typescript
// src/server/api/users/[id].ts
import type { GoContext, GoResponse } from '@philjs/go';

// GET /api/users/:id - Get single user
export async function GET(ctx: GoContext): Promise<GoResponse> {
  const { id } = ctx.request.params;

  return {
    status: 200,
    body: { id: parseInt(id), name: 'User' },
  };
}

// PUT /api/users/:id - Update user
export async function PUT(ctx: GoContext): Promise<GoResponse> {
  const { id } = ctx.request.params;
  const body = ctx.request.body;

  return {
    status: 200,
    body: { id: parseInt(id), ...body },
  };
}

// DELETE /api/users/:id - Delete user
export async function DELETE(ctx: GoContext): Promise<GoResponse> {
  const { id } = ctx.request.params;

  return {
    status: 200,
    body: { deleted: true, id: parseInt(id) },
  };
}
```

### Generated Go Handlers

The code generator creates production-ready Go handlers:

```go
// handlers/user_handlers.go (generated)
package handlers

import (
    "context"
    "database/sql"
    "encoding/json"
    "net/http"
    "strconv"
    "time"

    "github.com/myuser/my-app/db"
    "github.com/myuser/my-app/response"
    "github.com/myuser/my-app/types"
    "github.com/go-playground/validator/v10"
)

var validate = validator.New()

// POST_api_users handles POST /api/users
func POST_api_users(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
    defer cancel()

    // Parse request body
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        response.Error(w, http.StatusBadRequest, "INVALID_JSON", "Invalid request body")
        return
    }

    // Validate request
    if err := validate.Struct(req); err != nil {
        response.ValidationError(w, err)
        return
    }

    // Insert into database
    query := `
        INSERT INTO users (name, email, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING *
    `

    var result User
    err := db.Get().GetContext(ctx, &result, query, req.Name, req.Email)
    if err != nil {
        response.Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to create user")
        return
    }

    response.JSON(w, http.StatusCreated, result)
}

// GET_api_users_id handles GET /api/users/:id
func GET_api_users_id(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
    defer cancel()

    // Parse path parameter
    idStr := r.PathValue("id")
    id, err := strconv.ParseInt(idStr, 10, 64)
    if err != nil {
        response.Error(w, http.StatusBadRequest, "INVALID_ID", "Invalid id format")
        return
    }

    // Query database
    var result User
    query := `SELECT * FROM users WHERE id = $1`

    err = db.Get().GetContext(ctx, &result, query, id)
    if err != nil {
        if err == sql.ErrNoRows {
            response.Error(w, http.StatusNotFound, "NOT_FOUND", "User not found")
            return
        }
        response.Error(w, http.StatusInternalServerError, "DB_ERROR", "Failed to fetch user")
        return
    }

    response.JSON(w, http.StatusOK, result)
}
```

### SSR Integration

For SSR, the Go server renders PhilJS components:

```typescript
// philjs.config.ts
import { defineConfig } from '@philjs/build';

export default defineConfig({
  ssr: {
    adapter: '@philjs/go',
    streaming: true,  // Enable streaming SSR
  },
});
```

The Go server receives SSR requests and returns rendered HTML:

```go
// Generated SSR handler
func handleSSR(w http.ResponseWriter, r *http.Request) {
    result, err := ssr.Render(r.URL.Path, ssr.RenderOptions{
        Props: extractProps(r),
        Streaming: true,
    })

    if err != nil {
        http.Error(w, "SSR Error", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "text/html; charset=utf-8")
    w.Write([]byte(result.HTML))
}
```

## Examples

### Basic REST API

```typescript
// src/server/api/posts/index.ts
import type { GoContext, GoResponse } from '@philjs/go';

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreatePostRequest {
  title: string;
  content: string;
  authorId: number;
}

interface PostQuery {
  page?: number;
  limit?: number;
  search?: string;
  authorId?: number;
}

export async function GET(ctx: GoContext): Promise<GoResponse> {
  const query = ctx.request.query as unknown as PostQuery;

  return {
    status: 200,
    body: {
      data: [],
      meta: {
        page: query.page || 1,
        limit: query.limit || 20,
        total: 0,
      },
    },
  };
}

export async function POST(ctx: GoContext): Promise<GoResponse> {
  const body = ctx.request.body as CreatePostRequest;

  if (!body.title || !body.content) {
    return {
      status: 400,
      body: { error: 'Title and content are required' },
    };
  }

  return {
    status: 201,
    body: {
      id: 1,
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}
```

### Authentication Middleware

Create custom middleware in your Go project:

```go
// go/middleware/auth.go
package middleware

import (
    "context"
    "net/http"
    "strings"

    "github.com/myuser/my-app/response"
)

type contextKey string

const UserIDKey contextKey = "user_id"

func Auth() func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            authHeader := r.Header.Get("Authorization")
            if authHeader == "" {
                response.Unauthorized(w, "Missing authorization header")
                return
            }

            parts := strings.SplitN(authHeader, " ", 2)
            if len(parts) != 2 || parts[0] != "Bearer" {
                response.Unauthorized(w, "Invalid authorization format")
                return
            }

            token := parts[1]
            userID, err := validateToken(token)
            if err != nil {
                response.Unauthorized(w, "Invalid token")
                return
            }

            ctx := context.WithValue(r.Context(), UserIDKey, userID)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}

func GetUserID(ctx context.Context) (int64, bool) {
    userID, ok := ctx.Value(UserIDKey).(int64)
    return userID, ok
}

func validateToken(token string) (int64, error) {
    // Implement your token validation logic
    return 1, nil
}
```

### Database Transactions

Use the generated database helpers for transactions:

```go
// handlers/order_handlers.go
package handlers

import (
    "context"
    "net/http"
    "time"

    "github.com/jmoiron/sqlx"
    "github.com/myuser/my-app/db"
    "github.com/myuser/my-app/response"
)

func POST_api_orders(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
    defer cancel()

    var req CreateOrderRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        response.BadRequest(w, "Invalid request body")
        return
    }

    var orderID int64

    err := db.Transaction(ctx, func(tx *sqlx.Tx) error {
        // Create order
        err := tx.QueryRowxContext(ctx,
            `INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id`,
            req.UserID, req.Total,
        ).Scan(&orderID)
        if err != nil {
            return err
        }

        // Create order items
        for _, item := range req.Items {
            _, err = tx.ExecContext(ctx,
                `INSERT INTO order_items (order_id, product_id, quantity, price)
                 VALUES ($1, $2, $3, $4)`,
                orderID, item.ProductID, item.Quantity, item.Price,
            )
            if err != nil {
                return err
            }

            // Update inventory
            _, err = tx.ExecContext(ctx,
                `UPDATE products SET stock = stock - $1 WHERE id = $2`,
                item.Quantity, item.ProductID,
            )
            if err != nil {
                return err
            }
        }

        return nil
    })

    if err != nil {
        response.InternalError(w, "Failed to create order")
        return
    }

    response.Created(w, map[string]interface{}{
        "id": orderID,
    })
}
```

### Full Application Example

Complete setup for a production application:

```typescript
// philjs.config.ts
import { defineConfig } from '@philjs/build';

export default defineConfig({
  server: {
    adapter: '@philjs/go',
    port: process.env.PORT || 3000,
    ssr: true,
  },
  build: {
    outDir: './dist',
  },
});
```

```typescript
// src/server/index.ts
import { createGoServer } from '@philjs/go';

const server = await createGoServer({
  port: parseInt(process.env.PORT || '3000'),
  host: '0.0.0.0',
  ssr: true,
  static: './dist/client',
  compress: true,
  http2: true,
  timeout: 30000,
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['*'],
    credentials: true,
  },
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await server.stop();
  process.exit(0);
});
```

```bash
# Development workflow
pnpm dev              # Start PhilJS dev server
philjs-go generate -w # Watch and generate Go code
philjs-go dev         # Start Go server

# Production build
pnpm build            # Build PhilJS app
philjs-go generate    # Generate Go code
philjs-go build       # Build Go binary

# Docker deployment
philjs-go build --docker
docker run -p 3000:3000 philjs-server
```

## Related Packages

- [@philjs/core](../core/overview.md) - Core PhilJS functionality
- [@philjs/ssr](../ssr/overview.md) - Server-side rendering utilities
- [@philjs/api](../api/overview.md) - API route handling
- [@philjs/adapters](../adapters/overview.md) - Server adapters for various platforms
