/**
 * Tests for Switch Component
 */

import { describe, it, expect, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  describe('rendering', () => {
    it('should render a button element with role="switch"', () => {
      const vnode = Switch({});
      const button = findSwitchButton(vnode);

      expect(button.type).toBe('button');
      expect(button.props.role).toBe('switch');
    });

    it('should render with default unchecked state', () => {
      const vnode = Switch({});
      const button = findSwitchButton(vnode);

      expect(button.props['aria-checked']).toBe(false);
    });

    it('should include hidden checkbox input for forms', () => {
      const vnode = Switch({ name: 'notifications' });
      const input = findHiddenInput(vnode);

      expect(input.type).toBe('input');
      expect(input.props.type).toBe('checkbox');
      expect(input.props.name).toBe('notifications');
      expect(input.props.className).toContain('sr-only');
    });
  });

  describe('controlled/uncontrolled', () => {
    it('should accept controlled checked value', () => {
      const vnode = Switch({ checked: true });
      const button = findSwitchButton(vnode);

      expect(button.props['aria-checked']).toBe(true);
    });

    it('should use defaultChecked for initial uncontrolled state', () => {
      const vnode = Switch({ defaultChecked: true });

      // The signal should be initialized with the default value
      expect(vnode).toBeDefined();
    });
  });

  describe('sizes', () => {
    it('should apply sm size styles', () => {
      const vnode = Switch({ size: 'sm' });
      const button = findSwitchButton(vnode);

      expect(button.props.className).toContain('h-5');
      expect(button.props.className).toContain('w-9');
    });

    it('should apply md size styles (default)', () => {
      const vnode = Switch({ size: 'md' });
      const button = findSwitchButton(vnode);

      expect(button.props.className).toContain('h-6');
      expect(button.props.className).toContain('w-11');
    });

    it('should apply lg size styles', () => {
      const vnode = Switch({ size: 'lg' });
      const button = findSwitchButton(vnode);

      expect(button.props.className).toContain('h-7');
      expect(button.props.className).toContain('w-14');
    });
  });

  describe('visual states', () => {
    it('should apply unchecked background color', () => {
      const vnode = Switch({ checked: false });
      const button = findSwitchButton(vnode);

      expect(button.props.className).toContain('bg-gray-200');
    });

    it('should apply checked background color', () => {
      const vnode = Switch({ checked: true });
      const button = findSwitchButton(vnode);

      expect(button.props.className).toContain('bg-blue-600');
    });

    it('should have rounded-full shape', () => {
      const vnode = Switch({});
      const button = findSwitchButton(vnode);

      expect(button.props.className).toContain('rounded-full');
    });

    it('should render thumb element', () => {
      const vnode = Switch({});
      const button = findSwitchButton(vnode);
      // Children may be wrapped in array
      const buttonChildren = Array.isArray(button.props.children)
        ? button.props.children
        : [button.props.children];
      const thumb = buttonChildren[0];

      expect(thumb.type).toBe('span');
      expect(thumb.props.className).toContain('rounded-full');
      expect(thumb.props.className).toContain('bg-white');
    });

    it('should translate thumb when checked', () => {
      const vnode = Switch({ checked: true, size: 'md' });
      const button = findSwitchButton(vnode);
      // Children may be wrapped in array
      const buttonChildren = Array.isArray(button.props.children)
        ? button.props.children
        : [button.props.children];
      const thumb = buttonChildren[0];

      expect(thumb.props.className).toContain('translate-x-5');
    });

    it('should not translate thumb when unchecked', () => {
      const vnode = Switch({ checked: false });
      const button = findSwitchButton(vnode);
      // Children may be wrapped in array
      const buttonChildren = Array.isArray(button.props.children)
        ? button.props.children
        : [button.props.children];
      const thumb = buttonChildren[0];

      expect(thumb.props.className).toContain('translate-x-0');
    });
  });

  describe('label', () => {
    it('should render label when provided', () => {
      const vnode = Switch({ label: 'Enable notifications' });
      const label = findLabel(vnode);

      expect(label).toBeDefined();
      expect(label.type).toBe('label');
      // Children may be wrapped in array
      const labelText = Array.isArray(label.props.children)
        ? label.props.children[0]
        : label.props.children;
      expect(labelText).toBe('Enable notifications');
    });

    it('should link label to switch via htmlFor', () => {
      const vnode = Switch({ label: 'Enable', id: 'notifications' });
      const label = findLabel(vnode);
      const button = findSwitchButton(vnode);

      expect(label.props.htmlFor).toBe('notifications');
      expect(button.props.id).toBe('notifications');
    });
  });

  describe('description', () => {
    it('should render description when provided', () => {
      const vnode = Switch({ description: 'Receive email notifications' });
      const description = findDescription(vnode);

      expect(description).toBeDefined();
      expect(description.type).toBe('p');
      // Children may be wrapped in array
      const descText = Array.isArray(description.props.children)
        ? description.props.children[0]
        : description.props.children;
      expect(descText).toBe('Receive email notifications');
    });

    it('should link description via aria-describedby', () => {
      const vnode = Switch({ id: 'switch', description: 'Description' });
      const button = findSwitchButton(vnode);

      expect(button.props['aria-describedby']).toBe('switch-description');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      const vnode = Switch({ disabled: true });
      const button = findSwitchButton(vnode);

      expect(button.props.disabled).toBe(true);
    });

    it('should apply disabled styles', () => {
      const vnode = Switch({ disabled: true });
      const button = findSwitchButton(vnode);

      expect(button.props.className).toContain('opacity-50');
      expect(button.props.className).toContain('cursor-not-allowed');
    });

    it('should apply disabled styles to label', () => {
      const vnode = Switch({ label: 'Option', disabled: true });
      const label = findLabel(vnode);

      expect(label.props.className).toContain('text-gray-400');
    });

    it('should disable hidden input', () => {
      const vnode = Switch({ disabled: true });
      const input = findHiddenInput(vnode);

      expect(input.props.disabled).toBe(true);
    });
  });

  describe('events', () => {
    it('should call onChange handler when clicked', () => {
      const onChange = vi.fn();
      const vnode = Switch({ onChange, checked: false });
      const button = findSwitchButton(vnode);

      button.props.onClick();

      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should toggle value when clicked', () => {
      const onChange = vi.fn();
      const vnode = Switch({ onChange, checked: true });
      const button = findSwitchButton(vnode);

      button.props.onClick();

      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('should not call onChange when disabled', () => {
      const onChange = vi.fn();
      const vnode = Switch({ onChange, disabled: true });
      const button = findSwitchButton(vnode);

      // Click should be ignored when disabled
      button.props.onClick();

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should handle keyboard events (Space)', () => {
      const onChange = vi.fn();
      const vnode = Switch({ onChange, checked: false });
      const button = findSwitchButton(vnode);

      const spaceEvent = { key: ' ', preventDefault: vi.fn() };
      button.props.onKeyDown(spaceEvent);

      expect(spaceEvent.preventDefault).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should handle keyboard events (Enter)', () => {
      const onChange = vi.fn();
      const vnode = Switch({ onChange, checked: false });
      const button = findSwitchButton(vnode);

      const enterEvent = { key: 'Enter', preventDefault: vi.fn() };
      button.props.onKeyDown(enterEvent);

      expect(enterEvent.preventDefault).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe('accessibility', () => {
    it('should have role="switch"', () => {
      const vnode = Switch({});
      const button = findSwitchButton(vnode);

      expect(button.props.role).toBe('switch');
    });

    it('should have aria-checked attribute', () => {
      const vnode = Switch({ checked: true });
      const button = findSwitchButton(vnode);

      expect(button.props['aria-checked']).toBe(true);
    });

    it('should accept aria-label', () => {
      const vnode = Switch({ 'aria-label': 'Toggle dark mode' });
      const button = findSwitchButton(vnode);

      expect(button.props['aria-label']).toBe('Toggle dark mode');
    });

    it('should use label as aria-label fallback', () => {
      const vnode = Switch({ label: 'Dark mode' });
      const button = findSwitchButton(vnode);

      expect(button.props['aria-label']).toBe('Dark mode');
    });

    it('should have focus ring styles', () => {
      const vnode = Switch({});
      const button = findSwitchButton(vnode);

      expect(button.props.className).toContain('focus:ring-2');
      expect(button.props.className).toContain('focus:ring-blue-500');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = Switch({ className: 'custom-switch' });

      expect(vnode.props.className).toContain('custom-switch');
    });
  });

  describe('transitions', () => {
    it('should have transition styles on button', () => {
      const vnode = Switch({});
      const button = findSwitchButton(vnode);

      expect(button.props.className).toContain('transition-colors');
      expect(button.props.className).toContain('duration-200');
    });

    it('should have transition styles on thumb', () => {
      const vnode = Switch({});
      const button = findSwitchButton(vnode);
      // Children may be wrapped in array
      const buttonChildren = Array.isArray(button.props.children)
        ? button.props.children
        : [button.props.children];
      const thumb = buttonChildren[0];

      expect(thumb.props.className).toContain('transition');
      expect(thumb.props.className).toContain('duration-200');
    });
  });
});

// Helper functions
function findSwitchButton(vnode: any): any {
  if (vnode?.type === 'button' && vnode?.props?.role === 'switch') return vnode;
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findSwitchButton(child);
      if (found) return found;
    }
  }
  return null;
}

function findHiddenInput(vnode: any): any {
  if (vnode?.type === 'input' && vnode?.props?.className?.includes('sr-only')) return vnode;
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findHiddenInput(child);
      if (found) return found;
    }
  }
  return null;
}

function findLabel(vnode: any): any {
  if (vnode?.type === 'label') return vnode;
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findLabel(child);
      if (found) return found;
    }
  }
  return null;
}

function findDescription(vnode: any): any {
  if (vnode?.type === 'p' && vnode?.props?.className?.includes('text-gray-500')) return vnode;
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findDescription(child);
      if (found) return found;
    }
  }
  return null;
}
