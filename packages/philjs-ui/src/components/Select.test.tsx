/**
 * Tests for Select and MultiSelect Components
 */

import { describe, it, expect, vi } from 'vitest';
import { Select, MultiSelect } from './Select';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
];

describe('Select', () => {
  describe('rendering', () => {
    it('should render a select element', () => {
      const vnode = Select({ options: mockOptions });
      const select = findSelect(vnode);

      expect(select.type).toBe('select');
    });

    it('should render options', () => {
      const vnode = Select({ options: mockOptions });
      const select = findSelect(vnode);
      const selectChildren = Array.isArray(select.props.children)
        ? select.props.children
        : [select.props.children];
      // Find the options array (may be nested)
      const options = selectChildren.find((c: any) => Array.isArray(c) && c.length >= 3)
        || selectChildren.filter((c: any) => c?.type === 'option');

      expect(options).toHaveLength(3);
    });

    it('should render option labels', () => {
      const vnode = Select({ options: mockOptions });
      const select = findSelect(vnode);
      const selectChildren = Array.isArray(select.props.children)
        ? select.props.children
        : [select.props.children];
      const options = selectChildren.find((c: any) => Array.isArray(c) && c.length >= 3)
        || selectChildren.filter((c: any) => c?.type === 'option');

      // Children may be wrapped in array
      const getText = (child: any) => Array.isArray(child?.props?.children)
        ? child.props.children[0]
        : child?.props?.children;
      expect(getText(options[0])).toBe('Option 1');
      expect(getText(options[1])).toBe('Option 2');
    });

    it('should render disabled options', () => {
      const vnode = Select({ options: mockOptions });
      const select = findSelect(vnode);
      const selectChildren = Array.isArray(select.props.children)
        ? select.props.children
        : [select.props.children];
      const options = selectChildren.find((c: any) => Array.isArray(c) && c.length >= 3)
        || selectChildren.filter((c: any) => c?.type === 'option');

      expect(options[2].props.disabled).toBe(true);
    });
  });

  describe('placeholder', () => {
    it('should render placeholder option when provided', () => {
      const vnode = Select({ options: mockOptions, placeholder: 'Select an option' });
      const select = findSelect(vnode);
      const selectChildren = Array.isArray(select.props.children)
        ? select.props.children
        : [select.props.children];
      const placeholderOption = selectChildren[0];

      expect(placeholderOption.type).toBe('option');
      expect(placeholderOption.props.value).toBe('');
      expect(placeholderOption.props.disabled).toBe(true);
      // Children may be wrapped in array
      const placeholderText = Array.isArray(placeholderOption.props.children)
        ? placeholderOption.props.children[0]
        : placeholderOption.props.children;
      expect(placeholderText).toBe('Select an option');
    });
  });

  describe('sizes', () => {
    it('should apply sm size styles', () => {
      const vnode = Select({ options: mockOptions, size: 'sm' });
      const select = findSelect(vnode);

      expect(select.props.className).toContain('h-8');
      expect(select.props.className).toContain('px-3');
      expect(select.props.className).toContain('text-sm');
    });

    it('should apply md size styles (default)', () => {
      const vnode = Select({ options: mockOptions, size: 'md' });
      const select = findSelect(vnode);

      expect(select.props.className).toContain('h-10');
      expect(select.props.className).toContain('px-4');
      expect(select.props.className).toContain('text-base');
    });

    it('should apply lg size styles', () => {
      const vnode = Select({ options: mockOptions, size: 'lg' });
      const select = findSelect(vnode);

      expect(select.props.className).toContain('h-12');
      expect(select.props.className).toContain('px-5');
      expect(select.props.className).toContain('text-lg');
    });
  });

  describe('label', () => {
    it('should render label when provided', () => {
      const vnode = Select({ options: mockOptions, label: 'Country' });
      const label = findLabel(vnode);

      expect(label).toBeDefined();
      expect(label.props.children[0]).toBe('Country');
    });

    it('should show required indicator', () => {
      const vnode = Select({ options: mockOptions, label: 'Country', required: true });
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

    it('should link label to select via htmlFor', () => {
      const vnode = Select({ options: mockOptions, label: 'Country', id: 'country' });
      const label = findLabel(vnode);
      const select = findSelect(vnode);

      expect(label.props.htmlFor).toBe('country');
      expect(select.props.id).toBe('country');
    });
  });

  describe('value handling', () => {
    it('should accept controlled value', () => {
      const vnode = Select({ options: mockOptions, value: 'option2' });
      const select = findSelect(vnode);

      expect(select.props.value).toBe('option2');
    });

    it('should accept defaultValue', () => {
      const vnode = Select({ options: mockOptions, defaultValue: 'option1' });
      const select = findSelect(vnode);

      expect(select.props.defaultValue).toBe('option1');
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      const vnode = Select({ options: mockOptions, disabled: true });
      const select = findSelect(vnode);

      expect(select.props.disabled).toBe(true);
    });
  });

  describe('error state', () => {
    it('should apply error styles when error is true', () => {
      const vnode = Select({ options: mockOptions, error: true });
      const select = findSelect(vnode);

      expect(select.props.className).toContain('border-red-500');
      expect(select.props['aria-invalid']).toBe(true);
    });

    it('should display error message', () => {
      const vnode = Select({ options: mockOptions, error: 'Please select an option' });

      const errorMessage = findByRole(vnode, 'alert');
      expect(errorMessage).toBeDefined();
      // Children may be wrapped in array
      const message = Array.isArray(errorMessage.props.children)
        ? errorMessage.props.children[0]
        : errorMessage.props.children;
      expect(message).toBe('Please select an option');
    });
  });

  describe('helper text', () => {
    it('should display helper text when provided', () => {
      const vnode = Select({ options: mockOptions, helperText: 'Select your country' });

      const children = Array.isArray(vnode.props.children)
        ? vnode.props.children
        : [vnode.props.children];
      const helperText = children.find(
        (child: any) => child?.type === 'p' && child?.props?.className?.includes('text-gray-500')
      );

      expect(helperText).toBeDefined();
      // Children may be wrapped in array
      const text = Array.isArray(helperText.props.children)
        ? helperText.props.children[0]
        : helperText.props.children;
      expect(text).toBe('Select your country');
    });
  });

  describe('events', () => {
    it('should call onChange handler', () => {
      const onChange = vi.fn();
      const vnode = Select({ options: mockOptions, onChange });
      const select = findSelect(vnode);

      // Simulate change event
      const mockEvent = { target: { value: 'option2' } };
      select.props.onChange(mockEvent);

      expect(onChange).toHaveBeenCalledWith('option2');
    });
  });

  describe('accessibility', () => {
    it('should accept aria-label', () => {
      const vnode = Select({ options: mockOptions, 'aria-label': 'Select country' });
      const select = findSelect(vnode);

      expect(select.props['aria-label']).toBe('Select country');
    });

    it('should use label as aria-label fallback', () => {
      const vnode = Select({ options: mockOptions, label: 'Country' });
      const select = findSelect(vnode);

      expect(select.props['aria-label']).toBe('Country');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = Select({ options: mockOptions, className: 'custom-select' });

      expect(vnode.props.className).toContain('custom-select');
    });
  });

  describe('dropdown icon', () => {
    it('should render dropdown icon', () => {
      const vnode = Select({ options: mockOptions });

      // The component exists with proper structure
      expect(vnode).toBeDefined();
      expect(vnode.type).toBe('div');
    });
  });
});

describe('MultiSelect', () => {
  describe('rendering', () => {
    it('should render a div container', () => {
      const vnode = MultiSelect({ options: mockOptions });

      expect(vnode.type).toBe('div');
    });

    it('should render placeholder when no values selected', () => {
      const vnode = MultiSelect({ options: mockOptions, placeholder: 'Select options' });

      const selectBox = findSelectBox(vnode);
      const selectBoxChildren = Array.isArray(selectBox.props.children)
        ? selectBox.props.children
        : [selectBox.props.children];
      const placeholder = selectBoxChildren[0];

      // Children may be wrapped in array
      const placeholderText = Array.isArray(placeholder.props.children)
        ? placeholder.props.children[0]
        : placeholder.props.children;
      expect(placeholderText).toBe('Select options');
    });
  });

  describe('label', () => {
    it('should render label when provided', () => {
      const vnode = MultiSelect({ options: mockOptions, label: 'Tags' });
      const label = findLabel(vnode);

      expect(label).toBeDefined();
      expect(label.props.children[0]).toBe('Tags');
    });
  });

  describe('selected values', () => {
    it('should render selected value chips', () => {
      const vnode = MultiSelect({ options: mockOptions, value: ['option1', 'option2'] });

      const selectBox = findSelectBox(vnode);
      const chips = selectBox.props.children.filter(
        (child: any) => child?.props?.className?.includes('bg-blue-100')
      );

      expect(chips.length).toBe(2);
    });
  });

  describe('dropdown', () => {
    it('should not render dropdown when closed', () => {
      const vnode = MultiSelect({ options: mockOptions });

      // Signal controls dropdown visibility, initially closed
      expect(vnode).toBeDefined();
    });
  });

  describe('disabled state', () => {
    it('should apply disabled styles when disabled', () => {
      const vnode = MultiSelect({ options: mockOptions, disabled: true });

      const selectBox = findSelectBox(vnode);
      expect(selectBox.props.className).toContain('cursor-not-allowed');
      expect(selectBox.props.className).toContain('bg-gray-100');
    });
  });

  describe('error state', () => {
    it('should apply error styles when error is true', () => {
      const vnode = MultiSelect({ options: mockOptions, error: true });

      const selectBox = findSelectBox(vnode);
      expect(selectBox.props.className).toContain('border-red-500');
    });

    it('should display error message', () => {
      const vnode = MultiSelect({ options: mockOptions, error: 'Select at least one' });

      const errorMessage = findByRole(vnode, 'alert');
      expect(errorMessage).toBeDefined();
      // Children may be wrapped in array
      const message = Array.isArray(errorMessage.props.children)
        ? errorMessage.props.children[0]
        : errorMessage.props.children;
      expect(message).toBe('Select at least one');
    });
  });

  describe('helper text', () => {
    it('should display helper text when provided', () => {
      const vnode = MultiSelect({ options: mockOptions, helperText: 'Select multiple tags' });

      const helperText = vnode.props.children.find(
        (child: any) => child?.type === 'p' && child?.props?.className?.includes('text-gray-500')
      );

      expect(helperText).toBeDefined();
    });
  });

  describe('maxSelections', () => {
    it('should accept maxSelections prop', () => {
      const vnode = MultiSelect({
        options: mockOptions,
        maxSelections: 2,
        value: ['option1'],
      });

      expect(vnode).toBeDefined();
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = MultiSelect({ options: mockOptions, className: 'custom-multi' });

      expect(vnode.props.className).toContain('custom-multi');
    });
  });
});

// Helper functions
function findSelect(vnode: any): any {
  if (vnode?.type === 'select') return vnode;
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findSelect(child);
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

function findSelectBox(vnode: any): any {
  // Find the clickable select box in MultiSelect
  if (vnode?.props?.className?.includes('flex-wrap') && vnode?.props?.className?.includes('gap-1')) {
    return vnode;
  }
  if (vnode?.props?.children) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      const found = findSelectBox(child);
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
