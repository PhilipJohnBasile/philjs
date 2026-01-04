/**
 * @philjs/rich-text - Default Slash Commands
 * Built-in block commands for the slash menu
 */
export const defaultSlashCommands = [
    // Text blocks
    {
        name: 'Text',
        description: 'Plain text block',
        icon: 'T',
        keywords: ['paragraph', 'plain'],
        execute: (editor) => {
            editor.commands.insertBlock({ type: 'paragraph' });
        },
    },
    {
        name: 'Heading 1',
        description: 'Large heading',
        icon: 'H1',
        keywords: ['title', 'h1', 'header'],
        execute: (editor) => {
            editor.commands.insertBlock({ type: 'heading1' });
        },
    },
    {
        name: 'Heading 2',
        description: 'Medium heading',
        icon: 'H2',
        keywords: ['subtitle', 'h2', 'header'],
        execute: (editor) => {
            editor.commands.insertBlock({ type: 'heading2' });
        },
    },
    {
        name: 'Heading 3',
        description: 'Small heading',
        icon: 'H3',
        keywords: ['h3', 'header'],
        execute: (editor) => {
            editor.commands.insertBlock({ type: 'heading3' });
        },
    },
    // Lists
    {
        name: 'Bullet List',
        description: 'Unordered list',
        icon: '•',
        keywords: ['ul', 'unordered', 'bullets'],
        execute: (editor) => {
            editor.commands.insertBlock({ type: 'bulletList', children: [] });
        },
    },
    {
        name: 'Numbered List',
        description: 'Ordered list',
        icon: '1.',
        keywords: ['ol', 'ordered', 'numbers'],
        execute: (editor) => {
            editor.commands.insertBlock({ type: 'numberedList', children: [] });
        },
    },
    {
        name: 'To-do List',
        description: 'Checklist items',
        icon: '☑',
        keywords: ['checkbox', 'task', 'todo', 'checklist'],
        execute: (editor) => {
            editor.commands.insertBlock({ type: 'todoList', children: [] });
        },
    },
    // Rich blocks
    {
        name: 'Quote',
        description: 'Blockquote',
        icon: '"',
        keywords: ['blockquote', 'citation'],
        execute: (editor) => {
            editor.commands.insertBlock({ type: 'quote' });
        },
    },
    {
        name: 'Code',
        description: 'Code block with syntax highlighting',
        icon: '</>',
        keywords: ['codeblock', 'programming', 'snippet'],
        execute: (editor) => {
            editor.commands.insertBlock({ type: 'code', attrs: { language: 'plaintext' } });
        },
    },
    {
        name: 'Divider',
        description: 'Horizontal line separator',
        icon: '—',
        keywords: ['hr', 'separator', 'line'],
        execute: (editor) => {
            editor.commands.insertBlock({ type: 'divider' });
        },
    },
    // Media
    {
        name: 'Image',
        description: 'Upload or embed an image',
        icon: '🖼',
        keywords: ['picture', 'photo', 'media'],
        execute: (editor) => {
            const url = prompt('Enter image URL:');
            if (url) {
                editor.commands.insertBlock({
                    type: 'image',
                    attrs: { src: url },
                });
            }
        },
    },
    {
        name: 'Video',
        description: 'Embed a video',
        icon: '🎬',
        keywords: ['movie', 'youtube', 'media'],
        execute: (editor) => {
            const url = prompt('Enter video URL:');
            if (url) {
                editor.commands.insertBlock({
                    type: 'video',
                    attrs: { src: url },
                });
            }
        },
    },
    {
        name: 'Embed',
        description: 'Embed external content',
        icon: '🔗',
        keywords: ['iframe', 'external', 'widget'],
        execute: (editor) => {
            const url = prompt('Enter embed URL:');
            if (url) {
                editor.commands.insertBlock({
                    type: 'embed',
                    attrs: { src: url },
                });
            }
        },
    },
    // Advanced blocks
    {
        name: 'Callout',
        description: 'Highlighted info box',
        icon: '💡',
        keywords: ['info', 'warning', 'tip', 'note'],
        execute: (editor) => {
            editor.commands.insertBlock({
                type: 'callout',
                attrs: { icon: '💡', backgroundColor: '#fef3c7' },
            });
        },
    },
    {
        name: 'Toggle',
        description: 'Collapsible content',
        icon: '▶',
        keywords: ['collapse', 'expand', 'accordion', 'details'],
        execute: (editor) => {
            editor.commands.insertBlock({
                type: 'toggle',
                children: [],
            });
        },
    },
    {
        name: 'Columns',
        description: 'Multi-column layout',
        icon: '⫴',
        keywords: ['layout', 'grid', 'side by side'],
        execute: (editor) => {
            editor.commands.insertBlock({
                type: 'columns',
                attrs: { columns: 2 },
                children: [],
            });
        },
    },
    {
        name: 'Table',
        description: 'Table with rows and columns',
        icon: '⊞',
        keywords: ['grid', 'spreadsheet', 'data'],
        execute: (editor) => {
            editor.commands.insertBlock({
                type: 'table',
                children: [],
            });
        },
    },
];
export default defaultSlashCommands;
//# sourceMappingURL=defaultCommands.js.map