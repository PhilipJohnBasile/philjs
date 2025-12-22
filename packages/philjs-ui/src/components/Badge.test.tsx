/**
 * Tests for Badge, StatusIndicator, and NotificationBadge Components
 */

import { describe, it, expect } from 'vitest';
import type { JSXElement } from 'philjs-core';

// Helper to safely access props on JSX children
const asElement = (child: unknown): JSXElement => child as JSXElement;
import { Badge, StatusIndicator, NotificationBadge } from './Badge';

describe('Badge', () => {
  describe('rendering', () => {
    it('should render a span element', () => {
      const vnode = Badge({ children: 'Badge' });

      expect(vnode.type).toBe('span');
      // Children may be wrapped in array
      const text = Array.isArray(vnode.props.children)
        ? vnode.props.children[0]
        : vnode.props.children;
      expect(text).toBe('Badge');
    });

    it('should have inline-flex display', () => {
      const vnode = Badge({ children: 'Badge' });

      expect(vnode.props.className).toContain('inline-flex');
      expect(vnode.props.className).toContain('items-center');
    });
  });

  describe('variants', () => {
    it('should apply subtle variant styles (default)', () => {
      const vnode = Badge({ variant: 'subtle', color: 'gray', children: 'Badge' });

      expect(vnode.props.className).toContain('bg-gray-100');
      expect(vnode.props.className).toContain('text-gray-800');
    });

    it('should apply solid variant styles', () => {
      const vnode = Badge({ variant: 'solid', color: 'gray', children: 'Badge' });

      expect(vnode.props.className).toContain('bg-gray-600');
      expect(vnode.props.className).toContain('text-white');
    });

    it('should apply outline variant styles', () => {
      const vnode = Badge({ variant: 'outline', color: 'gray', children: 'Badge' });

      expect(vnode.props.className).toContain('border');
      expect(vnode.props.className).toContain('border-gray-600');
      expect(vnode.props.className).toContain('text-gray-600');
    });
  });

  describe('colors', () => {
    const colors = ['gray', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'cyan', 'purple', 'pink'] as const;

    colors.forEach((color) => {
      it(`should apply ${color} color styles`, () => {
        const vnode = Badge({ color, variant: 'subtle', children: 'Badge' });

        expect(vnode.props.className).toContain(`bg-${color}-100`);
      });
    });
  });

  describe('sizes', () => {
    it('should apply sm size styles', () => {
      const vnode = Badge({ size: 'sm', children: 'Badge' });

      expect(vnode.props.className).toContain('px-1.5');
      expect(vnode.props.className).toContain('py-0.5');
      expect(vnode.props.className).toContain('text-xs');
    });

    it('should apply md size styles (default)', () => {
      const vnode = Badge({ size: 'md', children: 'Badge' });

      expect(vnode.props.className).toContain('px-2');
      expect(vnode.props.className).toContain('py-0.5');
      expect(vnode.props.className).toContain('text-sm');
    });

    it('should apply lg size styles', () => {
      const vnode = Badge({ size: 'lg', children: 'Badge' });

      expect(vnode.props.className).toContain('px-2.5');
      expect(vnode.props.className).toContain('py-1');
      expect(vnode.props.className).toContain('text-base');
    });
  });

  describe('rounded', () => {
    it('should apply rounded corners by default', () => {
      const vnode = Badge({ rounded: false, children: 'Badge' });

      expect(vnode.props.className).toContain('rounded');
      expect(vnode.props.className).not.toContain('rounded-full');
    });

    it('should apply pill shape when rounded is true', () => {
      const vnode = Badge({ rounded: true, children: 'Badge' });

      expect(vnode.props.className).toContain('rounded-full');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = Badge({ className: 'custom-badge', children: 'Badge' });

      expect(vnode.props.className).toContain('custom-badge');
    });
  });

  describe('font styling', () => {
    it('should have font-medium', () => {
      const vnode = Badge({ children: 'Badge' });

      expect(vnode.props.className).toContain('font-medium');
    });
  });
});

