/**
 * Tests for Breadcrumb, BreadcrumbItem, BreadcrumbLink, and BreadcrumbSeparator Components
 */

import { describe, it, expect, vi } from 'vitest';
import type { JSXElement } from 'philjs-core';

// Helper to safely access props on JSX children
const asElement = (child: unknown): JSXElement => child as JSXElement;
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbIcons,
} from './Breadcrumb';

describe('Breadcrumb', () => {
  describe('rendering', () => {
    it('should render a nav element with aria-label', () => {
      const vnode = Breadcrumb({
        children: <BreadcrumbItem>Home</BreadcrumbItem>,
      });

      expect(vnode.type).toBe('nav');
      expect(vnode.props['aria-label']).toBe('Breadcrumb');
    });

    it('should render an ordered list', () => {
      const vnode = Breadcrumb({
        children: <BreadcrumbItem>Home</BreadcrumbItem>,
      });

      // Children may be wrapped in array
      const ol = Array.isArray(vnode.props.children)
        ? vnode.props.children[0]
        : vnode.props.children;
      expect(ol.type).toBe('ol');
      expect(ol.props.className).toContain('flex');
      expect(ol.props.className).toContain('items-center');
    });

    it('should render children as list items', () => {
      const vnode = Breadcrumb({
        children: [
          <BreadcrumbItem key="1">Home</BreadcrumbItem>,
          <BreadcrumbItem key="2">Products</BreadcrumbItem>,
        ],
      });

      // Children may be wrapped in array
      const ol = Array.isArray(vnode.props.children)
        ? vnode.props.children[0]
        : vnode.props.children;
      const items = Array.isArray(ol.props.children)
        ? ol.props.children
        : [ol.props.children];

      expect(items.length).toBe(2);
      items.forEach((item: any) => {
        expect(item.type).toBe('li');
      });
    });
  });

  describe('separator', () => {
    it('should use default separator (slash)', () => {
      const vnode = Breadcrumb({
        children: [
          <BreadcrumbItem key="1">Home</BreadcrumbItem>,
          <BreadcrumbItem key="2">Products</BreadcrumbItem>,
        ],
      });

      // Children may be wrapped in array
      const ol = Array.isArray(vnode.props.children)
        ? vnode.props.children[0]
        : vnode.props.children;
      const olChildren = Array.isArray(ol.props.children)
        ? ol.props.children
        : [ol.props.children];
      const firstItem = olChildren[0];
      const firstItemChildren = Array.isArray(firstItem.props.children)
        ? firstItem.props.children
        : [firstItem.props.children];
      const separator = firstItemChildren[1];
      // Separator children may also be wrapped
      const separatorContent = Array.isArray(separator.props.children)
        ? separator.props.children[0]
        : separator.props.children;

      expect(separatorContent).toBe('/');
    });

    it('should accept custom separator string', () => {
      const vnode = Breadcrumb({
        children: [
          <BreadcrumbItem key="1">Home</BreadcrumbItem>,
          <BreadcrumbItem key="2">Products</BreadcrumbItem>,
        ],
        separator: '>',
      });

      // Children may be wrapped in array
      const ol = Array.isArray(vnode.props.children)
        ? vnode.props.children[0]
        : vnode.props.children;
      const olChildren = Array.isArray(ol.props.children)
        ? ol.props.children
        : [ol.props.children];
      const firstItem = olChildren[0];
      const firstItemChildren = Array.isArray(firstItem.props.children)
        ? firstItem.props.children
        : [firstItem.props.children];
      const separator = firstItemChildren[1];
      // Separator children may also be wrapped
      const separatorContent = Array.isArray(separator.props.children)
        ? separator.props.children[0]
        : separator.props.children;

      expect(separatorContent).toBe('>');
    });

    it('should accept custom separator element', () => {
      const customSeparator = <span className="custom-sep">|</span>;
      const vnode = Breadcrumb({
        children: [
          <BreadcrumbItem key="1">Home</BreadcrumbItem>,
          <BreadcrumbItem key="2">Products</BreadcrumbItem>,
        ],
        separator: customSeparator,
      });

      expect(vnode).toBeDefined();
    });

    it('should not render separator after last item', () => {
      const vnode = Breadcrumb({
        children: [
          <BreadcrumbItem key="1">Home</BreadcrumbItem>,
          <BreadcrumbItem key="2">Products</BreadcrumbItem>,
        ],
      });

      // Children may be wrapped in array
      const ol = Array.isArray(vnode.props.children)
        ? vnode.props.children[0]
        : vnode.props.children;
      const olChildren = Array.isArray(ol.props.children)
        ? ol.props.children
        : [ol.props.children];
      const lastItem = olChildren[1];
      const lastItemChildren = Array.isArray(lastItem.props.children)
        ? lastItem.props.children
        : [lastItem.props.children];
      const separator = lastItemChildren[1];

      expect(!separator || separator === false).toBe(true);
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = Breadcrumb({
        children: <BreadcrumbItem>Home</BreadcrumbItem>,
        className: 'custom-breadcrumb',
      });

      expect(vnode.props.className).toContain('custom-breadcrumb');
    });
  });
});

