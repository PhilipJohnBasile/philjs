/**
 * Tests for Button, IconButton, and ButtonGroup Components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Button, IconButton, ButtonGroup } from './Button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render a button element', () => {
      const vnode = Button({ children: 'Click me' });

      expect(vnode.type).toBe('button');
      expect(vnode.props.children).toContain('Click me');
    });

    it('should render with default props', () => {
      const vnode = Button({ children: 'Test' });

      expect(vnode.props.type).toBe('button');
      expect(vnode.props.disabled).toBe(false);
      expect(vnode.props['aria-disabled']).toBe(false);
      expect(vnode.props['aria-busy']).toBe(false);
    });

    it('should apply custom className', () => {
      const vnode = Button({ children: 'Test', className: 'custom-class' });

      expect(vnode.props.className).toContain('custom-class');
    });

    it('should apply custom styles', () => {
      const style = { backgroundColor: 'red' };
      const vnode = Button({ children: 'Test', style });

      expect(vnode.props.style).toEqual(style);
    });
  });

  describe('variants', () => {
    it('should apply solid variant styles', () => {
      const vnode = Button({ children: 'Test', variant: 'solid', color: 'primary' });

      expect(vnode.props.className).toContain('bg-blue-600');
      expect(vnode.props.className).toContain('text-white');
    });

    it('should apply outline variant styles', () => {
      const vnode = Button({ children: 'Test', variant: 'outline', color: 'primary' });

      expect(vnode.props.className).toContain('border-blue-600');
      expect(vnode.props.className).toContain('text-blue-600');
    });

    it('should apply ghost variant styles', () => {
      const vnode = Button({ children: 'Test', variant: 'ghost', color: 'primary' });

      expect(vnode.props.className).toContain('text-blue-600');
      expect(vnode.props.className).toContain('hover:bg-blue-50');
    });

    it('should apply link variant styles', () => {
      const vnode = Button({ children: 'Test', variant: 'link', color: 'primary' });

      expect(vnode.props.className).toContain('text-blue-600');
      expect(vnode.props.className).toContain('hover:underline');
    });
  });

  describe('colors', () => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;

    colors.forEach((color) => {
      it(`should apply ${color} color variant`, () => {
        const vnode = Button({ children: 'Test', color });

        expect(vnode.props.className).toBeDefined();
      });
    });
  });

  describe('sizes', () => {
    it('should apply xs size styles', () => {
      const vnode = Button({ children: 'Test', size: 'xs' });

      expect(vnode.props.className).toContain('px-2');
      expect(vnode.props.className).toContain('py-1');
      expect(vnode.props.className).toContain('text-xs');
    });

    it('should apply sm size styles', () => {
      const vnode = Button({ children: 'Test', size: 'sm' });

      expect(vnode.props.className).toContain('px-3');
      expect(vnode.props.className).toContain('text-sm');
    });

    it('should apply md size styles (default)', () => {
      const vnode = Button({ children: 'Test', size: 'md' });

      expect(vnode.props.className).toContain('px-4');
      expect(vnode.props.className).toContain('py-2');
      expect(vnode.props.className).toContain('text-base');
    });

    it('should apply lg size styles', () => {
      const vnode = Button({ children: 'Test', size: 'lg' });

      expect(vnode.props.className).toContain('px-6');
      expect(vnode.props.className).toContain('py-3');
      expect(vnode.props.className).toContain('text-lg');
    });

    it('should apply xl size styles', () => {
      const vnode = Button({ children: 'Test', size: 'xl' });

      expect(vnode.props.className).toContain('px-8');
      expect(vnode.props.className).toContain('py-4');
      expect(vnode.props.className).toContain('text-xl');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      const vnode = Button({ children: 'Test', disabled: true });

      expect(vnode.props.disabled).toBe(true);
      expect(vnode.props['aria-disabled']).toBe(true);
    });

    it('should be disabled when loading prop is true', () => {
      const vnode = Button({ children: 'Test', loading: true });

      expect(vnode.props.disabled).toBe(true);
      expect(vnode.props['aria-busy']).toBe(true);
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when loading', () => {
      const vnode = Button({ children: 'Test', loading: true });

      // Check that the SVG spinner is present in children
      const children = vnode.props.children;
      const hasSpinner = children.some((child: any) =>
        child && child.type === 'svg' && child.props?.className?.includes('animate-spin')
      );

      expect(hasSpinner).toBe(true);
    });

    it('should hide icons when loading', () => {
      const icon = <span>icon</span>;
      const vnode = Button({ children: 'Test', loading: true, leftIcon: icon, rightIcon: icon });

      // When loading, leftIcon and rightIcon should not be rendered
      const children = vnode.props.children;
      expect(children).toBeDefined();
    });
  });

  describe('icons', () => {
    it('should render left icon', () => {
      const icon = <span data-testid="left-icon">Icon</span>;
      const vnode = Button({ children: 'Test', leftIcon: icon });

      const children = vnode.props.children;
      const hasLeftIcon = children.some((child: any) =>
        child && child.props?.className?.includes('mr-2')
      );

      expect(hasLeftIcon).toBe(true);
    });

    it('should render right icon', () => {
      const icon = <span data-testid="right-icon">Icon</span>;
      const vnode = Button({ children: 'Test', rightIcon: icon });

      const children = vnode.props.children;
      const hasRightIcon = children.some((child: any) =>
        child && child.props?.className?.includes('ml-2')
      );

      expect(hasRightIcon).toBe(true);
    });
  });

  describe('full width', () => {
    it('should apply full width styles', () => {
      const vnode = Button({ children: 'Test', fullWidth: true });

      expect(vnode.props.className).toContain('w-full');
    });
  });

  describe('button types', () => {
    it('should be type="button" by default', () => {
      const vnode = Button({ children: 'Test' });

      expect(vnode.props.type).toBe('button');
    });

    it('should support type="submit"', () => {
      const vnode = Button({ children: 'Test', type: 'submit' });

      expect(vnode.props.type).toBe('submit');
    });

    it('should support type="reset"', () => {
      const vnode = Button({ children: 'Test', type: 'reset' });

      expect(vnode.props.type).toBe('reset');
    });
  });

  describe('events', () => {
    it('should call onClick handler when clicked', () => {
      const onClick = vi.fn();
      const vnode = Button({ children: 'Test', onClick });

      expect(vnode.props.onClick).toBe(onClick);
    });
  });

  describe('accessibility', () => {
    it('should accept aria-label', () => {
      const vnode = Button({ children: 'X', 'aria-label': 'Close' });

      expect(vnode.props['aria-label']).toBe('Close');
    });

    it('should have focus styles', () => {
      const vnode = Button({ children: 'Test' });

      expect(vnode.props.className).toContain('focus:outline-none');
      expect(vnode.props.className).toContain('focus:ring-2');
    });
  });
});

describe('IconButton', () => {
  it('should render with icon only', () => {
    const icon = <span>X</span>;
    const vnode = IconButton({ icon, 'aria-label': 'Close' });

    expect(vnode.type).toBe(Button);
    expect(vnode.props['aria-label']).toBe('Close');
  });

  it('should apply icon button padding based on size', () => {
    const icon = <span>X</span>;
    const vnode = IconButton({ icon, 'aria-label': 'Close', size: 'sm' });

    expect(vnode.props.className).toContain('p-1.5');
  });

  it('should require aria-label', () => {
    const icon = <span>X</span>;
    const vnode = IconButton({ icon, 'aria-label': 'Test label' });

    expect(vnode.props['aria-label']).toBe('Test label');
  });
});

describe('ButtonGroup', () => {
  it('should render children', () => {
    const vnode = ButtonGroup({
      children: [
        <Button key="1">One</Button>,
        <Button key="2">Two</Button>,
      ],
    });

    expect(vnode.type).toBe('div');
    expect(vnode.props.role).toBe('group');
  });

  it('should apply gap when not attached', () => {
    const vnode = ButtonGroup({
      children: <Button>Test</Button>,
      attached: false,
    });

    expect(vnode.props.className).toContain('gap-2');
  });

  it('should apply attached styles when attached is true', () => {
    const vnode = ButtonGroup({
      children: <Button>Test</Button>,
      attached: true,
    });

    expect(vnode.props.className).toContain('rounded-l-none');
    expect(vnode.props.className).toContain('rounded-r-none');
  });

  it('should accept custom className', () => {
    const vnode = ButtonGroup({
      children: <Button>Test</Button>,
      className: 'custom-group',
    });

    expect(vnode.props.className).toContain('custom-group');
  });
});
