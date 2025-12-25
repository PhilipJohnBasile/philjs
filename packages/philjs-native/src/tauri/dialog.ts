/**
 * PhilJS Native - Tauri Native Dialogs
 *
 * Provides native dialog support including file dialogs,
 * message boxes, and confirmation dialogs.
 */

import { signal, type Signal } from 'philjs-core';
import { isTauri, getTauriInternals, invoke } from './index.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// State
// ============================================================================

/**
 * Dialog open state
 */
export const dialogOpen: Signal<boolean> = signal(false);

/**
 * Last dialog result
 */
export const lastDialogResult: Signal<unknown> = signal(null);

// ============================================================================
// Web Fallbacks
// ============================================================================

/**
 * Web file picker (uses File API)
 */
async function webOpenFile(options?: OpenDialogOptions): Promise<OpenDialogResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = options?.multiple ?? false;

    if (options?.directory) {
      input.webkitdirectory = true;
    }

    if (options?.filters?.length) {
      const extensions = options.filters
        .flatMap((f) => f.extensions.map((e) => `.${e}`))
        .join(',');
      input.accept = extensions;
    }

    input.onchange = () => {
      const files = Array.from(input.files || []);
      if (files.length === 0) {
        resolve(null);
      } else if (options?.multiple) {
        resolve(files.map((f) => f.name));
      } else {
        resolve(files[0].name);
      }
    };

    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * Web save file (uses download)
 */
async function webSaveFile(
  _options?: SaveDialogOptions,
  content?: string | Blob
): Promise<SaveDialogResult> {
  return new Promise((resolve) => {
    const filename = _options?.defaultPath?.split('/').pop() || 'download';

    if (content) {
      const blob = typeof content === 'string' ? new Blob([content]) : content;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      resolve(filename);
    } else {
      resolve(null);
    }
  });
}

/**
 * Web alert dialog
 */
async function webMessage(
  message: string,
  options?: MessageDialogOptions
): Promise<void> {
  alert(options?.title ? `${options.title}\n\n${message}` : message);
}

/**
 * Web confirm dialog
 */
async function webConfirm(
  message: string,
  options?: ConfirmDialogOptions
): Promise<boolean> {
  return confirm(options?.title ? `${options.title}\n\n${message}` : message);
}

/**
 * Web prompt dialog
 */
async function webPrompt(
  message: string,
  defaultValue?: string
): Promise<string | null> {
  return prompt(message, defaultValue);
}

// ============================================================================
// File Dialogs
// ============================================================================

/**
 * Open file dialog
 */
export async function open(options?: OpenDialogOptions): Promise<OpenDialogResult> {
  dialogOpen.set(true);

  try {
    if (!isTauri()) {
      const result = await webOpenFile(options);
      lastDialogResult.set(result);
      return result;
    }

    const internals = getTauriInternals();
    const dialog = internals?.dialog;

    if (!dialog) {
      throw new Error('Tauri dialog module not available');
    }

    const result = await dialog.open({
      title: options?.title,
      defaultPath: options?.defaultPath,
      filters: options?.filters,
      multiple: options?.multiple,
      directory: options?.directory,
      recursive: options?.recursive,
    });

    lastDialogResult.set(result);
    return result;
  } finally {
    dialogOpen.set(false);
  }
}

/**
 * Save file dialog
 */
export async function save(options?: SaveDialogOptions): Promise<SaveDialogResult> {
  dialogOpen.set(true);

  try {
    if (!isTauri()) {
      const result = await webSaveFile(options);
      lastDialogResult.set(result);
      return result;
    }

    const internals = getTauriInternals();
    const dialog = internals?.dialog;

    if (!dialog) {
      throw new Error('Tauri dialog module not available');
    }

    const result = await dialog.save({
      title: options?.title,
      defaultPath: options?.defaultPath,
      filters: options?.filters,
    });

    lastDialogResult.set(result);
    return result;
  } finally {
    dialogOpen.set(false);
  }
}

/**
 * Open file and read content
 */
