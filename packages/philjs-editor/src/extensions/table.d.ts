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
export declare function createTableExtensions(options?: TableOptions): any[];
/**
 * Table keyboard shortcuts
 */
export declare const tableShortcuts: {
    insertTable: string;
    addColumnBefore: string;
    addColumnAfter: string;
    addRowBefore: string;
    addRowAfter: string;
    deleteColumn: string;
    deleteRow: string;
    deleteTable: string;
    mergeCells: string;
    splitCell: string;
    toggleHeaderRow: string;
};
/**
 * Table helper commands
 */
export declare const tableCommands: {
    insertTable: (editor: any, options?: {
        rows?: number;
        cols?: number;
        withHeaderRow?: boolean;
    }) => void;
    addColumnBefore: (editor: any) => void;
    addColumnAfter: (editor: any) => void;
    addRowBefore: (editor: any) => void;
    addRowAfter: (editor: any) => void;
    deleteColumn: (editor: any) => void;
    deleteRow: (editor: any) => void;
    deleteTable: (editor: any) => void;
    mergeCells: (editor: any) => void;
    splitCell: (editor: any) => void;
    toggleHeaderRow: (editor: any) => void;
    toggleHeaderColumn: (editor: any) => void;
    toggleHeaderCell: (editor: any) => void;
    setCellAttribute: (editor: any, name: string, value: any) => void;
    goToNextCell: (editor: any) => void;
    goToPreviousCell: (editor: any) => void;
};
/**
 * Check if cursor is in a table
 */
export declare function isInTable(editor: any): boolean;
/**
 * Get table at current selection
 */
export declare function getTableInfo(editor: any): {
    rows: number;
    cols: number;
    hasHeaderRow: boolean;
} | null;
export { Table, TableRow, TableCell, TableHeader };
export default createTableExtensions;
//# sourceMappingURL=table.d.ts.map