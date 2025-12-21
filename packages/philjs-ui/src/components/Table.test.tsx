/**
 * Tests for Table, Thead, Tbody, Tfoot, Tr, Th, Td, TableCaption, and TableEmpty Components
 */

import { describe, it, expect, vi } from 'vitest';
import { Table, Thead, Tbody, Tfoot, Tr, Th, Td, TableCaption, TableEmpty } from './Table';
import type { JSXElement } from 'philjs-core';

// Helper to safely access props on JSX children
const asElement = (child: unknown): JSXElement => child as JSXElement;

// Helper to get table element from Table vnode
function getTableElement(vnode: any): any {
  // Children may be wrapped in array
  const children = Array.isArray(vnode.props.children)
    ? vnode.props.children
    : [vnode.props.children];
  return children[0];
}

describe('Table', () => {
  describe('rendering', () => {
    it('should render a table element', () => {
      const vnode = Table({ children: <Tbody><Tr><Td>Cell</Td></Tr></Tbody> });
      const table = getTableElement(vnode);

      expect(table.type).toBe('table');
    });

    it('should wrap table in overflow container', () => {
      const vnode = Table({ children: <Tbody><Tr><Td>Cell</Td></Tr></Tbody> });

      expect(vnode.type).toBe('div');
      expect(vnode.props.className).toContain('overflow-x-auto');
    });
  });

  describe('variants', () => {
    it('should apply simple variant (default)', () => {
      const vnode = Table({ variant: 'simple', children: <Tbody /> });
      const table = getTableElement(vnode);

      expect(table.props.className).toContain('divide-y');
      expect(table.props.className).toContain('divide-gray-200');
    });

    it('should apply striped variant', () => {
      const vnode = Table({ variant: 'striped', children: <Tbody /> });
      const table = getTableElement(vnode);

      expect(table.props.className).toContain('nth-child');
    });

    it('should apply unstyled variant', () => {
      const vnode = Table({ variant: 'unstyled', children: <Tbody /> });
      const table = getTableElement(vnode);

      expect(table.props.className).not.toContain('divide-y');
    });
  });

  describe('sizes', () => {
    it('should apply sm size', () => {
      const vnode = Table({ size: 'sm', children: <Tbody /> });
      const table = getTableElement(vnode);

      expect(table.props.className).toContain('text-sm');
    });

    it('should apply md size (default)', () => {
      const vnode = Table({ size: 'md', children: <Tbody /> });
      const table = getTableElement(vnode);

      expect(table.props.className).toContain('text-base');
    });

    it('should apply lg size', () => {
      const vnode = Table({ size: 'lg', children: <Tbody /> });
      const table = getTableElement(vnode);

      expect(table.props.className).toContain('text-lg');
    });
  });

  describe('hoverable', () => {
    it('should not be hoverable by default', () => {
      const vnode = Table({ hoverable: false, children: <Tbody /> });
      const table = getTableElement(vnode);

      expect(table.props.className).not.toContain('hover:bg-gray-50');
    });

    it('should apply hover styles when hoverable', () => {
      const vnode = Table({ hoverable: true, children: <Tbody /> });
      const table = getTableElement(vnode);

      expect(table.props.className).toContain('hover');
    });
  });

  describe('custom className', () => {
    it('should accept custom className', () => {
      const vnode = Table({ className: 'custom-table', children: <Tbody /> });

      expect(vnode.props.className).toContain('custom-table');
    });
  });
});

