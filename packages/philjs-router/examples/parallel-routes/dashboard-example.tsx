/**
 * Example: Dashboard with Multiple Parallel Slots
 *
 * This example demonstrates:
 * - @sidebar slot for navigation
 * - @main slot for main content
 * - @analytics slot for analytics widget
 * - Independent loading states per slot
 * - Suspense boundaries per slot
 * - Streaming support for each slot
 *
 * File structure:
 * app/
 *   dashboard/
 *     layout.tsx                  - Dashboard layout with all slots
 *     @sidebar/page.tsx           - Sidebar navigation
 *     @main/page.tsx              - Main content area
 *     @analytics/page.tsx         - Analytics widget
 *     @main/users/page.tsx        - Users list
 *     @main/settings/page.tsx     - Settings page
 */

import { h } from "philjs-core";
import type { VNode } from "philjs-core";
import {
  createParallelRouteConfig,
  matchParallelRoutes,
  loadParallelSlots,
  renderParallelSlots,
  useSlot,
  useSlotByName,
  type ParallelRouteConfig,
  type SlotComponentProps,
} from "../../src/parallel-routes.js";

// ============================================================================
// Data Layer
// ============================================================================

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: string;
};

type AnalyticsData = {
  totalUsers: number;
  activeUsers: number;
  revenue: number;
  growth: number;
};

type Settings = {
  theme: string;
  notifications: boolean;
  language: string;
};

// Mock data
const users: User[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "Admin",
    lastActive: "2 hours ago",
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob@example.com",
    role: "User",
    lastActive: "5 minutes ago",
  },
  {
    id: "3",
    name: "Carol White",
    email: "carol@example.com",
    role: "Editor",
    lastActive: "1 day ago",
  },
];

const analyticsData: AnalyticsData = {
  totalUsers: 1247,
  activeUsers: 892,
  revenue: 45230,
  growth: 12.5,
};

const settings: Settings = {
  theme: "dark",
  notifications: true,
  language: "en",
};

// API simulation with delays
async function getUsers(): Promise<User[]> {
  // Simulate slower API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  return users;
}

async function getAnalytics(): Promise<AnalyticsData> {
  // Simulate fast API call
  await new Promise((resolve) => setTimeout(resolve, 100));
  return analyticsData;
}

async function getSettings(): Promise<Settings> {
  // Simulate medium speed API call
  await new Promise((resolve) => setTimeout(resolve, 300));
  return settings;
}

async function getSidebarData(): Promise<{ activeSection: string }> {
  // Sidebar loads instantly
  return { activeSection: "dashboard" };
}

// ============================================================================
// Components
// ============================================================================

/**
 * Sidebar Component
 */
function Sidebar({ data }: SlotComponentProps): VNode {
  const sidebarData = data as { activeSection: string };

  const navItems = [
    { id: "overview", label: "Overview", href: "/dashboard" },
    { id: "users", label: "Users", href: "/dashboard/users" },
    { id: "settings", label: "Settings", href: "/dashboard/settings" },
    { id: "analytics", label: "Analytics", href: "/dashboard/analytics" },
  ];

  return h("aside", { class: "sidebar" }, [
    h("div", { class: "sidebar-header" }, [
      h("h2", {}, "Dashboard"),
    ]),
    h(
      "nav",
      { class: "sidebar-nav" },
      navItems.map((item) =>
        h(
          "a",
          {
            href: item.href,
            class: `nav-item ${sidebarData.activeSection === item.id ? "active" : ""}`,
          },
          item.label
        )
      )
    ),
  ]);
}

/**
 * Loading Component
 */
function LoadingSpinner({ message = "Loading..." }: { message?: string }): VNode {
  return h("div", { class: "loading-spinner" }, [
    h("div", { class: "spinner" }),
    h("p", {}, message),
  ]);
}

/**
 * Dashboard Overview - Main content
 */
function DashboardOverview({ data }: SlotComponentProps): VNode {
  return h("div", { class: "dashboard-overview" }, [
    h("h1", {}, "Dashboard Overview"),
    h("div", { class: "overview-grid" }, [
      h("div", { class: "stat-card" }, [
        h("h3", {}, "Welcome Back!"),
        h("p", {}, "Here's what's happening with your application today."),
      ]),
      h("div", { class: "stat-card" }, [
        h("h3", {}, "Quick Stats"),
        h("p", {}, "All systems operational"),
      ]),
    ]),
  ]);
}

