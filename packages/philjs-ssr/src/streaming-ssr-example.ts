/**
 * Example usage of streaming SSR with selective hydration.
 *
 * This demonstrates the new streaming SSR features:
 * - renderToStream for immediate TTFB
 * - Suspense boundaries for async content
 * - Selective hydration for interactive islands
 * - Multiple hydration strategies
 */

import {
  renderToStream,
  Suspense,
  Island,
  registerIsland,
  hydrateIsland,
  autoHydrateIslands,
  HydrationStrategy,
  webStreamToNodeStream,
  type RenderToStreamOptions,
} from "./index.js";
import { jsx, signal } from "philjs-core";
import type { IncomingMessage, ServerResponse } from "http";

// ============================================================================
// Example 1: Basic Streaming SSR
// ============================================================================

/**
 * Simple streaming SSR example.
 */
export async function basicStreamingExample() {
  const App = () =>
    jsx("div", {
      children: [
        jsx("h1", { children: "Hello Streaming SSR!" }),
        jsx("p", { children: "This content is streamed immediately." }),
      ],
    });

  const stream = renderToStream(jsx(App, {}), {
    onShellReady: () => {
      console.log("Shell HTML sent to client");
    },
    onAllReady: () => {
      console.log("All content streamed");
    },
  });

  return stream;
}

// ============================================================================
// Example 2: Suspense Boundaries for Async Data
// ============================================================================

/**
 * Fetch user data (simulated async operation).
 */
async function fetchUserData(userId: string) {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return {
    id: userId,
    name: "John Doe",
    email: "john@example.com",
  };
}

/**
 * User profile component with async data.
 */
async function UserProfile({ userId }: { userId: string }) {
  const user = await fetchUserData(userId);

  return jsx("div", {
    className: "user-profile",
    children: [
      jsx("h2", { children: user.name }),
      jsx("p", { children: user.email }),
    ],
  });
}

/**
 * Page with Suspense boundary for async content.
 */
export function suspenseBoundaryExample(userId: string) {
  const App = () =>
    jsx("div", {
      children: [
        jsx("header", { children: jsx("h1", { children: "User Dashboard" }) }),
        jsx(Suspense as any, {
          fallback: jsx("div", {
            className: "loading",
            children: "Loading user profile...",
          }),
          children: jsx(UserProfile, { userId }),
        }),
        jsx("footer", { children: "Copyright 2024" }),
      ],
    });

  return renderToStream(jsx(App, {}), {
    onShellReady: () => {
      // Shell (header + loading + footer) sent immediately
      console.log("Page shell delivered - TTFB optimized!");
    },
    onAllReady: () => {
      // User profile data streamed when ready
      console.log("User profile data streamed");
    },
  });
}

// ============================================================================
// Example 3: Selective Hydration with Islands
// ============================================================================

/**
 * Interactive counter component (needs hydration).
 */
function Counter({ initialCount = 0 }: { initialCount?: number }) {
  const count = signal(initialCount);

  return jsx("div", {
    className: "counter",
    children: [
      jsx("p", { children: () => `Count: ${count.value}` }),
      jsx("button", {
        onClick: () => count.value++,
        children: "Increment",
      }),
      jsx("button", {
        onClick: () => count.value--,
        children: "Decrement",
      }),
    ],
  });
}

/**
 * Static blog post component (no hydration needed).
 */
function BlogPost({ title, content }: { title: string; content: string }) {
  return jsx("article", {
    children: [
      jsx("h2", { children: title }),
      jsx("p", { children: content }),
    ],
  });
}

/**
 * Page with selective hydration - only Counter is interactive.
 */
export function selectiveHydrationExample() {
  // Mark Counter as interactive component
  const interactiveComponents = new Set([Counter]);

  const App = () =>
    jsx("div", {
      children: [
        // Static header - no hydration
        jsx("header", { children: jsx("h1", { children: "My Blog" }) }),

        // Static content - no hydration
        jsx(BlogPost, {
          title: "Welcome Post",
          content: "This is a static blog post that doesn't need JavaScript.",
        }),

        // Interactive counter - will be hydrated
        jsx(Counter, { initialCount: 0 }),

        // More static content
        jsx(BlogPost, {
          title: "Another Post",
          content: "More static content here.",
        }),

        // Static footer
        jsx("footer", { children: "© 2024 My Blog" }),
      ],
    });

  // Render with selective hydration
  const stream = renderToStream(jsx(App, {}), {
    selectiveHydration: true,
    interactiveComponents,
    bootstrapModules: ["/assets/client.js"],
  });

  return stream;
}

