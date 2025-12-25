export type BlogPost = {
  title: string;
  date: string;
  author: string;
  excerpt: string;
  tags: string[];
  slug: string;
  readingTime: string;
  body: string[];
  highlights: string[];
};

export const blogPosts: BlogPost[] = [
  {
    title: "PhilJS 1.0 Beta: Signals, SSR, and the ecosystem",
    date: "2025-01-15",
    author: "Phil Dev Team",
    excerpt: "A look at the full PhilJS stack and the packages shipping in the 1.0 beta release.",
    tags: ["Release", "Ecosystem"],
    slug: "v1-beta-ecosystem",
    readingTime: "6 min read",
    body: [
      "PhilJS 1.0 beta brings the full signals-first runtime together with a production-ready ecosystem. The core runtime is lean, but the surrounding packages cover routing, SSR, islands, data, auth, and deployment.",
      "The stack is designed to be cohesive. Routing, loaders, and actions share the same request lifecycle, while SSR and islands are built to work with the same primitives as the client runtime.",
      "With 88 packages in the monorepo, teams can start small and adopt more functionality as their product grows. The beta focuses on stability, performance, and predictable upgrade paths."
    ],
    highlights: [
      "Signals and compiler now ship together for predictable performance.",
      "SSR, islands, and resumability are built into the same rendering pipeline.",
      "First-party packages cover GraphQL, auth, PWA, analytics, and deployment."
    ]
  },
  {
    title: "Routing and data loading, the PhilJS way",
    date: "2025-01-10",
    author: "Sarah Chen",
    excerpt: "How file-based routing, loaders, and actions work together for fast navigation.",
    tags: ["Routing", "SSR"],
    slug: "routing-and-data-loading",
    readingTime: "5 min read",
    body: [
      "PhilJS routing centers on file-based conventions backed by loaders and actions. Loaders fetch data before a route renders, while actions handle mutations with a consistent server API.",
      "Because loaders run during SSR and on navigation, the UI stays fast and predictable. The router keeps navigation state in sync with the server response so you can progressively enhance without losing data.",
      "When paired with islands, routes can remain mostly static while only the necessary interactive components hydrate."
    ],
    highlights: [
      "Route loaders run for SSR, SSG, and client navigation.",
      "Actions share the same context as loaders for consistent data access.",
      "Type-safe params keep navigation and data contracts aligned."
    ]
  },
  {
    title: "Building GraphQL apps with philjs-graphql",
    date: "2025-01-05",
    author: "Michael Rodriguez",
    excerpt: "Typed queries, caching, and SSR for GraphQL-first teams.",
    tags: ["GraphQL", "Data"],
    slug: "graphql-with-philjs",
    readingTime: "4 min read",
    body: [
      "philjs-graphql ships a typed client with caching, SSR support, and normalized responses. It integrates with the router so queries can be prefetched at the route level.",
      "The caching layer is built to work with signals, so UI updates stay localized and reactive. When you navigate between routes, cache reuse keeps the app fast without manual wiring.",
      "Teams can also hook into analytics, tracing, and logging with the plugin ecosystem."
    ],
    highlights: [
      "Typed queries, mutations, and fragments with caching.",
      "SSR-friendly execution and hydration support.",
      "Works alongside realtime packages for live data."
    ]
  },
  {
    title: "Auth, sessions, and protected routes",
    date: "2024-12-28",
    author: "Emma Johnson",
    excerpt: "A guide to secure auth flows with philjs-auth and philjs-api.",
    tags: ["Security", "Auth"],
    slug: "auth-sessions-protected-routes",
    readingTime: "5 min read",
    body: [
      "philjs-auth provides provider integrations, session helpers, and client utilities for building secure authentication flows. Pair it with philjs-api to enforce access at the server layer.",
      "Route guards improve UX, but server-side checks keep your data protected. PhilJS encourages a shared session shape across loaders, actions, and API routes.",
      "Security headers, CSRF protection, and auditing tools are available through the ecosystem when you need to harden production environments."
    ],
    highlights: [
      "Use sessions and token refresh helpers out of the box.",
      "Enforce auth on the server, not just the UI.",
      "Built-in tooling for CSRF, headers, and auditing."
    ]
  },
  {
    title: "PWA and offline workflows",
    date: "2024-12-20",
    author: "David Park",
    excerpt: "Using the PWA plugin, service workers, and offline fallbacks.",
    tags: ["PWA", "Performance"],
    slug: "pwa-offline-workflows",
    readingTime: "4 min read",
    body: [
      "The PWA plugin generates service workers and manifests tailored to PhilJS apps. Start with precaching and runtime caching rules, then layer in offline fallbacks.",
      "The plugin integrates with build tooling so you can ship updates with predictable cache behavior. The install and update prompts are handled for you, with hooks to customize UX.",
      "Pair PWAs with islands to keep the offline shell light and fast."
    ],
    highlights: [
      "Generate service workers and manifests automatically.",
      "Use caching strategies aligned with your content.",
      "Manage install prompts and update notifications."
    ]
  },
  {
    title: "Deploying across edge and server runtimes",
    date: "2024-12-15",
    author: "Phil Dev Team",
    excerpt: "Adapters, edge middleware, and deployment options across the ecosystem.",
    tags: ["Deployment", "Adapters"],
    slug: "deploying-across-runtimes",
    readingTime: "5 min read",
    body: [
      "PhilJS ships adapters for common edge and server targets. Whether you deploy to Cloudflare Pages, Vercel Edge, or a Rust runtime, the adapter API keeps the deployment model consistent.",
      "Edge middleware lets you rewrite, redirect, and cache requests before they hit your app. Combine this with SSR streaming to reduce time to first byte globally.",
      "The deployment story keeps observability in mind, with logging, error tracking, and performance budgets built in."
    ],
    highlights: [
      "Use adapter presets to target edge or server runtimes.",
      "Edge middleware handles redirects, caching, and geolocation.",
      "Observability tooling keeps production behavior visible."
    ]
  }
];