/**
 * Users List - Main content
 */
function UsersList({ data }: SlotComponentProps): VNode {
  const users = data as User[];

  return h("div", { class: "users-list" }, [
    h("h1", {}, "Users"),
    h("div", { class: "users-actions" }, [
      h("button", { class: "btn-primary" }, "+ Add User"),
      h("input", { type: "search", placeholder: "Search users..." }),
    ]),
    h(
      "table",
      { class: "users-table" },
      [
        h("thead", {}, [
          h("tr", {}, [
            h("th", {}, "Name"),
            h("th", {}, "Email"),
            h("th", {}, "Role"),
            h("th", {}, "Last Active"),
            h("th", {}, "Actions"),
          ]),
        ]),
        h(
          "tbody",
          {},
          users.map((user) =>
            h("tr", {}, [
              h("td", {}, user.name),
              h("td", {}, user.email),
              h("td", {}, h("span", { class: `role-badge role-${user.role.toLowerCase()}` }, user.role)),
              h("td", {}, user.lastActive),
              h("td", {}, [
                h("button", { class: "btn-sm" }, "Edit"),
                h("button", { class: "btn-sm btn-danger" }, "Delete"),
              ]),
            ])
          )
        ),
      ]
    ),
  ]);
}

/**
 * Settings Page - Main content
 */
function SettingsPage({ data }: SlotComponentProps): VNode {
  const settings = data as Settings;

  return h("div", { class: "settings-page" }, [
    h("h1", {}, "Settings"),
    h("div", { class: "settings-form" }, [
      h("div", { class: "form-group" }, [
        h("label", {}, "Theme"),
        h("select", { value: settings.theme }, [
          h("option", { value: "light" }, "Light"),
          h("option", { value: "dark" }, "Dark"),
          h("option", { value: "auto" }, "Auto"),
        ]),
      ]),
      h("div", { class: "form-group" }, [
        h("label", {}, [
          h("input", { type: "checkbox", checked: settings.notifications }),
          " Enable Notifications",
        ]),
      ]),
      h("div", { class: "form-group" }, [
        h("label", {}, "Language"),
        h("select", { value: settings.language }, [
          h("option", { value: "en" }, "English"),
          h("option", { value: "es" }, "Spanish"),
          h("option", { value: "fr" }, "French"),
        ]),
      ]),
      h("button", { class: "btn-primary" }, "Save Changes"),
    ]),
  ]);
}

/**
 * Analytics Widget
 */
function AnalyticsWidget({ data, loading }: SlotComponentProps & { loading?: boolean }): VNode {
  if (loading) {
    return LoadingSpinner({ message: "Loading analytics..." });
  }

  const analytics = data as AnalyticsData;

  return h("div", { class: "analytics-widget" }, [
    h("h3", {}, "Analytics"),
    h("div", { class: "analytics-grid" }, [
      h("div", { class: "metric-card" }, [
        h("div", { class: "metric-value" }, analytics.totalUsers.toLocaleString()),
        h("div", { class: "metric-label" }, "Total Users"),
      ]),
      h("div", { class: "metric-card" }, [
        h("div", { class: "metric-value" }, analytics.activeUsers.toLocaleString()),
        h("div", { class: "metric-label" }, "Active Users"),
      ]),
      h("div", { class: "metric-card" }, [
        h("div", { class: "metric-value" }, `$${analytics.revenue.toLocaleString()}`),
        h("div", { class: "metric-label" }, "Revenue"),
      ]),
      h("div", { class: "metric-card metric-positive" }, [
        h("div", { class: "metric-value" }, `+${analytics.growth}%`),
        h("div", { class: "metric-label" }, "Growth"),
      ]),
    ]),
  ]);
}

/**
 * Dashboard Layout - Combines all slots
 */
function DashboardLayout({
  sidebar,
  main,
  analytics,
}: {
  sidebar: VNode | null;
  main: VNode | null;
  analytics?: VNode | null;
}): VNode {
  return h("div", { class: "dashboard-layout" }, [
    sidebar,
    h("div", { class: "dashboard-content" }, [
      analytics, // Top analytics bar
      h("div", { class: "dashboard-main" }, main),
    ]),
  ]);
}

// ============================================================================
// Route Configuration
// ============================================================================

/**
 * Configure parallel routes for dashboard.
 */
