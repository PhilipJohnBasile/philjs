/**
 * System Dialog APIs
 */

import { isTauri } from '../tauri/context.js';

const canUseWindow = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

const shouldUseTauri = (): boolean => {
  return isTauri() && canUseWindow();
};

// Dialog types
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
export const Dialog = {
  /**
   * Open a file selection dialog
   */
  async open(options: OpenDialogOptions = {}): Promise<string | string[] | null> {
    if (!shouldUseTauri()) {
      // Browser fallback using input element
      if (typeof document === 'undefined') {
        return null;
      }
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = options.multiple ?? false;

        if (options.filters?.length) {
          input.accept = options.filters
            .flatMap(f => f.extensions.map(e => `.${e}`))
            .join(',');
        }

        input.onchange = () => {
          const files = Array.from(input.files || []);
          if (files.length === 0) {
            resolve(null);
          } else if (options.multiple) {
            resolve(files.map(f => f.name));
          } else {
            resolve(files[0]!.name);
          }
        };

        input.click();
      });
    }

    const { open } = await import('@tauri-apps/plugin-dialog');
    const openOptions: Parameters<typeof open>[0] = {};
    if (options.title !== undefined) openOptions.title = options.title;
    if (options.defaultPath !== undefined) openOptions.defaultPath = options.defaultPath;
    if (options.filters !== undefined) openOptions.filters = options.filters;
    if (options.multiple !== undefined) openOptions.multiple = options.multiple;
    if (options.directory !== undefined) openOptions.directory = options.directory;
    if (options.canCreateDirectories !== undefined) openOptions.canCreateDirectories = options.canCreateDirectories;
    if (options.recursive !== undefined) openOptions.recursive = options.recursive;
    const result = await open(openOptions);
    return result ?? null;
  },

  /**
   * Open a save file dialog
   */
  async save(options: SaveDialogOptions = {}): Promise<string | null> {
    if (!shouldUseTauri()) {
      // Browser fallback - return a fake path
      if (typeof prompt !== 'function') {
        return options.defaultPath ?? null;
      }
      return prompt('Enter filename:', options.defaultPath || 'file.txt');
    }

    const { save } = await import('@tauri-apps/plugin-dialog');
    const saveOptions: Parameters<typeof save>[0] = {};
    if (options.title !== undefined) saveOptions.title = options.title;
    if (options.defaultPath !== undefined) saveOptions.defaultPath = options.defaultPath;
    if (options.filters !== undefined) saveOptions.filters = options.filters;
    if (options.canCreateDirectories !== undefined) saveOptions.canCreateDirectories = options.canCreateDirectories;
    return save(saveOptions);
  },

  /**
   * Show an info message box
   */
  async message(message: string, options: MessageDialogOptions = {}): Promise<void> {
    if (!shouldUseTauri()) {
      if (typeof alert === 'function') {
        alert(message);
      }
      return;
    }

    const { message: showMessage } = await import('@tauri-apps/plugin-dialog');
    const msgOptions: Parameters<typeof showMessage>[1] = {};
    if (options.title !== undefined) msgOptions.title = options.title;
    if (options.type !== undefined) msgOptions.kind = options.type;
    if (options.okLabel !== undefined) msgOptions.okLabel = options.okLabel;
    await showMessage(message, msgOptions);
  },

  /**
   * Show a confirmation dialog
   */
  async confirm(message: string, options: ConfirmDialogOptions = {}): Promise<boolean> {
    if (!shouldUseTauri()) {
      return typeof confirm === 'function' ? confirm(message) : false;
    }

    const { confirm: showConfirm } = await import('@tauri-apps/plugin-dialog');
    const confirmOptions: Parameters<typeof showConfirm>[1] = {};
    if (options.title !== undefined) confirmOptions.title = options.title;
    if (options.type !== undefined) confirmOptions.kind = options.type;
    const okLabelValue = options.confirmLabel ?? options.okLabel;
    if (okLabelValue !== undefined) confirmOptions.okLabel = okLabelValue;
    if (options.cancelLabel !== undefined) confirmOptions.cancelLabel = options.cancelLabel;
    return showConfirm(message, confirmOptions);
  },

  /**
   * Show an ask dialog (yes/no)
   */
  async ask(message: string, options: MessageDialogOptions = {}): Promise<boolean> {
    if (!shouldUseTauri()) {
      return typeof confirm === 'function' ? confirm(message) : false;
    }

    const { ask } = await import('@tauri-apps/plugin-dialog');
    const askOptions: Parameters<typeof ask>[1] = {};
    if (options.title !== undefined) askOptions.title = options.title;
    if (options.type !== undefined) askOptions.kind = options.type;
    if (options.okLabel !== undefined) askOptions.okLabel = options.okLabel;
    if (options.cancelLabel !== undefined) askOptions.cancelLabel = options.cancelLabel;
    return ask(message, askOptions);
  },
};

// Convenience functions
export const openDialog = Dialog.open;
export const saveDialog = Dialog.save;
export const showMessage = Dialog.message;
export const showConfirm = Dialog.confirm;
export const showAsk = Dialog.ask;
