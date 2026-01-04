/**
 * PhilJS Storybook Renderer
 *
 * Custom renderer that integrates PhilJS components with Storybook
 */
import { render as philJSRender } from '@philjs/core';
/**
 * Render a PhilJS story
 */
export function renderToCanvas({ storyFn, showMain, showError, showException }, context) {
    const element = storyFn();
    if (!element) {
        showError({
            title: 'Expecting a PhilJS element from the story',
            description: `Did you forget to return the PhilJS element from the story?
      Use "() => <MyComponent />" or "() => { return <MyComponent />; }" when defining the story.`,
        });
        return;
    }
    try {
        const rootElement = document.getElementById('storybook-root');
        if (!rootElement) {
            throw new Error('storybook-root element not found');
        }
        showMain();
        philJSRender(element, rootElement);
    }
    catch (err) {
        showException(err);
    }
}
/**
 * Clean up after a story
 */
export function cleanUpPreviousStory() {
    const rootElement = document.getElementById('storybook-root');
    if (rootElement) {
        rootElement.innerHTML = '';
    }
}
/**
 * Renderer configuration
 */
export const renderer = {
    renderToCanvas,
    cleanUpPreviousStory,
};
export default renderer;
//# sourceMappingURL=renderer.js.map