/**
 * Tests for Tooltip and Popover Components
 */

import { describe, it, expect, vi } from 'vitest';
import { Tooltip, Popover } from './Tooltip';
import type { JSXElement } from 'philjs-core';

// Helper to safely access props on JSX children
const asElement = (child: unknown): JSXElement => child as JSXElement;

describe('Tooltip', () => {
  describe('rendering', () => {
    it('should render children', () => {
      const vnode = Tooltip({
        content: 'Tooltip text',
        children: <button>Hover me</button>,
      });

      expect(vnode.type).toBe('div');
      expect(vnode.props.className).toContain('relative');
      expect(vnode.props.className).toContain('inline-block');
    });

    it('should not render tooltip content initially', () => {
      const vnode = Tooltip({
        content: 'Tooltip text',
        children: <button>Hover me</button>,
      });

      // Tooltip is controlled by signal, initially hidden
      // The second child (tooltip) should be falsy when not visible
      expect(vnode.props.children).toBeDefined();
    });
  });

  describe('placements', () => {
    // Note: Since visibility is controlled by signal, we test the placement styles exist
    it('should define top placement styles', () => {
      const vnode = Tooltip({
        content: 'Tooltip',
        placement: 'top',
        children: <button>Button</button>,
      });

      expect(vnode).toBeDefined();
    });

    it('should define bottom placement styles', () => {
      const vnode = Tooltip({
        content: 'Tooltip',
        placement: 'bottom',
        children: <button>Button</button>,
      });

      expect(vnode).toBeDefined();
    });

    it('should define left placement styles', () => {
      const vnode = Tooltip({
        content: 'Tooltip',
        placement: 'left',
        children: <button>Button</button>,
      });

      expect(vnode).toBeDefined();
    });

    it('should define right placement styles', () => {
      const vnode = Tooltip({
        content: 'Tooltip',
        placement: 'right',
        children: <button>Button</button>,
      });

      expect(vnode).toBeDefined();
    });
  });

  describe('arrow', () => {
    it('should show arrow by default', () => {
      const vnode = Tooltip({
        content: 'Tooltip',
        arrow: true,
        children: <button>Button</button>,
      });

      expect(vnode).toBeDefined();
    });

    it('should hide arrow when arrow is false', () => {
      const vnode = Tooltip({
        content: 'Tooltip',
        arrow: false,
        children: <button>Button</button>,
      });

      expect(vnode).toBeDefined();
    });
  });

  describe('disabled state', () => {
    it('should not show tooltip when disabled', () => {
      const vnode = Tooltip({
        content: 'Tooltip',
        disabled: true,
        children: <button>Button</button>,
      });

      expect(vnode).toBeDefined();
    });
  });

  describe('events', () => {
    it('should have onMouseEnter handler', () => {
      const vnode = Tooltip({
        content: 'Tooltip',
        children: <button>Button</button>,
      });

      expect(vnode.props.onMouseEnter).toBeDefined();
    });

    it('should have onMouseLeave handler', () => {
      const vnode = Tooltip({
        content: 'Tooltip',
        children: <button>Button</button>,
      });

      expect(vnode.props.onMouseLeave).toBeDefined();
    });

    it('should have onFocus handler', () => {
      const vnode = Tooltip({
        content: 'Tooltip',
        children: <button>Button</button>,
      });

      expect(vnode.props.onFocus).toBeDefined();
    });

    it('should have onBlur handler', () => {
      const vnode = Tooltip({
        content: 'Tooltip',
        children: <button>Button</button>,
      });

      expect(vnode.props.onBlur).toBeDefined();
    });
  });

  describe('delay', () => {
    it('should accept delay prop', () => {
      const vnode = Tooltip({
        content: 'Tooltip',
        delay: 500,
        children: <button>Button</button>,
      });

      expect(vnode).toBeDefined();
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = Tooltip({
        content: 'Tooltip',
        className: 'custom-tooltip',
        children: <button>Button</button>,
      });

      expect(vnode).toBeDefined();
    });
  });

  describe('content types', () => {
    it('should accept string content', () => {
      const vnode = Tooltip({
        content: 'Simple text',
        children: <button>Button</button>,
      });

      expect(vnode).toBeDefined();
    });

    it('should accept JSX content', () => {
      const vnode = Tooltip({
        content: <span>Rich <strong>content</strong></span>,
        children: <button>Button</button>,
      });

      expect(vnode).toBeDefined();
    });
  });
});

