/**
 * Layout Decorator
 *
 * Wrap stories with layout containers
 */

import type { StoryContext } from '../renderer.js';

export type LayoutType = 'centered' | 'fullscreen' | 'padded' | 'none';

const layoutStyles: Record<LayoutType, any> = {
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '16px',
  },
  fullscreen: {
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 0,
  },
  padded: {
    padding: '16px',
  },
  none: {},
};

/**
 * Layout decorator
 */
export function withLayout(
  story: () => any,
  context: StoryContext
): any {
  const layout = (context.parameters?.layout || 'padded') as LayoutType;
  const customStyles = context.parameters?.layoutStyles || {};

  const styles = {
    ...layoutStyles[layout],
    ...customStyles,
  };

  return <div style={styles}>{story()}</div>;
}
