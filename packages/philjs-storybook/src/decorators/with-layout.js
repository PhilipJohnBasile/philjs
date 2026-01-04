/**
 * Layout Decorator
 *
 * Wraps stories with layout containers
 */
/**
 * Decorator that wraps stories in a layout container
 */
export function withLayout(options = {}) {
    const { type = 'padded', padding = '1rem', background = 'transparent', maxWidth = 'none' } = options;
    return (storyFn, _context) => {
        const element = storyFn();
        // Apply layout styles to storybook root
        const root = document.getElementById('storybook-root');
        if (root) {
            switch (type) {
                case 'centered':
                    root.style.display = 'flex';
                    root.style.justifyContent = 'center';
                    root.style.alignItems = 'center';
                    root.style.minHeight = '100vh';
                    root.style.padding = padding;
                    root.style.background = background;
                    break;
                case 'fullscreen':
                    root.style.width = '100vw';
                    root.style.height = '100vh';
                    root.style.padding = '0';
                    root.style.margin = '0';
                    root.style.background = background;
                    break;
                case 'padded':
                    root.style.padding = padding;
                    root.style.maxWidth = maxWidth;
                    root.style.background = background;
                    break;
                case 'none':
                default:
                    // No styling applied
                    break;
            }
        }
        return element;
    };
}
//# sourceMappingURL=with-layout.js.map