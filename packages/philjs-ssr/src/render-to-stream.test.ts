/**
 * Tests for streaming SSR with selective hydration.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  renderToStream,
  Suspense,
  Island,
  type RenderToStreamOptions,
} from "./render-to-stream.js";
import { jsx } from "@philjs/core";

/**
 * Helper to read entire stream into string.
 */
async function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return result;
}

/**
 * Helper to collect stream chunks with timing.
 */
async function collectChunks(stream: ReadableStream<Uint8Array>): Promise<{
  chunks: string[];
  timings: number[];
  total: string;
}> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  const chunks: string[] = [];
  const timings: number[] = [];
  const startTime = Date.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    chunks.push(chunk);
    timings.push(Date.now() - startTime);
  }

  return {
    chunks,
    timings,
    total: chunks.join(""),
  };
}

/**
 * Async component that resolves after a delay.
 */
async function AsyncComponent({ delay = 100, text = "Loaded!" }) {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return jsx("div", { children: text });
}

/**
 * Component that throws a promise (simulating async data fetch).
 */
function SuspendingComponent({ delay = 100, text = "Loaded!" }) {
  let resolved = false;
  let promise: Promise<void> | null = null;

  if (!resolved) {
    if (!promise) {
      promise = new Promise((resolve) => {
        setTimeout(() => {
          resolved = true;
          resolve();
        }, delay);
      });
    }
    throw promise;
  }

  return jsx("div", { children: text });
}

describe("renderToStream", () => {
  it("should render simple HTML immediately", async () => {
    const App = () => jsx("div", { children: "Hello World" });
    const stream = renderToStream(jsx(App, {}));
    const html = await streamToString(stream);

    expect(html).toContain("Hello World");
  });

  it("should render nested components", async () => {
    const Child = ({ name }: { name: string }) =>
      jsx("span", { children: `Hello ${name}` });

    const Parent = () =>
      jsx("div", { children: jsx(Child, { name: "PhilJS" }) });

    const stream = renderToStream(jsx(Parent, {}));
    const html = await streamToString(stream);

    expect(html).toContain("Hello PhilJS");
  });

  it("should escape HTML special characters", async () => {
    const App = () =>
      jsx("div", { children: "<script>alert('xss')</script>" });

    const stream = renderToStream(jsx(App, {}));
    const html = await streamToString(stream);

    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert");
  });

  it("should render boolean attributes correctly", async () => {
    const App = () =>
      jsx("input", {
        type: "checkbox",
        checked: true,
        disabled: false,
      });

    const stream = renderToStream(jsx(App, {}));
    const html = await streamToString(stream);

    expect(html).toContain("checked");
    expect(html).not.toContain("disabled");
  });

  it("should convert className to class", async () => {
    const App = () =>
      jsx("div", { className: "container" });

    const stream = renderToStream(jsx(App, {}));
    const html = await streamToString(stream);

    expect(html).toContain('class="container"');
  });

  it("should render style objects", async () => {
    const App = () =>
      jsx("div", {
        style: { color: "red", fontSize: "16px" },
      });

    const stream = renderToStream(jsx(App, {}));
    const html = await streamToString(stream);

    expect(html).toContain("color:red");
    expect(html).toContain("font-size:16px");
  });

  it("should not include event handlers in HTML", async () => {
    const App = () =>
      jsx("button", {
        onClick: () => alert("clicked"),
        children: "Click me",
      });

    const stream = renderToStream(jsx(App, {}));
    const html = await streamToString(stream);

    expect(html).toContain("Click me");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("alert");
  });

  it("should call onShellReady when initial HTML is sent", async () => {
    const onShellReady = vi.fn();

    const App = () => jsx("div", { children: "Hello" });

    const stream = renderToStream(jsx(App, {}), { onShellReady });

    await streamToString(stream);

    expect(onShellReady).toHaveBeenCalledTimes(1);
  });

  it("should call onAllReady when stream is complete", async () => {
    const onAllReady = vi.fn();

    const App = () => jsx("div", { children: "Hello" });

    const stream = renderToStream(jsx(App, {}), { onAllReady });

    await streamToString(stream);

    expect(onAllReady).toHaveBeenCalledTimes(1);
  });
});

