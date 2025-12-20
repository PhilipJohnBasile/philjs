/**
 * Router Decorator
 *
 * Wrap stories with a mock router context
 */

import { createContext } from 'philjs-core/context';
import type { StoryContext } from '../renderer.js';

export interface RouterContext {
  pathname: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  navigate: (path: string) => void;
  back: () => void;
  forward: () => void;
}

const RouterContext = createContext<RouterContext>();

/**
 * Router decorator
 */
export function withRouter(
  story: () => any,
  context: StoryContext
): any {
  const routerParams = context.parameters?.router || {};

  const routerContext: RouterContext = {
    pathname: routerParams.pathname || '/',
    params: routerParams.params || {},
    searchParams: new URLSearchParams(routerParams.searchParams || ''),
    navigate: (path: string) => {
      console.log('Navigate to:', path);
    },
    back: () => {
      console.log('Navigate back');
    },
    forward: () => {
      console.log('Navigate forward');
    },
  };

  return (
    <RouterContext.Provider value={routerContext}>
      {story()}
    </RouterContext.Provider>
  );
}

/**
 * Hook to access router context in stories
 */
export function useRouter(): RouterContext {
  return RouterContext.use();
}
