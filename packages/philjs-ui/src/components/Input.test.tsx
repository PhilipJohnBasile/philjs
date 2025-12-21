/**
 * Tests for Input and Textarea Components
 */

import { describe, it, expect, vi } from 'vitest';
import { Input, Textarea } from './Input';

describe('Input', () => {
  describe('rendering', () => {
    it('should render an input element', () => {
      const vnode = Input({});

      expect(vnode.type).toBe('div');
      const input = findInput(vnode);
      expect(input.type).toBe('input');
    });

    it('should render with default type text', () => {
      const vnode = Input({});
      const input = findInput(vnode);

      expect(input.props.type).toBe('text');
    });

    it('should accept different input types', () => {
      const types = ['text', 'email', 'password', 'number', 'tel', 'url', 'search'] as const;

      types.forEach((type) => {
        const vnode = Input({ type });
        const input = findInput(vnode);

        expect(input.props.type).toBe(type);
      });
    });
  });

  describe('sizes', () => {
    it('should apply small size styles', () => {
      const vnode = Input({ size: 'sm' });
      const input = findInput(vnode);

      expect(input.props.className).toContain('h-8');
      expect(input.props.className).toContain('px-3');
      expect(input.props.className).toContain('text-sm');
    });

    it('should apply medium size styles (default)', () => {
      const vnode = Input({ size: 'md' });
      const input = findInput(vnode);

      expect(input.props.className).toContain('h-10');
      expect(input.props.className).toContain('px-4');
      expect(input.props.className).toContain('text-base');
    });

    it('should apply large size styles', () => {
      const vnode = Input({ size: 'lg' });
      const input = findInput(vnode);

      expect(input.props.className).toContain('h-12');
      expect(input.props.className).toContain('px-5');
      expect(input.props.className).toContain('text-lg');
    });
  });

  describe('variants', () => {
    it('should apply outline variant styles (default)', () => {
      const vnode = Input({ variant: 'outline' });
      const input = findInput(vnode);

      expect(input.props.className).toContain('border');
      expect(input.props.className).toContain('rounded-md');
      expect(input.props.className).toContain('focus:border-blue-500');
    });

    it('should apply filled variant styles', () => {
      const vnode = Input({ variant: 'filled' });
      const input = findInput(vnode);

      expect(input.props.className).toContain('bg-gray-100');
      expect(input.props.className).toContain('focus:bg-white');
    });

    it('should apply flushed variant styles', () => {
      const vnode = Input({ variant: 'flushed' });
      const input = findInput(vnode);

      expect(input.props.className).toContain('border-b-2');
      expect(input.props.className).toContain('rounded-none');
    });
  });

  describe('label', () => {
    it('should render label when provided', () => {
      const vnode = Input({ label: 'Email' });
      const label = findLabel(vnode);

      expect(label).toBeDefined();
      expect(label.type).toBe('label');
      expect(label.props.children[0]).toBe('Email');
    });

    it('should show required indicator when required', () => {
      const vnode = Input({ label: 'Email', required: true });
      const label = findLabel(vnode);
      const labelChildren = Array.isArray(label.props.children)
        ? label.props.children
        : [label.props.children];
      const requiredSpan = labelChildren[1];

      expect(requiredSpan.props.className).toContain('text-red-500');
      // Children may be wrapped in array
      const indicator = Array.isArray(requiredSpan.props.children)
        ? requiredSpan.props.children[0]
        : requiredSpan.props.children;
      expect(indicator).toBe('*');
    });

    it('should link label to input via htmlFor', () => {
      const vnode = Input({ label: 'Email', id: 'email-input' });
      const label = findLabel(vnode);
      const input = findInput(vnode);

      expect(label.props.htmlFor).toBe('email-input');
      expect(input.props.id).toBe('email-input');
    });
  });

  describe('placeholder', () => {
    it('should accept placeholder', () => {
      const vnode = Input({ placeholder: 'Enter email' });
      const input = findInput(vnode);

      expect(input.props.placeholder).toBe('Enter email');
    });
  });

  describe('value handling', () => {
    it('should accept controlled value', () => {
      const vnode = Input({ value: 'test@example.com' });
      const input = findInput(vnode);

      expect(input.props.value).toBe('test@example.com');
    });

    it('should accept defaultValue', () => {
      const vnode = Input({ defaultValue: 'default' });
      const input = findInput(vnode);

      expect(input.props.defaultValue).toBe('default');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      const vnode = Input({ disabled: true });
      const input = findInput(vnode);

      expect(input.props.disabled).toBe(true);
    });
  });

  describe('readOnly state', () => {
    it('should be readOnly when readOnly prop is true', () => {
      const vnode = Input({ readOnly: true });
      const input = findInput(vnode);

      expect(input.props.readOnly).toBe(true);
    });
  });

  describe('error state', () => {
    it('should apply error styles when error is true', () => {
      const vnode = Input({ error: true });
      const input = findInput(vnode);

      expect(input.props.className).toContain('border-red-500');
      expect(input.props['aria-invalid']).toBe(true);
    });

    it('should display error message when error is a string', () => {
      const vnode = Input({ error: 'Invalid email' });

      const errorElement = findByRole(vnode, 'alert');
      expect(errorElement).toBeDefined();
      // Children may be wrapped in array
      const errorText = Array.isArray(errorElement.props.children)
        ? errorElement.props.children[0]
        : errorElement.props.children;
      expect(errorText).toBe('Invalid email');
      expect(errorElement.props.className).toContain('text-red-600');
    });
  });

  describe('helper text', () => {
    it('should display helper text when provided', () => {
      const vnode = Input({ helperText: 'Enter your email address' });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const helperElement = children.find(
        (child: any) => child?.type === 'p' && child?.props?.className?.includes('text-gray-500')
      );
      expect(helperElement).toBeDefined();
      // Children may be wrapped in array
      const helperText = Array.isArray(helperElement.props.children)
        ? helperElement.props.children[0]
        : helperElement.props.children;
      expect(helperText).toBe('Enter your email address');
    });

    it('should hide helper text when there is an error', () => {
      const vnode = Input({ helperText: 'Help', error: 'Error message' });

      // Helper text should not appear when error exists
      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const helperElement = children.find(
        (child: any) => {
          const childText = Array.isArray(child?.props?.children)
            ? child.props.children[0]
            : child?.props?.children;
          return childText === 'Help';
        }
      );
      expect(helperElement).toBeFalsy();
    });
  });

  describe('left and right elements', () => {
    it('should render left element', () => {
      const leftIcon = <span>@</span>;
      const vnode = Input({ leftElement: leftIcon });
      const input = findInput(vnode);

      expect(input.props.className).toContain('pl-10');
    });

    it('should render right element', () => {
      const rightIcon = <span>X</span>;
      const vnode = Input({ rightElement: rightIcon });
      const input = findInput(vnode);

      expect(input.props.className).toContain('pr-10');
    });
  });

  describe('events', () => {
    it('should call onInput handler', () => {
      const onInput = vi.fn();
      const vnode = Input({ onInput });
      const input = findInput(vnode);

      expect(input.props.onInput).toBe(onInput);
    });

    it('should call onChange handler', () => {
      const onChange = vi.fn();
      const vnode = Input({ onChange });
      const input = findInput(vnode);

      expect(input.props.onChange).toBe(onChange);
    });

    it('should call onFocus handler', () => {
      const onFocus = vi.fn();
      const vnode = Input({ onFocus });
      const input = findInput(vnode);

      expect(input.props.onFocus).toBe(onFocus);
    });

    it('should call onBlur handler', () => {
      const onBlur = vi.fn();
      const vnode = Input({ onBlur });
      const input = findInput(vnode);

      expect(input.props.onBlur).toBe(onBlur);
    });
  });

  describe('accessibility', () => {
    it('should accept aria-label', () => {
      const vnode = Input({ 'aria-label': 'Email address' });
      const input = findInput(vnode);

      expect(input.props['aria-label']).toBe('Email address');
    });

    it('should set aria-invalid when error exists', () => {
      const vnode = Input({ error: true });
      const input = findInput(vnode);

      expect(input.props['aria-invalid']).toBe(true);
    });

    it('should set aria-describedby when helper text exists', () => {
      const vnode = Input({ id: 'email', helperText: 'Help text' });
      const input = findInput(vnode);

      expect(input.props['aria-describedby']).toContain('email-helper');
    });
  });

  describe('HTML attributes', () => {
    it('should accept name attribute', () => {
      const vnode = Input({ name: 'email' });
      const input = findInput(vnode);

      expect(input.props.name).toBe('email');
    });

    it('should accept autoComplete attribute', () => {
      const vnode = Input({ autoComplete: 'email' });
      const input = findInput(vnode);

      expect(input.props.autoComplete).toBe('email');
    });

    it('should accept maxLength attribute', () => {
      const vnode = Input({ maxLength: 100 });
      const input = findInput(vnode);

      expect(input.props.maxLength).toBe(100);
    });

    it('should accept pattern attribute', () => {
      const vnode = Input({ pattern: '[0-9]+' });
      const input = findInput(vnode);

      expect(input.props.pattern).toBe('[0-9]+');
    });
  });
});

