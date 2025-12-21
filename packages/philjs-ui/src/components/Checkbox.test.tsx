/**
 * Tests for Checkbox and CheckboxGroup Components
 */

import { describe, it, expect, vi } from 'vitest';
import { Checkbox, CheckboxGroup } from './Checkbox';

describe('Checkbox', () => {
  describe('rendering', () => {
    it('should render an input checkbox element', () => {
      const vnode = Checkbox({});
      const input = findCheckbox(vnode);

      expect(input.type).toBe('input');
      expect(input.props.type).toBe('checkbox');
    });

    it('should render with default unchecked state', () => {
      const vnode = Checkbox({});
      const input = findCheckbox(vnode);

      expect(input.props.checked).toBeUndefined();
    });
  });

  describe('controlled/uncontrolled', () => {
    it('should accept controlled checked value', () => {
      const vnode = Checkbox({ checked: true });
      const input = findCheckbox(vnode);

      expect(input.props.checked).toBe(true);
    });

    it('should accept defaultChecked for uncontrolled mode', () => {
      const vnode = Checkbox({ defaultChecked: true });
      const input = findCheckbox(vnode);

      expect(input.props.defaultChecked).toBe(true);
    });
  });

  describe('sizes', () => {
    it('should apply sm size styles', () => {
      const vnode = Checkbox({ size: 'sm' });
      const input = findCheckbox(vnode);

      expect(input.props.className).toContain('h-4');
      expect(input.props.className).toContain('w-4');
    });

    it('should apply md size styles (default)', () => {
      const vnode = Checkbox({ size: 'md' });
      const input = findCheckbox(vnode);

      expect(input.props.className).toContain('h-5');
      expect(input.props.className).toContain('w-5');
    });

    it('should apply lg size styles', () => {
      const vnode = Checkbox({ size: 'lg' });
      const input = findCheckbox(vnode);

      expect(input.props.className).toContain('h-6');
      expect(input.props.className).toContain('w-6');
    });
  });

  describe('label', () => {
    it('should render label when provided', () => {
      const vnode = Checkbox({ label: 'Accept terms' });
      const label = findLabel(vnode);

      expect(label).toBeDefined();
      expect(label.type).toBe('label');
      expect(label.props.children[0]).toBe('Accept terms');
    });

    it('should link label to checkbox via htmlFor', () => {
      const vnode = Checkbox({ label: 'Accept', id: 'terms' });
      const label = findLabel(vnode);
      const input = findCheckbox(vnode);

      expect(label.props.htmlFor).toBe('terms');
      expect(input.props.id).toBe('terms');
    });

    it('should show required indicator when required', () => {
      const vnode = Checkbox({ label: 'Accept', required: true });
      const label = findLabel(vnode);
      const requiredSpan = label.props.children[1];

      expect(requiredSpan.props.className).toContain('text-red-500');
      // Children may be wrapped in array
      const indicator = Array.isArray(requiredSpan.props.children)
        ? requiredSpan.props.children[0]
        : requiredSpan.props.children;
      expect(indicator).toBe('*');
    });
  });

  describe('description', () => {
    it('should render description when provided', () => {
      const vnode = Checkbox({ description: 'I agree to the terms and conditions' });

      const description = findDescription(vnode);
      expect(description).toBeDefined();
      expect(description.type).toBe('p');
      expect(description.props.className).toContain('text-sm');
      expect(description.props.className).toContain('text-gray-500');
    });

    it('should link description to checkbox via aria-describedby', () => {
      const vnode = Checkbox({ id: 'terms', description: 'Description text' });
      const input = findCheckbox(vnode);

      expect(input.props['aria-describedby']).toBe('terms-description');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      const vnode = Checkbox({ disabled: true });
      const input = findCheckbox(vnode);

      expect(input.props.disabled).toBe(true);
      expect(input.props.className).toContain('bg-gray-100');
      expect(input.props.className).toContain('cursor-not-allowed');
    });

    it('should apply disabled styles to label', () => {
      const vnode = Checkbox({ label: 'Accept', disabled: true });
      const label = findLabel(vnode);

      expect(label.props.className).toContain('text-gray-400');
    });
  });

  describe('error state', () => {
    it('should apply error styles when error is true', () => {
      const vnode = Checkbox({ error: true });
      const input = findCheckbox(vnode);

      expect(input.props.className).toContain('border-red-500');
      expect(input.props['aria-invalid']).toBe(true);
    });

    it('should display error message when error is a string', () => {
      const vnode = Checkbox({ error: 'This field is required' });

      const errorMessage = findByRole(vnode, 'alert');
      expect(errorMessage).toBeDefined();
      // Children may be wrapped in array
      const errorText = Array.isArray(errorMessage.props.children)
        ? errorMessage.props.children[0]
        : errorMessage.props.children;
      expect(errorText).toBe('This field is required');
      expect(errorMessage.props.className).toContain('text-red-600');
    });
  });

  describe('indeterminate state', () => {
    it('should accept indeterminate prop', () => {
      const vnode = Checkbox({ indeterminate: true });
      const input = findCheckbox(vnode);

      // The ref callback sets the indeterminate property
      expect(input.props.ref).toBeDefined();
    });
  });

  describe('events', () => {
    it('should call onChange handler', () => {
      const onChange = vi.fn();
      const vnode = Checkbox({ onChange });
      const input = findCheckbox(vnode);

      // Simulate change event
      const mockEvent = { target: { checked: true } };
      input.props.onChange(mockEvent);

      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe('accessibility', () => {
    it('should accept aria-label', () => {
      const vnode = Checkbox({ 'aria-label': 'Accept terms' });
      const input = findCheckbox(vnode);

      expect(input.props['aria-label']).toBe('Accept terms');
    });

    it('should use label as aria-label fallback', () => {
      const vnode = Checkbox({ label: 'Accept terms' });
      const input = findCheckbox(vnode);

      expect(input.props['aria-label']).toBe('Accept terms');
    });

    it('should have focus ring styles', () => {
      const vnode = Checkbox({});
      const input = findCheckbox(vnode);

      expect(input.props.className).toContain('focus:ring-2');
      expect(input.props.className).toContain('focus:ring-blue-500');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = Checkbox({ className: 'custom-checkbox' });

      expect(vnode.props.className).toContain('custom-checkbox');
    });
  });

  describe('HTML attributes', () => {
    it('should accept name attribute', () => {
      const vnode = Checkbox({ name: 'terms' });
      const input = findCheckbox(vnode);

      expect(input.props.name).toBe('terms');
    });

    it('should accept value attribute', () => {
      const vnode = Checkbox({ value: 'accepted' });
      const input = findCheckbox(vnode);

      expect(input.props.value).toBe('accepted');
    });

    it('should accept required attribute', () => {
      const vnode = Checkbox({ required: true });
      const input = findCheckbox(vnode);

      expect(input.props.required).toBe(true);
    });
  });
});

describe('CheckboxGroup', () => {
  describe('rendering', () => {
    it('should render a fieldset element', () => {
      const vnode = CheckboxGroup({ children: <Checkbox /> });

      expect(vnode.type).toBe('fieldset');
      expect(vnode.props.role).toBe('group');
    });

    it('should render children', () => {
      const children = [
        <Checkbox key="1" label="Option 1" />,
        <Checkbox key="2" label="Option 2" />,
      ];
      const vnode = CheckboxGroup({ children });

      // Children are rendered within the fieldset
      expect(vnode.props.children).toBeDefined();
    });
  });

  describe('label', () => {
    it('should render legend when label is provided', () => {
      const vnode = CheckboxGroup({ label: 'Options', children: <Checkbox /> });

      const legend = findLegend(vnode);
      expect(legend).toBeDefined();
      expect(legend.type).toBe('legend');
      expect(legend.props.children[0]).toBe('Options');
    });

    it('should show required indicator', () => {
      const vnode = CheckboxGroup({ label: 'Options', required: true, children: <Checkbox /> });

      const legend = findLegend(vnode);
      const requiredSpan = legend.props.children[1];

      expect(requiredSpan.props.className).toContain('text-red-500');
    });
  });

  describe('description', () => {
    it('should render description when provided', () => {
      const vnode = CheckboxGroup({
        description: 'Select all that apply',
        children: <Checkbox />,
      });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const description = children.find(
        (child: any) => child?.type === 'p' && child?.props?.className?.includes('text-gray-500')
      );

      expect(description).toBeDefined();
      // Children may be wrapped in array
      const descText = Array.isArray(description.props.children)
        ? description.props.children[0]
        : description.props.children;
      expect(descText).toBe('Select all that apply');
    });
  });

  describe('orientation', () => {
    it('should apply vertical orientation styles (default)', () => {
      const vnode = CheckboxGroup({ orientation: 'vertical', children: <Checkbox /> });

      const container = findFlexContainer(vnode);
      expect(container.props.className).toContain('flex-col');
      expect(container.props.className).toContain('gap-2');
    });

    it('should apply horizontal orientation styles', () => {
      const vnode = CheckboxGroup({ orientation: 'horizontal', children: <Checkbox /> });

      const container = findFlexContainer(vnode);
      expect(container.props.className).toContain('flex-wrap');
      expect(container.props.className).toContain('gap-4');
    });
  });

  describe('error state', () => {
    it('should display error message when error is a string', () => {
      const vnode = CheckboxGroup({ error: 'Select at least one option', children: <Checkbox /> });

      const errorMessage = findByRole(vnode, 'alert');
      expect(errorMessage).toBeDefined();
      // Children may be wrapped in array
      const errorText = Array.isArray(errorMessage.props.children)
        ? errorMessage.props.children[0]
        : errorMessage.props.children;
      expect(errorText).toBe('Select at least one option');
    });
  });

  describe('accessibility', () => {
    it('should have role="group"', () => {
      const vnode = CheckboxGroup({ error: true, children: <Checkbox /> });

      expect(vnode.props.role).toBe('group');
    });

    it('should render as fieldset element', () => {
      const vnode = CheckboxGroup({ required: true, children: <Checkbox /> });

      expect(vnode.type).toBe('fieldset');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = CheckboxGroup({ className: 'custom-group', children: <Checkbox /> });

      expect(vnode.props.className).toContain('custom-group');
    });
  });
});

// Helper functions
function findCheckbox(vnode: any): any {
  if (vnode?.type === 'input' && vnode?.props?.type === 'checkbox') return vnode;
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findCheckbox(child);
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

function findLegend(vnode: any): any {
  if (vnode?.type === 'legend') return vnode;
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findLegend(child);
      if (found) return found;
    }
  }
  return null;
}

function findFlexContainer(vnode: any): any {
  if (vnode?.type === 'div' && vnode?.props?.className?.includes('flex')) return vnode;
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findFlexContainer(child);
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
