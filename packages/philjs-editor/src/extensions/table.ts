/**
 * Table Extension
 *
 * Full-featured table support with headers, merging, and styling
 */

import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

export interface TableOptions {
  /**
   * Allow table resizing
   */
  resizable?: boolean;
  /**
   * Allow cell selection
   */
  cellSelection?: boolean;
  /**
   * Default number of rows
   */
  defaultRows?: number;
  /**
   * Default number of columns
   */
  defaultCols?: number;
  /**
   * Allow header row
   */
  withHeaderRow?: boolean;
  /**
   * Custom cell min width
   */
  cellMinWidth?: number;
}

/**
 * Create configured table extensions
 */
export function createTableExtensions(options: TableOptions = {}) {
  const {
    resizable = true,
    cellSelection = true,
    defaultRows = 3,
    defaultCols = 3,
    withHeaderRow = true,
    cellMinWidth = 100,
  } = options;

  return [
    Table.configure({
      resizable,
      cellMinWidth,
      HTMLAttributes: {
        class: 'philjs-table',
      },
    }),
    TableRow.configure({
      HTMLAttributes: {
        class: 'philjs-table-row',
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: 'philjs-table-cell',
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: 'philjs-table-header',
      },
    }),
  ];
}

/**
 * Table keyboard shortcuts
 */
export const tableShortcuts = {
  insertTable: 'Mod-Alt-t',
  addColumnBefore: 'Mod-Alt-Left',
  addColumnAfter: 'Mod-Alt-Right',
  addRowBefore: 'Mod-Alt-Up',
  addRowAfter: 'Mod-Alt-Down',
  deleteColumn: 'Mod-Alt-Backspace',
  deleteRow: 'Mod-Shift-Backspace',
  deleteTable: 'Mod-Shift-Alt-Backspace',
  mergeCells: 'Mod-Alt-m',
  splitCell: 'Mod-Alt-s',
  toggleHeaderRow: 'Mod-Alt-h',
};

/**
 * Table helper commands
 */
export const tableCommands = {
  insertTable: (
    editor: any,
    options: { rows?: number; cols?: number; withHeaderRow?: boolean } = {}
  ) => {
    const { rows = 3, cols = 3, withHeaderRow = true } = options;
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow }).run();
  },

  addColumnBefore: (editor: any) => {
    editor.chain().focus().addColumnBefore().run();
  },

  addColumnAfter: (editor: any) => {
    editor.chain().focus().addColumnAfter().run();
  },

  addRowBefore: (editor: any) => {
    editor.chain().focus().addRowBefore().run();
  },

  addRowAfter: (editor: any) => {
    editor.chain().focus().addRowAfter().run();
  },

  deleteColumn: (editor: any) => {
    editor.chain().focus().deleteColumn().run();
  },

  deleteRow: (editor: any) => {
    editor.chain().focus().deleteRow().run();
  },

  deleteTable: (editor: any) => {
    editor.chain().focus().deleteTable().run();
  },

  mergeCells: (editor: any) => {
    editor.chain().focus().mergeCells().run();
  },

  splitCell: (editor: any) => {
    editor.chain().focus().splitCell().run();
  },

  toggleHeaderRow: (editor: any) => {
    editor.chain().focus().toggleHeaderRow().run();
  },

  toggleHeaderColumn: (editor: any) => {
    editor.chain().focus().toggleHeaderColumn().run();
  },

  toggleHeaderCell: (editor: any) => {
    editor.chain().focus().toggleHeaderCell().run();
  },

  setCellAttribute: (editor: any, name: string, value: any) => {
    editor.chain().focus().setCellAttribute(name, value).run();
  },

  goToNextCell: (editor: any) => {
    editor.chain().focus().goToNextCell().run();
  },

  goToPreviousCell: (editor: any) => {
    editor.chain().focus().goToPreviousCell().run();
  },
};

/**
 * Check if cursor is in a table
 */
export function isInTable(editor: any): boolean {
  return editor.isActive('table');
}

/**
 * Get table at current selection
 */
export function getTableInfo(editor: any): {
  rows: number;
  cols: number;
  hasHeaderRow: boolean;
} | null {
  if (!isInTable(editor)) {
    return null;
  }

  const { state } = editor;
  const { selection } = state;
  const { $from } = selection;

  // Find table node
  let tableNode = null;
  let depth = $from.depth;

  while (depth > 0) {
    const node = $from.node(depth);
    if (node.type.name === 'table') {
      tableNode = node;
      break;
    }
    depth--;
  }

  if (!tableNode) {
    return null;
  }

  const rows = tableNode.childCount;
  const cols = tableNode.firstChild?.childCount || 0;
  const hasHeaderRow = tableNode.firstChild?.firstChild?.type.name === 'tableHeader';

  return { rows, cols, hasHeaderRow };
}

export { Table, TableRow, TableCell, TableHeader };
export default createTableExtensions;
