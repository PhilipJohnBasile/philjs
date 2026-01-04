/**
 * Task List Extension
 *
 * Todo/checkbox lists with completion tracking
 */
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
/**
 * Create configured task list extensions
 */
export function createTaskListExtensions(options = {}) {
    const { nested = true, itemHTMLAttributes = {} } = options;
    return [
        TaskList.configure({
            HTMLAttributes: {
                class: 'philjs-task-list',
            },
        }),
        TaskItem.configure({
            nested,
            HTMLAttributes: {
                class: 'philjs-task-item',
                ...itemHTMLAttributes,
            },
        }),
    ];
}
/**
 * Task list commands
 */
export const taskListCommands = {
    toggleTaskList: (editor) => {
        editor.chain().focus().toggleTaskList().run();
    },
    setTaskItem: (editor, checked = false) => {
        editor.chain().focus().toggleTaskList().run();
    },
    checkTask: (editor) => {
        editor.chain().focus().updateAttributes('taskItem', { checked: true }).run();
    },
    uncheckTask: (editor) => {
        editor.chain().focus().updateAttributes('taskItem', { checked: false }).run();
    },
    toggleTask: (editor) => {
        const { checked } = editor.getAttributes('taskItem');
        editor.chain().focus().updateAttributes('taskItem', { checked: !checked }).run();
    },
};
/**
 * Keyboard shortcuts
 */
export const taskListShortcuts = {
    toggleTaskList: 'Mod-Shift-9',
    toggleTask: 'Mod-Enter',
};
/**
 * Get task statistics from editor content
 */
export function getTaskStats(editor) {
    let total = 0;
    let completed = 0;
    editor.state.doc.descendants((node) => {
        if (node.type.name === 'taskItem') {
            total++;
            if (node.attrs.checked) {
                completed++;
            }
        }
    });
    return {
        total,
        completed,
        pending: total - completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
}
/**
 * Get all tasks from editor content
 */
export function getAllTasks(editor) {
    const tasks = [];
    editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'taskItem') {
            tasks.push({
                text: node.textContent,
                checked: node.attrs.checked,
                position: pos,
            });
        }
    });
    return tasks;
}
/**
 * Toggle task at specific position
 */
export function toggleTaskAtPosition(editor, position) {
    const { tr } = editor.state;
    const node = editor.state.doc.nodeAt(position);
    if (node && node.type.name === 'taskItem') {
        tr.setNodeMarkup(position, null, {
            ...node.attrs,
            checked: !node.attrs.checked,
        });
        editor.view.dispatch(tr);
    }
}
/**
 * Check all tasks
 */
export function checkAllTasks(editor) {
    const { tr } = editor.state;
    let modified = false;
    editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'taskItem' && !node.attrs.checked) {
            tr.setNodeMarkup(pos, null, { ...node.attrs, checked: true });
            modified = true;
        }
    });
    if (modified) {
        editor.view.dispatch(tr);
    }
}
/**
 * Uncheck all tasks
 */
export function uncheckAllTasks(editor) {
    const { tr } = editor.state;
    let modified = false;
    editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'taskItem' && node.attrs.checked) {
            tr.setNodeMarkup(pos, null, { ...node.attrs, checked: false });
            modified = true;
        }
    });
    if (modified) {
        editor.view.dispatch(tr);
    }
}
/**
 * Convert bullet list to task list
 */
export function bulletListToTaskList(editor) {
    editor.chain().focus().toggleBulletList().toggleTaskList().run();
}
/**
 * Convert task list to bullet list
 */
export function taskListToBulletList(editor) {
    editor.chain().focus().toggleTaskList().toggleBulletList().run();
}
/**
 * Default task list styles
 */
export const taskListStyles = `
.philjs-task-list {
  list-style: none;
  padding: 0;
}

.philjs-task-item {
  align-items: flex-start;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.philjs-task-item > label {
  display: flex;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.philjs-task-item > label > input[type="checkbox"] {
  accent-color: #2563eb;
  cursor: pointer;
  height: 1rem;
  width: 1rem;
}

.philjs-task-item > div {
  flex: 1;
}

.philjs-task-item[data-checked="true"] > div {
  color: #64748b;
  text-decoration: line-through;
}

.philjs-task-item[data-checked="true"] > div p {
  color: #64748b;
}

/* Nested task lists */
.philjs-task-item .philjs-task-list {
  margin-left: 1.5rem;
  margin-top: 0.25rem;
}
`;
export { TaskList, TaskItem };
export default createTaskListExtensions;
//# sourceMappingURL=task-list.js.map