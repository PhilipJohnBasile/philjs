/**
 * Tests for Next.js 14 style Parallel Routes.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  matchParallelRoutes,
  loadParallelSlots,
  parseInterception,
  navigateWithInterception,
  closeInterception,
  isIntercepted,
  useSlot,
  useSlots,
  useSlotByName,
  useInterception,
  renderParallelSlots,
  createParallelRouteConfig,
  updateParallelRouteState,
  clearParallelRouteState,
  type ParallelRouteConfig,
  type SlotDefinition,
  type InterceptConfig,
  type MatchedSlot,
  type SlotComponentProps,
} from "./parallel-routes.js";

describe("Parallel Routes", () => {
  beforeEach(() => {
    clearParallelRouteState();
  });

  describe("Slot Matching", () => {
    it("should match basic parallel slots", () => {
      const config: ParallelRouteConfig = {
        slots: [
          {
            name: "children",
            path: "/dashboard",
            component: ({ slotName }: SlotComponentProps) => ({ type: "div", props: { children: slotName } }),
          },
          {
            name: "@sidebar",
            path: "/dashboard",
            component: ({ slotName }: SlotComponentProps) => ({ type: "div", props: { children: slotName } }),
          },
          {
            name: "@modal",
            path: "/dashboard",
            component: ({ slotName }: SlotComponentProps) => ({ type: "div", props: { children: slotName } }),
            optional: true,
          },
        ],
      };

      const matches = matchParallelRoutes("/dashboard", config);

      expect(matches).toBeDefined();
      expect(matches?.size).toBe(3);
      expect(matches?.has("children")).toBe(true);
      expect(matches?.has("@sidebar")).toBe(true);
      expect(matches?.has("@modal")).toBe(true);
    });

    it("should match slots with dynamic segments", () => {
      const config: ParallelRouteConfig = {
        slots: [
          {
            name: "children",
            path: "/users/:id",
            component: ({ params }: SlotComponentProps) => ({ type: "div", props: { children: params.id } }),
          },
          {
            name: "@sidebar",
            path: "/users/:id",
            component: ({ slotName }: SlotComponentProps) => ({ type: "div", props: { children: slotName } }),
          },
        ],
      };

      const matches = matchParallelRoutes("/users/123", config);

      expect(matches).toBeDefined();
      expect(matches?.size).toBe(2);

      const childrenSlot = matches?.get("children");
      expect(childrenSlot?.params.id).toBe("123");

      const sidebarSlot = matches?.get("@sidebar");
      expect(sidebarSlot?.params.id).toBe("123");
    });

    it("should use default component when no match and slot is required", () => {
      const defaultComponent = ({ slotName }: SlotComponentProps) => ({
        type: "div",
        props: { children: `Default ${slotName}` },
      });

      const config: ParallelRouteConfig = {
        slots: [
          {
            name: "children",
            path: "/dashboard",
            component: ({ slotName }: SlotComponentProps) => ({ type: "div", props: { children: slotName } }),
          },
          {
            name: "@sidebar",
            path: "/settings", // Different path
            default: defaultComponent,
            component: ({ slotName }: SlotComponentProps) => ({ type: "div", props: { children: slotName } }),
          },
        ],
      };

      const matches = matchParallelRoutes("/dashboard", config);

      expect(matches).toBeDefined();
      const sidebarSlot = matches?.get("@sidebar");
      expect(sidebarSlot).toBeDefined();
      expect(sidebarSlot?.id).toContain("default");
    });

    it("should return null when main slot doesn't match", () => {
      const config: ParallelRouteConfig = {
        slots: [
          {
            name: "children",
            path: "/dashboard",
            component: ({ slotName }: SlotComponentProps) => ({ type: "div", props: { children: slotName } }),
          },
        ],
      };

      const matches = matchParallelRoutes("/settings", config);

      expect(matches).toBeNull();
    });
  });

  describe("Route Interception", () => {
    it("should parse same-level interception (.)", () => {
      const result = parseInterception("(.)photos/:id");

      expect(result).toEqual({
        type: "(.)",
        target: "photos/:id",
      });
    });

    it("should parse one-level-up interception (..)", () => {
      const result = parseInterception("(..)photos/:id");

      expect(result).toEqual({
        type: "(..)",
        target: "photos/:id",
      });
    });

    it("should parse two-levels-up interception (..)(..)", () => {
      const result = parseInterception("(..)(..)photos/:id");

      expect(result).toEqual({
        type: "(..)(..)",
        target: "photos/:id",
      });
    });

    it("should parse root interception (...)", () => {
      const result = parseInterception("(...)photos/:id");

      expect(result).toEqual({
        type: "(...)",
        target: "photos/:id",
      });
    });

    it("should return null for non-intercepted paths", () => {
      const result = parseInterception("photos/:id");

      expect(result).toBeNull();
    });

    it("should match intercepted routes", () => {
      const config: ParallelRouteConfig = {
        slots: [
          {
            name: "children",
            path: "/photos/:id",
            component: ({ params }: SlotComponentProps) => ({ type: "div", props: { children: params.id } }),
          },
          {
            name: "@modal",
            path: "(.)photos/:id", // Intercepts same-level /photos/:id
            component: ({ params }: SlotComponentProps) => ({ type: "div", props: { children: `Modal: ${params.id}` } }),
          },
        ],
        basePath: "/",
      };

      const matches = matchParallelRoutes("/photos/123", config);

      expect(matches).toBeDefined();
      expect(matches?.has("@modal")).toBe(true);

      const modalSlot = matches?.get("@modal");
      expect(modalSlot?.params.id).toBe("123");
    });

    it("should handle soft navigation for intercepted routes", async () => {
      const config: ParallelRouteConfig = {
        slots: [
          {
            name: "children",
            path: "/photos/:id",
            component: ({ params }: SlotComponentProps) => ({ type: "div", props: { children: params.id } }),
          },
          {
            name: "@modal",
            path: "(.)photos/:id",
            component: ({ params }: SlotComponentProps) => ({ type: "div", props: { children: `Modal: ${params.id}` } }),
          },
        ],
        softNavigation: true,
      };

      const state = await navigateWithInterception("/photos/123", config, "soft");

      expect(state.intercepted).toBe(true);
      expect(state.mode).toBe("soft");
      expect(state.slotName).toBe("@modal");
    });

    it("should handle hard navigation", async () => {
      const config: ParallelRouteConfig = {
        slots: [
          {
            name: "children",
            path: "/photos/:id",
            component: ({ params }: SlotComponentProps) => ({ type: "div", props: { children: params.id } }),
          },
        ],
      };

      const state = await navigateWithInterception("/photos/123", config, "hard");

      expect(state.intercepted).toBe(false);
      expect(state.mode).toBe("hard");
    });

    it("should close interception and restore state", () => {
      // Setup initial intercepted state
      updateParallelRouteState(
        new Map([
          [
            "@modal",
            {
              slot: {
                name: "@modal",
                path: "(.)photos/:id",
              },
              params: { id: "123" },
              pathname: "/photos/123",
              id: "@modal:123",
            },
          ],
        ]),
        "/photos/123",
        {
          intercepted: true,
          originalUrl: "/",
          slotName: "@modal",
          mode: "soft",
        }
      );

      expect(isIntercepted()).toBe(true);

      closeInterception();

      // State should be reset
      const finalIntercepted = isIntercepted();
      expect(finalIntercepted).toBe(false);
    });
  });

  describe("Parallel Data Loading", () => {
    it("should load data for all slots in parallel", async () => {
      const slots = new Map<string, MatchedSlot>([
        [
          "children",
          {
            slot: {
              name: "children",
              path: "/dashboard",
              loader: async () => ({ data: "children data" }),
            },
            params: {},
            pathname: "/dashboard",
            id: "children:dashboard",
          },
        ],
        [
          "@sidebar",
          {
            slot: {
              name: "@sidebar",
              path: "/dashboard",
              loader: async () => ({ data: "sidebar data" }),
            },
            params: {},
            pathname: "/dashboard",
            id: "@sidebar:dashboard",
          },
        ],
        [
          "@modal",
          {
            slot: {
              name: "@modal",
              path: "/dashboard",
              loader: async () => ({ data: "modal data" }),
            },
            params: {},
            pathname: "/dashboard",
            id: "@modal:dashboard",
          },
        ],
      ]);

      const request = new Request("http://localhost/dashboard");
      const loadedSlots = await loadParallelSlots(slots, request);

      expect(loadedSlots.size).toBe(3);

      const childrenSlot = loadedSlots.get("children");
      expect(childrenSlot?.data).toEqual({ data: "children data" });

      const sidebarSlot = loadedSlots.get("@sidebar");
      expect(sidebarSlot?.data).toEqual({ data: "sidebar data" });

      const modalSlot = loadedSlots.get("@modal");
      expect(modalSlot?.data).toEqual({ data: "modal data" });
    });

    it("should handle loader errors per slot", async () => {
      const slots = new Map<string, MatchedSlot>([
        [
          "children",
          {
            slot: {
              name: "children",
              path: "/dashboard",
              loader: async () => ({ data: "children data" }),
            },
            params: {},
            pathname: "/dashboard",
            id: "children:dashboard",
          },
        ],
        [
          "@sidebar",
          {
            slot: {
              name: "@sidebar",
              path: "/dashboard",
              loader: async () => {
                throw new Error("Sidebar error");
              },
            },
            params: {},
            pathname: "/dashboard",
            id: "@sidebar:dashboard",
          },
        ],
      ]);

      const request = new Request("http://localhost/dashboard");
      const loadedSlots = await loadParallelSlots(slots, request);

      expect(loadedSlots.size).toBe(2);

      const childrenSlot = loadedSlots.get("children");
      expect(childrenSlot?.data).toEqual({ data: "children data" });
      expect(childrenSlot?.error).toBeUndefined();

      const sidebarSlot = loadedSlots.get("@sidebar");
      expect(sidebarSlot?.error).toBeDefined();
      expect(sidebarSlot?.error?.message).toBe("Sidebar error");
    });

    it("should pass params to loaders", async () => {
      let receivedParams: Record<string, string> = {};

      const slots = new Map<string, MatchedSlot>([
        [
          "children",
          {
            slot: {
              name: "children",
              path: "/users/:id",
              loader: async ({ params }) => {
                receivedParams = params;
                return { userId: params.id };
              },
            },
            params: { id: "123" },
            pathname: "/users/123",
            id: "children:users/:id",
          },
        ],
      ]);

      const request = new Request("http://localhost/users/123");
      await loadParallelSlots(slots, request);

      expect(receivedParams.id).toBe("123");
    });
  });

  describe("Rendering", () => {
    it("should render all slots", () => {
      const slots = new Map<string, MatchedSlot>([
        [
          "children",
          {
            slot: {
              name: "children",
              path: "/dashboard",
              component: ({ slotName }: SlotComponentProps) => ({
                type: "div",
                props: { children: `Slot: ${slotName}` },
              }),
            },
            params: {},
            pathname: "/dashboard",
            id: "children:dashboard",
            data: { test: "data" },
          },
        ],
        [
          "@sidebar",
          {
            slot: {
              name: "@sidebar",
              path: "/dashboard",
              component: ({ slotName, data }: SlotComponentProps) => ({
                type: "aside",
                props: { children: `${slotName}: ${JSON.stringify(data)}` },
              }),
            },
            params: {},
            pathname: "/dashboard",
            id: "@sidebar:dashboard",
            data: { sidebar: "info" },
          },
        ],
      ]);

      const searchParams = new URLSearchParams();
      const rendered = renderParallelSlots(slots, searchParams);

      expect(rendered.children).toBeDefined();
      expect(rendered.children.type).toBe("div");

      expect(rendered["@sidebar"]).toBeDefined();
      expect(rendered["@sidebar"].type).toBe("aside");
    });

    it("should use default component when no component specified", () => {
      const slots = new Map<string, MatchedSlot>([
        [
          "children",
          {
            slot: {
              name: "children",
              path: "/dashboard",
              default: ({ slotName }: SlotComponentProps) => ({
                type: "div",
                props: { children: `Default: ${slotName}` },
              }),
            },
            params: {},
            pathname: "/dashboard",
            id: "children:dashboard",
          },
        ],
      ]);

      const searchParams = new URLSearchParams();
      const rendered = renderParallelSlots(slots, searchParams);

      expect(rendered.children).toBeDefined();
      expect(rendered.children.props.children).toBe("Default: children");
    });

    it("should render null when no component or default", () => {
      const slots = new Map<string, MatchedSlot>([
        [
          "children",
          {
            slot: {
              name: "children",
              path: "/dashboard",
            },
            params: {},
            pathname: "/dashboard",
            id: "children:dashboard",
          },
        ],
      ]);

      const searchParams = new URLSearchParams();
      const rendered = renderParallelSlots(slots, searchParams);

      expect(rendered.children).toBeNull();
    });
  });

  describe("Configuration Builder", () => {
    it("should create config with defaults", () => {
      const config = createParallelRouteConfig({
        slots: [
          {
            name: "children",
            path: "/",
          },
        ],
      });

      expect(config.basePath).toBe("");
      expect(config.mainSlot).toBe("children");
      expect(config.softNavigation).toBe(true);
    });

    it("should preserve custom options", () => {
      const config = createParallelRouteConfig({
        basePath: "/app",
        slots: [
          {
            name: "children",
            path: "/",
          },
        ],
        mainSlot: "@main",
        softNavigation: false,
      });

      expect(config.basePath).toBe("/app");
      expect(config.mainSlot).toBe("@main");
      expect(config.softNavigation).toBe(false);
    });
  });

  describe("State Management", () => {
    it("should update parallel route state", () => {
      const slots = new Map<string, MatchedSlot>([
        [
          "children",
          {
            slot: {
              name: "children",
              path: "/dashboard",
            },
            params: { test: "param" },
            pathname: "/dashboard",
            id: "children:dashboard",
          },
        ],
      ]);

      updateParallelRouteState(slots, "/dashboard");

      const currentSlots = useSlots();
      expect(currentSlots.size).toBe(1);
      expect(currentSlots.has("children")).toBe(true);
    });

    it("should clear parallel route state", () => {
      const slots = new Map<string, MatchedSlot>([
        [
          "children",
          {
            slot: {
              name: "children",
              path: "/dashboard",
            },
            params: {},
            pathname: "/dashboard",
            id: "children:dashboard",
          },
        ],
      ]);

      updateParallelRouteState(slots, "/dashboard");
      expect(useSlots().size).toBe(1);

      clearParallelRouteState();
      expect(useSlots().size).toBe(0);
    });

    it("should combine params from all slots", () => {
      const slots = new Map<string, MatchedSlot>([
        [
          "children",
          {
            slot: {
              name: "children",
              path: "/users/:userId",
            },
            params: { userId: "123" },
            pathname: "/users/123",
            id: "children:users",
          },
        ],
        [
          "@modal",
          {
            slot: {
              name: "@modal",
              path: "/photos/:photoId",
            },
            params: { photoId: "456" },
            pathname: "/photos/456",
            id: "@modal:photos",
          },
        ],
      ]);

      updateParallelRouteState(slots, "/users/123");

      const currentSlots = useSlots();
      // Verify combined params are available
      const childrenSlot = currentSlots.get("children");
      const modalSlot = currentSlots.get("@modal");

      expect(childrenSlot?.params.userId).toBe("123");
      expect(modalSlot?.params.photoId).toBe("456");
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle multi-level nested slots", () => {
      const config: ParallelRouteConfig = {
        slots: [
          {
            name: "children",
            path: "/app",
            component: ({ slotName }: SlotComponentProps) => ({ type: "div", props: { children: slotName } }),
            children: [
              {
                name: "children",
                path: "/dashboard",
                component: ({ slotName }: SlotComponentProps) => ({ type: "div", props: { children: slotName } }),
              },
            ],
          },
          {
            name: "@sidebar",
            path: "/app",
            component: ({ slotName }: SlotComponentProps) => ({ type: "div", props: { children: slotName } }),
          },
        ],
      };

      const matches = matchParallelRoutes("/app/dashboard", config);

      expect(matches).toBeDefined();
      expect(matches?.has("children")).toBe(true);
    });

    it("should handle conditional slot rendering", () => {
      const config: ParallelRouteConfig = {
        slots: [
          {
            name: "children",
            path: "/photos/:id",
            component: ({ params }: SlotComponentProps) => ({ type: "div", props: { children: params.id } }),
          },
          {
            name: "@modal",
            path: "(.)photos/:id",
            component: ({ params }: SlotComponentProps) => ({ type: "div", props: { children: `Modal: ${params.id}` } }),
            optional: true,
          },
        ],
      };

      // With interception - modal should render
      const matchesWithModal = matchParallelRoutes("/photos/123", config);
      expect(matchesWithModal?.has("@modal")).toBe(true);

      // Without interception - modal should not render
      const matchesWithoutModal = matchParallelRoutes("/other", config);
      expect(matchesWithoutModal).toBeNull();
    });
  });
});
