/**
 * System Dialog APIs
 */

import { isTauri } from '../tauri/context';

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
    if (!isTauri()) {
      // Browser fallback using input element
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
            resolve(files[0].name);
          }
        };

        input.click();
      });
    }

    const { open } = await import('@tauri-apps/plugin-dialog');
    return open({
      title: options.title,
      defaultPath: options.defaultPath,
      filters: options.filters,
      multiple: options.multiple,
      directory: options.directory,
      canCreateDirectories: options.canCreateDirectories,
      recursive: options.recursive,
    });
  },

  /**
   * Open a save file dialog
   */
  async save(options: SaveDialogOptions = {}): Promise<string | null> {
    if (!isTauri()) {
      // Browser fallback - return a fake path
      const filename = prompt('Enter filename:', options.defaultPath || 'file.txt');
      return filename;
    }

    const { save } = await import('@tauri-apps/plugin-dialog');
    return save({
      title: options.title,
      defaultPath: options.defaultPath,
      filters: options.filters,
      canCreateDirectories: options.canCreateDirectories,
    });
  },

  /**
   * Show an info message box
   */
  async message(message: string, options: MessageDialogOptions = {}): Promise<void> {
    if (!isTauri()) {
      alert(message);
      return;
    }

    const { message: showMessage } = await import('@tauri-apps/plugin-dialog');
    await showMessage(message, {
      title: options.title,
      kind: options.type,
      okLabel: options.okLabel,
    });
  },

  /**
   * Show a confirmation dialog
   */
  async confirm(message: string, options: ConfirmDialogOptions = {}): Promise<boolean> {
    if (!isTauri()) {
      return confirm(message);
    }

    const { confirm: showConfirm } = await import('@tauri-apps/plugin-dialog');
    return showConfirm(message, {
      title: options.title,
      kind: options.type,
      okLabel: options.confirmLabel || options.okLabel,
      cancelLabel: options.cancelLabel,
    });
  },

  /**
   * Show an ask dialog (yes/no)
   */
  async ask(message: string, options: MessageDialogOptions = {}): Promise<boolean> {
    if (!isTauri()) {
      return confirm(message);
    }

    const { ask } = await import('@tauri-apps/plugin-dialog');
    return ask(message, {
      title: options.title,
      kind: options.type,
      okLabel: options.okLabel,
      cancelLabel: options.cancelLabel,
    });
  },
};

// Convenience functions
export const openDialog = Dialog.open;
export const saveDialog = Dialog.save;
export const showMessage = Dialog.message;
export const showConfirm = Dialog.confirm;
export const showAsk = Dialog.ask;
