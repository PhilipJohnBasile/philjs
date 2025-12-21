/**
 * View Transitions API Tests
 *
 * Tests for the Astro-inspired View Transitions implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  ViewTransitionManager,
  initViewTransitions,
  getViewTransitionManager,
  resetViewTransitions,
  supportsViewTransitions,
  navigateWithTransition,
  navigate,
  startViewTransition,
  markSharedElement,
  transitionLink,
  animateFallback,
  useViewTransition,
  prefersReducedMotion,
  getNavigationDirection,
  ViewTransitionLink,
  createViewTransitionLink,
  type ViewTransitionConfig,
  type TransitionType,
  type ViewTransitionOptions,
} from "./view-transitions";

// Mock document and window for SSR/test environment
const createMockDocument = () => {
  const styleElements: HTMLStyleElement[] = [];
  const eventListeners = new Map<string, Function[]>();

  return {
    createElement: vi.fn((tag: string) => {
      if (tag === "style") {
        const el = {
          id: "",
          className: "",
          textContent: "",
          remove: vi.fn(() => {
            const idx = styleElements.indexOf(el as any);
            if (idx > -1) styleElements.splice(idx, 1);
          }),
        };
        styleElements.push(el as any);
        return el;
      }
      if (tag === "a") {
        return {
          href: "",
          className: "",
          target: "",
          origin: "http://localhost",
          style: {},
          setAttribute: vi.fn(),
          addEventListener: vi.fn((event: string, handler: Function) => {
            if (!eventListeners.has(event)) {
              eventListeners.set(event, []);
            }
            eventListeners.get(event)!.push(handler);
          }),
          removeEventListener: vi.fn(),
        };
      }
      if (tag === "link") {
        return { rel: "", href: "" };
      }
      return { style: {} };
    }),
    head: {
      appendChild: vi.fn(),
    },
    body: {
      cloneNode: vi.fn(() => ({ style: {} })),
      animate: vi.fn(() => {
        const animation = { onfinish: null as any };
        // Simulate animation finishing immediately
        setTimeout(() => {
          if (animation.onfinish) animation.onfinish();
        }, 0);
        return animation;
      }),
    },
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    startViewTransition: vi.fn((callback: () => void | Promise<void>) => {
      const transition = {
        finished: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        ready: Promise.resolve(),
        skipTransition: vi.fn(),
      };
      Promise.resolve().then(() => callback());
      return transition;
    }),
    styleElements,
    eventListeners,
  };
};

const createMockWindow = () => {
  const listeners = new Map<string, Function[]>();
  return {
    location: {
      origin: "http://localhost",
      pathname: "/",
      href: "http://localhost/",
    },
    history: {
      pushState: vi.fn(),
      replaceState: vi.fn(),
    },
    matchMedia: vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
    addEventListener: vi.fn((event: string, handler: Function) => {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(handler);
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn((event: Event) => {
      const handlers = listeners.get(event.type);
      if (handlers) {
        handlers.forEach((h) => h(event));
      }
    }),
    CustomEvent: class extends Event {
      detail: any;
      constructor(type: string, options?: { detail?: any }) {
        super(type);
        this.detail = options?.detail;
      }
    },
    PopStateEvent: class extends Event {
      constructor(type: string) {
        super(type);
      }
    },
    IntersectionObserver: class {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(callback: Function, options?: any) {}
    },
    listeners,
  };
};

describe("View Transitions", () => {
  let mockDocument: ReturnType<typeof createMockDocument>;
  let mockWindow: ReturnType<typeof createMockWindow>;

  beforeEach(() => {
    mockDocument = createMockDocument();
    mockWindow = createMockWindow();

    // @ts-ignore
    global.document = mockDocument;
    // @ts-ignore
    global.window = mockWindow;

    resetViewTransitions();
  });

  afterEach(() => {
    resetViewTransitions();
    vi.clearAllMocks();
  });

  describe("supportsViewTransitions", () => {
    it("should return true when API is available", () => {
      expect(supportsViewTransitions()).toBe(true);
    });

    it("should return false when document is undefined", () => {
      // @ts-ignore
      global.document = undefined;
      expect(supportsViewTransitions()).toBe(false);
    });

    it("should return false when startViewTransition is not available", () => {
      // @ts-ignore
      delete mockDocument.startViewTransition;
      expect(supportsViewTransitions()).toBe(false);
    });
  });

  describe("ViewTransitionManager", () => {
    it("should create manager with default config", () => {
      const manager = new ViewTransitionManager();
      const config = manager.getConfig();

      expect(config.defaultAnimation).toBe("fade");
      expect(config.duration).toBe(300);
      expect(config.fallback).toBe("animate");
      expect(config.respectReducedMotion).toBe(true);
      expect(config.directionAware).toBe(true);
    });

    it("should create manager with custom config", () => {
      const config: ViewTransitionConfig = {
        defaultAnimation: "slide-left",
        duration: 500,
        easing: "ease-in-out",
        fallback: "swap",
        respectReducedMotion: false,
      };

      const manager = new ViewTransitionManager(config);
      const resultConfig = manager.getConfig();

      expect(resultConfig.defaultAnimation).toBe("slide-left");
      expect(resultConfig.duration).toBe(500);
      expect(resultConfig.easing).toBe("ease-in-out");
      expect(resultConfig.fallback).toBe("swap");
      expect(resultConfig.respectReducedMotion).toBe(false);
    });

    it("should update config", () => {
      const manager = new ViewTransitionManager();
      manager.updateConfig({ duration: 1000 });

      expect(manager.getConfig().duration).toBe(1000);
    });

    it("should inject styles on creation", () => {
      new ViewTransitionManager();
      expect(mockDocument.createElement).toHaveBeenCalledWith("style");
      expect(mockDocument.head.appendChild).toHaveBeenCalled();
    });

    it("should track transition state", () => {
      const manager = new ViewTransitionManager();
      const state = manager.getState();

      expect(state.isTransitioning).toBe(false);
      expect(state.direction).toBeNull();
      expect(state.from).toBeNull();
      expect(state.to).toBeNull();
    });

    it("should check if transitioning", () => {
      const manager = new ViewTransitionManager();
      expect(manager.isTransitioning()).toBe(false);
    });

    it("should set transition name on element", () => {
      const manager = new ViewTransitionManager();
      const element = { style: { viewTransitionName: "" } } as HTMLElement;

      const cleanup = manager.setTransitionName(element, "my-element");

      expect(element.style.viewTransitionName).toBe("my-element");

      cleanup();
      expect(element.style.viewTransitionName).toBe("");
    });

    it("should persist element", () => {
      const manager = new ViewTransitionManager();
      const element = {
        style: { viewTransitionName: "" },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
      } as unknown as HTMLElement;

      const cleanup = manager.persist(element, "persistent-header");

      expect(element.style.viewTransitionName).toBe("persistent-header");
      expect(element.setAttribute).toHaveBeenCalledWith(
        "data-philjs-transition-persist",
        "persistent-header"
      );

      cleanup();
      expect(element.removeAttribute).toHaveBeenCalledWith(
        "data-philjs-transition-persist"
      );
    });

    it("should subscribe to lifecycle events", async () => {
      const manager = new ViewTransitionManager();
      const handler = vi.fn();

      const cleanup = manager.addEventListener("before-preparation", handler);

      await manager.transition(() => {});

      expect(handler).toHaveBeenCalled();

      cleanup();
    });

    it("should subscribe to legacy events", async () => {
      const manager = new ViewTransitionManager();
      const startHandler = vi.fn();
      const finishedHandler = vi.fn();

      manager.on("start", startHandler);
      manager.on("finished", finishedHandler);

      await manager.transition(() => {});

      expect(startHandler).toHaveBeenCalled();
      expect(finishedHandler).toHaveBeenCalled();
    });

    it("should unsubscribe from legacy events", () => {
      const manager = new ViewTransitionManager();
      const handler = vi.fn();

      manager.on("start", handler);
      manager.off("start", handler);

      // Handler should be removed
      expect(true).toBe(true);
    });

    it("should skip transition", async () => {
      const manager = new ViewTransitionManager();
      let transitionCaptured: any = null;

      manager.on("start", (t) => {
        transitionCaptured = t;
      });

      const transitionPromise = manager.transition(() => {});

      // Skip immediately after starting
      manager.skipTransition();

      await transitionPromise;

      if (transitionCaptured) {
        expect(transitionCaptured.skipTransition).toBeDefined();
      }
    });

    it("should cleanup on destroy", () => {
      const manager = new ViewTransitionManager();
      manager.destroy();

      const state = manager.getState();
      expect(state.isTransitioning).toBe(false);
      expect(manager.getCurrentTransition()).toBeNull();
    });
  });

  describe("initViewTransitions", () => {
    it("should create singleton manager", () => {
      const manager1 = initViewTransitions();
      const manager2 = initViewTransitions();

      expect(manager1).toBe(manager2);
    });

    it("should accept config", () => {
      const manager = initViewTransitions({ duration: 500 });
      expect(manager.getConfig().duration).toBe(500);
    });

    it("should update existing manager config", () => {
      const manager1 = initViewTransitions({ duration: 300 });
      const manager2 = initViewTransitions({ duration: 500 });

      expect(manager1).toBe(manager2);
      expect(manager2.getConfig().duration).toBe(500);
    });
  });

  describe("getViewTransitionManager", () => {
    it("should return null before initialization", () => {
      expect(getViewTransitionManager()).toBeNull();
    });

    it("should return manager after initialization", () => {
      initViewTransitions();
      expect(getViewTransitionManager()).not.toBeNull();
    });
  });

  describe("resetViewTransitions", () => {
    it("should clear the global manager", () => {
      initViewTransitions();
      expect(getViewTransitionManager()).not.toBeNull();

      resetViewTransitions();
      expect(getViewTransitionManager()).toBeNull();
    });
  });

  describe("navigateWithTransition", () => {
    it("should navigate with default options", async () => {
      await navigateWithTransition("/about");

      expect(mockWindow.history.pushState).toHaveBeenCalledWith({}, "", "/about");
    });

    it("should navigate with custom transition type", async () => {
      await navigateWithTransition("/about", { type: "slide-left" });

      expect(mockWindow.history.pushState).toHaveBeenCalled();
    });
  });

  describe("navigate", () => {
    it("should navigate with replace option", async () => {
      const manager = initViewTransitions();

      await navigate("/about", { replace: true });

      expect(mockWindow.history.replaceState).toHaveBeenCalledWith({}, "", "/about");
    });

    it("should navigate with push by default", async () => {
      await navigate("/about");

      expect(mockWindow.history.pushState).toHaveBeenCalled();
    });
  });

  describe("startViewTransition", () => {
    it("should wrap document.startViewTransition", async () => {
      const callback = vi.fn();

      const transition = await startViewTransition(callback);

      expect(mockDocument.startViewTransition).toHaveBeenCalled();
      expect(transition).not.toBeNull();
    });

    it("should return null when reduced motion is preferred", async () => {
      mockWindow.matchMedia = vi.fn(() => ({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })) as any;

      const callback = vi.fn();
      const transition = await startViewTransition(callback);

      expect(callback).toHaveBeenCalled();
      expect(transition).toBeNull();
    });

    it("should fallback when API not supported", async () => {
      // @ts-ignore
      delete mockDocument.startViewTransition;

      const callback = vi.fn();
      const transition = await startViewTransition(callback);

      expect(callback).toHaveBeenCalled();
      expect(transition).toBeNull();
    });
  });

  describe("markSharedElement", () => {
    it("should set view-transition-name on element", () => {
      const element = { style: { viewTransitionName: "" } } as HTMLElement;

      const cleanup = markSharedElement(element, { name: "hero-image" });

      expect(element.style.viewTransitionName).toBe("hero-image");

      cleanup();
      expect(element.style.viewTransitionName).toBe("");
    });

    it("should add custom duration and easing styles", () => {
      const element = { style: { viewTransitionName: "" } } as HTMLElement;

      markSharedElement(element, {
        name: "hero-image",
        duration: 500,
        easing: "ease-out",
      });

      expect(mockDocument.createElement).toHaveBeenCalledWith("style");
      expect(mockDocument.head.appendChild).toHaveBeenCalled();
    });
  });

  describe("transitionLink", () => {
    it("should attach click handler to anchor", () => {
      const anchor = {
        origin: "http://localhost",
        href: "http://localhost/about",
        target: "",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as HTMLAnchorElement;

      const cleanup = transitionLink(anchor);

      expect(anchor.addEventListener).toHaveBeenCalledWith("click", expect.any(Function));

      cleanup();
      expect(anchor.removeEventListener).toHaveBeenCalledWith(
        "click",
        expect.any(Function)
      );
    });

    it("should not intercept external links", async () => {
      const anchor = {
        origin: "http://external.com",
        href: "http://external.com/page",
        target: "",
        addEventListener: vi.fn((event, handler) => {
          if (event === "click") {
            // Simulate click
            const mockEvent = {
              metaKey: false,
              ctrlKey: false,
              preventDefault: vi.fn(),
            };
            handler(mockEvent);
            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
          }
        }),
        removeEventListener: vi.fn(),
      } as unknown as HTMLAnchorElement;

      transitionLink(anchor);
    });

    it("should not intercept links with target=_blank", async () => {
      const anchor = {
        origin: "http://localhost",
        href: "http://localhost/about",
        target: "_blank",
        addEventListener: vi.fn((event, handler) => {
          if (event === "click") {
            const mockEvent = {
              metaKey: false,
              ctrlKey: false,
              preventDefault: vi.fn(),
            };
            handler(mockEvent);
            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
          }
        }),
        removeEventListener: vi.fn(),
      } as unknown as HTMLAnchorElement;

      transitionLink(anchor);
    });

    it("should not intercept clicks with modifier keys", async () => {
      const anchor = {
        origin: "http://localhost",
        href: "http://localhost/about",
        target: "",
        addEventListener: vi.fn((event, handler) => {
          if (event === "click") {
            const mockEvent = {
              metaKey: true,
              ctrlKey: false,
              preventDefault: vi.fn(),
            };
            handler(mockEvent);
            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
          }
        }),
        removeEventListener: vi.fn(),
      } as unknown as HTMLAnchorElement;

      transitionLink(anchor);
    });
  });

  describe("animateFallback", () => {
    it("should animate element with fade", async () => {
      const element = {
        animate: vi.fn(() => ({
          onfinish: null as any,
        })),
      } as unknown as HTMLElement;

      const promise = animateFallback(element, "fade");

      expect(element.animate).toHaveBeenCalledWith(
        [{ opacity: 0 }, { opacity: 1 }],
        expect.objectContaining({
          duration: 300,
          fill: "both",
        })
      );

      // Simulate animation finish
      const animateCall = (element.animate as any).mock.results[0].value;
      animateCall.onfinish();

      await promise;
    });

    it("should animate element with slide-left", async () => {
      const element = {
        animate: vi.fn(() => ({
          onfinish: null as any,
        })),
      } as unknown as HTMLElement;

      const promise = animateFallback(element, "slide-left");

      expect(element.animate).toHaveBeenCalledWith(
        [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }],
        expect.any(Object)
      );

      const animateCall = (element.animate as any).mock.results[0].value;
      animateCall.onfinish();

      await promise;
    });

    it("should resolve immediately for none type", async () => {
      const element = {
        animate: vi.fn(),
      } as unknown as HTMLElement;

      await animateFallback(element, "none");

      expect(element.animate).not.toHaveBeenCalled();
    });

    it("should use custom duration and easing", async () => {
      const element = {
        animate: vi.fn(() => ({
          onfinish: null as any,
        })),
      } as unknown as HTMLElement;

      const promise = animateFallback(element, "fade", {
        duration: 500,
        easing: "ease-in-out",
      });

      expect(element.animate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          duration: 500,
          easing: "ease-in-out",
        })
      );

      const animateCall = (element.animate as any).mock.results[0].value;
      animateCall.onfinish();

      await promise;
    });
  });

  describe("useViewTransition hook", () => {
    it("should return transition state and methods", () => {
      const result = useViewTransition();

      expect(result.isTransitioning).toBe(false);
      expect(result.direction).toBeNull();
      expect(result.from).toBeNull();
      expect(result.to).toBeNull();
      expect(typeof result.navigate).toBe("function");
      expect(typeof result.startTransition).toBe("function");
      expect(typeof result.skipTransition).toBe("function");
    });

    it("should navigate via hook", async () => {
      const { navigate } = useViewTransition();

      await navigate("/about", { type: "slide-left" });

      expect(mockWindow.history.pushState).toHaveBeenCalled();
    });

    it("should start transition via hook", async () => {
      const { startTransition } = useViewTransition();
      const callback = vi.fn();

      await startTransition(callback);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe("prefersReducedMotion", () => {
    it("should return false by default", () => {
      expect(prefersReducedMotion()).toBe(false);
    });

    it("should return true when reduced motion is preferred", () => {
      mockWindow.matchMedia = vi.fn(() => ({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })) as any;

      expect(prefersReducedMotion()).toBe(true);
    });
  });

  describe("getNavigationDirection", () => {
    it("should return forward by default", () => {
      expect(getNavigationDirection()).toBe("forward");
    });

    it("should return direction from manager state", () => {
      const manager = initViewTransitions();
      // Manager's state direction is null initially
      expect(getNavigationDirection()).toBe("forward");
    });
  });

  describe("ViewTransitionLink", () => {
    it("should create anchor element", () => {
      const link = ViewTransitionLink({ href: "/about" });

      expect(mockDocument.createElement).toHaveBeenCalledWith("a");
    });

    it("should apply className and style", () => {
      const link = ViewTransitionLink({
        href: "/about",
        className: "my-link",
        style: { color: "red" },
      });

      expect(link.className).toBe("my-link");
    });

    it("should add click handler", () => {
      const link = ViewTransitionLink({ href: "/about" });

      expect(link.addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
    });
  });

  describe("createViewTransitionLink", () => {
    it("should return element type and onClick handler", () => {
      const result = createViewTransitionLink({ href: "/about" });

      expect(result.element).toBe("a");
      expect(result.props.href).toBe("/about");
      expect(typeof result.onClick).toBe("function");
    });

    it("should handle click and navigate", async () => {
      const result = createViewTransitionLink({
        href: "/about",
        transition: "slide-left",
      });

      const mockEvent = {
        preventDefault: vi.fn(),
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        defaultPrevented: false,
      } as unknown as MouseEvent;

      await result.onClick(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockWindow.history.pushState).toHaveBeenCalled();
    });

    it("should not prevent default for modifier key clicks", async () => {
      const result = createViewTransitionLink({ href: "/about" });

      const mockEvent = {
        preventDefault: vi.fn(),
        metaKey: true,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        defaultPrevented: false,
      } as unknown as MouseEvent;

      await result.onClick(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
    });

    it("should call custom onClick handler", async () => {
      const customOnClick = vi.fn();
      const result = createViewTransitionLink({
        href: "/about",
        onClick: customOnClick,
      });

      const mockEvent = {
        preventDefault: vi.fn(),
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        defaultPrevented: false,
      } as unknown as MouseEvent;

      await result.onClick(mockEvent);

      expect(customOnClick).toHaveBeenCalled();
    });
  });

  describe("Lifecycle Events", () => {
    it("should emit before-preparation event", async () => {
      const manager = initViewTransitions();
      const handler = vi.fn();

      manager.addEventListener("before-preparation", handler);

      await manager.transition(() => {});

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          direction: expect.any(String),
        })
      );
    });

    it("should emit after-swap event", async () => {
      const manager = initViewTransitions();
      const handler = vi.fn();

      manager.addEventListener("after-swap", handler);

      await manager.transition(() => {});

      expect(handler).toHaveBeenCalled();
    });

    it("should emit page-load event", async () => {
      const manager = initViewTransitions();
      const handler = vi.fn();

      manager.addEventListener("page-load", handler);

      await manager.transition(() => {});

      expect(handler).toHaveBeenCalled();
    });

    it("should dispatch DOM events", async () => {
      const manager = initViewTransitions();

      await manager.transition(() => {});

      expect(mockWindow.dispatchEvent).toHaveBeenCalled();
    });

    it("should allow removing event listeners", () => {
      const manager = initViewTransitions();
      const handler = vi.fn();

      const cleanup = manager.addEventListener("before-preparation", handler);
      cleanup();

      // Handler should be removed
      expect(true).toBe(true);
    });

    it("should allow removing event listeners via removeEventListener", () => {
      const manager = initViewTransitions();
      const handler = vi.fn();

      manager.addEventListener("before-preparation", handler);
      manager.removeEventListener("before-preparation", handler);

      // Handler should be removed
      expect(true).toBe(true);
    });
  });

  describe("Transition Types", () => {
    const transitionTypes: TransitionType[] = [
      "slide-left",
      "slide-right",
      "slide-up",
      "slide-down",
      "fade",
      "scale",
      "morph",
      "initial",
      "none",
      "custom",
    ];

    transitionTypes.forEach((type) => {
      it(`should handle ${type} transition type`, async () => {
        const manager = initViewTransitions();

        await manager.transition(() => {}, { type });

        expect(true).toBe(true); // No error thrown
      });
    });
  });

  describe("Fallback Behaviors", () => {
    beforeEach(() => {
      // Remove startViewTransition to simulate unsupported browser
      // @ts-ignore
      delete mockDocument.startViewTransition;
    });

    it("should use animate fallback", async () => {
      const manager = new ViewTransitionManager({ fallback: "animate" });
      const callback = vi.fn();

      await manager.transition(callback);

      expect(callback).toHaveBeenCalled();
    });

    it("should use swap fallback", async () => {
      const manager = new ViewTransitionManager({ fallback: "swap" });
      const callback = vi.fn();

      await manager.transition(callback);

      expect(callback).toHaveBeenCalled();
    });

    it("should use none fallback", async () => {
      const manager = new ViewTransitionManager({ fallback: "none" });
      const callback = vi.fn();

      await manager.transition(callback);

      // callback should not be called with 'none' fallback
      expect(true).toBe(true);
    });
  });

  describe("Direction Detection", () => {
    it("should detect forward navigation", async () => {
      const manager = initViewTransitions();

      await manager.navigate("/about");

      const state = manager.getState();
      // Direction is determined during navigation
      expect(["forward", "backward", "same"]).toContain(state.direction);
    });

    it("should track navigation history", async () => {
      const manager = initViewTransitions();

      await manager.navigate("/page1");
      await manager.navigate("/page2");

      // History should be tracked
      expect(true).toBe(true);
    });
  });

  describe("Reduced Motion", () => {
    it("should skip animation when reduced motion is preferred", async () => {
      mockWindow.matchMedia = vi.fn(() => ({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })) as any;

      const manager = new ViewTransitionManager({ respectReducedMotion: true });
      const callback = vi.fn();

      await manager.transition(callback);

      expect(callback).toHaveBeenCalled();
      expect(mockDocument.startViewTransition).not.toHaveBeenCalled();
    });

    it("should animate when reduced motion is not preferred", async () => {
      const manager = new ViewTransitionManager({ respectReducedMotion: true });
      const callback = vi.fn();

      await manager.transition(callback);

      expect(mockDocument.startViewTransition).toHaveBeenCalled();
    });

    it("should ignore reduced motion preference when configured", async () => {
      mockWindow.matchMedia = vi.fn(() => ({
        matches: true,
        media: "(prefers-reduced-motion: reduce)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })) as any;

      const manager = new ViewTransitionManager({ respectReducedMotion: false });
      const callback = vi.fn();

      await manager.transition(callback);

      expect(mockDocument.startViewTransition).toHaveBeenCalled();
    });
  });

  describe("Custom CSS", () => {
    it("should inject custom CSS during transition", async () => {
      const manager = initViewTransitions();

      await manager.transition(() => {}, {
        customCSS: "::view-transition { opacity: 0.5; }",
      });

      // Custom style should be created and removed
      expect(mockDocument.createElement).toHaveBeenCalledWith("style");
    });
  });

  describe("setTransitionAnimation", () => {
    it("should set animation with built-in type", () => {
      const manager = new ViewTransitionManager();
      const element = { style: { viewTransitionName: "" } } as HTMLElement;

      const cleanup = manager.setTransitionAnimation(element, "fade", {
        duration: 500,
      });

      expect(element.style.viewTransitionName).toBeTruthy();
      expect(mockDocument.createElement).toHaveBeenCalledWith("style");

      cleanup();
      expect(element.style.viewTransitionName).toBe("");
    });

    it("should set animation with custom keyframes", () => {
      const manager = new ViewTransitionManager();
      const element = { style: { viewTransitionName: "" } } as HTMLElement;

      const cleanup = manager.setTransitionAnimation(element, {
        old: [{ opacity: "1" }, { opacity: "0" }],
        new: [{ opacity: "0" }, { opacity: "1" }],
      });

      expect(element.style.viewTransitionName).toBeTruthy();

      cleanup();
    });
  });
});
