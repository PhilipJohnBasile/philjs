/**
 * Tests for Card, CardHeader, CardTitle, CardBody, CardFooter, and CardImage Components
 */

import { describe, it, expect, vi } from 'vitest';
import { Card, CardHeader, CardTitle, CardBody, CardFooter, CardImage } from './Card';

describe('Card', () => {
  describe('rendering', () => {
    it('should render a div element', () => {
      const vnode = Card({ children: 'Content' });

      expect(vnode.type).toBe('div');
      // Children may be wrapped in array
      const content = Array.isArray(vnode.props.children)
        ? vnode.props.children[0]
        : vnode.props.children;
      expect(content).toBe('Content');
    });

    it('should apply rounded corners', () => {
      const vnode = Card({ children: 'Content' });

      expect(vnode.props.className).toContain('rounded-lg');
    });

    it('should accept custom className', () => {
      const vnode = Card({ children: 'Content', className: 'custom-card' });

      expect(vnode.props.className).toContain('custom-card');
    });
  });

  describe('variants', () => {
    it('should apply elevated variant styles (default)', () => {
      const vnode = Card({ children: 'Content', variant: 'elevated' });

      expect(vnode.props.className).toContain('bg-white');
      expect(vnode.props.className).toContain('shadow-md');
    });

    it('should apply outlined variant styles', () => {
      const vnode = Card({ children: 'Content', variant: 'outlined' });

      expect(vnode.props.className).toContain('bg-white');
      expect(vnode.props.className).toContain('border');
      expect(vnode.props.className).toContain('border-gray-200');
    });

    it('should apply filled variant styles', () => {
      const vnode = Card({ children: 'Content', variant: 'filled' });

      expect(vnode.props.className).toContain('bg-gray-50');
    });
  });

  describe('padding', () => {
    it('should apply no padding', () => {
      const vnode = Card({ children: 'Content', padding: 'none' });

      expect(vnode.props.className).toContain('p-0');
    });

    it('should apply small padding', () => {
      const vnode = Card({ children: 'Content', padding: 'sm' });

      expect(vnode.props.className).toContain('p-3');
    });

    it('should apply medium padding (default)', () => {
      const vnode = Card({ children: 'Content', padding: 'md' });

      expect(vnode.props.className).toContain('p-4');
    });

    it('should apply large padding', () => {
      const vnode = Card({ children: 'Content', padding: 'lg' });

      expect(vnode.props.className).toContain('p-6');
    });
  });

  describe('hoverable', () => {
    it('should not be hoverable by default', () => {
      const vnode = Card({ children: 'Content', hoverable: false });

      expect(vnode.props.className).not.toContain('hover:shadow-lg');
    });

    it('should apply hover styles when hoverable', () => {
      const vnode = Card({ children: 'Content', hoverable: true });

      expect(vnode.props.className).toContain('transition-shadow');
      expect(vnode.props.className).toContain('hover:shadow-lg');
    });
  });

  describe('clickable', () => {
    it('should not be clickable by default', () => {
      const vnode = Card({ children: 'Content' });

      expect(vnode.props.role).toBeUndefined();
      expect(vnode.props.tabIndex).toBeUndefined();
      expect(vnode.props.onClick).toBeUndefined();
    });

    it('should be clickable when clickable prop is true', () => {
      const onClick = vi.fn();
      const vnode = Card({ children: 'Content', clickable: true, onClick });

      expect(vnode.props.role).toBe('button');
      expect(vnode.props.tabIndex).toBe(0);
      expect(vnode.props.className).toContain('cursor-pointer');
    });

    it('should call onClick when clicked and clickable', () => {
      const onClick = vi.fn();
      const vnode = Card({ children: 'Content', clickable: true, onClick });

      expect(vnode.props.onClick).toBe(onClick);
    });
  });
});

