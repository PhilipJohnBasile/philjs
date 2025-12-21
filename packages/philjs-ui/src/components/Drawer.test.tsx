/**
 * Tests for Drawer, DrawerHeader, DrawerBody, and DrawerFooter Components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Drawer, DrawerHeader, DrawerBody, DrawerFooter } from './Drawer';

describe('Drawer', () => {
  beforeEach(() => {
    // Reset body overflow
    document.body.style.overflow = '';
  });

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      const vnode = Drawer({
        isOpen: false,
        onClose: vi.fn(),
        children: 'Content',
      });

      expect(vnode).toBeNull();
    });

    it('should render when isOpen is true', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        children: 'Content',
      });

      expect(vnode).not.toBeNull();
      expect(vnode.type).toBe('div');
      expect(vnode.props.role).toBe('dialog');
      expect(vnode.props['aria-modal']).toBe('true');
    });

    it('should render overlay', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        children: 'Content',
      });

      const overlay = vnode.props.children[0];
      expect(overlay.props.className).toContain('bg-black/50');
      expect(overlay.props['aria-hidden']).toBe('true');
    });
  });

  describe('placements', () => {
    it('should apply right placement (default)', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        placement: 'right',
        children: 'Content',
      });

      const container = vnode.props.children[1];
      expect(container.props.className).toContain('right-0');
      expect(container.props.className).toContain('inset-y-0');
    });

    it('should apply left placement', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        placement: 'left',
        children: 'Content',
      });

      const container = vnode.props.children[1];
      expect(container.props.className).toContain('left-0');
      expect(container.props.className).toContain('inset-y-0');
    });

    it('should apply top placement', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        placement: 'top',
        children: 'Content',
      });

      const container = vnode.props.children[1];
      expect(container.props.className).toContain('top-0');
      expect(container.props.className).toContain('inset-x-0');
    });

    it('should apply bottom placement', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        placement: 'bottom',
        children: 'Content',
      });

      const container = vnode.props.children[1];
      expect(container.props.className).toContain('bottom-0');
      expect(container.props.className).toContain('inset-x-0');
    });
  });

  describe('sizes', () => {
    it('should apply xs size for left/right placement', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        size: 'xs',
        placement: 'right',
        children: 'Content',
      });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[1];
      const containerChildren = Array.isArray(container.props.children)
        ? container.props.children
        : [container.props.children];
      const panel = containerChildren[0];
      expect(panel.props.className).toContain('w-64');
    });

    it('should apply md size for left/right placement', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        size: 'md',
        placement: 'right',
        children: 'Content',
      });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[1];
      const containerChildren = Array.isArray(container.props.children)
        ? container.props.children
        : [container.props.children];
      const panel = containerChildren[0];
      expect(panel.props.className).toContain('w-96');
    });

    it('should apply full size for left/right placement', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        size: 'full',
        placement: 'right',
        children: 'Content',
      });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[1];
      const containerChildren = Array.isArray(container.props.children)
        ? container.props.children
        : [container.props.children];
      const panel = containerChildren[0];
      expect(panel.props.className).toContain('w-screen');
    });

    it('should apply xs size for top/bottom placement', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        size: 'xs',
        placement: 'top',
        children: 'Content',
      });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[1];
      const containerChildren = Array.isArray(container.props.children)
        ? container.props.children
        : [container.props.children];
      const panel = containerChildren[0];
      expect(panel.props.className).toContain('h-32');
    });
  });

  describe('title', () => {
    it('should render title when provided', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        title: 'Drawer Title',
        children: 'Content',
      });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[1];
      const containerChildren = Array.isArray(container.props.children)
        ? container.props.children
        : [container.props.children];
      const panel = containerChildren[0];
      const panelChildren = Array.isArray(panel.props.children)
        ? panel.props.children
        : [panel.props.children];
      const header = panelChildren[0];
      const headerChildren = Array.isArray(header.props.children)
        ? header.props.children
        : [header.props.children];
      const title = headerChildren[0];

      expect(title.type).toBe('h2');
      // Children may be wrapped in array
      const titleText = Array.isArray(title.props.children)
        ? title.props.children[0]
        : title.props.children;
      expect(titleText).toBe('Drawer Title');
    });
  });

  describe('close button', () => {
    it('should show close button by default', () => {
      const onClose = vi.fn();
      const vnode = Drawer({
        isOpen: true,
        onClose,
        title: 'Title',
        children: 'Content',
      });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[1];
      const containerChildren = Array.isArray(container.props.children)
        ? container.props.children
        : [container.props.children];
      const panel = containerChildren[0];
      const panelChildren = Array.isArray(panel.props.children)
        ? panel.props.children
        : [panel.props.children];
      const header = panelChildren[0];
      const headerChildren = Array.isArray(header.props.children)
        ? header.props.children
        : [header.props.children];
      const closeButton = headerChildren[1];

      expect(closeButton.type).toBe('button');
      expect(closeButton.props['aria-label']).toBe('Close drawer');
    });

    it('should hide close button when showCloseButton is false', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        showCloseButton: false,
        children: 'Content',
      });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[1];
      const containerChildren = Array.isArray(container.props.children)
        ? container.props.children
        : [container.props.children];
      const panel = containerChildren[0];
      const panelChildren = Array.isArray(panel.props.children)
        ? panel.props.children
        : [panel.props.children];
      // No header when no title and no close button, OR header exists but no close button
      const header = panelChildren[0];
      const isFalsy = !header || header === false;
      const hasNoCloseButton = isFalsy || (header.props && !findCloseButton(header));
      expect(hasNoCloseButton).toBe(true);
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      const vnode = Drawer({
        isOpen: true,
        onClose,
        title: 'Title',
        children: 'Content',
      });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[1];
      const containerChildren = Array.isArray(container.props.children)
        ? container.props.children
        : [container.props.children];
      const panel = containerChildren[0];
      const panelChildren = Array.isArray(panel.props.children)
        ? panel.props.children
        : [panel.props.children];
      const header = panelChildren[0];
      const headerChildren = Array.isArray(header.props.children)
        ? header.props.children
        : [header.props.children];
      const closeButton = headerChildren[1];

      expect(closeButton.props.onClick).toBe(onClose);
    });
  });

  describe('overlay click', () => {
    it('should close on overlay click by default', () => {
      const onClose = vi.fn();
      const vnode = Drawer({
        isOpen: true,
        onClose,
        children: 'Content',
      });

      const overlay = vnode.props.children[0];
      overlay.props.onClick();

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close on overlay click when closeOnOverlay is false', () => {
      const onClose = vi.fn();
      const vnode = Drawer({
        isOpen: true,
        onClose,
        closeOnOverlay: false,
        children: 'Content',
      });

      const overlay = vnode.props.children[0];
      overlay.props.onClick();

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('content', () => {
    it('should render content in scrollable area', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        children: 'Drawer Content',
      });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[1];
      const containerChildren = Array.isArray(container.props.children)
        ? container.props.children
        : [container.props.children];
      const panel = containerChildren[0];
      const panelChildren = Array.isArray(panel.props.children)
        ? panel.props.children
        : [panel.props.children];
      const content = panelChildren[1];

      expect(content.props.className).toContain('overflow-y-auto');
    });
  });

  describe('styling', () => {
    it('should have z-index', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        children: 'Content',
      });

      expect(vnode.props.className).toContain('z-50');
    });

    it('should have shadow', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        children: 'Content',
      });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[1];
      const containerChildren = Array.isArray(container.props.children)
        ? container.props.children
        : [container.props.children];
      const panel = containerChildren[0];

      expect(panel.props.className).toContain('shadow-xl');
    });

    it('should have transition animation', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        children: 'Content',
      });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[1];
      const containerChildren = Array.isArray(container.props.children)
        ? container.props.children
        : [container.props.children];
      const panel = containerChildren[0];

      expect(panel.props.className).toContain('transition-transform');
      expect(panel.props.className).toContain('duration-300');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        className: 'custom-drawer',
        children: 'Content',
      });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const container = children[1];
      const containerChildren = Array.isArray(container.props.children)
        ? container.props.children
        : [container.props.children];
      const panel = containerChildren[0];

      expect(panel.props.className).toContain('custom-drawer');
    });

    it('should accept overlay className', () => {
      const vnode = Drawer({
        isOpen: true,
        onClose: vi.fn(),
        overlayClassName: 'custom-overlay',
        children: 'Content',
      });

      const overlay = vnode.props.children[0];
      expect(overlay.props.className).toContain('custom-overlay');
    });
  });
});

describe('DrawerHeader', () => {
  it('should render children', () => {
    const vnode = DrawerHeader({ children: 'Header Content' });

    expect(vnode.type).toBe('div');
    // Children may be wrapped in array
    const content = Array.isArray(vnode.props.children)
      ? vnode.props.children[0]
      : vnode.props.children;
    expect(content).toBe('Header Content');
  });

  it('should have border bottom', () => {
    const vnode = DrawerHeader({ children: 'Header' });

    expect(vnode.props.className).toContain('border-b');
    expect(vnode.props.className).toContain('border-gray-200');
  });

  it('should have padding', () => {
    const vnode = DrawerHeader({ children: 'Header' });

    expect(vnode.props.className).toContain('px-4');
    expect(vnode.props.className).toContain('py-3');
  });

  it('should accept custom className', () => {
    const vnode = DrawerHeader({ children: 'Header', className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('DrawerBody', () => {
  it('should render children', () => {
    const vnode = DrawerBody({ children: 'Body Content' });

    expect(vnode.type).toBe('div');
    // Children may be wrapped in array
    const content = Array.isArray(vnode.props.children)
      ? vnode.props.children[0]
      : vnode.props.children;
    expect(content).toBe('Body Content');
  });

  it('should be flex-1 for flexible height', () => {
    const vnode = DrawerBody({ children: 'Body' });

    expect(vnode.props.className).toContain('flex-1');
  });

  it('should be scrollable', () => {
    const vnode = DrawerBody({ children: 'Body' });

    expect(vnode.props.className).toContain('overflow-y-auto');
  });

  it('should have padding', () => {
    const vnode = DrawerBody({ children: 'Body' });

    expect(vnode.props.className).toContain('px-4');
    expect(vnode.props.className).toContain('py-3');
  });

  it('should accept custom className', () => {
    const vnode = DrawerBody({ children: 'Body', className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('DrawerFooter', () => {
  it('should render children', () => {
    const vnode = DrawerFooter({ children: 'Footer Content' });

    expect(vnode.type).toBe('div');
    // Children may be wrapped in array
    const content = Array.isArray(vnode.props.children)
      ? vnode.props.children[0]
      : vnode.props.children;
    expect(content).toBe('Footer Content');
  });

  it('should have border top', () => {
    const vnode = DrawerFooter({ children: 'Footer' });

    expect(vnode.props.className).toContain('border-t');
    expect(vnode.props.className).toContain('border-gray-200');
  });

  it('should have flex with justify-end', () => {
    const vnode = DrawerFooter({ children: 'Footer' });

    expect(vnode.props.className).toContain('flex');
    expect(vnode.props.className).toContain('justify-end');
    expect(vnode.props.className).toContain('gap-2');
  });

  it('should have padding', () => {
    const vnode = DrawerFooter({ children: 'Footer' });

    expect(vnode.props.className).toContain('px-4');
    expect(vnode.props.className).toContain('py-3');
  });

  it('should accept custom className', () => {
    const vnode = DrawerFooter({ children: 'Footer', className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

// Helper function to find close button in vnode tree
function findCloseButton(vnode: any): any {
  if (vnode?.props?.['aria-label'] === 'Close drawer') return vnode;
  if (vnode?.type === 'button' && vnode?.props?.['aria-label'] === 'Close drawer') return vnode;
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findCloseButton(child);
      if (found) return found;
    }
  }
  return null;
}
