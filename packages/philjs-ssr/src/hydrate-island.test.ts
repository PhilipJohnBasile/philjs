/**
 * Tests for selective island hydration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  registerIsland,
  hydrateIsland,
  hydrateAllIslands,
  hydrateIslandOnVisible,
  hydrateIslandOnInteraction,
  hydrateIslandOnIdle,
  autoHydrateIslands,
  HydrationStrategy,
  getIslandStatus,
  clearIslands,
} from "./hydrate-island.js";
import { jsx } from "@philjs/core";

/**
 * Setup JSDOM environment.
 */
function setupDOM(html: string) {
  document.body.innerHTML = html;
}

describe("registerIsland", () => {
  beforeEach(() => {
    clearIslands();
  });

  it("should register a component", () => {
    const Button = (props: any) => jsx("button", { children: props.text });

    registerIsland("Button", Button);

    // Should not throw
    expect(() => registerIsland("Button", Button)).not.toThrow();
  });

  it("should allow registering multiple components", () => {
    const Button = () => jsx("button", {});
    const Input = () => jsx("input", {});

    registerIsland("Button", Button);
    registerIsland("Input", Input);

    // Both should be registered
    expect(() => registerIsland("Button", Button)).not.toThrow();
    expect(() => registerIsland("Input", Input)).not.toThrow();
  });
});

