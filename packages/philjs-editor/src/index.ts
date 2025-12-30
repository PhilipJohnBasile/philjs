/**
 * @philjs/editor - Rich Text Editor for PhilJS
 * Pure Web Components - No React
 */

// ============================================================================
// Types
// ============================================================================

export interface EditorConfig {
  content?: string;
  extensions?: string[];
  placeholder?: string;
  autofocus?: boolean | 'start' | 'end';
  editable?: boolean;
  class?: string;
  onUpdate?: (content: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface EditorInstance {
  getHTML: () => string;
  getText: () => string;
  setContent: (content: string) => void;
  clearContent: () => void;
  focus: () => void;
  blur: () => void;
  isEmpty: () => boolean;
  getCharacterCount: () => number;
  getWordCount: () => number;
  isFocused: () => boolean;
  destroy: () => void;
}

// ============================================================================
// Rich Text Editor Web Component
// ============================================================================

export class PhilEditor extends HTMLElement {
  static observedAttributes = ['placeholder', 'readonly', 'autofocus'];

  private shadow: ShadowRoot;
  private editorEl: HTMLDivElement | null = null;
  private config: EditorConfig = {};

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
    this.setupEditor();
  }

  configure(config: EditorConfig): void {
    this.config = config;
    if (config.content && this.editorEl) {
      this.editorEl.innerHTML = config.content;
    }
  }

  override getHTML(): string {
    return this.editorEl?.innerHTML ?? '';
  }

  getText(): string {
    return this.editorEl?.textContent ?? '';
  }

  setContent(content: string): void {
    if (this.editorEl) {
      this.editorEl.innerHTML = content;
    }
  }

  clearContent(): void {
    if (this.editorEl) {
      this.editorEl.innerHTML = '';
    }
  }

  override focus(): void {
    this.editorEl?.focus();
  }

  override blur(): void {
    this.editorEl?.blur();
  }

  isEmpty(): boolean {
    return !this.editorEl?.textContent?.trim();
  }

  getCharacterCount(): number {
    return this.editorEl?.textContent?.length ?? 0;
  }

  getWordCount(): number {
    const text = this.editorEl?.textContent?.trim() ?? '';
    if (!text) return 0;
    return text.split(/\s+/).length;
  }

  isFocused(): boolean {
    return this.shadow.activeElement === this.editorEl;
  }

  // Commands
  bold(): void { document.execCommand('bold'); }
  italic(): void { document.execCommand('italic'); }
  underline(): void { document.execCommand('underline'); }
  strikethrough(): void { document.execCommand('strikeThrough'); }
  heading(level: 1 | 2 | 3 | 4 | 5 | 6): void { document.execCommand('formatBlock', false, `h${level}`); }
  paragraph(): void { document.execCommand('formatBlock', false, 'p'); }
  bulletList(): void { document.execCommand('insertUnorderedList'); }
  orderedList(): void { document.execCommand('insertOrderedList'); }
  blockquote(): void { document.execCommand('formatBlock', false, 'blockquote'); }
  codeBlock(): void { document.execCommand('formatBlock', false, 'pre'); }
  link(url: string): void { document.execCommand('createLink', false, url); }
  unlink(): void { document.execCommand('unlink'); }
  undo(): void { document.execCommand('undo'); }
  redo(): void { document.execCommand('redo'); }

  private setupEditor(): void {
    this.editorEl = this.shadow.querySelector('.editor-content');
    if (!this.editorEl) return;

    this.editorEl.addEventListener('input', () => {
      this.config.onUpdate?.(this.getHTML());
      this.dispatchEvent(new CustomEvent('update', { detail: this.getHTML() }));
    });

    this.editorEl.addEventListener('focus', () => {
      this.config.onFocus?.();
      this.dispatchEvent(new Event('editor-focus'));
    });

    this.editorEl.addEventListener('blur', () => {
      this.config.onBlur?.();
      this.dispatchEvent(new Event('editor-blur'));
    });

    if (this.config.autofocus || this.hasAttribute('autofocus')) {
      this.editorEl.focus();
    }
  }

  private render(): void {
    const placeholder = this.getAttribute('placeholder') || 'Start typing...';
    const readonly = this.hasAttribute('readonly');

    this.shadow.innerHTML = `
      <style>
        :host { display: block; font-family: system-ui, -apple-system, sans-serif; }
        .editor-container { border: 1px solid var(--editor-border, #e0e0e0); border-radius: 8px; overflow: hidden; }
        .editor-toolbar { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; background: var(--editor-toolbar-bg, #f5f5f5); border-bottom: 1px solid var(--editor-border, #e0e0e0); }
        .toolbar-button { padding: 6px 10px; border: none; background: var(--editor-button-bg, #fff); border-radius: 4px; cursor: pointer; font-size: 14px; }
        .toolbar-button:hover { background: var(--editor-button-hover, #e8e8e8); }
        .editor-content { min-height: 200px; padding: 16px; outline: none; line-height: 1.6; }
        .editor-content:empty:before { content: attr(data-placeholder); color: var(--editor-placeholder, #999); }
        .editor-content blockquote { border-left: 3px solid var(--editor-accent, #3b82f6); margin-left: 0; padding-left: 1em; }
        .editor-content pre { background: var(--editor-code-bg, #f5f5f5); padding: 1em; border-radius: 4px; }
      </style>
      <div class="editor-container">
        <div class="editor-toolbar">
          <button class="toolbar-button" data-cmd="bold" title="Bold"><b>B</b></button>
          <button class="toolbar-button" data-cmd="italic" title="Italic"><i>I</i></button>
          <button class="toolbar-button" data-cmd="underline" title="Underline"><u>U</u></button>
          <button class="toolbar-button" data-cmd="h1" title="Heading 1">H1</button>
          <button class="toolbar-button" data-cmd="h2" title="Heading 2">H2</button>
          <button class="toolbar-button" data-cmd="bulletList" title="Bullet List">•</button>
          <button class="toolbar-button" data-cmd="orderedList" title="Ordered List">1.</button>
          <button class="toolbar-button" data-cmd="blockquote" title="Quote">"</button>
          <button class="toolbar-button" data-cmd="code" title="Code">&lt;/&gt;</button>
        </div>
        <div class="editor-content" contenteditable="${!readonly}" data-placeholder="${placeholder}"></div>
      </div>
    `;

    this.shadow.querySelectorAll('.toolbar-button').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = (btn as HTMLElement).dataset['cmd'];
        if (cmd) this.executeCommand(cmd);
      });
    });
  }

  private executeCommand(cmd: string): void {
    const commands: Record<string, () => void> = {
      bold: () => this.bold(),
      italic: () => this.italic(),
      underline: () => this.underline(),
      h1: () => this.heading(1),
      h2: () => this.heading(2),
      bulletList: () => this.bulletList(),
      orderedList: () => this.orderedList(),
      blockquote: () => this.blockquote(),
      code: () => this.codeBlock(),
    };
    commands[cmd]?.();
    this.editorEl?.focus();
  }
}

customElements.define('phil-editor', PhilEditor);

// ============================================================================
// Utilities
// ============================================================================

export function createEditorConfig(options: Partial<EditorConfig> = {}): EditorConfig {
  return {
    content: '',
    placeholder: 'Start typing...',
    autofocus: false,
    editable: true,
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
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
}
