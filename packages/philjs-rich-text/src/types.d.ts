/**
 * @philjs/rich-text - Type definitions
 * Block-based rich text editor types
 */
export type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bulletList' | 'numberedList' | 'todoList' | 'quote' | 'code' | 'divider' | 'image' | 'video' | 'embed' | 'table' | 'callout' | 'toggle' | 'columns';
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
export interface SlashCommand {
    name: string;
    description: string;
    icon?: string;
    keywords?: string[];
    execute: (editor: EditorInstance) => void;
}
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
export interface EditorInstance {
    state: EditorState;
    commands: EditorCommands;
    view: EditorView;
    getJSON(): Block[];
    getHTML(): string;
    getText(): string;
    setContent(blocks: Block[]): void;
    clearContent(): void;
    focus(): void;
    blur(): void;
    isFocused(): boolean;
    on(event: string, callback: (...args: unknown[]) => void): void;
    off(event: string, callback: (...args: unknown[]) => void): void;
    emit(event: string, ...args: unknown[]): void;
    destroy(): void;
}
export interface EditorCommands {
    bold(): boolean;
    italic(): boolean;
    underline(): boolean;
    strike(): boolean;
    code(): boolean;
    setBlockType(type: BlockType): boolean;
    insertBlock(block: Partial<Block>): boolean;
    deleteBlock(id: string): boolean;
    moveBlock(id: string, direction: 'up' | 'down'): boolean;
    toggleBulletList(): boolean;
    toggleNumberedList(): boolean;
    toggleTodoList(): boolean;
    undo(): boolean;
    redo(): boolean;
    selectAll(): boolean;
    clearSelection(): void;
}
export interface EditorView {
    dom: HTMLElement;
    hasFocus: boolean;
    scrollToSelection(): void;
}
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
export interface ExportOptions {
    format: 'json' | 'html' | 'markdown' | 'text';
    includeIds?: boolean;
}
export interface ImportOptions {
    format: 'json' | 'html' | 'markdown';
    preserveIds?: boolean;
}
//# sourceMappingURL=types.d.ts.map