/**
 * Client-side hydration setup for selective hydration.
 */
export function clientHydrationSetup() {
  // Register interactive components
  registerIsland("Counter", Counter);

  // Auto-hydrate islands using visible strategy
  // Islands will hydrate when they become visible
  autoHydrateIslands(HydrationStrategy.VISIBLE);

  // Or use other strategies:
  // autoHydrateIslands(HydrationStrategy.EAGER); // Immediate
  // autoHydrateIslands(HydrationStrategy.INTERACTION); // On hover/click
  // autoHydrateIslands(HydrationStrategy.IDLE); // When browser idle
}

// ============================================================================
// Example 4: Multiple Suspense Boundaries
// ============================================================================

async function fetchProducts() {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return [
    { id: 1, name: "Product 1", price: 10 },
    { id: 2, name: "Product 2", price: 20 },
  ];
}

async function fetchReviews() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return [
    { id: 1, rating: 5, text: "Great!" },
    { id: 2, rating: 4, text: "Good" },
  ];
}

async function ProductList() {
  const products = await fetchProducts();

  return jsx("div", {
    className: "products",
    children: products.map((p) =>
      jsx("div", {
        key: p.id,
        children: `${p.name} - $${p.price}`,
      })
    ),
  });
}

async function ReviewList() {
  const reviews = await fetchReviews();

  return jsx("div", {
    className: "reviews",
    children: reviews.map((r) =>
      jsx("div", {
        key: r.id,
        children: `${r.rating}★ - ${r.text}`,
      })
    ),
  });
}

/**
 * Dashboard with multiple independent async sections.
 */
export function multipleSuspenseExample() {
  const App = () =>
    jsx("div", {
      children: [
        jsx("h1", { children: "Product Dashboard" }),

        // Each section loads independently
        jsx("section", {
          children: [
            jsx("h2", { children: "Products" }),
            jsx(Suspense as any, {
              fallback: jsx("div", { children: "Loading products..." }),
              children: jsx(ProductList, {}),
            }),
          ],
        }),

        jsx("section", {
          children: [
            jsx("h2", { children: "Reviews" }),
            jsx(Suspense as any, {
              fallback: jsx("div", { children: "Loading reviews..." }),
              children: jsx(ReviewList, {}),
            }),
          ],
        }),
      ],
    });

  return renderToStream(jsx(App, {}), {
    onShellReady: () => {
      console.log("Page shell + loading states sent");
    },
  });
}

// ============================================================================
// Example 5: Node.js HTTP Server Integration
// ============================================================================

/**
 * Integrate streaming SSR with Node.js HTTP server.
 */
export function createStreamingHandler() {
  return async (req: IncomingMessage, res: ServerResponse) => {
    const App = () =>
      jsx("html", {
        children: [
          jsx("head", {
            children: [
              jsx("title", { children: "Streaming SSR Example" }),
              jsx("meta", { charset: "utf-8" }),
            ],
          }),
          jsx("body", {
            children: jsx("div", {
              id: "app",
              children: [
                jsx("h1", { children: "Hello from Streaming SSR!" }),
                jsx(Suspense as any, {
                  fallback: jsx("p", { children: "Loading..." }),
                  children: jsx(UserProfile, { userId: "123" }),
                }),
              ],
            }),
          }),
        ],
      });

    const webStream = renderToStream(jsx(App, {}), {
      onShellReady: () => {
        // Set headers when shell is ready
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Transfer-Encoding": "chunked",
        });
      },
      onError: (error) => {
        console.error("SSR Error:", error);
      },
    });

    // Convert Web Stream to Node.js stream
    const nodeStream = webStreamToNodeStream(webStream);

    // Pipe to response
    nodeStream.pipe(res);
  };
}

// ============================================================================
// Example 6: Explicit Island Boundaries
// ============================================================================

/**
 * Interactive search component.
 */
function SearchBox() {
  const query = signal("");

  return jsx("div", {
    className: "search",
    children: [
      jsx("input", {
        type: "text",
        placeholder: "Search...",
        value: () => query.value,
        onInput: (e: any) => (query.value = e.target.value),
      }),
      jsx("p", { children: () => `Searching for: ${query.value}` }),
    ],
  });
}