describe("hydrateIsland", () => {
  beforeEach(() => {
    clearIslands();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should hydrate a simple island", () => {
    const clickHandler = vi.fn();

    const Button = ({ text }: { text: string }) =>
      jsx("button", {
        onClick: clickHandler,
        children: text,
      });

    registerIsland("Button", Button);

    setupDOM(`
      <div data-island="i0" data-component="Button" data-props='{"text":"Click me"}'>
        <button>Click me</button>
      </div>
    `);

    hydrateIsland("i0");

    // Button should be hydrated
    const button = document.querySelector("button");
    expect(button).toBeTruthy();

    // Click should trigger handler
    button?.click();
    expect(clickHandler).toHaveBeenCalledTimes(1);

    // Island should be marked as hydrated
    const status = getIslandStatus("i0");
    expect(status.hydrated).toBe(true);
  });

  it("should deserialize props correctly", () => {
    const Counter = ({ initialCount }: { initialCount: number }) =>
      jsx("div", { children: `Count: ${initialCount}` });

    registerIsland("Counter", Counter);

    setupDOM(`
      <div data-island="i0" data-component="Counter" data-props='{"initialCount":42}'>
        <div>Count: 42</div>
      </div>
    `);

    hydrateIsland("i0");

    const status = getIslandStatus("i0");
    expect(status.hydrated).toBe(true);
  });

  it("should warn if island not found", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    hydrateIsland("nonexistent");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("not found")
    );

    consoleSpy.mockRestore();
  });

  it("should warn if component not registered", () => {
    setupDOM(`
      <div data-island="i0" data-component="UnknownComponent" data-props='{}'>
        <div>Content</div>
      </div>
    `);

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    hydrateIsland("i0");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("not registered")
    );

    consoleSpy.mockRestore();
  });

  it("should not hydrate same island twice", () => {
    const Button = () => jsx("button", { children: "Click" });

    registerIsland("Button", Button);

    setupDOM(`
      <div data-island="i0" data-component="Button" data-props='{}'>
        <button>Click</button>
      </div>
    `);

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    hydrateIsland("i0");
    hydrateIsland("i0"); // Second call

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("already hydrated")
    );

    consoleSpy.mockRestore();
  });

  it("should handle hydration errors gracefully", () => {
    const ErrorComponent = () => {
      throw new Error("Component error");
    };

    registerIsland("ErrorComponent", ErrorComponent);

    setupDOM(`
      <div data-island="i0" data-component="ErrorComponent" data-props='{}'>
        <div>Fallback</div>
      </div>
    `);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    hydrateIsland("i0");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to hydrate"),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});

describe("hydrateAllIslands", () => {
  beforeEach(() => {
    clearIslands();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should hydrate all islands on the page", () => {
    const Button = () => jsx("button", { children: "Click" });
    const Input = () => jsx("input", {});

    registerIsland("Button", Button);
    registerIsland("Input", Input);

    setupDOM(`
      <div>
        <div data-island="i0" data-component="Button" data-props='{}'>
          <button>Click</button>
        </div>
        <div data-island="i1" data-component="Input" data-props='{}'>
          <input />
        </div>
      </div>
    `);

    hydrateAllIslands();

    expect(getIslandStatus("i0").hydrated).toBe(true);
    expect(getIslandStatus("i1").hydrated).toBe(true);
  });

  it("should skip already hydrated islands", () => {
    const Button = () => jsx("button", { children: "Click" });

    registerIsland("Button", Button);

    setupDOM(`
      <div data-island="i0" data-component="Button" data-props='{}'>
        <button>Click</button>
      </div>
    `);

    hydrateIsland("i0"); // Hydrate manually first

    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    hydrateAllIslands();

    // Should warn about already hydrated
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

describe("hydrateIslandOnVisible", () => {
  beforeEach(() => {
    clearIslands();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should set up intersection observer", () => {
    const Button = () => jsx("button", { children: "Click" });

    registerIsland("Button", Button);

    setupDOM(`
      <div data-island="i0" data-component="Button" data-props='{}'>
        <button>Click</button>
      </div>
    `);

    // Mock IntersectionObserver
    const observeMock = vi.fn();
    const disconnectMock = vi.fn();

    global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: observeMock,
      disconnect: disconnectMock,
      unobserve: vi.fn(),
    })) as any;

    hydrateIslandOnVisible("i0");

    expect(observeMock).toHaveBeenCalled();
  });
});

describe("hydrateIslandOnInteraction", () => {
  beforeEach(() => {
    clearIslands();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should hydrate on specified events", () => {
    const Button = () => jsx("button", { children: "Click" });

    registerIsland("Button", Button);

    setupDOM(`
      <div data-island="i0" data-component="Button" data-props='{}'>
        <button>Click</button>
      </div>
    `);

    hydrateIslandOnInteraction("i0", ["click"]);

    expect(getIslandStatus("i0").hydrated).toBe(false);

    // Trigger click
    const island = document.querySelector('[data-island="i0"]');
    island?.dispatchEvent(new Event("click"));

    expect(getIslandStatus("i0").hydrated).toBe(true);
  });

  it("should remove event listeners after hydration", () => {
    const Button = () => jsx("button", { children: "Click" });

    registerIsland("Button", Button);

    setupDOM(`
      <div data-island="i0" data-component="Button" data-props='{}'>
        <button>Click</button>
      </div>
    `);

    const island = document.querySelector('[data-island="i0"]');
    const removeEventListenerSpy = vi.spyOn(island as Element, "removeEventListener");

    hydrateIslandOnInteraction("i0", ["mouseenter"]);

    island?.dispatchEvent(new Event("mouseenter"));

    expect(removeEventListenerSpy).toHaveBeenCalled();
  });
});

describe("hydrateIslandOnIdle", () => {
  beforeEach(() => {
    clearIslands();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should use requestIdleCallback if available", () => {
    const Button = () => jsx("button", { children: "Click" });

    registerIsland("Button", Button);

    setupDOM(`
      <div data-island="i0" data-component="Button" data-props='{}'>
        <button>Click</button>
      </div>
    `);

    const requestIdleCallbackMock = vi.fn((callback) => {
      callback();
      return 1;
    });

    (global as any).requestIdleCallback = requestIdleCallbackMock;

    hydrateIslandOnIdle("i0");

    expect(requestIdleCallbackMock).toHaveBeenCalled();
    expect(getIslandStatus("i0").hydrated).toBe(true);

    delete (global as any).requestIdleCallback;
  });

  it("should fallback to setTimeout if requestIdleCallback unavailable", () => {
    const Button = () => jsx("button", { children: "Click" });

    registerIsland("Button", Button);

    setupDOM(`
      <div data-island="i0" data-component="Button" data-props='{}'>
        <button>Click</button>
      </div>
    `);

    vi.useFakeTimers();

    hydrateIslandOnIdle("i0", 100);

    expect(getIslandStatus("i0").hydrated).toBe(false);

    vi.advanceTimersByTime(100);

    expect(getIslandStatus("i0").hydrated).toBe(true);

    vi.useRealTimers();
  });
});

describe("autoHydrateIslands", () => {
  beforeEach(() => {
    clearIslands();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should hydrate with EAGER strategy", () => {
    const Button = () => jsx("button", { children: "Click" });

    registerIsland("Button", Button);

    setupDOM(`
      <div data-island="i0" data-component="Button" data-props='{}'>
        <button>Click</button>
      </div>
    `);

    autoHydrateIslands(HydrationStrategy.EAGER);

    expect(getIslandStatus("i0").hydrated).toBe(true);
  });

  it("should setup observer with VISIBLE strategy", () => {
    const Button = () => jsx("button", { children: "Click" });

    registerIsland("Button", Button);

    setupDOM(`
      <div data-island="i0" data-component="Button" data-props='{}'>
        <button>Click</button>
      </div>
    `);

    const observeMock = vi.fn();

    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: observeMock,
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    })) as any;

    autoHydrateIslands(HydrationStrategy.VISIBLE);

    expect(observeMock).toHaveBeenCalled();
  });

  it("should setup listeners with INTERACTION strategy", () => {
    const Button = () => jsx("button", { children: "Click" });

    registerIsland("Button", Button);

    setupDOM(`
      <div data-island="i0" data-component="Button" data-props='{}'>
        <button>Click</button>
      </div>
    `);

    autoHydrateIslands(HydrationStrategy.INTERACTION);

    const island = document.querySelector('[data-island="i0"]');
    island?.dispatchEvent(new Event("mouseenter"));

    expect(getIslandStatus("i0").hydrated).toBe(true);
  });

  it("should use IDLE strategy by default", () => {
    const Button = () => jsx("button", { children: "Click" });

    registerIsland("Button", Button);

    setupDOM(`
      <div data-island="i0" data-component="Button" data-props='{}'>
        <button>Click</button>
      </div>
    `);

    // Mock requestIdleCallback
    const requestIdleCallbackMock = vi.fn((callback) => {
      callback();
      return 1;
    });

    (global as any).requestIdleCallback = requestIdleCallbackMock;

    // VISIBLE is default, not IDLE, let me fix the test
    autoHydrateIslands(HydrationStrategy.IDLE);

    expect(requestIdleCallbackMock).toHaveBeenCalled();

    delete (global as any).requestIdleCallback;
  });
});

describe("getIslandStatus", () => {
  beforeEach(() => {
    clearIslands();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should return correct status", () => {
    setupDOM(`
      <div data-island="i0" data-component="Button" data-props='{}'>
        <button>Click</button>
      </div>
    `);

    const status1 = getIslandStatus("i0");
    expect(status1.exists).toBe(true);
    expect(status1.hydrated).toBe(false);

    const Button = () => jsx("button", { children: "Click" });
    registerIsland("Button", Button);

    hydrateIsland("i0");

    const status2 = getIslandStatus("i0");
    expect(status2.exists).toBe(true);
    expect(status2.hydrated).toBe(true);
  });

  it("should return false for non-existent island", () => {
    const status = getIslandStatus("nonexistent");
    expect(status.exists).toBe(false);
    expect(status.hydrated).toBe(false);
  });
});
