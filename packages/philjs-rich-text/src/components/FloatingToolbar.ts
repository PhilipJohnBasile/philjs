/**
 * @philjs/rich-text - Floating Toolbar
 * Context-aware formatting toolbar - vanilla JS
 */

import type { EditorInstance } from '../types';

export interface FloatingToolbarOptions {
  editor: EditorInstance | null;
}

interface ToolbarButton {
  name: string;
  icon: string;
  command: keyof EditorInstance['commands'];
}

const defaultButtons: ToolbarButton[] = [
  { name: 'Bold', icon: 'B', command: 'bold' },
  { name: 'Italic', icon: 'I', command: 'italic' },
  { name: 'Underline', icon: 'U', command: 'underline' },
  { name: 'Strikethrough', icon: 'S', command: 'strike' },
  { name: 'Code', icon: '</>', command: 'code' },
];

export class FloatingToolbar {
  private editor: EditorInstance | null;
  private element: HTMLDivElement | null = null;
  private isVisible: boolean = false;

  constructor(options: FloatingToolbarOptions) {
    this.editor = options.editor;
    this.handleSelectionChange = this.handleSelectionChange.bind(this);
    document.addEventListener('selectionchange', this.handleSelectionChange);
  }

  show(): void {
    if (this.isVisible) return;
    this.isVisible = true;
    this.render();
  }

  hide(): void {
    this.isVisible = false;
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  destroy(): void {
    this.hide();
    document.removeEventListener('selectionchange', this.handleSelectionChange);
  }

  private handleSelectionChange(): void {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      this.hide();
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width === 0) {
      this.hide();
      return;
    }

    this.updatePosition(rect);
  }

  private updatePosition(rect: DOMRect): void {
    if (!this.element) {
      this.render();
    }

    if (!this.element) return;

    const toolbarHeight = 40;
    const toolbarWidth = this.element.offsetWidth || 200;

    this.element.style.left = `${Math.max(8, rect.left + rect.width / 2 - toolbarWidth / 2)}px`;
    this.element.style.top = `${Math.max(8, rect.top - toolbarHeight - 8)}px`;
  }

  private render(): void {
    this.element = document.createElement('div');
    this.element.className = 'philjs-floating-toolbar';
    Object.assign(this.element.style, {
      position: 'fixed',
      display: 'flex',
      gap: '2px',
      backgroundColor: '#1f2937',
      padding: '4px',
      borderRadius: '6px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
      zIndex: '1000',
    });

    for (const button of defaultButtons) {
      const btn = this.createButton(button);
      this.element.appendChild(btn);
    }

    // Separator
    const separator = document.createElement('div');
    Object.assign(separator.style, {
      width: '1px',
      backgroundColor: '#4b5563',
      margin: '4px',
    });
    this.element.appendChild(separator);

    // Link button
    const linkBtn = this.createLinkButton();
    this.element.appendChild(linkBtn);

    document.body.appendChild(this.element);
  }

  private createButton(button: ToolbarButton): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.title = button.name;
    btn.textContent = button.icon;
    Object.assign(btn.style, {
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '4px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: button.command === 'bold' ? '700' : '400',
      fontStyle: button.command === 'italic' ? 'italic' : 'normal',
      textDecoration: button.command === 'underline' ? 'underline' :
                      button.command === 'strike' ? 'line-through' : 'none',
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.backgroundColor = '#374151';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.backgroundColor = 'transparent';
    });

    btn.addEventListener('click', () => {
      if (this.editor) {
        const cmd = this.editor.commands[button.command];
        if (typeof cmd === 'function') {
          (cmd as () => boolean)();
        }
      }
    });

    return btn;
  }

  private createLinkButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.title = 'Link';
    btn.textContent = '🔗';
    Object.assign(btn.style, {
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '4px',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.backgroundColor = '#374151';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.backgroundColor = 'transparent';
    });

    btn.addEventListener('click', () => {
      const url = prompt('Enter URL:');
      if (url) {
        // Add link mark to selection
      }
    });

    return btn;
  }
}

export default FloatingToolbar;
