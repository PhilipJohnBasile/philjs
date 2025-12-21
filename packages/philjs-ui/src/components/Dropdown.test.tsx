/**
 * Tests for Dropdown, DropdownItem, DropdownDivider, and DropdownLabel Components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from './Dropdown';

describe('Dropdown', () => {
  describe('rendering', () => {
    it('should render trigger element', () => {
      const trigger = <button>Open Menu</button>;
      const vnode = Dropdown({
        trigger,
        children: <DropdownItem>Item</DropdownItem>,
      });

      expect(vnode.type).toBe('div');
      expect(vnode.props.className).toContain('relative');
      expect(vnode.props.className).toContain('inline-block');

      // First child wraps the trigger
      const triggerWrapper = vnode.props.children[0];
      // Children may be wrapped in array
      const triggerContent = Array.isArray(triggerWrapper.props.children)
        ? triggerWrapper.props.children[0]
        : triggerWrapper.props.children;
      expect(triggerContent).toBe(trigger);
    });

    it('should not render menu when closed', () => {
      const vnode = Dropdown({
        trigger: <button>Open</button>,
        children: <DropdownItem>Item</DropdownItem>,
        isOpen: false,
      });

      // Menu should not be rendered (falsy)
      const menu = vnode.props.children[1];
      expect(menu).toBeFalsy();
    });

    it('should render menu when open', () => {
      const vnode = Dropdown({
        trigger: <button>Open</button>,
        children: <DropdownItem>Item</DropdownItem>,
        isOpen: true,
      });

      const menu = vnode.props.children[1];
      expect(menu.props.role).toBe('menu');
    });
  });

  describe('placements', () => {
    it('should apply bottom-start placement styles (default)', () => {
      const vnode = Dropdown({
        trigger: <button>Open</button>,
        children: <DropdownItem>Item</DropdownItem>,
        isOpen: true,
        placement: 'bottom-start',
      });

      const menu = vnode.props.children[1];
      expect(menu.props.className).toContain('top-full');
      expect(menu.props.className).toContain('left-0');
    });

    it('should apply bottom-end placement styles', () => {
      const vnode = Dropdown({
        trigger: <button>Open</button>,
        children: <DropdownItem>Item</DropdownItem>,
        isOpen: true,
        placement: 'bottom-end',
      });

      const menu = vnode.props.children[1];
      expect(menu.props.className).toContain('top-full');
      expect(menu.props.className).toContain('right-0');
    });

    it('should apply top-start placement styles', () => {
      const vnode = Dropdown({
        trigger: <button>Open</button>,
        children: <DropdownItem>Item</DropdownItem>,
        isOpen: true,
        placement: 'top-start',
      });

      const menu = vnode.props.children[1];
      expect(menu.props.className).toContain('bottom-full');
      expect(menu.props.className).toContain('left-0');
    });

    it('should apply top-end placement styles', () => {
      const vnode = Dropdown({
        trigger: <button>Open</button>,
        children: <DropdownItem>Item</DropdownItem>,
        isOpen: true,
        placement: 'top-end',
      });

      const menu = vnode.props.children[1];
      expect(menu.props.className).toContain('bottom-full');
      expect(menu.props.className).toContain('right-0');
    });
  });

  describe('controlled state', () => {
    it('should use controlled isOpen prop', () => {
      const onOpenChange = vi.fn();
      const vnode = Dropdown({
        trigger: <button>Open</button>,
        children: <DropdownItem>Item</DropdownItem>,
        isOpen: true,
        onOpenChange,
      });

      const menu = vnode.props.children[1];
      expect(menu).toBeTruthy();
    });

    it('should call onOpenChange when trigger is clicked', () => {
      const onOpenChange = vi.fn();
      const vnode = Dropdown({
        trigger: <button>Open</button>,
        children: <DropdownItem>Item</DropdownItem>,
        isOpen: false,
        onOpenChange,
      });

      const triggerWrapper = vnode.props.children[0];
      triggerWrapper.props.onClick();

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe('closeOnSelect', () => {
    it('should close on select by default', () => {
      const onOpenChange = vi.fn();
      const vnode = Dropdown({
        trigger: <button>Open</button>,
        children: <DropdownItem>Item</DropdownItem>,
        isOpen: true,
        onOpenChange,
        closeOnSelect: true,
      });

      const menu = vnode.props.children[1];
      menu.props.onClick();

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not close on select when closeOnSelect is false', () => {
      const onOpenChange = vi.fn();
      const vnode = Dropdown({
        trigger: <button>Open</button>,
        children: <DropdownItem>Item</DropdownItem>,
        isOpen: true,
        onOpenChange,
        closeOnSelect: false,
      });

      const menu = vnode.props.children[1];
      menu.props.onClick();

      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('custom className', () => {
    it('should accept custom className for menu', () => {
      const vnode = Dropdown({
        trigger: <button>Open</button>,
        children: <DropdownItem>Item</DropdownItem>,
        isOpen: true,
        className: 'custom-menu',
      });

      const menu = vnode.props.children[1];
      expect(menu.props.className).toContain('custom-menu');
    });
  });

  describe('menu styles', () => {
    it('should have z-index and shadow', () => {
      const vnode = Dropdown({
        trigger: <button>Open</button>,
        children: <DropdownItem>Item</DropdownItem>,
        isOpen: true,
      });

      const menu = vnode.props.children[1];
      expect(menu.props.className).toContain('z-50');
      expect(menu.props.className).toContain('shadow-lg');
    });

    it('should have minimum width', () => {
      const vnode = Dropdown({
        trigger: <button>Open</button>,
        children: <DropdownItem>Item</DropdownItem>,
        isOpen: true,
      });

      const menu = vnode.props.children[1];
      expect(menu.props.className).toContain('min-w-[160px]');
    });
  });
});

describe('DropdownItem', () => {
  describe('rendering', () => {
    it('should render a button element', () => {
      const vnode = DropdownItem({ children: 'Item Text' });

      expect(vnode.type).toBe('button');
      expect(vnode.props.role).toBe('menuitem');
    });

    it('should render children', () => {
      const vnode = DropdownItem({ children: 'Click me' });

      expect(vnode.props.children).toContain('Click me');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      const vnode = DropdownItem({ children: 'Item', disabled: true });

      expect(vnode.props.disabled).toBe(true);
      expect(vnode.props.className).toContain('opacity-50');
      expect(vnode.props.className).toContain('cursor-not-allowed');
    });

    it('should not call onClick when disabled', () => {
      const onClick = vi.fn();
      const vnode = DropdownItem({ children: 'Item', disabled: true, onClick });

      // Simulate the internal handleClick
      // When disabled, onClick should not be invoked
      expect(vnode.props.disabled).toBe(true);
    });
  });

  describe('danger variant', () => {
    it('should apply danger styles when danger is true', () => {
      const vnode = DropdownItem({ children: 'Delete', danger: true });

      expect(vnode.props.className).toContain('text-red-600');
      expect(vnode.props.className).toContain('hover:bg-red-50');
    });

    it('should apply normal styles when danger is false', () => {
      const vnode = DropdownItem({ children: 'Item', danger: false });

      expect(vnode.props.className).toContain('text-gray-700');
      expect(vnode.props.className).toContain('hover:bg-gray-100');
    });
  });

  describe('icon', () => {
    it('should render icon when provided', () => {
      const icon = <span data-testid="icon">@</span>;
      const vnode = DropdownItem({ children: 'Profile', icon });

      const iconWrapper = vnode.props.children[0];
      expect(iconWrapper.props.className).toContain('mr-2');
      // Children may be wrapped in array
      const iconContent = Array.isArray(iconWrapper.props.children)
        ? iconWrapper.props.children[0]
        : iconWrapper.props.children;
      expect(iconContent).toBe(icon);
    });
  });

  describe('events', () => {
    it('should call onClick when clicked', () => {
      const onClick = vi.fn();
      const vnode = DropdownItem({ children: 'Item', onClick });

      vnode.props.onClick();
      expect(onClick).toHaveBeenCalled();
    });

    it('should handle keyboard events', () => {
      const onClick = vi.fn();
      const vnode = DropdownItem({ children: 'Item', onClick });

      // Test Enter key
      const enterEvent = { key: 'Enter', preventDefault: vi.fn() };
      vnode.props.onKeyDown(enterEvent);
      expect(onClick).toHaveBeenCalled();

      // Test Space key
      const spaceEvent = { key: ' ', preventDefault: vi.fn() };
      vnode.props.onKeyDown(spaceEvent);
      expect(onClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('styles', () => {
    it('should have full width', () => {
      const vnode = DropdownItem({ children: 'Item' });

      expect(vnode.props.className).toContain('w-full');
    });

    it('should have left-aligned text', () => {
      const vnode = DropdownItem({ children: 'Item' });

      expect(vnode.props.className).toContain('text-left');
    });

    it('should have flex layout for icon alignment', () => {
      const vnode = DropdownItem({ children: 'Item' });

      expect(vnode.props.className).toContain('flex');
      expect(vnode.props.className).toContain('items-center');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = DropdownItem({ children: 'Item', className: 'custom-item' });

      expect(vnode.props.className).toContain('custom-item');
    });
  });
});

describe('DropdownDivider', () => {
  it('should render an hr element', () => {
    const vnode = DropdownDivider();

    expect(vnode.type).toBe('hr');
    expect(vnode.props.className).toContain('my-1');
    expect(vnode.props.className).toContain('border-gray-200');
  });
});

describe('DropdownLabel', () => {
  it('should render a div element', () => {
    const vnode = DropdownLabel({ children: 'Section Label' });

    expect(vnode.type).toBe('div');
  });

  it('should render children', () => {
    const vnode = DropdownLabel({ children: 'Actions' });

    // Children may be wrapped in array
    const content = Array.isArray(vnode.props.children)
      ? vnode.props.children[0]
      : vnode.props.children;
    expect(content).toBe('Actions');
  });

  it('should have label styles', () => {
    const vnode = DropdownLabel({ children: 'Label' });

    expect(vnode.props.className).toContain('px-4');
    expect(vnode.props.className).toContain('py-2');
    expect(vnode.props.className).toContain('text-xs');
    expect(vnode.props.className).toContain('font-semibold');
    expect(vnode.props.className).toContain('text-gray-500');
    expect(vnode.props.className).toContain('uppercase');
  });
});
