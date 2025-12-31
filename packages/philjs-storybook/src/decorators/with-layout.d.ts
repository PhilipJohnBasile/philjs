/**
 * Layout Decorator
 *
 * Wraps stories with layout containers
 */
export type LayoutType = 'centered' | 'fullscreen' | 'padded' | 'none';
export interface WithLayoutOptions {
    type?: LayoutType;
    padding?: string;
    background?: string;
    maxWidth?: string;
}
/**
 * Decorator that wraps stories in a layout container
 */
export declare function withLayout(options?: WithLayoutOptions): (storyFn: () => any, _context: any) => any;
//# sourceMappingURL=with-layout.d.ts.map