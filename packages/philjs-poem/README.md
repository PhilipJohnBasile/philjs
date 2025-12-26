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

## License

MIT