describe('Textarea', () => {
  describe('rendering', () => {
    it('should render a textarea element', () => {
      const vnode = Textarea({});

      expect(vnode.type).toBe('div');
      const textarea = findTextarea(vnode);
      expect(textarea.type).toBe('textarea');
    });

    it('should accept rows prop', () => {
      const vnode = Textarea({ rows: 6 });
      const textarea = findTextarea(vnode);

      expect(textarea.props.rows).toBe(6);
    });

    it('should default to 4 rows', () => {
      const vnode = Textarea({});
      const textarea = findTextarea(vnode);

      expect(textarea.props.rows).toBe(4);
    });
  });

  describe('resize', () => {
    it('should allow vertical resize by default', () => {
      const vnode = Textarea({});
      const textarea = findTextarea(vnode);

      expect(textarea.props.className).toContain('resize-y');
    });

    it('should disable resize when resize="none"', () => {
      const vnode = Textarea({ resize: 'none' });
      const textarea = findTextarea(vnode);

      expect(textarea.props.className).toContain('resize-none');
    });

    it('should allow horizontal resize when resize="horizontal"', () => {
      const vnode = Textarea({ resize: 'horizontal' });
      const textarea = findTextarea(vnode);

      expect(textarea.props.className).toContain('resize-x');
    });

    it('should allow both directions when resize="both"', () => {
      const vnode = Textarea({ resize: 'both' });
      const textarea = findTextarea(vnode);

      expect(textarea.props.className).toContain('resize');
    });
  });

  describe('label', () => {
    it('should render label when provided', () => {
      const vnode = Textarea({ label: 'Description' });
      const label = findLabel(vnode);

      expect(label).toBeDefined();
      expect(label.props.children[0]).toBe('Description');
    });
  });

  describe('error state', () => {
    it('should apply error styles', () => {
      const vnode = Textarea({ error: true });
      const textarea = findTextarea(vnode);

      expect(textarea.props.className).toContain('border-red-500');
    });

    it('should display error message', () => {
      const vnode = Textarea({ error: 'Description is required' });

      const errorElement = findByRole(vnode, 'alert');
      expect(errorElement).toBeDefined();
      // Children may be wrapped in array
      const errorText = Array.isArray(errorElement.props.children)
        ? errorElement.props.children[0]
        : errorElement.props.children;
      expect(errorText).toBe('Description is required');
    });
  });

  describe('events', () => {
    it('should call onInput handler', () => {
      const onInput = vi.fn();
      const vnode = Textarea({ onInput });
      const textarea = findTextarea(vnode);

      expect(textarea.props.onInput).toBe(onInput);
    });
  });
});

// Helper functions to find elements in vnode tree
function findInput(vnode: any): any {
  if (vnode?.type === 'input') return vnode;
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findInput(child);
      if (found) return found;
    }
  }
  return null;
}

function findTextarea(vnode: any): any {
  if (vnode?.type === 'textarea') return vnode;
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findTextarea(child);
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

function findByRole(vnode: any, role: string): any {
  if (vnode?.props?.role === role) return vnode;
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findByRole(child, role);
      if (found) return found;
    }
  }
  return null;
}