describe('CardHeader', () => {
  it('should render with flex layout', () => {
    const vnode = CardHeader({ children: 'Header' });

    expect(vnode.type).toBe('div');
    expect(vnode.props.className).toContain('flex');
    expect(vnode.props.className).toContain('items-center');
    expect(vnode.props.className).toContain('justify-between');
  });

  it('should render children', () => {
    const vnode = CardHeader({ children: 'Header Content' });

    // First child is the content wrapper
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    const contentWrapper = children[0];
    expect(contentWrapper.type).toBe('div');
    // Children may be wrapped in array
    const content = Array.isArray(contentWrapper.props.children)
      ? contentWrapper.props.children[0]
      : contentWrapper.props.children;
    expect(content).toBe('Header Content');
  });

  it('should render action element', () => {
    const action = <button>Action</button>;
    const vnode = CardHeader({ children: 'Header', action });

    // Second child is the action wrapper
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    const actionWrapper = children[1];
    expect(actionWrapper.type).toBe('div');
    // Children may be wrapped in array
    const actionContent = Array.isArray(actionWrapper.props.children)
      ? actionWrapper.props.children[0]
      : actionWrapper.props.children;
    expect(actionContent).toBe(action);
  });

  it('should accept custom className', () => {
    const vnode = CardHeader({ children: 'Header', className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('CardTitle', () => {
  it('should render title as h3', () => {
    const vnode = CardTitle({ children: 'Title' });

    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    const h3 = children[0];
    expect(h3.type).toBe('h3');
    expect(h3.props.className).toContain('text-lg');
    expect(h3.props.className).toContain('font-semibold');
    // Children may be wrapped in array
    const titleText = Array.isArray(h3.props.children)
      ? h3.props.children[0]
      : h3.props.children;
    expect(titleText).toBe('Title');
  });

  it('should render subtitle when provided', () => {
    const vnode = CardTitle({ children: 'Title', subtitle: 'Subtitle text' });

    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    const subtitle = children[1];
    expect(subtitle.type).toBe('p');
    expect(subtitle.props.className).toContain('text-sm');
    expect(subtitle.props.className).toContain('text-gray-500');
    // Children may be wrapped in array
    const subtitleText = Array.isArray(subtitle.props.children)
      ? subtitle.props.children[0]
      : subtitle.props.children;
    expect(subtitleText).toBe('Subtitle text');
  });

  it('should not render subtitle when not provided', () => {
    const vnode = CardTitle({ children: 'Title' });

    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    expect(children[1]).toBeFalsy();
  });

  it('should accept custom className', () => {
    const vnode = CardTitle({ children: 'Title', className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('CardBody', () => {
  it('should render children', () => {
    const vnode = CardBody({ children: 'Body content' });

    expect(vnode.type).toBe('div');
    // Children may be wrapped in array
    const content = Array.isArray(vnode.props.children)
      ? vnode.props.children[0]
      : vnode.props.children;
    expect(content).toBe('Body content');
  });

  it('should accept custom className', () => {
    const vnode = CardBody({ children: 'Content', className: 'custom-body' });

    expect(vnode.props.className).toBe('custom-body');
  });
});

describe('CardFooter', () => {
  it('should render with margin top', () => {
    const vnode = CardFooter({ children: 'Footer' });

    expect(vnode.type).toBe('div');
    expect(vnode.props.className).toContain('mt-4');
    expect(vnode.props.className).toContain('pt-4');
  });

  it('should render children', () => {
    const vnode = CardFooter({ children: 'Footer content' });

    // Children may be wrapped in array
    const content = Array.isArray(vnode.props.children)
      ? vnode.props.children[0]
      : vnode.props.children;
    expect(content).toBe('Footer content');
  });

  it('should render divider when divider prop is true', () => {
    const vnode = CardFooter({ children: 'Footer', divider: true });

    expect(vnode.props.className).toContain('border-t');
    expect(vnode.props.className).toContain('border-gray-200');
  });

  it('should not render divider by default', () => {
    const vnode = CardFooter({ children: 'Footer', divider: false });

    expect(vnode.props.className).not.toContain('border-t');
  });

  it('should accept custom className', () => {
    const vnode = CardFooter({ children: 'Footer', className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('CardImage', () => {
  it('should render an img element', () => {
    const vnode = CardImage({ src: '/image.jpg', alt: 'Test image' });

    expect(vnode.type).toBe('img');
    expect(vnode.props.src).toBe('/image.jpg');
    expect(vnode.props.alt).toBe('Test image');
  });

  it('should apply top position styles by default', () => {
    const vnode = CardImage({ src: '/image.jpg', alt: 'Test', position: 'top' });

    expect(vnode.props.className).toContain('rounded-t-lg');
    expect(vnode.props.className).toContain('-mt-4');
    expect(vnode.props.className).toContain('mb-4');
  });

  it('should apply bottom position styles', () => {
    const vnode = CardImage({ src: '/image.jpg', alt: 'Test', position: 'bottom' });

    expect(vnode.props.className).toContain('rounded-b-lg');
    expect(vnode.props.className).toContain('-mb-4');
    expect(vnode.props.className).toContain('mt-4');
  });

  it('should apply full width and object-cover', () => {
    const vnode = CardImage({ src: '/image.jpg', alt: 'Test' });

    expect(vnode.props.className).toContain('w-full');
    expect(vnode.props.className).toContain('object-cover');
  });

  it('should accept custom className', () => {
    const vnode = CardImage({ src: '/image.jpg', alt: 'Test', className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});