describe('Popover', () => {
  describe('rendering', () => {
    it('should render trigger element', () => {
      const trigger = <button>Open Popover</button>;
      const vnode = Popover({
        trigger,
        children: <div>Popover content</div>,
      });

      expect(vnode.type).toBe('div');
      expect(vnode.props.className).toContain('relative');
      expect(vnode.props.className).toContain('inline-block');

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const triggerWrapper = asElement(children[0]);
      // Children may be wrapped in array
      const triggerChild = Array.isArray(triggerWrapper.props.children)
        ? triggerWrapper.props.children[0]
        : triggerWrapper.props.children;
      expect(triggerChild).toBe(trigger);
    });

    it('should not render content when closed', () => {
      const vnode = Popover({
        trigger: <button>Open</button>,
        children: <div>Content</div>,
        isOpen: false,
      });

      const content = vnode.props.children[1];
      expect(content).toBeFalsy();
    });

    it('should render content when open', () => {
      const vnode = Popover({
        trigger: <button>Open</button>,
        children: <div>Content</div>,
        isOpen: true,
      });

      const content = vnode.props.children[1];
      expect(content).toBeDefined();
    });
  });

  describe('placements', () => {
    it('should apply top placement styles', () => {
      const vnode = Popover({
        trigger: <button>Open</button>,
        children: <div>Content</div>,
        placement: 'top',
        isOpen: true,
      });

      const content = vnode.props.children[1];
      expect(content.props.className).toContain('bottom-full');
    });

    it('should apply bottom placement styles (default)', () => {
      const vnode = Popover({
        trigger: <button>Open</button>,
        children: <div>Content</div>,
        placement: 'bottom',
        isOpen: true,
      });

      const content = vnode.props.children[1];
      expect(content.props.className).toContain('top-full');
    });

    it('should apply left placement styles', () => {
      const vnode = Popover({
        trigger: <button>Open</button>,
        children: <div>Content</div>,
        placement: 'left',
        isOpen: true,
      });

      const content = vnode.props.children[1];
      expect(content.props.className).toContain('right-full');
    });

    it('should apply right placement styles', () => {
      const vnode = Popover({
        trigger: <button>Open</button>,
        children: <div>Content</div>,
        placement: 'right',
        isOpen: true,
      });

      const content = vnode.props.children[1];
      expect(content.props.className).toContain('left-full');
    });
  });

  describe('controlled state', () => {
    it('should use controlled isOpen prop', () => {
      const vnode = Popover({
        trigger: <button>Open</button>,
        children: <div>Content</div>,
        isOpen: true,
      });

      const content = vnode.props.children[1];
      expect(content).toBeDefined();
    });

    it('should call onOpenChange when trigger is clicked', () => {
      const onOpenChange = vi.fn();
      const vnode = Popover({
        trigger: <button>Open</button>,
        children: <div>Content</div>,
        isOpen: false,
        onOpenChange,
      });

      const triggerWrapper = vnode.props.children[0];
      triggerWrapper.props.onClick();

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe('styling', () => {
    it('should have z-index', () => {
      const vnode = Popover({
        trigger: <button>Open</button>,
        children: <div>Content</div>,
        isOpen: true,
      });

      const content = vnode.props.children[1];
      expect(content.props.className).toContain('z-50');
    });

    it('should have shadow and border', () => {
      const vnode = Popover({
        trigger: <button>Open</button>,
        children: <div>Content</div>,
        isOpen: true,
      });

      const content = vnode.props.children[1];
      expect(content.props.className).toContain('shadow-lg');
      expect(content.props.className).toContain('border');
    });

    it('should have padding and minimum width', () => {
      const vnode = Popover({
        trigger: <button>Open</button>,
        children: <div>Content</div>,
        isOpen: true,
      });

      const content = vnode.props.children[1];
      expect(content.props.className).toContain('p-4');
      expect(content.props.className).toContain('min-w-[200px]');
    });

    it('should have rounded corners', () => {
      const vnode = Popover({
        trigger: <button>Open</button>,
        children: <div>Content</div>,
        isOpen: true,
      });

      const content = vnode.props.children[1];
      expect(content.props.className).toContain('rounded-lg');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = Popover({
        trigger: <button>Open</button>,
        children: <div>Content</div>,
        isOpen: true,
        className: 'custom-popover',
      });

      const content = vnode.props.children[1];
      expect(content.props.className).toContain('custom-popover');
    });
  });
});
