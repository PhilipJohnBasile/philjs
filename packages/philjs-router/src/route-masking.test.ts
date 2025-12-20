/**
 * Tests for Route Masking.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  initRouteMasking,
  createRouteMask,
  applyRouteMask,
  removeRouteMask,
  getCurrentMask,
  isRouteMasked,
  getActualRoute,
  getMaskedUrl,
  navigateWithMask,
  navigateAsModal,
  navigateAsDrawer,
  closeOverlay,
  pushMask,
  popMask,
  getMaskStack,
  getMaskStackDepth,
  clearMaskStack,
  restoreMaskFromHistory,
  getMaskFromHistory,
  clearMaskHistory,
  matchesMask,
  detectMaskFromHistory,
  isRouteMaskingEnabled,
  setRouteMaskingEnabled,
  getMaskConfig,
  type RouteMask,
} from "./route-masking.js";

describe("Route Masking", () => {
  beforeEach(() => {
    // Reset state
    clearMaskStack();
    clearMaskHistory();
    setRouteMaskingEnabled(true);
  });

  describe("Initialization", () => {
    it("should initialize with default config", () => {
      initRouteMasking();

      const config = getMaskConfig();
      expect(config.enabled).toBe(true);
      expect(config.maxStackDepth).toBe(10);
    });

    it("should initialize with custom config", () => {
      initRouteMasking({
        maxStackDepth: 5,
        defaultPreserve: true,
        maxHistorySize: 25,
      });

      const config = getMaskConfig();
      expect(config.maxStackDepth).toBe(5);
      expect(config.defaultPreserve).toBe(true);
      expect(config.maxHistorySize).toBe(25);
    });
  });

  describe("Mask Creation", () => {
    it("should create a route mask", () => {
      const mask = createRouteMask("/actual/route", "/masked/url");

      expect(mask.actualRoute).toBe("/actual/route");
      expect(mask.maskedUrl).toBe("/masked/url");
      expect(mask.timestamp).toBeGreaterThan(0);
    });

    it("should create mask with state", () => {
      const state = { modalId: "123", data: "test" };
      const mask = createRouteMask("/route", "/masked", { state });

      expect(mask.state).toEqual(state);
    });

    it("should create mask with preserve option", () => {
      const mask = createRouteMask("/route", "/masked", { preserve: true });

      expect(mask.preserve).toBe(true);
    });
  });

  describe("Applying Masks", () => {
    it("should apply a route mask", () => {
      initRouteMasking();

      const mask = createRouteMask("/photos/detail", "/photos");
      applyRouteMask(mask);

      expect(isRouteMasked()).toBe(true);
      expect(getCurrentMask()).toEqual(mask);
    });

    it("should get actual route", () => {
      initRouteMasking();

      const mask = createRouteMask("/photos/123", "/photos");
      applyRouteMask(mask);

      expect(getActualRoute()).toBe("/photos/123");
    });

    it("should get masked URL", () => {
      initRouteMasking();

      const mask = createRouteMask("/photos/123", "/photos");
      applyRouteMask(mask);

      expect(getMaskedUrl()).toBe("/photos");
    });

    it("should not apply mask when disabled", () => {
      initRouteMasking({ enabled: false });

      const mask = createRouteMask("/actual", "/masked");
      applyRouteMask(mask);

      expect(isRouteMasked()).toBe(false);
    });
  });

  describe("Removing Masks", () => {
    it("should remove route mask", () => {
      initRouteMasking();

      const mask = createRouteMask("/actual", "/masked");
      applyRouteMask(mask);

      expect(isRouteMasked()).toBe(true);

      removeRouteMask();

      expect(isRouteMasked()).toBe(false);
      expect(getCurrentMask()).toBeNull();
    });

    it("should pop from mask stack", () => {
      initRouteMasking();

      const mask1 = createRouteMask("/route1", "/masked1");
      const mask2 = createRouteMask("/route2", "/masked2");

      pushMask(mask1);
      pushMask(mask2);

      expect(getMaskStackDepth()).toBe(2);

      removeRouteMask({ pop: true });

      expect(getMaskStackDepth()).toBe(1);
      expect(getCurrentMask()?.actualRoute).toBe("/route1");
    });
  });

  describe("Navigation with Masking", () => {
    it("should navigate with mask", () => {
      initRouteMasking();

      navigateWithMask("/photos/123", {
        maskAs: "/photos",
        state: { photoId: "123" },
      });

      expect(isRouteMasked()).toBe(true);
      expect(getActualRoute()).toBe("/photos/123");
      expect(getMaskedUrl()).toBe("/photos");
    });

    it("should navigate as modal", () => {
      initRouteMasking();

      navigateAsModal("/modal/content", {
        backgroundRoute: "/dashboard",
        state: { data: "test" },
      });

      const mask = getCurrentMask();
      expect(mask?.actualRoute).toBe("/modal/content");
      expect(mask?.maskedUrl).toBe("/dashboard");
      expect(mask?.state?.modal).toBe(true);
    });

    it("should navigate as drawer", () => {
      initRouteMasking();

      navigateAsDrawer("/drawer/settings", {
        backgroundRoute: "/app",
        side: "right",
      });

      const mask = getCurrentMask();
      expect(mask?.actualRoute).toBe("/drawer/settings");
      expect(mask?.maskedUrl).toBe("/app");
      expect(mask?.state?.drawer).toBe(true);
      expect(mask?.state?.drawerSide).toBe("right");
    });

    it("should close overlay", () => {
      initRouteMasking();

      navigateAsModal("/modal", { backgroundRoute: "/home" });
      expect(isRouteMasked()).toBe(true);

      closeOverlay();
      expect(isRouteMasked()).toBe(false);
    });
  });

  describe("Mask Stack", () => {
    it("should push mask onto stack", () => {
      initRouteMasking();

      const mask1 = createRouteMask("/route1", "/masked1");
      const mask2 = createRouteMask("/route2", "/masked2");

      pushMask(mask1);
      pushMask(mask2);

      expect(getMaskStackDepth()).toBe(2);
      expect(getCurrentMask()).toEqual(mask2);
    });

    it("should pop mask from stack", () => {
      initRouteMasking();

      const mask1 = createRouteMask("/route1", "/masked1");
      const mask2 = createRouteMask("/route2", "/masked2");

      pushMask(mask1);
      pushMask(mask2);

      const popped = popMask();

      expect(popped).toEqual(mask2);
      expect(getMaskStackDepth()).toBe(1);
      expect(getCurrentMask()).toEqual(mask1);
    });

    it("should return null when popping empty stack", () => {
      initRouteMasking();

      const popped = popMask();

      expect(popped).toBeNull();
    });

    it("should enforce max stack depth", () => {
      initRouteMasking({ maxStackDepth: 2 });

      const mask1 = createRouteMask("/route1", "/masked1");
      const mask2 = createRouteMask("/route2", "/masked2");
      const mask3 = createRouteMask("/route3", "/masked3");

      pushMask(mask1);
      pushMask(mask2);
      pushMask(mask3);

      // Third mask should not be added
      expect(getMaskStackDepth()).toBe(2);
    });

    it("should clear mask stack", () => {
      initRouteMasking();

      pushMask(createRouteMask("/route1", "/masked1"));
      pushMask(createRouteMask("/route2", "/masked2"));

      clearMaskStack();

      expect(getMaskStackDepth()).toBe(0);
      expect(isRouteMasked()).toBe(false);
    });

    it("should get mask stack", () => {
      initRouteMasking();

      const mask1 = createRouteMask("/route1", "/masked1");
      const mask2 = createRouteMask("/route2", "/masked2");

      pushMask(mask1);
      pushMask(mask2);

      const stack = getMaskStack();

      expect(stack.length).toBe(2);
      expect(stack[0].mask).toEqual(mask1);
      expect(stack[1].mask).toEqual(mask2);
    });
  });

  describe("Mask History", () => {
    it("should store mask in history", () => {
      initRouteMasking();

      const mask = createRouteMask("/actual", "/masked");
      applyRouteMask(mask);

      const fromHistory = getMaskFromHistory("/masked");
      expect(fromHistory).toBeDefined();
    });

    it("should restore mask from history", () => {
      initRouteMasking();

      const mask = createRouteMask("/actual", "/masked");
      applyRouteMask(mask);

      removeRouteMask();

      const restored = restoreMaskFromHistory("/masked");

      expect(restored).toBe(true);
      expect(isRouteMasked()).toBe(true);
    });

    it("should not restore expired mask", () => {
      initRouteMasking();

      const mask = createRouteMask("/actual", "/masked");
      mask.timestamp = Date.now() - 1000000; // Very old
      applyRouteMask(mask);

      removeRouteMask();

      const restored = restoreMaskFromHistory("/masked", { maxAge: 1000 });

      expect(restored).toBe(false);
    });

    it("should clear mask history", () => {
      initRouteMasking();

      const mask = createRouteMask("/actual", "/masked");
      applyRouteMask(mask);

      clearMaskHistory();

      const fromHistory = getMaskFromHistory("/masked");
      expect(fromHistory).toBeNull();
    });
  });

  describe("Mask Matching", () => {
    it("should match exact URLs", () => {
      expect(matchesMask("/exact", "/exact", "exact")).toBe(true);
      expect(matchesMask("/exact", "/other", "exact")).toBe(false);
    });

    it("should match prefix URLs", () => {
      expect(matchesMask("/app/settings", "/app", "prefix")).toBe(true);
      expect(matchesMask("/app/settings", "/dashboard", "prefix")).toBe(false);
    });

    it("should match pattern URLs", () => {
      expect(matchesMask("/users/123", "/users/*", "pattern")).toBe(true);
      expect(matchesMask("/users/123/edit", "/users/*/edit", "pattern")).toBe(
        true
      );
      expect(matchesMask("/posts/123", "/users/*", "pattern")).toBe(false);
    });
  });

  describe("Configuration", () => {
    it("should enable/disable masking", () => {
      expect(isRouteMaskingEnabled()).toBe(true);

      setRouteMaskingEnabled(false);
      expect(isRouteMaskingEnabled()).toBe(false);

      setRouteMaskingEnabled(true);
      expect(isRouteMaskingEnabled()).toBe(true);
    });

    it("should get config", () => {
      initRouteMasking({
        maxStackDepth: 3,
        defaultPreserve: true,
      });

      const config = getMaskConfig();
      expect(config.maxStackDepth).toBe(3);
      expect(config.defaultPreserve).toBe(true);
    });
  });

  describe("Nested Masking", () => {
    it("should support nested masks", () => {
      initRouteMasking();

      const mask1 = createRouteMask("/modal1", "/background");
      const mask2 = createRouteMask("/modal2", "/modal1");

      applyRouteMask(mask1);
      applyRouteMask(mask2, { nested: true });

      expect(getMaskStackDepth()).toBe(2);
    });

    it("should maintain parent-child relationship", () => {
      initRouteMasking();

      const mask1 = createRouteMask("/parent", "/base");
      const mask2 = createRouteMask("/child", "/parent");

      applyRouteMask(mask1);
      applyRouteMask(mask2, { nested: true });

      const stack = getMaskStack();
      expect(stack[1].parentId).toBe(stack[0].id);
    });
  });

  describe("Modal Use Case", () => {
    it("should handle modal flow", () => {
      initRouteMasking();

      // Navigate to modal
      navigateAsModal("/photo/123", {
        backgroundRoute: "/gallery",
        state: { photoId: "123" },
      });

      expect(getActualRoute()).toBe("/photo/123");
      expect(getMaskedUrl()).toBe("/gallery");

      // Close modal
      closeOverlay();

      expect(isRouteMasked()).toBe(false);
    });

    it("should handle nested modals", () => {
      initRouteMasking();

      // First modal
      navigateAsModal("/modal1", { backgroundRoute: "/home" });

      // Second modal on top of first
      navigateAsModal("/modal2", { backgroundRoute: "/modal1" });

      expect(getMaskStackDepth()).toBe(2);

      // Close second modal
      closeOverlay();

      expect(getMaskStackDepth()).toBe(1);
      expect(getActualRoute()).toBe("/modal1");
    });
  });

  describe("Drawer Use Case", () => {
    it("should handle drawer with different sides", () => {
      initRouteMasking();

      navigateAsDrawer("/drawer", {
        backgroundRoute: "/app",
        side: "left",
      });

      const mask = getCurrentMask();
      expect(mask?.state?.drawerSide).toBe("left");
    });
  });

  describe("State Preservation", () => {
    it("should preserve state across mask changes", () => {
      initRouteMasking();

      const state = { userId: "123", tab: "profile" };
      const mask = createRouteMask("/user/detail", "/users", { state });

      applyRouteMask(mask);

      const currentMask = getCurrentMask();
      expect(currentMask?.state).toEqual(state);
    });
  });
});
