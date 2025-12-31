import { describe, it, expect } from 'vitest';
import { signal } from './signals';
import { render } from './hydrate';
import { jsx } from './jsx-runtime';

const createContainer = (): HTMLDivElement => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return container;
};

describe('render() dynamic accessors', () => {
  it('updates text content when a signal changes', () => {
    const count = signal(0);
    const container = createContainer();

    render(
      jsx('div', { 'data-testid': 'counter', children: count }),
      container
    );

    const counter = container.querySelector("[data-testid='counter']") as HTMLDivElement;
    expect(counter.textContent).toBe('0');

    count.set(5);
    expect(counter.textContent).toBe('5');

    count.set(42);
    expect(counter.textContent).toBe('42');

    document.body.removeChild(container);
  });

  it('swaps conditional children without leaving stale nodes', () => {
    const toggle = signal(true);
    const container = createContainer();

    render(
      jsx('div', {
        'data-testid': 'conditional',
        children: () =>
          toggle()
            ? [
                jsx('span', { 'data-marker': 'a', children: 'A' }),
                jsx('span', { 'data-marker': 'b', children: 'B' }),
              ]
            : jsx('span', { 'data-marker': 'c', children: 'C' }),
      }),
      container
    );

    const getMarkers = (): string[] =>
      Array.from(container.querySelectorAll('[data-marker]')).map(
        (el) => (el as HTMLElement).dataset.marker || ''
      );

    expect(getMarkers()).toEqual(['a', 'b']);

    toggle.set(false);
    expect(getMarkers()).toEqual(['c']);

    toggle.set(true);
    expect(getMarkers()).toEqual(['a', 'b']);

    document.body.removeChild(container);
  });

  it('removes DOM nodes when dynamic accessor returns null', () => {
    const show = signal(true);
    const container = createContainer();

    render(
      jsx('div', {
        'data-testid': 'nullable',
        children: () =>
          show() ? jsx('span', { 'data-marker': 'present', children: 'Here' }) : null,
      }),
      container
    );

    const query = (): Element | null => container.querySelector("[data-marker='present']");

    expect(query()).not.toBeNull();

    show.set(false);
    expect(query()).toBeNull();

    show.set(true);
    expect(query()).not.toBeNull();

    document.body.removeChild(container);
  });
});
