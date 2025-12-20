/**
 * Router integration example
 */

import { lazyRoute, LazyRouteManager } from '../src/integrations/router.js';
import { signal } from 'philjs-core';

/**
 * Define lazy routes
 */
const routes = [
  lazyRoute({
    path: '/',
    component: () => <HomePage />,
    loader: async () => {
      // Load home page data
      const response = await fetch('/api/home');
      return response.json();
    },
  }),

  lazyRoute({
    path: '/about',
    component: () => <AboutPage />,
    loader: async () => {
      // Load about page data
      const response = await fetch('/api/about');
      return response.json();
    },
  }),

  lazyRoute({
    path: '/blog/:slug',
    component: () => <BlogPost />,
    loader: async ({ params }: any) => {
      // Load blog post data
      const response = await fetch(`/api/blog/${params.slug}`);
      return response.json();
    },
  }),

  lazyRoute({
    path: '/dashboard',
    component: () => <Dashboard />,
    loader: async () => {
      // Load dashboard data
      const [user, stats] = await Promise.all([
        fetch('/api/user').then((r) => r.json()),
        fetch('/api/stats').then((r) => r.json()),
      ]);
      return { user, stats };
    },
    children: [
      lazyRoute({
        path: '/dashboard/settings',
        component: () => <Settings />,
      }),
    ],
  }),
];

/**
 * Simple router implementation
 */
function Router() {
  const currentPath = signal(window.location.pathname);
  const routeManager = new LazyRouteManager();

  // Add all routes
  routes.forEach((route) => routeManager.addRoute(route));

  // Handle navigation
  window.addEventListener('popstate', () => {
    currentPath.set(window.location.pathname);
  });

  // Get current route
  const currentRoute = signal<any>(null);

  // Load route on path change
  (async () => {
    const route = await routeManager.matchRoute(currentPath());
    if (route) {
      currentRoute.set(route);
    }
  })();

  return (
    <div>
      {currentRoute() ? (
        <RouteRenderer route={currentRoute()} />
      ) : (
        <NotFound />
      )}
    </div>
  );
}

/**
 * Route renderer
 */
function RouteRenderer({ route }: { route: any }) {
  const data = signal<any>(null);
  const loading = signal(true);

  // Load route data
  (async () => {
    if (route.loader) {
      const loaderData = await route.loader.handler();
      data.set(loaderData);
    }
    loading.set(false);
  })();

  if (loading()) {
    return <div>Loading...</div>;
  }

  if (route.component) {
    const Component = route.component.handler;
    return <Component data={data()} />;
  }

  return null;
}

/**
 * Example pages
 */
function HomePage() {
  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to PhilJS!</p>
    </div>
  );
}

function AboutPage() {
  return (
    <div>
      <h1>About</h1>
      <p>Learn more about PhilJS.</p>
    </div>
  );
}

function BlogPost() {
  return (
    <div>
      <h1>Blog Post</h1>
      <p>Read our latest articles.</p>
    </div>
  );
}

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Your dashboard.</p>
    </div>
  );
}

function Settings() {
  return (
    <div>
      <h1>Settings</h1>
      <p>Manage your settings.</p>
    </div>
  );
}

function NotFound() {
  return (
    <div>
      <h1>404 - Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}

export { Router, routes };