describe('BreadcrumbItem', () => {
  describe('rendering', () => {
    it('should render as span when isCurrentPage is true', () => {
      const vnode = BreadcrumbItem({ children: 'Current Page', isCurrentPage: true });

      expect(vnode.type).toBe('span');
      expect(vnode.props['aria-current']).toBe('page');
    });

    it('should render as anchor when href is provided', () => {
      const vnode = BreadcrumbItem({ children: 'Link', href: '/page' });

      expect(vnode.type).toBe('a');
      expect(vnode.props.href).toBe('/page');
    });

    it('should render as button when onClick is provided without href', () => {
      const onClick = vi.fn();
      const vnode = BreadcrumbItem({ children: 'Button', onClick });

      expect(vnode.type).toBe('button');
      expect(vnode.props.onClick).toBe(onClick);
    });
  });

  describe('styling', () => {
    it('should apply current page styles', () => {
      const vnode = BreadcrumbItem({ children: 'Current', isCurrentPage: true });

      expect(vnode.props.className).toContain('text-gray-900');
      expect(vnode.props.className).toContain('font-medium');
    });

    it('should apply inactive link styles', () => {
      const vnode = BreadcrumbItem({ children: 'Link', href: '/page' });

      expect(vnode.props.className).toContain('text-gray-500');
      expect(vnode.props.className).toContain('hover:text-gray-700');
    });

    it('should have text-sm size', () => {
      const vnode = BreadcrumbItem({ children: 'Item', href: '/page' });

      expect(vnode.props.className).toContain('text-sm');
    });
  });

  describe('events', () => {
    it('should call onClick on anchor', () => {
      const onClick = vi.fn();
      const vnode = BreadcrumbItem({ children: 'Link', href: '/page', onClick });

      expect(vnode.props.onClick).toBe(onClick);
    });

    it('should call onClick on button', () => {
      const onClick = vi.fn();
      const vnode = BreadcrumbItem({ children: 'Button', onClick });

      expect(vnode.props.onClick).toBe(onClick);
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = BreadcrumbItem({ children: 'Item', className: 'custom' });

      expect(vnode.props.className).toContain('custom');
    });
  });
});

describe('BreadcrumbLink', () => {
  it('should be an alias for BreadcrumbItem', () => {
    const vnode = BreadcrumbLink({ children: 'Link', href: '/page' });

    // BreadcrumbLink returns a BreadcrumbItem component
    expect(vnode.type).toBe(BreadcrumbItem);
  });
});

describe('BreadcrumbSeparator', () => {
  it('should render a span element', () => {
    const vnode = BreadcrumbSeparator({});

    expect(vnode.type).toBe('span');
  });

  it('should have aria-hidden for accessibility', () => {
    const vnode = BreadcrumbSeparator({});

    expect(vnode.props['aria-hidden']).toBe('true');
  });

  it('should render default separator (slash)', () => {
    const vnode = BreadcrumbSeparator({});

    // Children may be wrapped in array
    const content = Array.isArray(vnode.props.children)
      ? vnode.props.children[0]
      : vnode.props.children;
    expect(content).toBe('/');
  });

  it('should accept custom children', () => {
    const vnode = BreadcrumbSeparator({ children: '>' });

    // Children may be wrapped in array
    const content = Array.isArray(vnode.props.children)
      ? vnode.props.children[0]
      : vnode.props.children;
    expect(content).toBe('>');
  });

  it('should have margin and gray color', () => {
    const vnode = BreadcrumbSeparator({});

    expect(vnode.props.className).toContain('mx-2');
    expect(vnode.props.className).toContain('text-gray-400');
  });

  it('should accept custom className', () => {
    const vnode = BreadcrumbSeparator({ className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('BreadcrumbIcons', () => {
  it('should export chevron icon', () => {
    expect(BreadcrumbIcons.chevron).toBeDefined();
    expect(BreadcrumbIcons.chevron.type).toBe('svg');
  });

  it('should export arrow icon', () => {
    expect(BreadcrumbIcons.arrow).toBeDefined();
    expect(BreadcrumbIcons.arrow.type).toBe('svg');
  });

  it('should export dot icon', () => {
    expect(BreadcrumbIcons.dot).toBeDefined();
    expect(BreadcrumbIcons.dot.type).toBe('span');
  });

  it('should have accessible icon sizes', () => {
    expect(BreadcrumbIcons.chevron.props.className).toContain('h-4');
    expect(BreadcrumbIcons.chevron.props.className).toContain('w-4');
  });
});
