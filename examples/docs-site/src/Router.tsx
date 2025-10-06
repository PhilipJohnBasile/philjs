import { effect, render } from 'philjs-core';

interface Route {
  path: string | ((path: string) => boolean);
  component: () => any;
}

interface RouterProps {
  routes: Route[];
  currentPath: () => string;
}

export function Router({ routes, currentPath }: RouterProps) {
  const containerId = 'router-container';

  effect(() => {
    const path = currentPath();

    // Find matching route
    const route = routes.find(r => {
      if (typeof r.path === 'function') {
        return r.path(path);
      }
      return r.path === path;
    });

    const updateDOM = () => {
      const container = document.getElementById(containerId);
      if (route && container) {
        // Clear and re-render (will cause scroll jump, but navigate() will fix it)
        container.innerHTML = '';
        const vnode = route.component();
        render(vnode, container);
      }
    };

    // Use View Transitions API if available for smooth transitions
    // @ts-ignore - View Transitions API may not be in types yet
    if (typeof document !== 'undefined' && document.startViewTransition) {
      // @ts-ignore
      document.startViewTransition(() => {
        updateDOM();
      });
    } else {
      // Fallback: add fade transition manually
      setTimeout(() => {
        const container = document.getElementById(containerId);
        if (container) {
          container.style.opacity = '0';
          container.style.transition = 'opacity 0.15s ease-out';

          setTimeout(() => {
            updateDOM();
            container.style.opacity = '1';
          }, 150);
        }
      }, 0);
    }
  });

  return (
    <div id={containerId} style="min-height: 100vh;" />
  );
}
