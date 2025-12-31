/**
 * System Dialog APIs
 */
export interface OpenDialogOptions {
    /** Dialog title */
    title?: string;
    /** Default path */
    defaultPath?: string;
    /** File filters */
    filters?: DialogFilter[];
    /** Allow multiple selection */
    multiple?: boolean;
    /** Allow directories */
    directory?: boolean;
    /** Allow creating directories */
    canCreateDirectories?: boolean;
    /** Recursive directory selection */
    recursive?: boolean;
}
export interface SaveDialogOptions {
    /** Dialog title */
    title?: string;
    /** Default path */
    defaultPath?: string;
    /** File filters */
    filters?: DialogFilter[];
    /** Allow creating directories */
    canCreateDirectories?: boolean;
}
export interface DialogFilter {
    /** Filter name */
    name: string;
    /** File extensions (without dot) */
    extensions: string[];
}
export interface MessageDialogOptions {
    /** Dialog title */
    title?: string;
    /** Dialog type */
    type?: 'info' | 'warning' | 'error';
    /** OK button label */
    okLabel?: string;
    /** Cancel button label */
    cancelLabel?: string;
}
export interface ConfirmDialogOptions extends MessageDialogOptions {
    /** Confirm button label */
    confirmLabel?: string;
}
/**
 * Dialog API
 */
export declare const Dialog: {
    /**
     * Open a file selection dialog
     */
    open(options?: OpenDialogOptions): Promise<string | string[] | null>;
    /**
     * Open a save file dialog
     */
    save(options?: SaveDialogOptions): Promise<string | null>;
    /**
     * Show an info message box
     */
    message(message: string, options?: MessageDialogOptions): Promise<void>;
    /**
     * Show a confirmation dialog
     */
    confirm(message: string, options?: ConfirmDialogOptions): Promise<boolean>;
    /**
     * Show an ask dialog (yes/no)
     */
    ask(message: string, options?: MessageDialogOptions): Promise<boolean>;
};
export declare const openDialog: (options?: OpenDialogOptions) => Promise<string | string[] | null>;
export declare const saveDialog: (options?: SaveDialogOptions) => Promise<string | null>;
export declare const showMessage: (message: string, options?: MessageDialogOptions) => Promise<void>;
export declare const showConfirm: (message: string, options?: ConfirmDialogOptions) => Promise<boolean>;
export declare const showAsk: (message: string, options?: MessageDialogOptions) => Promise<boolean>;
//# sourceMappingURL=dialog.d.ts.map