/**
 * Tests for render utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '../src/render';

describe('render', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a simple element', () => {
    const element = {
      type: 'div',
      props: { children: 'Hello World' },
    };

    const { container } = render(element);

    expect(container.textContent).toBe('Hello World');
  });

  it('renders nested elements', () => {
    const element = {
      type: 'div',
      props: {
        children: [
          { type: 'h1', props: { children: 'Title' } },
          { type: 'p', props: { children: 'Content' } },
        ],
      },
    };

    const { container } = render(element);

    expect(container.querySelector('h1')?.textContent).toBe('Title');
    expect(container.querySelector('p')?.textContent).toBe('Content');
  });

  it('renders with className', () => {
    const element = {
      type: 'div',
      props: { className: 'test-class', children: 'Content' },
    };

    const { container } = render(element);
    const div = container.querySelector('.test-class');

    expect(div).toBeTruthy();
    expect(div?.textContent).toBe('Content');
  });

  it('renders with data attributes', () => {
    const element = {
      type: 'div',
      props: {
        'data-testid': 'test-element',
        children: 'Content',
      },
    };

    const { getByTestId } = render(element);
    const div = getByTestId('test-element');

    expect(div).toBeTruthy();
    expect(div.textContent).toBe('Content');
  });

  it('provides rerender functionality', () => {
    const element1 = {
      type: 'div',
      props: { children: 'First' },
    };

    const { container, rerender } = render(element1);
    expect(container.textContent).toBe('First');

    const element2 = {
      type: 'div',
      props: { children: 'Second' },
    };

    rerender(element2);
    expect(container.textContent).toBe('Second');
  });

  it('provides unmount functionality', () => {
    const element = {
      type: 'div',
      props: { children: 'Hello' },
    };

    const { container, unmount } = render(element);
    expect(container.textContent).toBe('Hello');

    unmount();
    expect(container.textContent).toBe('');
  });

  it('provides debug functionality', () => {
    const element = {
      type: 'div',
      props: { children: 'Hello' },
    };

    const { debug } = render(element);

    // Should not throw
    expect(() => debug()).not.toThrow();
  });

  it('provides asFragment functionality', () => {
    const element = {
      type: 'div',
      props: { children: 'Hello' },
    };

    const { asFragment } = render(element);
    const fragment = asFragment();

    expect(fragment).toBeInstanceOf(DocumentFragment);
    expect(fragment.textContent).toBe('Hello');
  });

  it('supports custom container', () => {
    const customContainer = document.createElement('div');
    customContainer.id = 'custom';

    const element = {
      type: 'span',
      props: { children: 'Test' },
    };

    const { container } = render(element, { container: customContainer });

    expect(container).toBe(customContainer);
    expect(container.textContent).toBe('Test');
  });

  it('supports wrapper component', () => {
    const Wrapper = ({ children }: { children: any }) => ({
      type: 'div',
      props: {
        className: 'wrapper',
        children,
      },
    });

    const element = {
      type: 'span',
      props: { children: 'Wrapped' },
    };

    const { container } = render(element, { wrapper: Wrapper });
    const wrapper = container.querySelector('.wrapper');

    expect(wrapper).toBeTruthy();
    expect(wrapper?.querySelector('span')?.textContent).toBe('Wrapped');
  });
});

describe('cleanup', () => {
  it('removes all mounted containers', () => {
    const element = {
      type: 'div',
      props: { children: 'Test' },
    };

    const { container } = render(element);
    expect(container.textContent).toBe('Test');
    expect(document.body.contains(container)).toBe(true);

    cleanup();

    expect(container.textContent).toBe('');
    expect(document.body.contains(container)).toBe(false);
  });

  it('handles multiple renders', () => {
    const element1 = {
      type: 'div',
      props: { children: 'First' },
    };
    const element2 = {
      type: 'div',
      props: { children: 'Second' },
    };

    const { container: container1 } = render(element1);
    const { container: container2 } = render(element2);

    expect(container1.textContent).toBe('First');
    expect(container2.textContent).toBe('Second');

    cleanup();

    expect(container1.textContent).toBe('');
    expect(container2.textContent).toBe('');
  });
});

describe('bound queries', () => {
  it('getByRole finds element', () => {
    const element = {
      type: 'button',
      props: { children: 'Click me' },
    };

    const { getByRole } = render(element);
    const button = getByRole('button');

    expect(button).toBeTruthy();
    expect(button.textContent).toBe('Click me');
  });

  it('getByText finds element', () => {
    const element = {
      type: 'div',
      props: { children: 'Hello World' },
    };

    const { getByText } = render(element);
    const div = getByText('Hello World');

    expect(div).toBeTruthy();
  });

  it('queryByText returns null when not found', () => {
    const element = {
      type: 'div',
      props: { children: 'Hello' },
    };

    const { queryByText } = render(element);
    const result = queryByText('Goodbye');

    expect(result).toBeNull();
  });

  it('getAllByText finds multiple elements', () => {
    const element = {
      type: 'div',
      props: {
        children: [
          { type: 'span', props: { children: 'Test' } },
          { type: 'span', props: { children: 'Test' } },
        ],
      },
    };

    const { getAllByText } = render(element);
    const elements = getAllByText('Test');

    expect(elements).toHaveLength(2);
  });
});
