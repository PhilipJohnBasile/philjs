/**
 * Component Library for the visual builder
 * Provides a registry of all available components for the palette
 */
// ============================================================================
// Component Categories
// ============================================================================
export const componentCategories = [
    { id: 'layout', name: 'Layout', icon: 'layout', order: 1 },
    { id: 'typography', name: 'Typography', icon: 'type', order: 2 },
    { id: 'forms', name: 'Forms', icon: 'form', order: 3 },
    { id: 'media', name: 'Media', icon: 'image', order: 4 },
    { id: 'data-display', name: 'Data Display', icon: 'table', order: 5 },
    { id: 'navigation', name: 'Navigation', icon: 'menu', order: 6 },
    { id: 'feedback', name: 'Feedback', icon: 'bell', order: 7 },
    { id: 'overlay', name: 'Overlay', icon: 'layers', order: 8 },
];
// ============================================================================
// All Components
// ============================================================================
export const allComponents = [
    // Layout Components
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
    {
        type: 'Stack',
        name: 'Stack',
        category: 'layout',
        props: [
            { name: 'spacing', type: 'string' },
            { name: 'direction', type: 'enum', enumValues: ['vertical', 'horizontal'] },
        ],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'HStack',
        name: 'HStack',
        category: 'layout',
        props: [{ name: 'spacing', type: 'string' }],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'Center',
        name: 'Center',
        category: 'layout',
        props: [],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'Spacer',
        name: 'Spacer',
        category: 'layout',
        props: [{ name: 'size', type: 'string' }],
        canHaveChildren: false,
    },
    // Typography Components
    {
        type: 'Text',
        name: 'Text',
        category: 'typography',
        props: [
            { name: 'content', type: 'string' },
            { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
            { name: 'weight', type: 'enum', enumValues: ['normal', 'medium', 'semibold', 'bold'] },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Heading',
        name: 'Heading',
        category: 'typography',
        props: [
            { name: 'content', type: 'string' },
            { name: 'level', type: 'enum', enumValues: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Code',
        name: 'Code',
        category: 'typography',
        props: [
            { name: 'content', type: 'string' },
            { name: 'language', type: 'enum', enumValues: ['javascript', 'typescript', 'jsx', 'tsx', 'css', 'html', 'json'] },
        ],
        canHaveChildren: false,
    },
    // Form Components
    {
        type: 'Button',
        name: 'Button',
        category: 'forms',
        props: [
            { name: 'label', type: 'string' },
            { name: 'variant', type: 'enum', enumValues: ['primary', 'secondary', 'outline', 'ghost', 'link'] },
            { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'] },
            { name: 'disabled', type: 'boolean' },
        ],
        canHaveChildren: false,
        defaultStyles: {
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            borderRadius: { value: 4, unit: 'px' },
            padding: { value: 8, unit: 'px' },
        },
    },
    {
        type: 'Input',
        name: 'Input',
        category: 'forms',
        props: [
            { name: 'type', type: 'enum', enumValues: ['text', 'email', 'password', 'number', 'tel', 'url'] },
            { name: 'placeholder', type: 'string' },
            { name: 'disabled', type: 'boolean' },
            { name: 'required', type: 'boolean' },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Textarea',
        name: 'Textarea',
        category: 'forms',
        props: [
            { name: 'placeholder', type: 'string' },
            { name: 'rows', type: 'number' },
            { name: 'disabled', type: 'boolean' },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Checkbox',
        name: 'Checkbox',
        category: 'forms',
        props: [
            { name: 'label', type: 'string' },
            { name: 'checked', type: 'boolean' },
            { name: 'disabled', type: 'boolean' },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Radio',
        name: 'Radio',
        category: 'forms',
        props: [
            { name: 'label', type: 'string' },
            { name: 'value', type: 'string' },
            { name: 'checked', type: 'boolean' },
            { name: 'disabled', type: 'boolean' },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Select',
        name: 'Select',
        category: 'forms',
        props: [
            { name: 'options', type: 'array' },
            { name: 'placeholder', type: 'string' },
            { name: 'disabled', type: 'boolean' },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Switch',
        name: 'Switch',
        category: 'forms',
        props: [
            { name: 'label', type: 'string' },
            { name: 'checked', type: 'boolean' },
            { name: 'disabled', type: 'boolean' },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Slider',
        name: 'Slider',
        category: 'forms',
        props: [
            { name: 'min', type: 'number' },
            { name: 'max', type: 'number' },
            { name: 'step', type: 'number' },
            { name: 'value', type: 'number' },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Form',
        name: 'Form',
        category: 'forms',
        props: [{ name: 'onSubmit', type: 'function' }],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'FormField',
        name: 'FormField',
        category: 'forms',
        props: [
            { name: 'label', type: 'string' },
            { name: 'error', type: 'string' },
            { name: 'required', type: 'boolean' },
        ],
        isContainer: true,
        canHaveChildren: true,
    },
    // Media Components
    {
        type: 'Image',
        name: 'Image',
        category: 'media',
        props: [
            { name: 'src', type: 'image' },
            { name: 'alt', type: 'string' },
            { name: 'objectFit', type: 'enum', enumValues: ['cover', 'contain', 'fill', 'none', 'scale-down'] },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Video',
        name: 'Video',
        category: 'media',
        props: [
            { name: 'src', type: 'string' },
            { name: 'autoplay', type: 'boolean' },
            { name: 'controls', type: 'boolean' },
            { name: 'loop', type: 'boolean' },
            { name: 'muted', type: 'boolean' },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Avatar',
        name: 'Avatar',
        category: 'media',
        props: [
            { name: 'src', type: 'image' },
            { name: 'name', type: 'string' },
            { name: 'size', type: 'enum', enumValues: ['xs', 'sm', 'md', 'lg', 'xl'] },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Icon',
        name: 'Icon',
        category: 'media',
        props: [
            { name: 'name', type: 'string' },
            { name: 'size', type: 'number' },
            { name: 'color', type: 'color' },
        ],
        canHaveChildren: false,
    },
    // Data Display Components
    {
        type: 'Card',
        name: 'Card',
        category: 'data-display',
        props: [{ name: 'variant', type: 'enum', enumValues: ['elevated', 'outlined', 'filled'] }],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'CardHeader',
        name: 'Card Header',
        category: 'data-display',
        props: [],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'CardBody',
        name: 'Card Body',
        category: 'data-display',
        props: [],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'CardFooter',
        name: 'Card Footer',
        category: 'data-display',
        props: [],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'Badge',
        name: 'Badge',
        category: 'data-display',
        props: [
            { name: 'content', type: 'string' },
            { name: 'variant', type: 'enum', enumValues: ['primary', 'secondary', 'success', 'warning', 'error', 'info'] },
        ],
        canHaveChildren: false,
    },
    {
        type: 'List',
        name: 'List',
        category: 'data-display',
        props: [{ name: 'ordered', type: 'boolean' }],
        isContainer: true,
        canHaveChildren: true,
        allowedChildren: ['ListItem'],
    },
    {
        type: 'ListItem',
        name: 'List Item',
        category: 'data-display',
        props: [],
        isContainer: true,
        canHaveChildren: true,
        allowedParents: ['List'],
    },
    {
        type: 'Table',
        name: 'Table',
        category: 'data-display',
        props: [{ name: 'striped', type: 'boolean' }],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'Accordion',
        name: 'Accordion',
        category: 'data-display',
        props: [{ name: 'allowMultiple', type: 'boolean' }],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'Tabs',
        name: 'Tabs',
        category: 'data-display',
        props: [{ name: 'defaultValue', type: 'string' }],
        isContainer: true,
        canHaveChildren: true,
    },
    // Navigation Components
    {
        type: 'Link',
        name: 'Link',
        category: 'navigation',
        props: [
            { name: 'href', type: 'string' },
            { name: 'target', type: 'enum', enumValues: ['_self', '_blank', '_parent', '_top'] },
            { name: 'content', type: 'string' },
        ],
        canHaveChildren: true,
    },
    {
        type: 'Nav',
        name: 'Nav',
        category: 'navigation',
        props: [{ name: 'orientation', type: 'enum', enumValues: ['horizontal', 'vertical'] }],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'NavItem',
        name: 'Nav Item',
        category: 'navigation',
        props: [
            { name: 'href', type: 'string' },
            { name: 'active', type: 'boolean' },
        ],
        canHaveChildren: true,
        allowedParents: ['Nav'],
    },
    {
        type: 'Breadcrumb',
        name: 'Breadcrumb',
        category: 'navigation',
        props: [{ name: 'separator', type: 'string' }],
        isContainer: true,
        canHaveChildren: true,
    },
    // Feedback Components
    {
        type: 'Alert',
        name: 'Alert',
        category: 'feedback',
        props: [
            { name: 'title', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'variant', type: 'enum', enumValues: ['info', 'success', 'warning', 'error'] },
            { name: 'closable', type: 'boolean' },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Progress',
        name: 'Progress',
        category: 'feedback',
        props: [
            { name: 'value', type: 'number' },
            { name: 'max', type: 'number' },
            { name: 'showLabel', type: 'boolean' },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Spinner',
        name: 'Spinner',
        category: 'feedback',
        props: [
            { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'] },
            { name: 'color', type: 'color' },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Skeleton',
        name: 'Skeleton',
        category: 'feedback',
        props: [
            { name: 'width', type: 'string' },
            { name: 'height', type: 'string' },
            { name: 'variant', type: 'enum', enumValues: ['text', 'circular', 'rectangular'] },
        ],
        canHaveChildren: false,
    },
    {
        type: 'Tooltip',
        name: 'Tooltip',
        category: 'feedback',
        props: [
            { name: 'content', type: 'string' },
            { name: 'placement', type: 'enum', enumValues: ['top', 'right', 'bottom', 'left'] },
        ],
        isContainer: true,
        canHaveChildren: true,
    },
    // Overlay Components
    {
        type: 'Modal',
        name: 'Modal',
        category: 'overlay',
        props: [
            { name: 'title', type: 'string' },
            { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg', 'xl', 'full'] },
            { name: 'closeOnOverlayClick', type: 'boolean' },
        ],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'Drawer',
        name: 'Drawer',
        category: 'overlay',
        props: [
            { name: 'placement', type: 'enum', enumValues: ['left', 'right', 'top', 'bottom'] },
            { name: 'size', type: 'enum', enumValues: ['sm', 'md', 'lg'] },
        ],
        isContainer: true,
        canHaveChildren: true,
    },
    {
        type: 'Popover',
        name: 'Popover',
        category: 'overlay',
        props: [
            { name: 'placement', type: 'enum', enumValues: ['top', 'right', 'bottom', 'left'] },
            { name: 'trigger', type: 'enum', enumValues: ['click', 'hover'] },
        ],
        isContainer: true,
        canHaveChildren: true,
    },
];
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Get a component definition by type
 */
export function getComponentDefinition(type) {
    return allComponents.find((c) => c.type === type);
}
/**
 * Get all components in a category
 */
export function getComponentsByCategory(categoryId) {
    return allComponents.filter((c) => c.category === categoryId);
}
/**
 * Register all built-in components with a store
 */
export function registerBuiltInComponents(registerFn) {
    for (const component of allComponents) {
        registerFn(component);
    }
}
//# sourceMappingURL=ComponentLibrary.js.map