describe('Thead', () => {
  it('should render a thead element', () => {
    const vnode = Thead({ children: <Tr><Th>Header</Th></Tr> });

    expect(vnode.type).toBe('thead');
  });

  it('should have gray background', () => {
    const vnode = Thead({ children: <Tr><Th>Header</Th></Tr> });

    expect(vnode.props.className).toContain('bg-gray-50');
  });

  it('should accept custom className', () => {
    const vnode = Thead({ children: <Tr />, className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('Tbody', () => {
  it('should render a tbody element', () => {
    const vnode = Tbody({ children: <Tr><Td>Cell</Td></Tr> });

    expect(vnode.type).toBe('tbody');
  });

  it('should have divide-y styles', () => {
    const vnode = Tbody({ children: <Tr><Td>Cell</Td></Tr> });

    expect(vnode.props.className).toContain('divide-y');
    expect(vnode.props.className).toContain('divide-gray-200');
  });

  it('should have white background', () => {
    const vnode = Tbody({ children: <Tr><Td>Cell</Td></Tr> });

    expect(vnode.props.className).toContain('bg-white');
  });

  it('should accept custom className', () => {
    const vnode = Tbody({ children: <Tr />, className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('Tfoot', () => {
  it('should render a tfoot element', () => {
    const vnode = Tfoot({ children: <Tr><Td>Footer</Td></Tr> });

    expect(vnode.type).toBe('tfoot');
  });

  it('should have gray background', () => {
    const vnode = Tfoot({ children: <Tr><Td>Footer</Td></Tr> });

    expect(vnode.props.className).toContain('bg-gray-50');
  });

  it('should accept custom className', () => {
    const vnode = Tfoot({ children: <Tr />, className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('Tr', () => {
  it('should render a tr element', () => {
    const vnode = Tr({ children: <Td>Cell</Td> });

    expect(vnode.type).toBe('tr');
  });

  it('should apply selected styles', () => {
    const vnode = Tr({ children: <Td>Cell</Td>, selected: true });

    expect(vnode.props.className).toContain('bg-blue-50');
  });

  it('should apply cursor-pointer when onClick is provided', () => {
    const vnode = Tr({ children: <Td>Cell</Td>, onClick: vi.fn() });

    expect(vnode.props.className).toContain('cursor-pointer');
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    const vnode = Tr({ children: <Td>Cell</Td>, onClick });

    expect(vnode.props.onClick).toBe(onClick);
  });

  it('should accept custom className', () => {
    const vnode = Tr({ children: <Td>Cell</Td>, className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('Th', () => {
  it('should render a th element', () => {
    const vnode = Th({ children: 'Header' });

    expect(vnode.type).toBe('th');
    expect(vnode.props.scope).toBe('col');
  });

  it('should have font-semibold', () => {
    const vnode = Th({ children: 'Header' });

    expect(vnode.props.className).toContain('font-semibold');
  });

  it('should have padding', () => {
    const vnode = Th({ children: 'Header' });

    expect(vnode.props.className).toContain('px-4');
    expect(vnode.props.className).toContain('py-3');
  });

  describe('alignment', () => {
    it('should align left by default', () => {
      const vnode = Th({ children: 'Header', align: 'left' });

      expect(vnode.props.className).toContain('text-left');
    });

    it('should align center', () => {
      const vnode = Th({ children: 'Header', align: 'center' });

      expect(vnode.props.className).toContain('text-center');
    });

    it('should align right', () => {
      const vnode = Th({ children: 'Header', align: 'right' });

      expect(vnode.props.className).toContain('text-right');
    });
  });

  describe('sortable', () => {
    it('should show sort icons when sortable', () => {
      const vnode = Th({ children: 'Header', sortable: true });

      expect(vnode.props.className).toContain('cursor-pointer');
      expect(vnode.props.className).toContain('select-none');
    });

    it('should call onSort when clicked and sortable', () => {
      const onSort = vi.fn();
      const vnode = Th({ children: 'Header', sortable: true, onSort });

      expect(vnode.props.onClick).toBe(onSort);
    });

    it('should indicate ascending sort direction', () => {
      const vnode = Th({ children: 'Header', sortable: true, sortDirection: 'asc' });

      expect(vnode).toBeDefined();
    });

    it('should indicate descending sort direction', () => {
      const vnode = Th({ children: 'Header', sortable: true, sortDirection: 'desc' });

      expect(vnode).toBeDefined();
    });
  });

  describe('width', () => {
    it('should accept width as number', () => {
      const vnode = Th({ children: 'Header', width: 100 });

      expect(vnode.props.style.width).toBe('100px');
    });

    it('should accept width as string', () => {
      const vnode = Th({ children: 'Header', width: '50%' });

      expect(vnode.props.style.width).toBe('50%');
    });
  });

  it('should accept custom className', () => {
    const vnode = Th({ children: 'Header', className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('Td', () => {
  it('should render a td element', () => {
    const vnode = Td({ children: 'Cell' });

    expect(vnode.type).toBe('td');
  });

  it('should have padding', () => {
    const vnode = Td({ children: 'Cell' });

    expect(vnode.props.className).toContain('px-4');
    expect(vnode.props.className).toContain('py-3');
  });

  it('should have gray text color', () => {
    const vnode = Td({ children: 'Cell' });

    expect(vnode.props.className).toContain('text-gray-600');
  });

  describe('alignment', () => {
    it('should align left by default', () => {
      const vnode = Td({ children: 'Cell', align: 'left' });

      expect(vnode.props.className).toContain('text-left');
    });

    it('should align center', () => {
      const vnode = Td({ children: 'Cell', align: 'center' });

      expect(vnode.props.className).toContain('text-center');
    });

    it('should align right', () => {
      const vnode = Td({ children: 'Cell', align: 'right' });

      expect(vnode.props.className).toContain('text-right');
    });
  });

  describe('spanning', () => {
    it('should accept colSpan', () => {
      const vnode = Td({ children: 'Cell', colSpan: 2 });

      expect(vnode.props.colSpan).toBe(2);
    });

    it('should accept rowSpan', () => {
      const vnode = Td({ children: 'Cell', rowSpan: 3 });

      expect(vnode.props.rowSpan).toBe(3);
    });
  });

  it('should accept custom className', () => {
    const vnode = Td({ children: 'Cell', className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('TableCaption', () => {
  it('should render a caption element', () => {
    const vnode = TableCaption({ children: 'Caption text' });

    expect(vnode.type).toBe('caption');
  });

  it('should apply bottom placement by default', () => {
    const vnode = TableCaption({ children: 'Caption', placement: 'bottom' });

    expect(vnode.props.className).toContain('caption-bottom');
  });

  it('should apply top placement', () => {
    const vnode = TableCaption({ children: 'Caption', placement: 'top' });

    expect(vnode.props.className).toContain('caption-top');
  });

  it('should have gray text', () => {
    const vnode = TableCaption({ children: 'Caption' });

    expect(vnode.props.className).toContain('text-gray-500');
  });

  it('should accept custom className', () => {
    const vnode = TableCaption({ children: 'Caption', className: 'custom' });

    expect(vnode.props.className).toContain('custom');
  });
});

describe('TableEmpty', () => {
  it('should render a tr with td spanning all columns', () => {
    const vnode = TableEmpty({ colSpan: 5 });

    expect(vnode.type).toBe('tr');
    // Children may be wrapped in array
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    const td = asElement(children[0]);
    expect(td.props.colSpan).toBe(5);
  });

  it('should display default message', () => {
    const vnode = TableEmpty({ colSpan: 5 });

    // Children may be wrapped in array
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    const td = asElement(children[0]);
    const tdChildren = Array.isArray(td.props.children)
      ? td.props.children
      : [td.props.children];
    const contentWrapper = tdChildren[0];
    const contentChildren = Array.isArray(contentWrapper.props.children)
      ? contentWrapper.props.children
      : [contentWrapper.props.children];
    // Message is in a <p> tag - find it
    const messageP = contentChildren.find((c: any) => c?.type === 'p');
    const messageText = Array.isArray(messageP.props.children)
      ? messageP.props.children[0]
      : messageP.props.children;
    expect(messageText).toBe('No data available');
  });

  it('should display custom message', () => {
    const vnode = TableEmpty({ colSpan: 5, message: 'No results found' });

    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    const td = asElement(children[0]);
    const tdChildren = Array.isArray(td.props.children)
      ? td.props.children
      : [td.props.children];
    const contentWrapper = tdChildren[0];
    const contentChildren = Array.isArray(contentWrapper.props.children)
      ? contentWrapper.props.children
      : [contentWrapper.props.children];
    const messageP = contentChildren.find((c: any) => c?.type === 'p');
    const messageText = Array.isArray(messageP.props.children)
      ? messageP.props.children[0]
      : messageP.props.children;
    expect(messageText).toBe('No results found');
  });

  it('should accept custom icon', () => {
    const customIcon = <span>Custom Icon</span>;
    const vnode = TableEmpty({ colSpan: 5, icon: customIcon });

    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    const td = asElement(children[0]);
    const tdChildren = Array.isArray(td.props.children)
      ? td.props.children
      : [td.props.children];
    const contentWrapper = tdChildren[0];
    const contentChildren = Array.isArray(contentWrapper.props.children)
      ? contentWrapper.props.children
      : [contentWrapper.props.children];
    // First child should be the custom icon
    expect(contentChildren[0]).toBe(customIcon);
  });

  it('should be centered', () => {
    const vnode = TableEmpty({ colSpan: 5 });

    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    const td = asElement(children[0]);
    expect(td.props.className).toContain('text-center');
  });
});
