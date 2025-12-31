# Project Structure

A typical PhilJS app organizes routes, shared components, and server logic separately.

```
my-app/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   ├── routes/
│   │   └── index.tsx
│   ├── server/
│   │   └── entry-server.ts
│   └── styles/
├── public/
└── vite.config.ts
```

## Key Folders

- `components/`: reusable UI pieces
- `routes/`: file-based routes
- `server/`: SSR entry and runtime helpers
- `styles/`: CSS, tokens, or Tailwind config
