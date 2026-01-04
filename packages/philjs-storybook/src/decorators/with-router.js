/**
 * Router Decorator
 *
 * Wraps stories with a mock router context
 */
import { createMockRouter } from '../mocks/router-mocks.js';
/**
 * Decorator that provides router context to stories
 */
export function withRouter(options = {}) {
    const { initialPath = '/', params = {} } = options;
    return (storyFn, context) => {
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
//# sourceMappingURL=with-router.js.map