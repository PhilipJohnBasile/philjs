/**
 * Table Extension
 *
 * Full-featured table support with headers, merging, and styling
 */
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
/**
 * Create configured table extensions
 */
export function createTableExtensions(options = {}) {
    const { resizable = true, cellSelection = true, defaultRows = 3, defaultCols = 3, withHeaderRow = true, cellMinWidth = 100, } = options;
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
    insertTable: (editor, options = {}) => {
        const { rows = 3, cols = 3, withHeaderRow = true } = options;
        editor.chain().focus().insertTable({ rows, cols, withHeaderRow }).run();
    },
    addColumnBefore: (editor) => {
        editor.chain().focus().addColumnBefore().run();
    },
    addColumnAfter: (editor) => {
        editor.chain().focus().addColumnAfter().run();
    },
    addRowBefore: (editor) => {
        editor.chain().focus().addRowBefore().run();
    },
    addRowAfter: (editor) => {
        editor.chain().focus().addRowAfter().run();
    },
    deleteColumn: (editor) => {
        editor.chain().focus().deleteColumn().run();
    },
    deleteRow: (editor) => {
        editor.chain().focus().deleteRow().run();
    },
    deleteTable: (editor) => {
        editor.chain().focus().deleteTable().run();
    },
    mergeCells: (editor) => {
        editor.chain().focus().mergeCells().run();
    },
    splitCell: (editor) => {
        editor.chain().focus().splitCell().run();
    },
    toggleHeaderRow: (editor) => {
        editor.chain().focus().toggleHeaderRow().run();
    },
    toggleHeaderColumn: (editor) => {
        editor.chain().focus().toggleHeaderColumn().run();
    },
    toggleHeaderCell: (editor) => {
        editor.chain().focus().toggleHeaderCell().run();
    },
    setCellAttribute: (editor, name, value) => {
        editor.chain().focus().setCellAttribute(name, value).run();
    },
    goToNextCell: (editor) => {
        editor.chain().focus().goToNextCell().run();
    },
    goToPreviousCell: (editor) => {
        editor.chain().focus().goToPreviousCell().run();
    },
};
/**
 * Check if cursor is in a table
 */
export function isInTable(editor) {
    return editor.isActive('table');
}
/**
 * Get table at current selection
 */
export function getTableInfo(editor) {
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
//# sourceMappingURL=table.js.map