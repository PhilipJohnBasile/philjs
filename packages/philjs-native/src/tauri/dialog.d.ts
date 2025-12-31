/**
 * PhilJS Native - Tauri Native Dialogs
 *
 * Provides native dialog support including file dialogs,
 * message boxes, and confirmation dialogs.
 */
import { type Signal } from 'philjs-core';
/**
 * File filter for open/save dialogs
 */
export interface FileFilter {
    name: string;
    extensions: string[];
}
/**
 * Open file dialog options
 */
export interface OpenDialogOptions {
    /** Dialog title */
    title?: string;
    /** Default path/directory */
    defaultPath?: string;
    /** File filters */
    filters?: FileFilter[];
    /** Allow multiple selection */
    multiple?: boolean;
    /** Allow directory selection */
    directory?: boolean;
    /** Restrict to existing files only */
    recursive?: boolean;
}
/**
 * Save file dialog options
 */
export interface SaveDialogOptions {
    /** Dialog title */
    title?: string;
    /** Default path */
    defaultPath?: string;
    /** File filters */
    filters?: FileFilter[];
}
/**
 * Message dialog options
 */
export interface MessageDialogOptions {
    /** Dialog title */
    title?: string;
    /** Message type */
    type?: 'info' | 'warning' | 'error';
    /** OK button label */
    okLabel?: string;
    /** Cancel button label */
    cancelLabel?: string;
}
/**
 * Confirmation dialog options
 */
export interface ConfirmDialogOptions extends MessageDialogOptions {
    /** Confirm button label */
    confirmLabel?: string;
}
/**
 * Ask dialog options (Yes/No/Cancel)
 */
export interface AskDialogOptions extends MessageDialogOptions {
    /** Yes button label */
    yesLabel?: string;
    /** No button label */
    noLabel?: string;
}
/**
 * Open dialog result
 */
export type OpenDialogResult = string | string[] | null;
/**
 * Save dialog result
 */
export type SaveDialogResult = string | null;
/**
 * Dialog open state
 */
export declare const dialogOpen: Signal<boolean>;
/**
 * Last dialog result
 */
export declare const lastDialogResult: Signal<unknown>;
/**
 * Open file dialog
 */
export declare function open(options?: OpenDialogOptions): Promise<OpenDialogResult>;
/**
 * Save file dialog
 */
export declare function save(options?: SaveDialogOptions): Promise<SaveDialogResult>;
/**
 * Open file and read content
 */
export declare function openAndRead(options?: OpenDialogOptions & {
    encoding?: 'utf8' | 'binary';
}): Promise<{
    path: string;
    content: string | Uint8Array;
} | null>;
/**
 * Save content to file with dialog
 */
export declare function saveWithContent(content: string | Uint8Array, options?: SaveDialogOptions): Promise<string | null>;
/**
 * Show message dialog
 */
export declare function message(text: string, options?: MessageDialogOptions | string): Promise<void>;
/**
 * Show confirmation dialog
 */
export declare function confirm(text: string, options?: ConfirmDialogOptions | string): Promise<boolean>;
/**
 * Show ask dialog (Yes/No)
 */
export declare function ask(text: string, options?: AskDialogOptions | string): Promise<boolean>;
/**
 * Show input prompt
 */
export declare function prompt(message: string, options?: {
    title?: string;
    defaultValue?: string;
    placeholder?: string;
}): Promise<string | null>;
/**
 * Show info dialog
 */
export declare function info(text: string, title?: string): Promise<void>;
/**
 * Show warning dialog
 */
export declare function warning(text: string, title?: string): Promise<void>;
/**
 * Show error dialog
 */
export declare function error(text: string, title?: string): Promise<void>;
/**
 * Show delete confirmation
 */
export declare function confirmDelete(itemName: string, options?: {
    title?: string;
}): Promise<boolean>;
/**
 * Show unsaved changes dialog
 */
export declare function confirmUnsavedChanges(): Promise<'save' | 'discard' | 'cancel'>;
/**
 * File filter presets
 */
export declare const FileFilters: {
    images: {
        name: string;
        extensions: string[];
    };
    documents: {
        name: string;
        extensions: string[];
    };
    spreadsheets: {
        name: string;
        extensions: string[];
    };
    presentations: {
        name: string;
        extensions: string[];
    };
    videos: {
        name: string;
        extensions: string[];
    };
    audio: {
        name: string;
        extensions: string[];
    };
    archives: {
        name: string;
        extensions: string[];
    };
    code: {
        name: string;
        extensions: string[];
    };
    all: {
        name: string;
        extensions: string[];
    };
};
/**
 * Open image dialog
 */
export declare function openImage(options?: Omit<OpenDialogOptions, 'filters'>): Promise<OpenDialogResult>;
/**
 * Open document dialog
 */
export declare function openDocument(options?: Omit<OpenDialogOptions, 'filters'>): Promise<OpenDialogResult>;
/**
 * Save document dialog
 */
export declare function saveDocument(options?: Omit<SaveDialogOptions, 'filters'>): Promise<SaveDialogResult>;
/**
 * Open directory dialog
 */
export declare function openDirectory(options?: Omit<OpenDialogOptions, 'directory'>): Promise<string | null>;
/**
 * Hook for dialog state
 */
export declare function useDialogState(): {
    isOpen: boolean;
    lastResult: unknown;
};
declare const _default: {
    open: typeof open;
    save: typeof save;
    openAndRead: typeof openAndRead;
    saveWithContent: typeof saveWithContent;
    message: typeof message;
    confirm: typeof confirm;
    ask: typeof ask;
    prompt: typeof prompt;
    info: typeof info;
    warning: typeof warning;
    error: typeof error;
    confirmDelete: typeof confirmDelete;
    confirmUnsavedChanges: typeof confirmUnsavedChanges;
    FileFilters: {
        images: {
            name: string;
            extensions: string[];
        };
        documents: {
            name: string;
            extensions: string[];
        };
        spreadsheets: {
            name: string;
            extensions: string[];
        };
        presentations: {
            name: string;
            extensions: string[];
        };
        videos: {
            name: string;
            extensions: string[];
        };
        audio: {
            name: string;
            extensions: string[];
        };
        archives: {
            name: string;
            extensions: string[];
        };
        code: {
            name: string;
            extensions: string[];
        };
        all: {
            name: string;
            extensions: string[];
        };
    };
    openImage: typeof openImage;
    openDocument: typeof openDocument;
    saveDocument: typeof saveDocument;
    openDirectory: typeof openDirectory;
};
export default _default;
//# sourceMappingURL=dialog.d.ts.map