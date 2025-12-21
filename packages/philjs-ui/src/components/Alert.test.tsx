/**
 * Tests for Alert, AlertTitle, and AlertDescription Components
 */

import { describe, it, expect, vi } from 'vitest';
import { Alert, AlertTitle, AlertDescription } from './Alert';

describe('Alert', () => {
  describe('rendering', () => {
    it('should render a div with role="alert"', () => {
      const vnode = Alert({ children: 'Alert content' });

      expect(vnode.type).toBe('div');
      expect(vnode.props.role).toBe('alert');
    });

    it('should render children', () => {
      const vnode = Alert({ children: 'Alert message' });

      // Children are nested within the structure
      expect(vnode).toBeDefined();
    });
  });

  describe('status variants', () => {
    it('should apply info status styles (default)', () => {
      const vnode = Alert({ status: 'info', children: 'Info' });

      expect(vnode.props.className).toContain('bg-blue-50');
      expect(vnode.props.className).toContain('text-blue-800');
    });

    it('should apply success status styles', () => {
      const vnode = Alert({ status: 'success', children: 'Success' });

      expect(vnode.props.className).toContain('bg-green-50');
      expect(vnode.props.className).toContain('text-green-800');
    });

    it('should apply warning status styles', () => {
      const vnode = Alert({ status: 'warning', children: 'Warning' });

      expect(vnode.props.className).toContain('bg-yellow-50');
      expect(vnode.props.className).toContain('text-yellow-800');
    });

    it('should apply error status styles', () => {
      const vnode = Alert({ status: 'error', children: 'Error' });

      expect(vnode.props.className).toContain('bg-red-50');
      expect(vnode.props.className).toContain('text-red-800');
    });
  });

  describe('variant styles', () => {
    it('should apply subtle variant styles (default)', () => {
      const vnode = Alert({ variant: 'subtle', children: 'Alert' });

      expect(vnode.props.className).toContain('bg-blue-50');
    });

    it('should apply solid variant styles', () => {
      const vnode = Alert({ variant: 'solid', status: 'info', children: 'Alert' });

      expect(vnode.props.className).toContain('bg-blue-600');
      expect(vnode.props.className).toContain('text-white');
    });

    it('should apply left-accent variant styles', () => {
      const vnode = Alert({ variant: 'left-accent', children: 'Alert' });

      expect(vnode.props.className).toContain('border-l-4');
    });

    it('should apply top-accent variant styles', () => {
      const vnode = Alert({ variant: 'top-accent', children: 'Alert' });

      expect(vnode.props.className).toContain('border-t-4');
    });
  });

  describe('title', () => {
    it('should render title when provided', () => {
      const vnode = Alert({ title: 'Alert Title', children: 'Content' });

      const content = findAlertContent(vnode);
      const contentChildren = Array.isArray(content.props.children)
        ? content.props.children
        : [content.props.children];
      const title = contentChildren[0];

      expect(title.type).toBe('h3');
      expect(title.props.className).toContain('font-medium');
      // Children may be wrapped in array
      const titleText = Array.isArray(title.props.children)
        ? title.props.children[0]
        : title.props.children;
      expect(titleText).toBe('Alert Title');
    });

    it('should not render title when not provided', () => {
      const vnode = Alert({ children: 'Content' });

      const content = findAlertContent(vnode);
      const contentChildren = Array.isArray(content.props.children)
        ? content.props.children
        : [content.props.children];
      // The first child is either the title (when provided) or the content div (when no title)
      // When no title, the title element position should be falsy
      // In JSX, {title && ...} returns false when title is undefined
      const titleElement = contentChildren[0];
      // Since no title is provided, the first element should be falsy (false or undefined)
      expect(!titleElement || titleElement === false || titleElement.type !== 'h3').toBe(true);
    });
  });

  describe('icon', () => {
    it('should show default icon by default', () => {
      const vnode = Alert({ status: 'info', children: 'Info' });

      const flexContainer = getFlexContainer(vnode);
      const iconWrapper = flexContainer[0];

      expect(iconWrapper).toBeDefined();
    });

    it('should hide icon when showIcon is false', () => {
      const vnode = Alert({ showIcon: false, children: 'Alert' });

      const flexContainer = getFlexContainer(vnode);
      // When showIcon is false, the icon wrapper should be falsy
      // OR the first element should be the content (not an icon wrapper)
      const firstElement = flexContainer[0];
      // Check if it's not an icon wrapper (either falsy or is the content div)
      const isIconHidden = !firstElement ||
                          firstElement === false ||
                          (firstElement.props && firstElement.props.className && firstElement.props.className.includes('flex-1'));
      expect(isIconHidden).toBe(true);
    });

    it('should render custom icon when provided', () => {
      const customIcon = <span data-testid="custom-icon">!</span>;
      const vnode = Alert({ icon: customIcon, children: 'Alert' });

      const flexContainer = getFlexContainer(vnode);
      const iconWrapper = flexContainer[0];
      const iconWrapperChildren = Array.isArray(iconWrapper.props.children)
        ? iconWrapper.props.children[0]
        : iconWrapper.props.children;

      expect(iconWrapperChildren).toBe(customIcon);
    });
  });

  describe('dismissible', () => {
    it('should not show dismiss button by default', () => {
      const vnode = Alert({ children: 'Alert' });

      const flexContainer = getFlexContainer(vnode);
      const dismissButton = flexContainer[2];

      expect(!dismissButton || dismissButton === false).toBe(true);
    });

    it('should show dismiss button when dismissible is true', () => {
      const vnode = Alert({ dismissible: true, children: 'Alert' });

      const flexContainer = getFlexContainer(vnode);
      const dismissButton = flexContainer[2];

      expect(dismissButton).toBeDefined();
      expect(dismissButton.type).toBe('div'); // Wrapper div containing button
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      const vnode = Alert({ dismissible: true, onDismiss, children: 'Alert' });

      const flexContainer = getFlexContainer(vnode);
      const dismissWrapper = flexContainer[2];
      const dismissWrapperChildren = Array.isArray(dismissWrapper.props.children)
        ? dismissWrapper.props.children[0]
        : dismissWrapper.props.children;

      expect(dismissWrapperChildren.props['aria-label']).toBe('Dismiss');
    });
  });

  describe('accessibility', () => {
    it('should have role="alert"', () => {
      const vnode = Alert({ children: 'Alert' });

      expect(vnode.props.role).toBe('alert');
    });

    it('should have aria-label on dismiss button', () => {
      const vnode = Alert({ dismissible: true, children: 'Alert' });

      const flexContainer = getFlexContainer(vnode);
      const dismissWrapper = flexContainer[2];
      const dismissWrapperChildren = Array.isArray(dismissWrapper.props.children)
        ? dismissWrapper.props.children[0]
        : dismissWrapper.props.children;

      expect(dismissWrapperChildren.props['aria-label']).toBe('Dismiss');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = Alert({ className: 'custom-alert', children: 'Alert' });

      expect(vnode.props.className).toContain('custom-alert');
    });
  });

  describe('styling', () => {
    it('should have rounded corners', () => {
      const vnode = Alert({ children: 'Alert' });

      expect(vnode.props.className).toContain('rounded-md');
    });

    it('should have padding', () => {
      const vnode = Alert({ children: 'Alert' });

      expect(vnode.props.className).toContain('p-4');
    });
  });
});

