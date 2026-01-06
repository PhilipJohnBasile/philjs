/**
 * @philjs/tauri - Tauri desktop app bindings for PhilJS
 *
 * This package provides Rust-based Tauri desktop app operations.
 * The core implementation is in Rust (.rs files).
 * This TypeScript file provides type definitions and JS bindings.
 */

export interface TauriConfig {
  appName: string;
  version: string;
  identifier: string;
}

export interface WindowConfig {
  title: string;
  width?: number;
  height?: number;
  resizable?: boolean;
  fullscreen?: boolean;
}

export interface DialogOptions {
  title?: string;
  message: string;
  kind?: 'info' | 'warning' | 'error';
}

export interface FileDialogOptions {
  title?: string;
  filters?: { name: string; extensions: string[] }[];
  defaultPath?: string;
  multiple?: boolean;
}

/**
 * Invoke a Tauri command (requires Tauri runtime)
 */
export async function invoke<T>(_cmd: string, _args?: Record<string, unknown>): Promise<T> {
  throw new Error('@philjs/tauri requires the Tauri runtime');
}

/**
 * Show a dialog (requires Tauri runtime)
 */
export async function dialog(_options: DialogOptions): Promise<void> {
  throw new Error('@philjs/tauri requires the Tauri runtime');
}

/**
 * Open a file dialog (requires Tauri runtime)
 */
export async function openFileDialog(_options: FileDialogOptions): Promise<string | string[] | null> {
  throw new Error('@philjs/tauri requires the Tauri runtime');
}
