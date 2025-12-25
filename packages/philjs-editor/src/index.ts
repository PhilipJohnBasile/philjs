/**
 * PhilJS Editor
 *
 * Rich text editor with TipTap extensions for PhilJS
 */

// Re-export all extensions
export * from './extensions/index.js';

// Editor types
export interface EditorConfig {
  /** Initial content */
  content?: string;
  /** Enabled extensions */
  extensions?: string[];
  /** Placeholder text */
  placeholder?: string;
  /** Enable autofocus */
  autofocus?: boolean | 'start' | 'end';
  /** Make editor readonly */
  editable?: boolean;
  /** Custom CSS class */
  class?: string;
}

export interface EditorInstance {
  /** Get HTML content */
  getHTML: () => string;
  /** Get JSON content */
  getJSON: () => Record<string, unknown>;
  /** Get plain text */
  getText: () => string;
  /** Set content */
  setContent: (content: string) => void;
  /** Clear content */
  clearContent: () => void;
  /** Focus editor */
  focus: () => void;
  /** Blur editor */
  blur: () => void;
  /** Check if empty */
  isEmpty: () => boolean;
  /** Get character count */
  getCharacterCount: () => number;
  /** Get word count */
  getWordCount: () => number;
  /** Check if focused */
  isFocused: () => boolean;
  /** Destroy editor */
  destroy: () => void;
}

// Default editor configuration
export const defaultEditorConfig: EditorConfig = {
  content: '',
  extensions: [
    'code-block',
    'image',
    'video',
    'table',
    'mention',
    'emoji',
    'link',
    'task-list',
    'math',
  ],
  placeholder: 'Start typing...',
  autofocus: false,
  editable: true,
};

// Utility functions
export function createEditorConfig(options: Partial<EditorConfig> = {}): EditorConfig {
  return {
    ...defaultEditorConfig,
    ...options,
  };
}

export function getCharacterCount(content: string): number {
  return content.replace(/<[^>]*>/g, '').length;
}

export function getWordCount(content: string): number {
  const text = content.replace(/<[^>]*>/g, '').trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

export function sanitizeContent(html: string): string {
  // Basic HTML sanitization - remove script tags
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
}