describe("Suspense boundaries", () => {
  it("should render Suspense fallback for async content", async () => {
    const App = () =>
      jsx(Suspense as any, {
        fallback: jsx("div", { children: "Loading..." }),
        children: jsx(AsyncComponent, { delay: 50, text: "Content loaded!" }),
      });

    const { chunks, total } = await collectChunks(
      renderToStream(jsx(App, {}))
    );

    // First chunk should contain fallback
    expect(chunks[0]).toContain("Loading...");

    // Final HTML should contain resolved content
    expect(total).toContain("Content loaded!");
  });

  it("should stream resolved Suspense boundaries progressively", async () => {
    const App = () =>
      jsx("div", {
        children: [
          jsx("h1", { children: "Title" }),
          jsx(Suspense as any, {
            fallback: jsx("div", { children: "Loading 1..." }),
            children: jsx(AsyncComponent, { delay: 50, text: "Content 1" }),
          }),
          jsx(Suspense as any, {
            fallback: jsx("div", { children: "Loading 2..." }),
            children: jsx(AsyncComponent, { delay: 100, text: "Content 2" }),
          }),
        ],
      });

    const { chunks, total } = await collectChunks(
      renderToStream(jsx(App, {}))
    );

    // Should have multiple chunks
    expect(chunks.length).toBeGreaterThan(1);

    // First chunk has shell + fallbacks
    expect(chunks[0]).toContain("Title");
    expect(chunks[0]).toContain("Loading 1...");
    expect(chunks[0]).toContain("Loading 2...");

    // Final HTML has resolved content
    expect(total).toContain("Content 1");
    expect(total).toContain("Content 2");
  });

  it("should handle nested Suspense boundaries", async () => {
    const App = () =>
      jsx(Suspense as any, {
        fallback: jsx("div", { children: "Loading outer..." }),
        children: jsx("div", {
          children: [
            jsx("p", { children: "Outer content" }),
            jsx(Suspense as any, {
              fallback: jsx("div", { children: "Loading inner..." }),
              children: jsx(AsyncComponent, { delay: 50, text: "Inner content" }),
            }),
          ],
        }),
      });

    const { total } = await collectChunks(renderToStream(jsx(App, {})));

    expect(total).toContain("Outer content");
    expect(total).toContain("Inner content");
  });

  it("should handle Suspense errors gracefully", async () => {
    const ErrorComponent = async () => {
      throw new Error("Component failed");
    };

    const onError = vi.fn();

    const App = () =>
      jsx(Suspense as any, {
        fallback: jsx("div", { children: "Loading..." }),
        children: jsx(ErrorComponent, {}),
      });

    const stream = renderToStream(jsx(App, {}), { onError });

    const { total } = await collectChunks(stream);

    // Should render error fallback
    expect(total).toContain("Failed to load content");
    expect(onError).toHaveBeenCalled();
  });
});

describe("Selective hydration", () => {
  it("should add island markers for interactive components", async () => {
    const InteractiveButton = ({ text }: { text: string }) =>
      jsx("button", { children: text });

    const interactiveComponents = new Set([InteractiveButton]);

    const App = () =>
      jsx("div", {
        children: [
          jsx("h1", { children: "Static title" }),
          jsx(InteractiveButton, { text: "Click me" }),
        ],
      });

    const stream = renderToStream(jsx(App, {}), {
      selectiveHydration: true,
      interactiveComponents,
    });

    const html = await streamToString(stream);

    // Should have island markers
    expect(html).toContain('data-island=');
    expect(html).toContain('data-component="InteractiveButton"');
    expect(html).toContain('data-props=');

    // Static content should not have markers
    expect(html).toContain("Static title");
  });

  it("should serialize props for hydration", async () => {
    const Counter = ({ initialCount }: { initialCount: number }) =>
      jsx("div", { children: `Count: ${initialCount}` });

    const interactiveComponents = new Set([Counter]);

    const App = () => jsx(Counter, { initialCount: 42 });

    const stream = renderToStream(jsx(App, {}), {
      selectiveHydration: true,
      interactiveComponents,
    });

    const html = await streamToString(stream);

    // Should serialize props
    expect(html).toContain('"initialCount":42');
  });

  it("should exclude functions from serialized props", async () => {
    const Button = ({ text, onClick }: { text: string; onClick: () => void }) =>
      jsx("button", { children: text });

    const interactiveComponents = new Set([Button]);

    const App = () =>
      jsx(Button, {
        text: "Click",
        onClick: () => console.log("clicked"),
      });

    const stream = renderToStream(jsx(App, {}), {
      selectiveHydration: true,
      interactiveComponents,
    });

    const html = await streamToString(stream);

    // Should have text but not onClick
    expect(html).toContain('"text":"Click"');
    expect(html).not.toContain("onClick");
    expect(html).not.toContain("console.log");
  });

  it("should inject hydration runtime script", async () => {
    const Button = () => jsx("button", { children: "Click" });

    const interactiveComponents = new Set([Button]);

    const App = () => jsx(Button, {});

    const stream = renderToStream(jsx(App, {}), {
      selectiveHydration: true,
      interactiveComponents,
    });

    const html = await streamToString(stream);

    // Should include hydration runtime
    expect(html).toContain("$PHIL_ISLANDS");
    expect(html).toContain("$PHIL_R");
  });

  it("should include bootstrap scripts", async () => {
    const App = () => jsx("div", { children: "Hello" });

    const stream = renderToStream(jsx(App, {}), {
      selectiveHydration: true,
      interactiveComponents: new Set(),
      bootstrapScripts: ["/assets/app.js"],
      bootstrapModules: ["/assets/app.mjs"],
    });

    const html = await streamToString(stream);

    expect(html).toContain('<script src="/assets/app.js"');
    expect(html).toContain('<script type="module" src="/assets/app.mjs"');
  });

  it("should work with explicit Island components", async () => {
    const App = () =>
      jsx(Island as any, {
        name: "header",
        children: jsx("header", { children: "My Header" }),
      });

    const stream = renderToStream(jsx(App, {}), {
      selectiveHydration: true,
    });

    const html = await streamToString(stream);

    expect(html).toContain('data-island=');
    expect(html).toContain('data-island-name="header"');
  });
});