export async function openAndRead(
  options?: OpenDialogOptions & { encoding?: 'utf8' | 'binary' }
): Promise<{ path: string; content: string | Uint8Array } | null> {
  const path = await open({ ...options, multiple: false });

  if (!path || Array.isArray(path)) {
    return null;
  }

  if (!isTauri()) {
    // Web: use File API with actual file object
    return null; // Would need actual file content
  }

  const internals = getTauriInternals();
  const fs = internals?.fs;

  if (!fs) {
    return null;
  }

  try {
    const content = options?.encoding === 'binary'
      ? await fs.readBinaryFile(path)
      : await fs.readTextFile(path);

    return { path, content };
  } catch {
    return null;
  }
}

/**
 * Save content to file with dialog
 */
export async function saveWithContent(
  content: string | Uint8Array,
  options?: SaveDialogOptions
): Promise<string | null> {
  const path = await save(options);

  if (!path) {
    return null;
  }

  if (!isTauri()) {
    // Web: trigger download
    const blob = typeof content === 'string'
      ? new Blob([content], { type: 'text/plain' })
      : new Blob([content]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path;
    a.click();
    URL.revokeObjectURL(url);
    return path;
  }

  const internals = getTauriInternals();
  const fs = internals?.fs;

  if (!fs) {
    return null;
  }

  try {
    if (typeof content === 'string') {
      await fs.writeTextFile(path, content);
    } else {
      await fs.writeBinaryFile(path, content);
    }
    return path;
  } catch {
    return null;
  }
}

// ============================================================================
// Message Dialogs
// ============================================================================

/**
 * Show message dialog
 */
export async function message(
  text: string,
  options?: MessageDialogOptions | string
): Promise<void> {
  const opts: MessageDialogOptions = typeof options === 'string'
    ? { title: options }
    : options || {};

  dialogOpen.set(true);

  try {
    if (!isTauri()) {
      await webMessage(text, opts);
      return;
    }

    const internals = getTauriInternals();
    const dialog = internals?.dialog;

    if (!dialog) {
      await webMessage(text, opts);
      return;
    }

    await dialog.message(text, {
      title: opts.title,
      type: opts.type,
      okLabel: opts.okLabel,
    });
  } finally {
    dialogOpen.set(false);
  }
}

/**
 * Show confirmation dialog
 */
export async function confirm(
  text: string,
  options?: ConfirmDialogOptions | string
): Promise<boolean> {
  const opts: ConfirmDialogOptions = typeof options === 'string'
    ? { title: options }
    : options || {};

  dialogOpen.set(true);

  try {
    if (!isTauri()) {
      const result = await webConfirm(text, opts);
      lastDialogResult.set(result);
      return result;
    }

    const internals = getTauriInternals();
    const dialog = internals?.dialog;

    if (!dialog) {
      const result = await webConfirm(text, opts);
      lastDialogResult.set(result);
      return result;
    }

    const result = await dialog.confirm(text, {
      title: opts.title,
      type: opts.type,
      okLabel: opts.confirmLabel || opts.okLabel,
      cancelLabel: opts.cancelLabel,
    });

    lastDialogResult.set(result);
    return result;
  } finally {
    dialogOpen.set(false);
  }
}

/**
 * Show ask dialog (Yes/No)
 */
export async function ask(
  text: string,
  options?: AskDialogOptions | string
): Promise<boolean> {
  const opts: AskDialogOptions = typeof options === 'string'
    ? { title: options }
    : options || {};

  dialogOpen.set(true);

  try {
    if (!isTauri()) {
      const result = await webConfirm(text, opts);
      lastDialogResult.set(result);
      return result;
    }

    const internals = getTauriInternals();
    const dialog = internals?.dialog;

    if (!dialog) {
      const result = await webConfirm(text, opts);
      lastDialogResult.set(result);
      return result;
    }

    const result = await dialog.ask(text, {
      title: opts.title,
      type: opts.type,
      okLabel: opts.yesLabel,
      cancelLabel: opts.noLabel,
    });

    lastDialogResult.set(result);
    return result;
  } finally {
    dialogOpen.set(false);
  }
}

// ============================================================================
// Input Dialogs
// ============================================================================

/**
 * Show input prompt
 */
export async function prompt(
  message: string,
  options?: { title?: string; defaultValue?: string; placeholder?: string }
): Promise<string | null> {
  dialogOpen.set(true);

  try {
    if (!isTauri()) {
      const result = await webPrompt(message, options?.defaultValue);
      lastDialogResult.set(result);
      return result;
    }

    // Tauri doesn't have built-in prompt, use custom window or fallback
    const result = await webPrompt(
      options?.title ? `${options.title}\n\n${message}` : message,
      options?.defaultValue
    );
    lastDialogResult.set(result);
    return result;
  } finally {
    dialogOpen.set(false);
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Show info dialog
 */
export async function info(text: string, title?: string): Promise<void> {
  return message(text, { title, type: 'info' });
}

/**
 * Show warning dialog
 */
export async function warning(text: string, title?: string): Promise<void> {
  return message(text, { title, type: 'warning' });
}

/**
 * Show error dialog
 */
export async function error(text: string, title?: string): Promise<void> {
  return message(text, { title, type: 'error' });
}

/**
 * Show delete confirmation
 */
export async function confirmDelete(
  itemName: string,
  options?: { title?: string }
): Promise<boolean> {
  return confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`, {
    title: options?.title || 'Confirm Delete',
    type: 'warning',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  });
}

/**
 * Show unsaved changes dialog
 */
export async function confirmUnsavedChanges(): Promise<'save' | 'discard' | 'cancel'> {
  const result = await ask(
    'You have unsaved changes. Do you want to save them before closing?',
    {
      title: 'Unsaved Changes',
      type: 'warning',
      yesLabel: 'Save',
      noLabel: 'Discard',
    }
  );

  // Note: This is simplified - real implementation would need custom dialog for 3 options
  return result ? 'save' : 'discard';
}

// ============================================================================
// Common File Dialog Presets
// ============================================================================

/**
 * File filter presets
 */
export const FileFilters = {
  images: { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] },
  documents: { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'] },
  spreadsheets: { name: 'Spreadsheets', extensions: ['xls', 'xlsx', 'csv', 'ods'] },
  presentations: { name: 'Presentations', extensions: ['ppt', 'pptx', 'odp'] },
  videos: { name: 'Videos', extensions: ['mp4', 'avi', 'mkv', 'mov', 'webm'] },
  audio: { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac', 'aac'] },
  archives: { name: 'Archives', extensions: ['zip', 'rar', '7z', 'tar', 'gz'] },
  code: { name: 'Code', extensions: ['js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css'] },
  all: { name: 'All Files', extensions: ['*'] },
};

/**
 * Open image dialog
 */
export async function openImage(options?: Omit<OpenDialogOptions, 'filters'>): Promise<OpenDialogResult> {
  return open({ ...options, filters: [FileFilters.images] });
}

/**
 * Open document dialog
 */
export async function openDocument(options?: Omit<OpenDialogOptions, 'filters'>): Promise<OpenDialogResult> {
  return open({ ...options, filters: [FileFilters.documents] });
}

/**
 * Save document dialog
 */
export async function saveDocument(options?: Omit<SaveDialogOptions, 'filters'>): Promise<SaveDialogResult> {
  return save({ ...options, filters: [FileFilters.documents] });
}

/**
 * Open directory dialog
 */
export async function openDirectory(options?: Omit<OpenDialogOptions, 'directory'>): Promise<string | null> {
  const result = await open({ ...options, directory: true, multiple: false });
  return result as string | null;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for dialog state
 */
export function useDialogState(): { isOpen: boolean; lastResult: unknown } {
  return {
    isOpen: dialogOpen(),
    lastResult: lastDialogResult(),
  };
}

// ============================================================================
// Exports
// ============================================================================

export default {
  // File dialogs
  open,
  save,
  openAndRead,
  saveWithContent,
  // Message dialogs
  message,
  confirm,
  ask,
  prompt,
  // Convenience
  info,
  warning,
  error,
  confirmDelete,
  confirmUnsavedChanges,
  // Presets
  FileFilters,
  openImage,
  openDocument,
  saveDocument,
  openDirectory,
};
