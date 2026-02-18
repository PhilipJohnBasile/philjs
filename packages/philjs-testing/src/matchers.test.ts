/**
 * Tests for PhilJS Testing Library - Matchers
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  toBeInTheDocument,
  toHaveTextContent,
  toBeDisabled,
  toBeEnabled,
  toHaveAttribute,
  toHaveClass,
  toHaveValue,
  toBeChecked,
  toBeEmptyDOMElement,
} from './matchers';

describe('Matchers', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('toBeInTheDocument', () => {
    it('should pass when element is in the document', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      const result = toBeInTheDocument(element);
      expect(result.pass).toBe(true);
    });

    it('should fail when element is null', () => {
      const result = toBeInTheDocument(null);
      expect(result.pass).toBe(false);
    });

    it('should fail when element is not in the document', () => {
      const element = document.createElement('div');
      // Not appended to document

      const result = toBeInTheDocument(element);
      expect(result.pass).toBe(false);
    });

    it('should provide correct message', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      const result = toBeInTheDocument(element);
      expect(result.message()).toContain('not to be in the document');
    });
  });

  describe('toHaveTextContent', () => {
    it('should pass when element has matching text', () => {
      const element = document.createElement('div');
      element.textContent = 'Hello World';
      container.appendChild(element);

      const result = toHaveTextContent(element, 'Hello');
      expect(result.pass).toBe(true);
    });

    it('should pass with regex match', () => {
      const element = document.createElement('div');
      element.textContent = 'Hello World 123';
      container.appendChild(element);

      const result = toHaveTextContent(element, /World \d+/);
      expect(result.pass).toBe(true);
    });

    it('should fail when text does not match', () => {
      const element = document.createElement('div');
      element.textContent = 'Hello World';
      container.appendChild(element);

      const result = toHaveTextContent(element, 'Goodbye');
      expect(result.pass).toBe(false);
    });

    it('should fail when element is null', () => {
      const result = toHaveTextContent(null, 'test');
      expect(result.pass).toBe(false);
      expect(result.message()).toContain('element is null');
    });

    it('should handle empty text content', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      const result = toHaveTextContent(element, '');
      expect(result.pass).toBe(true);
    });
  });

  describe('toBeDisabled', () => {
    it('should pass when button is disabled', () => {
      const button = document.createElement('button');
      button.disabled = true;
      container.appendChild(button);

      const result = toBeDisabled(button);
      expect(result.pass).toBe(true);
    });

    it('should pass when element has disabled attribute', () => {
      const input = document.createElement('input');
      input.setAttribute('disabled', '');
      container.appendChild(input);

      const result = toBeDisabled(input);
      expect(result.pass).toBe(true);
    });

    it('should pass when element has aria-disabled', () => {
      const div = document.createElement('div');
      div.setAttribute('aria-disabled', 'true');
      container.appendChild(div);

      const result = toBeDisabled(div);
      expect(result.pass).toBe(true);
    });

    it('should fail when element is not disabled', () => {
      const button = document.createElement('button');
      container.appendChild(button);

      const result = toBeDisabled(button);
      expect(result.pass).toBe(false);
    });

    it('should fail when element is null', () => {
      const result = toBeDisabled(null);
      expect(result.pass).toBe(false);
    });
  });

  describe('toBeEnabled', () => {
    it('should pass when element is not disabled', () => {
      const button = document.createElement('button');
      container.appendChild(button);

      const result = toBeEnabled(button);
      expect(result.pass).toBe(true);
    });

    it('should fail when element is disabled', () => {
      const button = document.createElement('button');
      button.disabled = true;
      container.appendChild(button);

      const result = toBeEnabled(button);
      expect(result.pass).toBe(false);
    });
  });

  describe('toHaveAttribute', () => {
    it('should pass when element has attribute', () => {
      const element = document.createElement('div');
      element.setAttribute('data-testid', 'test');
      container.appendChild(element);

      const result = toHaveAttribute(element, 'data-testid');
      expect(result.pass).toBe(true);
    });

    it('should pass when attribute has specific value', () => {
      const element = document.createElement('div');
      element.setAttribute('data-testid', 'test');
      container.appendChild(element);

      const result = toHaveAttribute(element, 'data-testid', 'test');
      expect(result.pass).toBe(true);
    });

    it('should fail when attribute value does not match', () => {
      const element = document.createElement('div');
      element.setAttribute('data-testid', 'test');
      container.appendChild(element);

      const result = toHaveAttribute(element, 'data-testid', 'other');
      expect(result.pass).toBe(false);
    });

    it('should fail when element does not have attribute', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      const result = toHaveAttribute(element, 'data-testid');
      expect(result.pass).toBe(false);
    });

    it('should fail when element is null', () => {
      const result = toHaveAttribute(null, 'data-testid');
      expect(result.pass).toBe(false);
    });
  });

  describe('toHaveClass', () => {
    it('should pass when element has class', () => {
      const element = document.createElement('div');
      element.className = 'foo bar';
      container.appendChild(element);

      const result = toHaveClass(element, 'foo');
      expect(result.pass).toBe(true);
    });

    it('should pass when element has multiple classes', () => {
      const element = document.createElement('div');
      element.className = 'foo bar baz';
      container.appendChild(element);

      const result = toHaveClass(element, 'foo', 'bar');
      expect(result.pass).toBe(true);
    });

    it('should fail when element is missing a class', () => {
      const element = document.createElement('div');
      element.className = 'foo';
      container.appendChild(element);

      const result = toHaveClass(element, 'foo', 'bar');
      expect(result.pass).toBe(false);
      expect(result.message()).toContain('missing');
    });

    it('should fail when element is null', () => {
      const result = toHaveClass(null, 'foo');
      expect(result.pass).toBe(false);
    });
  });

  describe('toHaveValue', () => {
    it('should pass when input has value', () => {
      const input = document.createElement('input');
      input.value = 'test';
      container.appendChild(input);

      const result = toHaveValue(input, 'test');
      expect(result.pass).toBe(true);
    });

    it('should pass when textarea has value', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'multiline\ntext';
      container.appendChild(textarea);

      const result = toHaveValue(textarea, 'multiline\ntext');
      expect(result.pass).toBe(true);
    });

    it('should handle number values', () => {
      const input = document.createElement('input');
      input.type = 'number';
      input.value = '42';
      container.appendChild(input);

      const result = toHaveValue(input, 42);
      expect(result.pass).toBe(true);
    });

    it('should fail when value does not match', () => {
      const input = document.createElement('input');
      input.value = 'test';
      container.appendChild(input);

      const result = toHaveValue(input, 'other');
      expect(result.pass).toBe(false);
    });

    it('should fail when element is null', () => {
      const result = toHaveValue(null, 'test');
      expect(result.pass).toBe(false);
    });

    it('should handle multi-select', () => {
      const select = document.createElement('select');
      select.multiple = true;

      const option1 = document.createElement('option');
      option1.value = 'a';
      option1.selected = true;

      const option2 = document.createElement('option');
      option2.value = 'b';
      option2.selected = true;

      select.appendChild(option1);
      select.appendChild(option2);
      container.appendChild(select);

      const result = toHaveValue(select, ['a', 'b']);
      expect(result.pass).toBe(true);
    });
  });

  describe('toBeChecked', () => {
    it('should pass when checkbox is checked', () => {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = true;
      container.appendChild(input);

      const result = toBeChecked(input);
      expect(result.pass).toBe(true);
    });

    it('should pass when radio is checked', () => {
      const input = document.createElement('input');
      input.type = 'radio';
      input.checked = true;
      container.appendChild(input);

      const result = toBeChecked(input);
      expect(result.pass).toBe(true);
    });

    it('should pass when element has aria-checked', () => {
      const div = document.createElement('div');
      div.setAttribute('aria-checked', 'true');
      container.appendChild(div);

      const result = toBeChecked(div);
      expect(result.pass).toBe(true);
    });

    it('should fail when checkbox is not checked', () => {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = false;
      container.appendChild(input);

      const result = toBeChecked(input);
      expect(result.pass).toBe(false);
    });

    it('should fail when element is null', () => {
      const result = toBeChecked(null);
      expect(result.pass).toBe(false);
    });
  });

  describe('toBeEmptyDOMElement', () => {
    it('should pass when element is empty', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      const result = toBeEmptyDOMElement(element);
      expect(result.pass).toBe(true);
    });

    it('should pass when element has only whitespace', () => {
      const element = document.createElement('div');
      element.innerHTML = '   \n  ';
      container.appendChild(element);

      const result = toBeEmptyDOMElement(element);
      expect(result.pass).toBe(true);
    });

    it('should fail when element has content', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span>content</span>';
      container.appendChild(element);

      const result = toBeEmptyDOMElement(element);
      expect(result.pass).toBe(false);
    });

    it('should fail when element has text', () => {
      const element = document.createElement('div');
      element.textContent = 'text';
      container.appendChild(element);

      const result = toBeEmptyDOMElement(element);
      expect(result.pass).toBe(false);
    });

    it('should fail when element is null', () => {
      const result = toBeEmptyDOMElement(null);
      expect(result.pass).toBe(false);
    });
  });
});
