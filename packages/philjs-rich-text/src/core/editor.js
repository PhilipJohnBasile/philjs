/**
 * @philjs/rich-text - Core Editor
 * Editor instance factory and management
 */
function generateId() {
    return Math.random().toString(36).substring(2, 11);
}
export function createEditor(options) {
    const { container, initialContent, extensions, readOnly, onUpdate, onSelectionChange, } = options;
    // Initialize state
    let state = {
        blocks: initialContent.length > 0 ? initialContent : [
            { id: generateId(), type: 'paragraph', content: [] },
        ],
        selection: null,
    };
    // Event emitter
    const listeners = new Map();
    const emit = (event, ...args) => {
        listeners.get(event)?.forEach((cb) => cb(...args));
    };
    const on = (event, callback) => {
        if (!listeners.has(event)) {
            listeners.set(event, new Set());
        }
        listeners.get(event).add(callback);
    };
    const off = (event, callback) => {
        listeners.get(event)?.delete(callback);
    };
    // Commands
    const commands = {
        bold: () => {
            if (readOnly)
                return false;
            document.execCommand('bold');
            emit('update');
            return true;
        },
        italic: () => {
            if (readOnly)
                return false;
            document.execCommand('italic');
            emit('update');
            return true;
        },
        underline: () => {
            if (readOnly)
                return false;
            document.execCommand('underline');
            emit('update');
            return true;
        },
        strike: () => {
            if (readOnly)
                return false;
            document.execCommand('strikeThrough');
            emit('update');
            return true;
        },
        code: () => {
            if (readOnly)
                return false;
            // Wrap selection in code mark
            emit('update');
            return true;
        },
        setBlockType: (type) => {
            if (readOnly)
                return false;
            const selection = state.selection;
            if (!selection)
                return false;
            state.blocks = state.blocks.map((block) => {
                if (block.id === selection.anchor.blockId) {
                    return { ...block, type };
                }
                return block;
            });
            onUpdate(state);
            emit('update');
            return true;
        },
        insertBlock: (partial) => {
            if (readOnly)
                return false;
            const newBlock = {
                id: generateId(),
                type: partial.type || 'paragraph',
                content: partial.content || [],
            };
            if (partial.attrs !== undefined) {
                newBlock.attrs = partial.attrs;
            }
            if (partial.children !== undefined) {
                newBlock.children = partial.children;
            }
            const insertIndex = state.selection
                ? state.blocks.findIndex((b) => b.id === state.selection.anchor.blockId) + 1
                : state.blocks.length;
            state.blocks = [
                ...state.blocks.slice(0, insertIndex),
                newBlock,
                ...state.blocks.slice(insertIndex),
            ];
            onUpdate(state);
            emit('update');
            return true;
        },
        deleteBlock: (id) => {
            if (readOnly)
                return false;
            if (state.blocks.length <= 1)
                return false;
            state.blocks = state.blocks.filter((b) => b.id !== id);
            onUpdate(state);
            emit('update');
            return true;
        },
        moveBlock: (id, direction) => {
            if (readOnly)
                return false;
            const index = state.blocks.findIndex((b) => b.id === id);
            if (index === -1)
                return false;
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= state.blocks.length)
                return false;
            const blocks = [...state.blocks];
            const temp = blocks[index];
            blocks[index] = blocks[newIndex];
            blocks[newIndex] = temp;
            state.blocks = blocks;
            onUpdate(state);
            emit('update');
            return true;
        },
        toggleBulletList: () => commands.setBlockType('bulletList'),
        toggleNumberedList: () => commands.setBlockType('numberedList'),
        toggleTodoList: () => commands.setBlockType('todoList'),
        undo: () => {
            if (readOnly)
                return false;
            document.execCommand('undo');
            return true;
        },
        redo: () => {
            if (readOnly)
                return false;
            document.execCommand('redo');
            return true;
        },
        selectAll: () => {
            const selection = window.getSelection();
            if (selection) {
                selection.selectAllChildren(container);
            }
            return true;
        },
        clearSelection: () => {
            window.getSelection()?.removeAllRanges();
        },
    };
    // View
    const view = {
        dom: container,
        hasFocus: false,
        scrollToSelection: () => {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const element = range.commonAncestorContainer;
                element.scrollIntoView?.({ block: 'nearest' });
            }
        },
    };
    // Editor instance
    const editor = {
        state,
        commands,
        view,
        getJSON: () => state.blocks,
        getHTML: () => container.innerHTML,
        getText: () => container.textContent || '',
        setContent: (blocks) => {
            state.blocks = blocks;
            onUpdate(state);
            emit('update');
        },
        clearContent: () => {
            state.blocks = [{ id: generateId(), type: 'paragraph', content: [] }];
            onUpdate(state);
            emit('update');
        },
        focus: () => {
            container.focus();
            view.hasFocus = true;
        },
        blur: () => {
            container.blur();
            view.hasFocus = false;
        },
        isFocused: () => view.hasFocus,
        on,
        off,
        emit,
        destroy: () => {
            extensions.forEach((ext) => ext.onDestroy?.());
            listeners.clear();
        },
    };
    // Initialize extensions
    extensions.forEach((ext) => ext.onInit?.(editor));
    // Set up selection tracking
    document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            state.selection = null;
            onSelectionChange(null);
            return;
        }
        const range = selection.getRangeAt(0);
        const blockElement = range.commonAncestorContainer.closest?.('[data-block-id]');
        if (blockElement && container.contains(blockElement)) {
            const blockId = blockElement.getAttribute('data-block-id');
            state.selection = {
                anchor: { blockId, offset: range.startOffset },
                focus: { blockId, offset: range.endOffset },
            };
            onSelectionChange(state.selection);
        }
    });
    // Track focus
    container.addEventListener('focus', () => {
        view.hasFocus = true;
    });
    container.addEventListener('blur', () => {
        view.hasFocus = false;
    });
    return editor;
}
export default createEditor;
//# sourceMappingURL=editor.js.map