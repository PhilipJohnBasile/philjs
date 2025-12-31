/**
 * @philjs/rich-text - Core Editor
 * Editor instance factory and management
 */
import type { Block, EditorInstance, EditorState, Extension, Selection, CollaborationConfig } from '../types.js';
interface CreateEditorOptions {
    container: HTMLElement;
    initialContent: Block[];
    extensions: Extension[];
    readOnly: boolean;
    collaborationConfig?: CollaborationConfig;
    onUpdate: (state: EditorState) => void;
    onSelectionChange: (selection: Selection | null) => void;
}
export declare function createEditor(options: CreateEditorOptions): EditorInstance;
export default createEditor;
//# sourceMappingURL=editor.d.ts.map