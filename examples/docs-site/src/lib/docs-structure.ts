// Complete documentation structure for PhilJS
// Auto-generated from /docs directory structure

export interface DocItem {
  title: string;
  file: string;
}

export interface DocSection {
  title: string;
  path: string;
  items: DocItem[];
}

// Helper to convert filename to title
function fileToTitle(file: string): string {
  return file
    .replace('.md', '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const docsStructure: DocSection[] = [
  {
    title: 'Getting Started',
    path: 'getting-started',
    items: [
      { title: 'Introduction', file: 'introduction' },
      { title: 'Installation', file: 'installation' },
      { title: 'Quick Start', file: 'quick-start' },
      { title: 'Your First Component', file: 'your-first-component' },
      { title: 'Thinking in PhilJS', file: 'thinking-in-philjs' },
      { title: 'Tutorial: Tic-Tac-Toe', file: 'tutorial-tic-tac-toe' },
      { title: 'Tutorial: Todo App', file: 'tutorial-todo-app' },
      { title: 'Tutorial: Demo App', file: 'tutorial-demo-app' },
      { title: 'Tutorial: Storefront', file: 'tutorial-storefront' },
      { title: 'Tutorial: Static Blog', file: 'tutorial-blog-ssg' },
    ],
  },
  {
    title: 'Learn',
    path: 'learn',
    items: [
      { title: 'Components', file: 'components' },
      { title: 'JSX', file: 'jsx' },
      { title: 'Signals', file: 'signals' },
      { title: 'Memos', file: 'memos' },
      { title: 'Effects', file: 'effects' },
      { title: 'Context', file: 'context' },
      { title: 'Refs', file: 'refs' },
      { title: 'Event Handling', file: 'event-handling' },
      { title: 'Conditional Rendering', file: 'conditional-rendering' },
      { title: 'Lists and Keys', file: 'lists-and-keys' },
      { title: 'Forms', file: 'forms' },
      { title: 'Component Composition', file: 'component-composition' },
      { title: 'Lifecycle', file: 'lifecycle' },
      { title: 'Error Boundaries', file: 'error-boundaries' },
      { title: 'Portals', file: 'portals' },
      { title: 'Suspense & Async', file: 'suspense-async' },
      { title: 'Code Splitting', file: 'code-splitting' },
      { title: 'Lazy Loading', file: 'lazy-loading' },
      { title: 'Styling', file: 'styling' },
      { title: 'Animations', file: 'animations' },
      { title: 'Performance', file: 'performance' },
      { title: 'Testing', file: 'testing' },
      { title: 'TypeScript', file: 'typescript' },
      { title: 'TypeScript Integration', file: 'typescript-integration' },
      { title: 'Asset Handling', file: 'asset-handling' },
      { title: 'Environment Variables', file: 'environment-variables' },
      { title: 'Server vs Client', file: 'server-vs-client' },
    ],
  },
  {
    title: 'Routing',
    path: 'routing',
    items: [
      { title: 'Overview', file: 'overview' },
      { title: 'Basics', file: 'basics' },
      { title: 'Navigation', file: 'navigation' },
      { title: 'Dynamic Routes', file: 'dynamic-routes' },
      { title: 'Route Parameters', file: 'route-parameters' },
      { title: 'Layouts', file: 'layouts' },
      { title: 'Route Groups', file: 'route-groups' },
      { title: 'Parallel Routes', file: 'parallel-routes' },
      { title: 'Intercepting Routes', file: 'intercepting-routes' },
      { title: 'Data Loading', file: 'data-loading' },
      { title: 'Loading States', file: 'loading-states' },
      { title: 'Error Handling', file: 'error-handling' },
      { title: 'Route Guards', file: 'route-guards' },
      { title: 'Middleware', file: 'middleware' },
      { title: 'API Routes', file: 'api-routes' },
      { title: 'View Transitions', file: 'view-transitions' },
    ],
  },
  {
    title: 'Data Fetching',
    path: 'data-fetching',
    items: [
      { title: 'Overview', file: 'overview' },
      { title: 'Queries', file: 'queries' },
      { title: 'Mutations', file: 'mutations' },
      { title: 'Caching', file: 'caching' },
      { title: 'Loading States', file: 'loading-states' },
      { title: 'Error Handling', file: 'error-handling-data' },
      { title: 'Prefetching', file: 'prefetching' },
      { title: 'Pagination', file: 'pagination' },
      { title: 'Optimistic Updates', file: 'optimistic-updates' },
      { title: 'Real-time Data', file: 'real-time' },
      { title: 'Server Functions', file: 'server-functions' },
      { title: 'Server-side Rendering', file: 'server-side-rendering' },
      { title: 'Static Generation', file: 'static-generation' },
    ],
  },
  {
    title: 'Forms',
    path: 'forms',
    items: [
      { title: 'Overview', file: 'overview' },
      { title: 'Basics', file: 'basics' },
      { title: 'Validation', file: 'validation' },
      { title: 'Submission', file: 'submission' },
      { title: 'Form Actions', file: 'actions' },
      { title: 'Controlled vs Uncontrolled', file: 'controlled-uncontrolled' },
      { title: 'Complex Forms', file: 'complex-forms' },
      { title: 'Multi-step Forms', file: 'multi-step' },
      { title: 'File Uploads', file: 'file-uploads' },
      { title: 'Accessibility', file: 'accessibility' },
      { title: 'Form Libraries', file: 'form-libraries' },
    ],
  },
  {
    title: 'Styling',
    path: 'styling',
    items: [
      { title: 'Overview', file: 'overview' },
      { title: 'Inline Styles', file: 'inline-styles' },
      { title: 'CSS Modules', file: 'css-modules' },
      { title: 'CSS-in-JS', file: 'css-in-js' },
      { title: 'Styled Components', file: 'styled-components' },
      { title: 'Tailwind CSS', file: 'tailwind' },
      { title: 'Sass', file: 'sass' },
      { title: 'Theming', file: 'theming' },
      { title: 'Responsive Design', file: 'responsive' },
      { title: 'Animations', file: 'animations' },
    ],
  },
  {
    title: 'Performance',
    path: 'performance',
    items: [
      { title: 'Overview', file: 'overview' },
      { title: 'Bundle Optimization', file: 'bundle-optimization' },
      { title: 'Bundle Size', file: 'bundle-size' },
      { title: 'Code Splitting', file: 'code-splitting' },
      { title: 'Lazy Loading', file: 'lazy-loading' },
      { title: 'Memoization', file: 'memoization' },
      { title: 'Runtime Performance', file: 'runtime-performance' },
      { title: 'Runtime', file: 'runtime' },
      { title: 'Memory Management', file: 'memory-management' },
      { title: 'Server-side Performance', file: 'server-side' },
      { title: 'Image Optimization', file: 'images' },
      { title: 'Virtual Scrolling', file: 'virtual-scrolling' },
      { title: 'Profiling', file: 'profiling' },
      { title: 'Performance Budgets', file: 'performance-budgets' },
      { title: 'Budgets', file: 'budgets' },
      { title: 'Web Vitals', file: 'web-vitals' },
    ],
  },
  {
    title: 'Advanced',
    path: 'advanced',
    items: [
      { title: 'Overview', file: 'overview' },
      { title: 'Server-side Rendering', file: 'ssr' },
      { title: 'Static Site Generation', file: 'ssg' },
      { title: 'Incremental Static Regeneration', file: 'isr' },
      { title: 'Islands Architecture', file: 'islands' },
      { title: 'Resumability', file: 'resumability' },
      { title: 'State Management', file: 'state-management' },
      { title: 'Middleware', file: 'middleware' },
      { title: 'Authentication', file: 'authentication' },
      { title: 'Auth', file: 'auth' },
      { title: 'Error Boundaries', file: 'error-boundaries' },
      { title: 'Portals', file: 'portals' },
      { title: 'Testing', file: 'testing' },
      { title: 'SEO', file: 'seo' },
      { title: 'Internationalization', file: 'i18n' },
      { title: 'PWA', file: 'pwa' },
      { title: 'Service Workers', file: 'service-workers' },
      { title: 'Web Workers', file: 'web-workers' },
      { title: 'WebSockets', file: 'websockets' },
      { title: 'WebAssembly', file: 'wasm' },
      { title: 'Advanced Patterns', file: 'advanced-patterns' },
    ],
  },
  {
    title: 'API Reference',
    path: 'api-reference',
    items: [
      { title: 'Overview', file: 'overview' },
      { title: 'Core API', file: 'core' },
      { title: 'Components', file: 'components' },
      { title: 'Reactivity', file: 'reactivity' },
      { title: 'Context', file: 'context' },
      { title: 'Router', file: 'router' },
      { title: 'Data', file: 'data' },
      { title: 'SSR', file: 'ssr' },
      { title: 'CLI', file: 'cli' },
      { title: 'Configuration', file: 'config' },
    ],
  },
  {
    title: 'Migration',
    path: 'migration',
    items: [
      { title: 'From React', file: 'from-react' },
      { title: 'From Vue', file: 'from-vue' },
      { title: 'From Svelte', file: 'from-svelte' },
    ],
  },
  {
    title: 'Best Practices',
    path: 'best-practices',
    items: [
      { title: 'Overview', file: 'overview' },
      { title: 'Code Organization', file: 'code-organization' },
      { title: 'Component Patterns', file: 'component-patterns' },
      { title: 'State Management', file: 'state-management' },
      { title: 'Architecture', file: 'architecture' },
      { title: 'Performance', file: 'performance' },
      { title: 'Security', file: 'security' },
      { title: 'Accessibility', file: 'accessibility' },
      { title: 'Testing', file: 'testing' },
      { title: 'Error Handling', file: 'error-handling' },
      { title: 'TypeScript', file: 'typescript' },
      { title: 'Production', file: 'production' },
      { title: 'Deployment', file: 'deployment' },
    ],
  },
  {
    title: 'Troubleshooting',
    path: 'troubleshooting',
    items: [
      { title: 'Overview', file: 'overview' },
      { title: 'Common Issues', file: 'common-issues' },
      { title: 'Performance Issues', file: 'performance-issues' },
      { title: 'Debugging', file: 'debugging' },
      { title: 'FAQ', file: 'faq' },
      { title: 'General FAQ', file: 'faq-general' },
      { title: 'Performance FAQ', file: 'faq-performance' },
      { title: 'TypeScript FAQ', file: 'faq-typescript' },
    ],
  },
];

// Helper function to get all docs as flat array for search
export function getAllDocs() {
  const allDocs: Array<{ section: string; title: string; path: string; file: string }> = [];

  docsStructure.forEach(section => {
    section.items.forEach(item => {
      allDocs.push({
        section: section.title,
        title: item.title,
        path: section.path,
        file: item.file,
      });
    });
  });

  return allDocs;
}

// Helper to get next/previous doc
export function getAdjacentDocs(currentPath: string, currentFile: string) {
  const allDocs = getAllDocs();
  const currentIndex = allDocs.findIndex(
    doc => doc.path === currentPath && doc.file === currentFile
  );

  return {
    prev: currentIndex > 0 ? allDocs[currentIndex - 1] : null,
    next: currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null,
  };
}