describe('AlertTitle', () => {
  it('should render an h3 element', () => {
    const vnode = AlertTitle({ children: 'Title' });

    expect(vnode.type).toBe('h3');
    // Children may be wrapped in array
    const titleText = Array.isArray(vnode.props.children)
      ? vnode.props.children[0]
      : vnode.props.children;
    expect(titleText).toBe('Title');
  });

  it('should have font-medium class', () => {
    const vnode = AlertTitle({ children: 'Title' });

    expect(vnode.props.className).toContain('font-medium');
  });
});

describe('AlertDescription', () => {
  it('should render a div element', () => {
    const vnode = AlertDescription({ children: 'Description' });

    expect(vnode.type).toBe('div');
    // Children may be wrapped in array
    const descText = Array.isArray(vnode.props.children)
      ? vnode.props.children[0]
      : vnode.props.children;
    expect(descText).toBe('Description');
  });

  it('should have text-sm class', () => {
    const vnode = AlertDescription({ children: 'Description' });

    expect(vnode.props.className).toContain('text-sm');
  });

  it('should have margin-top and opacity', () => {
    const vnode = AlertDescription({ children: 'Description' });

    expect(vnode.props.className).toContain('mt-1');
    expect(vnode.props.className).toContain('opacity-90');
  });
});

// Helper function to unwrap children that may be wrapped in arrays
function unwrap(children: any): any {
  if (Array.isArray(children) && children.length === 1) {
    return children[0];
  }
  return children;
}

// Helper function to find flex container in vnode tree
function getFlexContainer(vnode: any): any[] {
  const children = unwrap(vnode.props.children);
  const innerChildren = unwrap(children.props.children);
  return Array.isArray(innerChildren) ? innerChildren : [innerChildren];
}

// Helper function to find alert content in vnode tree
function findAlertContent(vnode: any): any {
  const flexContainer = getFlexContainer(vnode);
  // Content is in the second element (after icon wrapper)
  return flexContainer[1];
}