export const dashboardConfig: ParallelRouteConfig = createParallelRouteConfig({
  basePath: "/dashboard",
  mainSlot: "@main",
  slots: [
    // Sidebar slot - always present
    {
      name: "@sidebar",
      path: "/",
      loader: async () => {
        return await getSidebarData();
      },
      component: Sidebar,
      loadingComponent: () => LoadingSpinner({ message: "Loading navigation..." }),
    },
    // Analytics slot - always present
    {
      name: "@analytics",
      path: "/",
      loader: async () => {
        return await getAnalytics();
      },
      component: AnalyticsWidget,
      loadingComponent: () => LoadingSpinner({ message: "Loading analytics..." }),
    },
    // Main slot - Overview
    {
      name: "@main",
      path: "/",
      component: DashboardOverview,
    },
    // Main slot - Users
    {
      name: "@main",
      path: "/users",
      loader: async () => {
        return await getUsers();
      },
      component: UsersList,
      loadingComponent: () => LoadingSpinner({ message: "Loading users..." }),
    },
    // Main slot - Settings
    {
      name: "@main",
      path: "/settings",
      loader: async () => {
        return await getSettings();
      },
      component: SettingsPage,
      loadingComponent: () => LoadingSpinner({ message: "Loading settings..." }),
    },
  ],
});

// ============================================================================
// Usage Example with Streaming
// ============================================================================

/**
 * Render dashboard with streaming support.
 * Slots load and render independently.
 */
export async function renderDashboard(container: HTMLElement): Promise<void> {
  const pathname = window.location.pathname;

  // Match routes
  const matches = matchParallelRoutes(pathname, dashboardConfig);

  if (!matches) {
    container.innerHTML = "<h1>404 - Page not found</h1>";
    return;
  }

  // Render loading states first
  renderLoadingState(container, matches);

  // Load data for all slots in parallel (no waterfall!)
  const request = new Request(window.location.href);
  const loadedSlots = await loadParallelSlots(matches, request);

  // Render final state
  const searchParams = new URLSearchParams(window.location.search);
  const rendered = renderParallelSlots(loadedSlots, searchParams);

  // Create layout with slots
  const layout = DashboardLayout({
    sidebar: rendered["@sidebar"],
    main: rendered["@main"],
    analytics: rendered["@analytics"],
  });

  // Update DOM
  container.innerHTML = "";
  container.appendChild(renderToDOM(layout));
}

/**
 * Render loading state for slots.
 */
function renderLoadingState(
  container: HTMLElement,
  matches: Map<string, any>
): void {
  const loadingComponents: Record<string, VNode> = {};

  for (const [slotName, match] of matches.entries()) {
    if (match.slot.loadingComponent) {
      loadingComponents[slotName] = match.slot.loadingComponent({});
    }
  }

  const layout = DashboardLayout({
    sidebar: loadingComponents["@sidebar"] || null,
    main: loadingComponents["@main"] || null,
    analytics: loadingComponents["@analytics"] || null,
  });

  container.innerHTML = "";
  container.appendChild(renderToDOM(layout));
}

/**
 * Simple helper to render VNode to DOM
 */
function renderToDOM(vnode: VNode | string | null): Node {
  if (!vnode || typeof vnode === "string") {
    return document.createTextNode(vnode || "");
  }

  const el = document.createElement(vnode.type);

  // Set props
  if (vnode.props) {
    for (const [key, value] of Object.entries(vnode.props)) {
      if (key === "children") continue;
      if (key.startsWith("on")) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, value as EventListener);
      } else if (key === "checked" && typeof value === "boolean") {
        (el as HTMLInputElement).checked = value;
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }

  // Render children
  if (vnode.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];

    for (const child of children) {
      if (child) {
        el.appendChild(renderToDOM(child));
      }
    }
  }

  return el;
}

// ============================================================================
// Advanced: Streaming with Progressive Rendering
// ============================================================================

/**
 * Render dashboard with progressive streaming.
 * Each slot updates as its data loads.
 */
