/**
 * PhilJS Storybook Renderer
 *
 * Custom renderer that integrates PhilJS components with Storybook
 */
type ComponentType<P = any> = (props: P) => any;
export interface RenderContext {
    args: Record<string, any>;
    argTypes: Record<string, any>;
    globals: Record<string, any>;
    hooks: any;
    parameters: Record<string, any>;
    viewMode: string;
}
export interface StoryContext extends RenderContext {
    id: string;
    kind: string;
    name: string;
    story: string;
    component?: ComponentType<any>;
}
/**
 * Render a PhilJS story
 */
export declare function renderToCanvas({ storyFn, showMain, showError, showException }: any, context: StoryContext): void;
/**
 * Clean up after a story
 */
export declare function cleanUpPreviousStory(): void;
/**
 * Renderer configuration
 */
export declare const renderer: {
    renderToCanvas: typeof renderToCanvas;
    cleanUpPreviousStory: typeof cleanUpPreviousStory;
};
export default renderer;
//# sourceMappingURL=renderer.d.ts.map