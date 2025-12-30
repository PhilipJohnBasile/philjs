/**
 * Router Decorator
 *
 * Wraps stories with a mock router context
 */

import { createMockRouter } from '../mocks/router-mocks.js';

export interface WithRouterOptions {
  initialPath?: string;
  params?: Record<string, string>;
}

/**
 * Decorator that provides router context to stories
 */
export function withRouter(options: WithRouterOptions = {}) {
  const { initialPath = '/', params = {} } = options;

  return (storyFn: () => any, context: any) => {
    const router = createMockRouter(initialPath);

    if (Object.keys(params).length > 0) {
      router.params.set(params);
    }

    // Attach router to context for story access
    if (context && context.parameters) {
      context.parameters['router'] = router;
    }

    return storyFn();
  };
}
