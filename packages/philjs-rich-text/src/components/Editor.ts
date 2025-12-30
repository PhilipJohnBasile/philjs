/**
 * @philjs/rich-text - Main Editor Class
 * Block-based rich text editor - framework agnostic
 */

import type {
  EditorConfig,
  EditorInstance,
  EditorState,
  Block,
  Selection,
  SlashCommand,
} from '../types.js';
import { createEditor } from '../core/editor.js';
import { SlashCommandMenu } from './SlashCommandMenu.js';
import { FloatingToolbar } from './FloatingToolbar.js';
import { BlockRenderer } from './BlockRenderer.js';

export interface EditorOptions extends EditorConfig {
  container: HTMLElement;
  initialContent?: Block[];
}

export class Editor {
  private container: HTMLElement;
  private editorInstance: EditorInstance | null = null;
  private state: EditorState;
  private slashMenu: SlashCommandMenu | null = null;
  private floatingToolbar: FloatingToolbar | null = null;
  private blockRenderer: BlockRenderer;
  private config: EditorOptions;

  constructor(options: EditorOptions) {
    this.container = options.container;
    this.config = options;
    this.state = {
      blocks: options.initialContent || [],
      selection: null,
    };
    this.blockRenderer = new BlockRenderer();
    this.init();
  }

  private init(): void {
    // Set up container
    this.container.classList.add('philjs-editor');
    this.container.setAttribute('contenteditable', this.config.readOnly ? 'false' : 'true');
    this.container.style.outline = 'none';
    this.container.style.minHeight = '100px';

    // Create editor instance
    const editorOptions: Parameters<typeof createEditor>[0] = {
      container: this.container,
      initialContent: this.state.blocks,
      extensions: this.config.extensions || [],
      readOnly: this.config.readOnly || false,
      onUpdate: (newState: EditorState) => {
        this.state = newState;
        this.render();
        this.config.onUpdate?.(newState);
      },
      onSelectionChange: (selection: Selection | null) => {
        this.state.selection = selection;
        this.updateFloatingToolbar(selection);
        this.config.onSelectionChange?.(selection);
      },
    };
    if (this.config.collaborationConfig !== undefined) {
      editorOptions.collaborationConfig = this.config.collaborationConfig;
    }
    this.editorInstance = createEditor(editorOptions);

    // Set up slash commands
    if (this.config.slashCommands && this.config.slashCommands.length > 0) {
      this.slashMenu = new SlashCommandMenu({
        commands: this.config.slashCommands,
        onSelect: (cmd: SlashCommand) => {
          if (this.editorInstance) {
            cmd.execute(this.editorInstance);
          }
        },
      });
    }

    // Set up floating toolbar
    if (!this.config.readOnly) {
      this.floatingToolbar = new FloatingToolbar({
        editor: this.editorInstance,
      });
    }

    // Event listeners
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Initial render
    this.render();

    // Autofocus
    if (this.config.autofocus) {
      this.focus();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.config.readOnly) return;

    // Slash command trigger
    if (e.key === '/' && this.slashMenu && !this.slashMenu.isOpen()) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        this.slashMenu.open({ x: rect.left, y: rect.bottom + 8 });
      }
    }

    // Close slash menu on escape
    if (e.key === 'Escape' && this.slashMenu?.isOpen()) {
      this.slashMenu.close();
    }
  }

  private updateFloatingToolbar(selection: Selection | null): void {
    if (!this.floatingToolbar) return;

    if (selection) {
      this.floatingToolbar.show();
    } else {
      this.floatingToolbar.hide();
    }
  }

  private render(): void {
    // Clear existing content
    this.container.innerHTML = '';

    // Show placeholder if empty
    if (this.state.blocks.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.className = 'philjs-editor-placeholder';
      placeholder.textContent = this.config.placeholder || "Type '/' for commands...";
      placeholder.style.color = '#9ca3af';
      this.container.appendChild(placeholder);
      return;
    }

    // Render blocks
    for (const block of this.state.blocks) {
      const element = this.blockRenderer.render(block, this.editorInstance, this.config.readOnly || false);
      this.container.appendChild(element);
    }
  }

  // Public API
  focus(): void {
    this.container.focus();
    this.editorInstance?.focus();
  }

  blur(): void {
    this.container.blur();
    this.editorInstance?.blur();
  }

  getContent(): Block[] {
    return this.editorInstance?.getJSON() || [];
  }

  setContent(blocks: Block[]): void {
    this.editorInstance?.setContent(blocks);
  }

  getHTML(): string {
    return this.editorInstance?.getHTML() || '';
  }

  getText(): string {
    return this.editorInstance?.getText() || '';
  }

  destroy(): void {
    this.editorInstance?.destroy();
    this.slashMenu?.destroy();
    this.floatingToolbar?.destroy();
    this.container.innerHTML = '';
  }
}

export function createRichTextEditor(options: EditorOptions): Editor {
  return new Editor(options);
}

export default Editor;
