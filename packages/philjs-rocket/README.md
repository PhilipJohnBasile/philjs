# @philjs/rocket

Rocket web framework integration for PhilJS applications. Seamlessly connect Rust Rocket backends with PhilJS frontend components for full-stack type safety.

## Installation

```bash
npm install @philjs/rocket
# or
yarn add @philjs/rocket
# or
pnpm add @philjs/rocket
```

**Rust (Cargo.toml):**
```toml
[dependencies]
philjs-rocket = "0.1"
rocket = "0.5"
```

## Basic Usage

**TypeScript:**
```tsx
import { createRocketClient, useRocketQuery } from '@philjs/rocket';

const client = createRocketClient({
  baseUrl: 'http://localhost:8000',
});

function Products() {
  const { data, error } = useRocketQuery('/api/products');

  if (error) return <Error message={error} />;
  return <ProductGrid products={data} />;
}
```

**Rust:**
```rust
use philjs_rocket::{PhilJS, TypeScript};
use rocket::{get, routes, serde::json::Json};

#[derive(Serialize, TypeScript)]
struct Product {
    id: u64,
    name: String,
    price: f64,
}

#[get("/api/products")]
async fn get_products() -> Json<Vec<Product>> {
    Json(fetch_products().await)
}

#[launch]
fn rocket() -> _ {
    PhilJS::generate_types("./frontend/src/types");

    rocket::build()
        .mount("/", routes![get_products])
}
```

## Features

- **Type Bridge** - Generate TypeScript from Rocket route types
- **API Client** - Typed client matching Rocket endpoints
- **Request Guards** - Type-safe request validation
- **Fairings** - CORS, auth, and logging fairings
- **Forms** - Multipart form and file handling
- **State Management** - Shared state between routes
- **WebSocket** - Real-time WebSocket support
- **SSR** - Server-side rendering integration
- **Error Catchers** - Unified error handling
- **Testing** - Integration testing utilities

## Hooks

| Hook | Description |
|------|-------------|
| `useRocketQuery` | Fetch from Rocket endpoint |
| `useRocketMutation` | Mutations with type safety |
| `useRocketForm` | Form submission handling |
| `useRocketAuth` | Authentication integration |

## Request Guards

```rust
use philjs_rocket::guards::PhilJSAuth;

#[get("/api/protected")]
async fn protected(auth: PhilJSAuth) -> Json<UserData> {
    Json(auth.user_data())
}
```

## CLI

```bash
# Generate TypeScript types
npx philjs-rocket sync

# Watch and regenerate on changes
npx philjs-rocket watch
```

## License

MIT