describe('StatusIndicator', () => {
  describe('rendering', () => {
    it('should render a span element', () => {
      const vnode = StatusIndicator({ status: 'online' });

      expect(vnode.type).toBe('span');
      expect(vnode.props.className).toContain('inline-flex');
      expect(vnode.props.className).toContain('items-center');
    });

    it('should render status dot', () => {
      const vnode = StatusIndicator({ status: 'online' });

      const dot = vnode.props.children[0];
      expect(dot.type).toBe('span');
      expect(dot.props.className).toContain('rounded-full');
    });
  });

  describe('status colors', () => {
    it('should apply online status color', () => {
      const vnode = StatusIndicator({ status: 'online' });
      const dot = vnode.props.children[0];

      expect(dot.props.className).toContain('bg-green-500');
    });

    it('should apply offline status color', () => {
      const vnode = StatusIndicator({ status: 'offline' });
      const dot = vnode.props.children[0];

      expect(dot.props.className).toContain('bg-gray-400');
    });

    it('should apply busy status color', () => {
      const vnode = StatusIndicator({ status: 'busy' });
      const dot = vnode.props.children[0];

      expect(dot.props.className).toContain('bg-red-500');
    });

    it('should apply away status color', () => {
      const vnode = StatusIndicator({ status: 'away' });
      const dot = vnode.props.children[0];

      expect(dot.props.className).toContain('bg-yellow-500');
    });

    it('should apply idle status color', () => {
      const vnode = StatusIndicator({ status: 'idle' });
      const dot = vnode.props.children[0];

      expect(dot.props.className).toContain('bg-gray-300');
    });
  });

  describe('sizes', () => {
    it('should apply sm size', () => {
      const vnode = StatusIndicator({ status: 'online', size: 'sm' });
      const dot = vnode.props.children[0];

      expect(dot.props.className).toContain('h-2');
      expect(dot.props.className).toContain('w-2');
    });

    it('should apply md size (default)', () => {
      const vnode = StatusIndicator({ status: 'online', size: 'md' });
      const dot = vnode.props.children[0];

      expect(dot.props.className).toContain('h-2.5');
      expect(dot.props.className).toContain('w-2.5');
    });

    it('should apply lg size', () => {
      const vnode = StatusIndicator({ status: 'online', size: 'lg' });
      const dot = vnode.props.children[0];

      expect(dot.props.className).toContain('h-3');
      expect(dot.props.className).toContain('w-3');
    });
  });

  describe('label', () => {
    it('should not render label by default', () => {
      const vnode = StatusIndicator({ status: 'online' });
      const label = vnode.props.children[1];

      expect(label).toBeFalsy();
    });

    it('should render label when provided', () => {
      const vnode = StatusIndicator({ status: 'online', label: 'Online' });
      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const label = asElement(children[1]);

      expect(label.type).toBe('span');
      expect(label.props.className).toContain('ml-2');
      // Children may be wrapped in array
      const labelText = Array.isArray(label.props.children)
        ? label.props.children[0]
        : label.props.children;
      expect(labelText).toBe('Online');
    });
  });

  describe('accessibility', () => {
    it('should hide dot from screen readers', () => {
      const vnode = StatusIndicator({ status: 'online' });
      const dot = asElement(vnode.props.children[0]);

      expect(dot.props['aria-hidden']).toBe(true);
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = StatusIndicator({ status: 'online', className: 'custom' });

      expect(vnode.props.className).toContain('custom');
    });
  });
});

describe('NotificationBadge', () => {
  describe('rendering', () => {
    it('should render a span element', () => {
      const vnode = NotificationBadge({ count: 5 });

      expect(vnode.type).toBe('span');
    });

    it('should render count value', () => {
      const vnode = NotificationBadge({ count: 10 });

      // Children may be wrapped in array
      const countText = Array.isArray(vnode.props.children)
        ? vnode.props.children[0]
        : vnode.props.children;
      expect(countText).toBe('10');
    });
  });

  describe('count display', () => {
    it('should display exact count when under max', () => {
      const vnode = NotificationBadge({ count: 50, max: 99 });

      // Children may be wrapped in array
      const countText = Array.isArray(vnode.props.children)
        ? vnode.props.children[0]
        : vnode.props.children;
      expect(countText).toBe('50');
    });

    it('should display max+ when count exceeds max', () => {
      const vnode = NotificationBadge({ count: 150, max: 99 });

      // Children may be wrapped in array
      const countText = Array.isArray(vnode.props.children)
        ? vnode.props.children[0]
        : vnode.props.children;
      expect(countText).toBe('99+');
    });

    it('should use custom max value', () => {
      const vnode = NotificationBadge({ count: 15, max: 9 });

      // Children may be wrapped in array
      const countText = Array.isArray(vnode.props.children)
        ? vnode.props.children[0]
        : vnode.props.children;
      expect(countText).toBe('9+');
    });
  });

  describe('zero count', () => {
    it('should not render when count is 0 and showZero is false', () => {
      const vnode = NotificationBadge({ count: 0, showZero: false });

      expect(vnode).toBeNull();
    });

    it('should render when count is 0 and showZero is true', () => {
      const vnode = NotificationBadge({ count: 0, showZero: true });

      expect(vnode).not.toBeNull();
      // Children may be wrapped in array
      const countText = Array.isArray(vnode.props.children)
        ? vnode.props.children[0]
        : vnode.props.children;
      expect(countText).toBe('0');
    });
  });

  describe('colors', () => {
    it('should apply red color (default)', () => {
      const vnode = NotificationBadge({ count: 5, color: 'red' });

      expect(vnode.props.className).toContain('bg-red-500');
      expect(vnode.props.className).toContain('text-white');
    });

    it('should apply blue color', () => {
      const vnode = NotificationBadge({ count: 5, color: 'blue' });

      expect(vnode.props.className).toContain('bg-blue-500');
    });

    it('should apply green color', () => {
      const vnode = NotificationBadge({ count: 5, color: 'green' });

      expect(vnode.props.className).toContain('bg-green-500');
    });

    it('should apply gray color', () => {
      const vnode = NotificationBadge({ count: 5, color: 'gray' });

      expect(vnode.props.className).toContain('bg-gray-500');
    });
  });

  describe('styling', () => {
    it('should have pill shape', () => {
      const vnode = NotificationBadge({ count: 5 });

      expect(vnode.props.className).toContain('rounded-full');
    });

    it('should have minimum width', () => {
      const vnode = NotificationBadge({ count: 5 });

      expect(vnode.props.className).toContain('min-w-[1.25rem]');
    });

    it('should have bold font', () => {
      const vnode = NotificationBadge({ count: 5 });

      expect(vnode.props.className).toContain('font-bold');
    });

    it('should center content', () => {
      const vnode = NotificationBadge({ count: 5 });

      expect(vnode.props.className).toContain('inline-flex');
      expect(vnode.props.className).toContain('items-center');
      expect(vnode.props.className).toContain('justify-center');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = NotificationBadge({ count: 5, className: 'custom' });

      expect(vnode.props.className).toContain('custom');
    });
  });
});
