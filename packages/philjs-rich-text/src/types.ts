/**
 * @philjs/rich-text - Type definitions
 * Block-based rich text editor types
 */

// Block types
export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'todoList'
  | 'quote'
  | 'code'
  | 'divider'
  | 'image'
  | 'video'
  | 'embed'
  | 'table'
  | 'callout'
  | 'toggle'
  | 'columns';

// Block content
export interface TextMark {
  type: 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'link' | 'highlight' | 'textColor';
  attrs?: Record<string, unknown>;
}

export interface TextNode {
  type: 'text';
  text: string;
  marks?: TextMark[];
}

export interface Block {
  id: string;
  type: BlockType;
  content: TextNode[] | Block[];
  attrs?: Record<string, unknown>;
  children?: Block[];
}

// Editor state
export interface EditorState {
  blocks: Block[];
  selection: Selection | null;
}

export interface Selection {
  anchor: Position;
  focus: Position;
}

export interface Position {
  blockId: string;
  offset: number;
}

// Editor configuration
export interface EditorConfig {
  placeholder?: string;
  readOnly?: boolean;
  autofocus?: boolean;
  extensions?: Extension[];
  onUpdate?: (state: EditorState) => void;
  onSelectionChange?: (selection: Selection | null) => void;
  slashCommands?: SlashCommand[];
  collaborationConfig?: CollaborationConfig;
}

// Extensions
export interface Extension {
  name: string;
  priority?: number;
  onInit?: (editor: EditorInstance) => void;
  onDestroy?: () => void;
  commands?: Record<string, (...args: unknown[]) => boolean>;
  keyBindings?: KeyBinding[];
  nodeViews?: Record<string, NodeViewFactory>;
}

export interface KeyBinding {
  key: string;
  command: string | ((editor: EditorInstance) => boolean);
  preventDefault?: boolean;
}

export type NodeViewFactory = (node: Block, editor: EditorInstance) => NodeView;

export interface NodeView {
  dom: HTMLElement;
  update?: (node: Block) => boolean;
  destroy?: () => void;
}

// Slash commands
export interface SlashCommand {
  name: string;
  description: string;
  icon?: string;
  keywords?: string[];
  execute: (editor: EditorInstance) => void;
}

// Collaboration
export interface CollaborationConfig {
  provider: 'yjs' | 'liveblocks' | 'partykit';
  roomId: string;
  user?: CollaborationUser;
  awareness?: boolean;
}

export interface CollaborationUser {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
}

export interface Cursor {
  user: CollaborationUser;
  position: Position;
}

// Editor instance
export interface EditorInstance {
  state: EditorState;
  commands: EditorCommands;
  view: EditorView;

  // State methods
  getJSON(): Block[];
  getHTML(): string;
  getText(): string;
  setContent(blocks: Block[]): void;
  clearContent(): void;

  // Focus methods
  focus(): void;
  blur(): void;
  isFocused(): boolean;

  // Event methods
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;

  // Lifecycle
  destroy(): void;
}

export interface EditorCommands {
  // Text formatting
  bold(): boolean;
  italic(): boolean;
  underline(): boolean;
  strike(): boolean;
  code(): boolean;

  // Block operations
  setBlockType(type: BlockType): boolean;
  insertBlock(block: Partial<Block>): boolean;
  deleteBlock(id: string): boolean;
  moveBlock(id: string, direction: 'up' | 'down'): boolean;

  // List operations
  toggleBulletList(): boolean;
  toggleNumberedList(): boolean;
  toggleTodoList(): boolean;

  // History
  undo(): boolean;
  redo(): boolean;

  // Selection
  selectAll(): boolean;
  clearSelection(): void;
}

export interface EditorView {
  dom: HTMLElement;
  hasFocus: boolean;
  scrollToSelection(): void;
}

// Toolbar
export interface ToolbarItem {
  type: 'button' | 'dropdown' | 'separator';
  name?: string;
  icon?: string;
  label?: string;
  command?: string;
  isActive?: (editor: EditorInstance) => boolean;
  items?: ToolbarItem[];
}

export interface ToolbarConfig {
  items: ToolbarItem[];
  position?: 'top' | 'bottom' | 'floating';
  sticky?: boolean;
}

// Export/Import
export interface ExportOptions {
  format: 'json' | 'html' | 'markdown' | 'text';
  includeIds?: boolean;
}

export interface ImportOptions {
  format: 'json' | 'html' | 'markdown';
  preserveIds?: boolean;
}
