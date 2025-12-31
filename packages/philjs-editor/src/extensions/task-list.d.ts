/**
 * Task List Extension
 *
 * Todo/checkbox lists with completion tracking
 */
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
export interface TaskListOptions {
    /**
     * Allow nested task lists
     */
    nested?: boolean;
    /**
     * Custom checkbox class
     */
    checkboxClass?: string;
    /**
     * Callback when task is toggled
     */
    onToggle?: (id: string, checked: boolean) => void;
    /**
     * Custom task item HTML attributes
     */
    itemHTMLAttributes?: Record<string, any>;
}
/**
 * Create configured task list extensions
 */
export declare function createTaskListExtensions(options?: TaskListOptions): any[];
/**
 * Task list commands
 */
export declare const taskListCommands: {
    toggleTaskList: (editor: any) => void;
    setTaskItem: (editor: any, checked?: boolean) => void;
    checkTask: (editor: any) => void;
    uncheckTask: (editor: any) => void;
    toggleTask: (editor: any) => void;
};
/**
 * Keyboard shortcuts
 */
export declare const taskListShortcuts: {
    toggleTaskList: string;
    toggleTask: string;
};
/**
 * Get task statistics from editor content
 */
export declare function getTaskStats(editor: any): {
    total: number;
    completed: number;
    pending: number;
    percentage: number;
};
/**
 * Get all tasks from editor content
 */
export declare function getAllTasks(editor: any): Array<{
    text: string;
    checked: boolean;
    position: number;
}>;
/**
 * Toggle task at specific position
 */
export declare function toggleTaskAtPosition(editor: any, position: number): void;
/**
 * Check all tasks
 */
export declare function checkAllTasks(editor: any): void;
/**
 * Uncheck all tasks
 */
export declare function uncheckAllTasks(editor: any): void;
/**
 * Convert bullet list to task list
 */
export declare function bulletListToTaskList(editor: any): void;
/**
 * Convert task list to bullet list
 */
export declare function taskListToBulletList(editor: any): void;
/**
 * Default task list styles
 */
export declare const taskListStyles = "\n.philjs-task-list {\n  list-style: none;\n  padding: 0;\n}\n\n.philjs-task-item {\n  align-items: flex-start;\n  display: flex;\n  gap: 0.5rem;\n  margin-bottom: 0.25rem;\n}\n\n.philjs-task-item > label {\n  display: flex;\n  flex-shrink: 0;\n  margin-top: 0.25rem;\n}\n\n.philjs-task-item > label > input[type=\"checkbox\"] {\n  accent-color: #2563eb;\n  cursor: pointer;\n  height: 1rem;\n  width: 1rem;\n}\n\n.philjs-task-item > div {\n  flex: 1;\n}\n\n.philjs-task-item[data-checked=\"true\"] > div {\n  color: #64748b;\n  text-decoration: line-through;\n}\n\n.philjs-task-item[data-checked=\"true\"] > div p {\n  color: #64748b;\n}\n\n/* Nested task lists */\n.philjs-task-item .philjs-task-list {\n  margin-left: 1.5rem;\n  margin-top: 0.25rem;\n}\n";
export { TaskList, TaskItem };
export default createTaskListExtensions;
//# sourceMappingURL=task-list.d.ts.map