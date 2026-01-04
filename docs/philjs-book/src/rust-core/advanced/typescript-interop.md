# TypeScript Interop

Many PhilJS Rust apps still ship a TypeScript client bundle for hydration or tooling. Keep the contract between Rust and TS explicit.

## Recommended pattern

1. Define shared DTOs in Rust using `serde`.
2. Serialize data with stable JSON structures.
3. Mirror those shapes in `src/types.ts` for the frontend.

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct UserDto {
    pub id: String,
    pub name: String,
}
```

```ts
export type UserDto = {
  id: string;
  name: string;
};
```

## Tips

- Keep DTOs flat and versioned.
- Treat Rust as the source of truth.
- Use API snapshots in tests to catch drift.
