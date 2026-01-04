/**
 * Palette components for the visual builder
 */
// ============================================================================
// Built-in Components
// ============================================================================
export const builtInCategories = [
    { id: 'layout', name: 'Layout', icon: 'layout', order: 1 },
    { id: 'typography', name: 'Typography', icon: 'type', order: 2 },
    { id: 'forms', name: 'Forms', icon: 'form', order: 3 },
    { id: 'media', name: 'Media', icon: 'image', order: 4 },
    { id: 'data-display', name: 'Data Display', icon: 'table', order: 5 },
    { id: 'navigation', name: 'Navigation', icon: 'menu', order: 6 },
    { id: 'feedback', name: 'Feedback', icon: 'bell', order: 7 },
    { id: 'overlay', name: 'Overlay', icon: 'layers', order: 8 },
];
export const builtInComponents = [
    // Layout components
    {
        type: 'Container',
        name: 'Container',
        category: 'layout',
        props: [],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'Frame',
        name: 'Frame',
        category: 'layout',
        props: [],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'Flex',
        name: 'Flex',
        category: 'layout',
        props: [
            { name: 'direction', type: 'enum', enumValues: ['row', 'column', 'row-reverse', 'column-reverse'] },
            { name: 'wrap', type: 'enum', enumValues: ['nowrap', 'wrap', 'wrap-reverse'] },
            { name: 'justify', type: 'enum', enumValues: ['start', 'end', 'center', 'between', 'around', 'evenly'] },
            { name: 'align', type: 'enum', enumValues: ['start', 'end', 'center', 'stretch', 'baseline'] },
            { name: 'gap', type: 'string' },
        ],
        isContainer: true,
        canHaveChildren: true,
        defaultStyles: { display: 'flex' },
    },
    {
        type: 'Grid',
        name: 'Grid',
        category: 'layout',
        props: [
            { name: 'columns', type: 'string' },
            { name: 'rows', type: 'string' },
            { name: 'gap', type: 'string' },
        ],
        isContainer: true,
        canHaveChildren: true,
        defaultStyles: { display: 'grid' },
    },
];
// ============================================================================
// Components
// ============================================================================
export function Palette(_props) {
    // Implementation placeholder
    return null;
}
export function PaletteItem(_props) {
    // Implementation placeholder
    return null;
}
export function PaletteCategory(_props) {
    // Implementation placeholder
    return null;
}
//# sourceMappingURL=Palette.js.map