/**
 * Page with explicit island boundaries.
 */
export function explicitIslandsExample() {
  const App = () =>
    jsx("div", {
      children: [
        jsx("h1", { children: "My Page" }),

        // Static content
        jsx("p", { children: "This is static and doesn't need JS." }),

        // Explicit island for search
        jsx(Island as any, {
          name: "search",
          children: jsx(SearchBox, {}),
        }),

        // More static content
        jsx("p", { children: "More static content here." }),

        // Another explicit island
        jsx(Island as any, {
          name: "counter",
          children: jsx(Counter, { initialCount: 10 }),
        }),
      ],
    });

  return renderToStream(jsx(App, {}), {
    selectiveHydration: true,
    bootstrapModules: ["/assets/islands.js"],
  });
}

/**
 * Client-side setup for explicit islands.
 */
export function clientIslandSetup() {
  registerIsland("SearchBox", SearchBox);
  registerIsland("Counter", Counter);

  // Hydrate specific islands with different strategies
  hydrateIslandOnVisible("i0"); // Search - visible
  hydrateIsland("i1"); // Counter - eager
}

// ============================================================================
// Example 7: Performance Optimization
// ============================================================================

/**
 * Optimized streaming with performance monitoring.
 */
export function performanceOptimizedExample() {
  const App = () =>
    jsx("div", {
      children: [
        jsx("h1", { children: "High Performance Page" }),
        // Large list that would slow down traditional SSR
        jsx("ul", {
          children: Array.from({ length: 1000 }, (_, i) =>
            jsx("li", { key: i, children: `Item ${i}` })
          ),
        }),
      ],
    });

  const startTime = Date.now();

  const stream = renderToStream(jsx(App, {}), {
    onShellReady: () => {
      const ttfb = Date.now() - startTime;
      console.log(`TTFB: ${ttfb}ms`);
      // Expected: < 10ms for shell
    },
    onAllReady: () => {
      const totalTime = Date.now() - startTime;
      console.log(`Total time: ${totalTime}ms`);
    },
  });

  return stream;
}

// ============================================================================
// Example 8: Error Handling
// ============================================================================

/**
 * Component that might fail.
 */
async function RiskyComponent() {
  const random = Math.random();
  if (random < 0.3) {
    throw new Error("Random failure");
  }

  await new Promise((resolve) => setTimeout(resolve, 100));
  return jsx("div", { children: "Success!" });
}

/**
 * Page with error handling.
 */
export function errorHandlingExample() {
  const App = () =>
    jsx("div", {
      children: [
        jsx("h1", { children: "Error Handling Example" }),
        jsx(Suspense as any, {
          fallback: jsx("div", { children: "Loading..." }),
          children: jsx(RiskyComponent, {}),
        }),
      ],
    });

  return renderToStream(jsx(App, {}), {
    onError: (error) => {
      console.error("Streaming SSR Error:", error);
      // Log to error tracking service
      // Could also send to client for display
    },
  });
}

// ============================================================================
// Usage Summary
// ============================================================================

/**
 * Quick reference for using streaming SSR:
 *
 * 1. Server-side rendering:
 *    ```ts
 *    const stream = renderToStream(jsx(App, {}), options);
 *    const nodeStream = webStreamToNodeStream(stream);
 *    nodeStream.pipe(res);
 *    ```
 *
 * 2. Add Suspense boundaries:
 *    ```ts
 *    jsx(Suspense, {
 *      fallback: jsx("div", { children: "Loading..." }),
 *      children: jsx(AsyncComponent, {})
 *    })
 *    ```
 *
 * 3. Mark interactive components:
 *    ```ts
 *    renderToStream(jsx(App, {}), {
 *      selectiveHydration: true,
 *      interactiveComponents: new Set([Counter, SearchBox])
 *    })
 *    ```
 *
 * 4. Client-side hydration:
 *    ```ts
 *    registerIsland("Counter", Counter);
 *    autoHydrateIslands(HydrationStrategy.VISIBLE);
 *    ```
 *
 * Performance benefits:
 * - 50%+ faster TTFB (Time-to-First-Byte)
 * - Progressive rendering of async content
 * - Reduced JavaScript bundle size (selective hydration)
 * - Better Core Web Vitals scores
 */
