# Project Structure

A typical PhilJS Rust project keeps UI code in Rust and uses a minimal HTML shell.

```
my-philjs-app/
├── Cargo.toml
├── index.html
├── src/
│   ├── lib.rs
│   ├── components/
│   │   └── counter.rs
│   └── pages/
│       └── home.rs
├── pkg/
│   ├── my_philjs_app_bg.wasm
│   └── my_philjs_app.js
└── dist/
```

## Key Files

- `src/lib.rs`: main entry point (mounts your root component)
- `src/components/`: reusable UI components
- `src/pages/`: route-level components when using a router
- `index.html`: HTML shell that loads the WASM bundle
- `pkg/`: wasm-pack output

## Optional Server Layout

If you are building SSR with Axum or Actix, you can add a `server/` directory:

```
server/
├── main.rs
└── routes.rs
```

This keeps server code separate from WASM-focused UI code.
