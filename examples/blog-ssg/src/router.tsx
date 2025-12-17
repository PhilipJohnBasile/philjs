import { render } from 'philjs-core';

type RouteEntry = {
  pattern: string;
  load: () => Promise<{ default: (props: any) => any }>;
};

const routes: RouteEntry[] = [
  { pattern: '/', load: () => import('./routes/index.tsx') },
  { pattern: '/blog', load: () => import('./routes/blog/index.tsx') },
  { pattern: '/blog/:slug', load: () => import('./routes/blog/[slug].tsx') },
  { pattern: '/tags/:tag', load: () => import('./routes/tags/[tag].tsx') },
];

let outlet: HTMLElement | null = null;

function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const paramNames: string[] = [];
  const regex = new RegExp(
    '^' +
      pattern
        .replace(/\//g, '\\/')
        .replace(/:[^/]+/g, segment => {
          paramNames.push(segment.slice(1));
          return '([^/]+)';
        }) +
      '$'
  );

  const match = pathname.match(regex);
  if (!match) return null;

  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = decodeURIComponent(match[index + 1]);
  });
  return params;
}

async function renderRoute(url: URL) {
  if (!outlet) throw new Error('Router not started');

  for (const entry of routes) {
    const params = matchPath(entry.pattern, url.pathname);
    if (params === null) continue;

    const mod = await entry.load();
    const Component = mod.default;
    render(() => Component({ params, url, navigate }), outlet);
    return;
  }

  render(() => 'Not Found', outlet);
}

export async function navigate(to: string) {
  const url = new URL(to, window.location.origin);
  window.history.pushState({}, '', url.toString());
  await renderRoute(url);
}

export function startRouter(target: HTMLElement) {
  outlet = target;

  document.addEventListener('click', (event) => {
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

    const url = new URL(anchor.href);
    if (url.origin !== window.location.origin) return;

    event.preventDefault();
    void navigate(url.pathname + url.search + url.hash);
  });

  window.addEventListener('popstate', () => {
    renderRoute(new URL(window.location.href));
  });

  renderRoute(new URL(window.location.href));
}