describe("Performance", () => {
  it("should send first chunk quickly (TTFB)", async () => {
    const App = () =>
      jsx("div", {
        children: [
          jsx("h1", { children: "Title" }),
          jsx(Suspense as any, {
            fallback: jsx("div", { children: "Loading..." }),
            children: jsx(AsyncComponent, { delay: 200, text: "Slow content" }),
          }),
        ],
      });

    const { timings } = await collectChunks(renderToStream(jsx(App, {})));

    // First chunk (shell) should arrive quickly (< 50ms)
    expect(timings[0]).toBeLessThan(50);

    // Subsequent chunks arrive later
    if (timings.length > 1) {
      expect(timings[1]).toBeGreaterThan(timings[0]);
    }
  });

  it("should handle large component trees efficiently", async () => {
    const LargeList = () =>
      jsx("ul", {
        children: Array.from({ length: 1000 }, (_, i) =>
          jsx("li", { key: i, children: `Item ${i}` })
        ),
      });

    const App = () => jsx(LargeList, {});

    const startTime = Date.now();
    const stream = renderToStream(jsx(App, {}));
    const html = await streamToString(stream);
    const duration = Date.now() - startTime;

    expect(html).toContain("Item 0");
    expect(html).toContain("Item 999");

    // Should complete in reasonable time (< 200ms for 1000 items)
    expect(duration).toBeLessThan(200);
  });

  it("should stream multiple boundaries concurrently", async () => {
    const App = () =>
      jsx("div", {
        children: Array.from({ length: 5 }, (_, i) =>
          jsx(Suspense as any, {
            key: i,
            fallback: jsx("div", { children: `Loading ${i}...` }),
            children: jsx(AsyncComponent, {
              delay: 50 + i * 10,
              text: `Content ${i}`,
            }),
          })
        ),
      });

    const startTime = Date.now();
    const { total } = await collectChunks(renderToStream(jsx(App, {})));
    const duration = Date.now() - startTime;

    // All content should be present
    for (let i = 0; i < 5; i++) {
      expect(total).toContain(`Content ${i}`);
    }

    // Should complete faster than sequential (< 150ms instead of 250ms)
    // Due to concurrent resolution
    expect(duration).toBeLessThan(150);
  });
});

describe("Edge cases", () => {
  it("should handle null and undefined children", async () => {
    const App = () =>
      jsx("div", {
        children: [null, undefined, jsx("span", { children: "visible" })],
      });

    const stream = renderToStream(jsx(App, {}));
    const html = await streamToString(stream);

    expect(html).toContain("visible");
    expect(html).not.toContain("null");
    expect(html).not.toContain("undefined");
  });

  it("should handle boolean children", async () => {
    const App = () =>
      jsx("div", {
        children: [true, false, jsx("span", { children: "visible" })],
      });

    const stream = renderToStream(jsx(App, {}));
    const html = await streamToString(stream);

    expect(html).toContain("visible");
    expect(html).not.toContain("true");
    expect(html).not.toContain("false");
  });

  it("should handle void elements", async () => {
    const App = () =>
      jsx("div", {
        children: [
          jsx("img", { src: "/logo.png", alt: "Logo" }),
          jsx("br", {}),
          jsx("input", { type: "text" }),
        ],
      });

    const stream = renderToStream(jsx(App, {}));
    const html = await streamToString(stream);

    expect(html).toContain('<img src="/logo.png" alt="Logo">');
    expect(html).not.toContain("</img>");
    expect(html).toContain("<br>");
    expect(html).not.toContain("</br>");
  });

  it("should handle empty components", async () => {
    const Empty = () => null;

    const App = () =>
      jsx("div", {
        children: jsx(Empty, {}),
      });

    const stream = renderToStream(jsx(App, {}));
    const html = await streamToString(stream);

    expect(html).toBe("<div></div>");
  });

  it("should handle Fragment components", async () => {
    const App = () =>
      jsx("div", {
        children: jsx("Fragment" as any, {
          children: [
            jsx("span", { children: "one" }),
            jsx("span", { children: "two" }),
          ],
        }),
      });

    // Note: This requires Fragment to be properly handled
    const stream = renderToStream(jsx(App, {}));
    const html = await streamToString(stream);

    expect(html).toContain("one");
    expect(html).toContain("two");
  });
});