export async function renderDashboardStreaming(container: HTMLElement): Promise<void> {
  const pathname = window.location.pathname;
  const matches = matchParallelRoutes(pathname, dashboardConfig);

  if (!matches) {
    container.innerHTML = "<h1>404 - Page not found</h1>";
    return;
  }

  // Initial render with loading states
  renderLoadingState(container, matches);

  // Create a map to track slot updates
  const slotUpdates = new Map<string, any>();

  // Function to update a single slot
  const updateSlot = (slotName: string, data: any) => {
    slotUpdates.set(slotName, data);

    // Re-render entire layout with updated slots
    const searchParams = new URLSearchParams(window.location.search);
    const rendered: Record<string, VNode | null> = {};

    for (const [name, match] of matches.entries()) {
      const slotData = slotUpdates.get(name);
      if (slotData) {
        const Component = match.slot.component;
        if (Component) {
          rendered[name] = Component({
            params: match.params,
            searchParams,
            data: slotData.data,
            error: slotData.error,
            slotName: name,
          });
        }
      } else if (match.slot.loadingComponent) {
        rendered[name] = match.slot.loadingComponent({});
      }
    }

    const layout = DashboardLayout({
      sidebar: rendered["@sidebar"] || null,
      main: rendered["@main"] || null,
      analytics: rendered["@analytics"] || null,
    });

    container.innerHTML = "";
    container.appendChild(renderToDOM(layout));
  };

  // Load each slot independently and update as data arrives
  const request = new Request(window.location.href);

  for (const [slotName, match] of matches.entries()) {
    if (match.slot.loader) {
      // Load slot data
      match.slot
        .loader({
          params: match.params,
          request,
          url: new URL(request.url),
        })
        .then((data) => {
          updateSlot(slotName, { data });
        })
        .catch((error) => {
          updateSlot(slotName, { error });
        });
    } else {
      // No loader, render immediately
      updateSlot(slotName, { data: undefined });
    }
  }
}

// ============================================================================
// CSS Styles (for reference)
// ============================================================================

/**
 * Suggested CSS for this example:
 *
 * ```css
 * .dashboard-layout {
 *   display: grid;
 *   grid-template-columns: 250px 1fr;
 *   height: 100vh;
 * }
 *
 * .sidebar {
 *   background: #1a1a1a;
 *   color: white;
 *   padding: 1rem;
 * }
 *
 * .sidebar-nav {
 *   display: flex;
 *   flex-direction: column;
 *   gap: 0.5rem;
 * }
 *
 * .nav-item {
 *   padding: 0.75rem 1rem;
 *   border-radius: 6px;
 *   color: #ccc;
 *   text-decoration: none;
 *   transition: all 0.2s;
 * }
 *
 * .nav-item:hover {
 *   background: #2a2a2a;
 *   color: white;
 * }
 *
 * .nav-item.active {
 *   background: #0066cc;
 *   color: white;
 * }
 *
 * .dashboard-content {
 *   display: flex;
 *   flex-direction: column;
 *   overflow: auto;
 * }
 *
 * .analytics-widget {
 *   padding: 1.5rem;
 *   background: #f5f5f5;
 *   border-bottom: 1px solid #ddd;
 * }
 *
 * .analytics-grid {
 *   display: grid;
 *   grid-template-columns: repeat(4, 1fr);
 *   gap: 1rem;
 * }
 *
 * .metric-card {
 *   background: white;
 *   padding: 1.5rem;
 *   border-radius: 8px;
 *   box-shadow: 0 2px 4px rgba(0,0,0,0.1);
 * }
 *
 * .metric-value {
 *   font-size: 2rem;
 *   font-weight: bold;
 * }
 *
 * .metric-label {
 *   color: #666;
 *   margin-top: 0.5rem;
 * }
 *
 * .dashboard-main {
 *   padding: 2rem;
 * }
 *
 * .users-table {
 *   width: 100%;
 *   border-collapse: collapse;
 *   margin-top: 1rem;
 * }
 *
 * .users-table th,
 * .users-table td {
 *   padding: 1rem;
 *   text-align: left;
 *   border-bottom: 1px solid #ddd;
 * }
 *
 * .loading-spinner {
 *   display: flex;
 *   flex-direction: column;
 *   align-items: center;
 *   justify-content: center;
 *   padding: 3rem;
 * }
 *
 * .spinner {
 *   border: 4px solid #f3f3f3;
 *   border-top: 4px solid #0066cc;
 *   border-radius: 50%;
 *   width: 40px;
 *   height: 40px;
 *   animation: spin 1s linear infinite;
 * }
 *
 * @keyframes spin {
 *   0% { transform: rotate(0deg); }
 *   100% { transform: rotate(360deg); }
 * }
 * ```
 */
