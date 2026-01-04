/**
 * Code Generator - Exports visual designs to PhilJS/JSX code
 */
// ============================================================================
// Default Options
// ============================================================================
const defaultOptions = {
    format: 'tsx',
    indent: '  ',
    quotes: 'single',
    semicolons: true,
    componentImports: true,
    styleFormat: 'object',
    signalBindings: true,
    includeComments: false,
    minify: false,
    componentName: 'GeneratedComponent',
    exportType: 'default',
    wrapInFunction: true,
    addPropsInterface: true,
};
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Convert StyleValue to a string value
 */
function styleValueToString(value) {
    if (value === undefined || value === null)
        return '';
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number')
        return `${value}px`;
    if (typeof value === 'object' && 'value' in value) {
        const unit = value.unit || 'px';
        if (unit === 'none')
            return String(value.value);
        if (unit === 'auto')
            return 'auto';
        return `${value.value}${unit}`;
    }
    return '';
}
/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}
/**
 * Escape string for use in quotes
 */
function escapeString(str, quoteChar) {
    return str.replace(new RegExp(quoteChar, 'g'), `\\${quoteChar}`);
}
/**
 * Get quote character based on options
 */
function getQuote(options) {
    return options.quotes === 'single' ? "'" : '"';
}
/**
 * Get semicolon based on options
 */
function getSemi(options) {
    return options.semicolons ? ';' : '';
}
/**
 * Format a string value with appropriate quotes
 */
function formatString(value, options) {
    const quote = getQuote(options);
    return `${quote}${escapeString(value, quote)}${quote}`;
}
/**
 * Get the HTML tag for a component type
 */
function getComponentTag(type, options) {
    const nativeMap = {
        Frame: 'div',
        Box: 'div',
        Flex: 'div',
        Grid: 'div',
        Stack: 'div',
        HStack: 'div',
        Center: 'div',
        Container: 'div',
        Spacer: 'div',
        AspectRatio: 'div',
        Text: 'span',
        Heading: 'h2',
        Paragraph: 'p',
        Code: 'code',
        Quote: 'blockquote',
        Label: 'label',
        Form: 'form',
        FormField: 'div',
        Button: 'button',
        Input: 'input',
        Textarea: 'textarea',
        Checkbox: 'label',
        Radio: 'label',
        Select: 'select',
        Switch: 'label',
        Slider: 'input',
        Image: 'img',
        Video: 'video',
        Icon: 'span',
        Avatar: 'div',
        Iframe: 'iframe',
        Card: 'div',
        CardHeader: 'div',
        CardBody: 'div',
        CardFooter: 'div',
        Badge: 'span',
        Divider: 'hr',
        List: 'ul',
        ListItem: 'li',
        Table: 'table',
        Accordion: 'div',
        Tabs: 'div',
        Link: 'a',
        Nav: 'nav',
        NavItem: 'a',
        Breadcrumb: 'nav',
        Menu: 'div',
        Alert: 'div',
        Progress: 'div',
        Spinner: 'div',
        Skeleton: 'div',
        Tooltip: 'div',
        Modal: 'div',
        Drawer: 'div',
        Popover: 'div',
    };
    if (options.componentImports) {
        // Return component name for library components
        return type;
    }
    return nativeMap[type] || 'div';
}
/**
 * Check if a type is a void/self-closing element
 */
function isVoidElement(type) {
    const voidElements = ['Input', 'Image', 'Slider', 'Divider', 'Spacer', 'Progress', 'Spinner', 'Skeleton'];
    return voidElements.includes(type);
}
// ============================================================================
// Style Generators
// ============================================================================
/**
 * Generate inline style string
 */
function generateInlineStyles(styles, options) {
    const styleEntries = [];
    const quote = getQuote(options);
    for (const [key, value] of Object.entries(styles)) {
        if (value === undefined || value === null)
            continue;
        const cssKey = camelToKebab(key);
        const cssValue = styleValueToString(value);
        if (cssValue) {
            styleEntries.push(`${cssKey}: ${cssValue}`);
        }
    }
    if (styleEntries.length === 0)
        return '';
    return `${quote}${styleEntries.join('; ')}${quote}`;
}
/**
 * Generate style object
 */
function generateStyleObject(styles, options, indentLevel) {
    const indent = options.indent.repeat(indentLevel);
    const innerIndent = options.indent.repeat(indentLevel + 1);
    const quote = getQuote(options);
    const styleEntries = [];
    for (const [key, value] of Object.entries(styles)) {
        if (value === undefined || value === null)
            continue;
        let formattedValue;
        if (typeof value === 'string') {
            formattedValue = formatString(value, options);
        }
        else if (typeof value === 'number') {
            formattedValue = String(value);
        }
        else if (typeof value === 'object' && 'value' in value) {
            const unit = value.unit || 'px';
            if (unit === 'none' || unit === 'auto') {
                formattedValue = formatString(unit === 'auto' ? 'auto' : String(value.value), options);
            }
            else {
                formattedValue = formatString(`${value.value}${unit}`, options);
            }
        }
        else {
            continue;
        }
        styleEntries.push(`${innerIndent}${key}: ${formattedValue}`);
    }
    if (styleEntries.length === 0)
        return '{}';
    if (options.minify) {
        return `{${styleEntries.map(e => e.trim()).join(',')}}`;
    }
    return `{\n${styleEntries.join(',\n')}\n${indent}}`;
}
/**
 * Generate Tailwind CSS classes from styles
 */
function generateTailwindClasses(styles) {
    const classes = [];
    // Display
    if (styles.display === 'flex')
        classes.push('flex');
    if (styles.display === 'grid')
        classes.push('grid');
    if (styles.display === 'inline')
        classes.push('inline');
    if (styles.display === 'inline-block')
        classes.push('inline-block');
    if (styles.display === 'hidden' || styles.display === 'none')
        classes.push('hidden');
    // Flex direction
    if (styles.flexDirection === 'column')
        classes.push('flex-col');
    if (styles.flexDirection === 'row-reverse')
        classes.push('flex-row-reverse');
    if (styles.flexDirection === 'column-reverse')
        classes.push('flex-col-reverse');
    // Flex wrap
    if (styles.flexWrap === 'wrap')
        classes.push('flex-wrap');
    if (styles.flexWrap === 'wrap-reverse')
        classes.push('flex-wrap-reverse');
    if (styles.flexWrap === 'nowrap')
        classes.push('flex-nowrap');
    // Justify content
    const justifyMap = {
        'flex-start': 'justify-start',
        'flex-end': 'justify-end',
        'center': 'justify-center',
        'space-between': 'justify-between',
        'space-around': 'justify-around',
        'space-evenly': 'justify-evenly',
    };
    if (styles.justifyContent && justifyMap[styles.justifyContent]) {
        classes.push(justifyMap[styles.justifyContent]);
    }
    // Align items
    const alignMap = {
        'flex-start': 'items-start',
        'flex-end': 'items-end',
        'center': 'items-center',
        'stretch': 'items-stretch',
        'baseline': 'items-baseline',
    };
    if (styles.alignItems && alignMap[styles.alignItems]) {
        classes.push(alignMap[styles.alignItems]);
    }
    // Width and height percentages
    const widthValue = typeof styles.width === 'object' && styles.width?.unit === '%' ? styles.width.value : null;
    if (widthValue === 100)
        classes.push('w-full');
    if (widthValue === 50)
        classes.push('w-1/2');
    const heightValue = typeof styles.height === 'object' && styles.height?.unit === '%' ? styles.height.value : null;
    if (heightValue === 100)
        classes.push('h-full');
    // Text alignment
    if (styles.textAlign === 'center')
        classes.push('text-center');
    if (styles.textAlign === 'right')
        classes.push('text-right');
    if (styles.textAlign === 'justify')
        classes.push('text-justify');
    // Font weight
    const weightMap = {
        100: 'font-thin',
        200: 'font-extralight',
        300: 'font-light',
        400: 'font-normal',
        500: 'font-medium',
        600: 'font-semibold',
        700: 'font-bold',
        800: 'font-extrabold',
        900: 'font-black',
    };
    if (typeof styles.fontWeight === 'number' && weightMap[styles.fontWeight]) {
        classes.push(weightMap[styles.fontWeight]);
    }
    // Position
    if (styles.position === 'relative')
        classes.push('relative');
    if (styles.position === 'absolute')
        classes.push('absolute');
    if (styles.position === 'fixed')
        classes.push('fixed');
    if (styles.position === 'sticky')
        classes.push('sticky');
    // Overflow
    if (styles.overflow === 'hidden')
        classes.push('overflow-hidden');
    if (styles.overflow === 'scroll')
        classes.push('overflow-scroll');
    if (styles.overflow === 'auto')
        classes.push('overflow-auto');
    // Cursor
    if (styles.cursor === 'pointer')
        classes.push('cursor-pointer');
    return classes.join(' ');
}
// ============================================================================
// Props Generator
// ============================================================================
/**
 * Generate props for a node
 */
function generateProps(node, options, indentLevel) {
    const props = [];
    const quote = getQuote(options);
    // Add className or style based on format
    if (options.styleFormat === 'tailwind') {
        const tailwindClasses = generateTailwindClasses(node.styles);
        if (tailwindClasses) {
            props.push(`className=${formatString(tailwindClasses, options)}`);
        }
    }
    else if (options.styleFormat === 'inline') {
        const inlineStyles = generateInlineStyles(node.styles, options);
        if (inlineStyles) {
            props.push(`style=${inlineStyles}`);
        }
    }
    else {
        // Object style
        const hasStyles = Object.keys(node.styles).some(k => node.styles[k] !== undefined);
        if (hasStyles) {
            const styleObj = generateStyleObject(node.styles, options, indentLevel);
            props.push(`style={${styleObj}}`);
        }
    }
    // Add regular props
    for (const [key, value] of Object.entries(node.props)) {
        if (value === undefined || value === null)
            continue;
        if (typeof value === 'string') {
            props.push(`${key}=${formatString(value, options)}`);
        }
        else if (typeof value === 'number') {
            props.push(`${key}={${value}}`);
        }
        else if (typeof value === 'boolean') {
            if (value) {
                props.push(key);
            }
        }
        else if (typeof value === 'object' && 'type' in value && value.type === 'binding') {
            // Signal binding
            props.push(`${key}={${value.expression}${value.mode === 'two-way' ? '' : '()'}}`);
        }
        else if (Array.isArray(value)) {
            props.push(`${key}={${JSON.stringify(value)}}`);
        }
        else {
            props.push(`${key}={${JSON.stringify(value)}}`);
        }
    }
    // Add event handlers
    for (const event of node.events) {
        const handlerName = event.handler.includes('=>') ?
            `{${event.handler}}` :
            `{${event.handler}}`;
        props.push(`${event.event}=${handlerName}`);
    }
    return props.join(' ');
}
// ============================================================================
// Node Generator
// ============================================================================
/**
 * Generate JSX for a single node
 */
function generateNodeJSX(node, nodes, options, indentLevel) {
    const indent = options.indent.repeat(indentLevel);
    const tag = getComponentTag(node.type, options);
    const props = generateProps(node, options, indentLevel);
    const isVoid = isVoidElement(node.type) && node.children.length === 0;
    // Handle text content
    if (node.type === 'Text' || node.type === 'Heading' || node.type === 'Paragraph') {
        const content = node.props['content'] || '';
        if (isVoid || node.children.length === 0) {
            return `${indent}<${tag}${props ? ' ' + props : ''}>${content}</${tag}>`;
        }
    }
    // Handle void elements
    if (isVoid) {
        return `${indent}<${tag}${props ? ' ' + props : ''} />`;
    }
    // Handle elements with children
    const childrenJSX = node.children
        .map(childId => {
        const childNode = nodes[childId];
        if (!childNode)
            return '';
        return generateNodeJSX(childNode, nodes, options, indentLevel + 1);
    })
        .filter(Boolean)
        .join('\n');
    if (!childrenJSX) {
        // Self-closing for empty containers
        return `${indent}<${tag}${props ? ' ' + props : ''} />`;
    }
    if (options.minify) {
        return `<${tag}${props ? ' ' + props : ''}>${childrenJSX.replace(/\n/g, '').replace(/\s+/g, ' ')}</${tag}>`;
    }
    return `${indent}<${tag}${props ? ' ' + props : ''}>\n${childrenJSX}\n${indent}</${tag}>`;
}
// ============================================================================
// Main Code Generator
// ============================================================================
/**
 * Generate complete component code
 */
export function generateCode(nodes, rootId, userOptions = {}) {
    const options = { ...defaultOptions, ...userOptions };
    const semi = getSemi(options);
    const quote = getQuote(options);
    const rootNode = nodes[rootId];
    if (!rootNode) {
        throw new Error(`Root node ${rootId} not found`);
    }
    // Collect unique component types for imports
    const componentTypes = new Set();
    const collectTypes = (nodeId) => {
        const node = nodes[nodeId];
        if (node) {
            componentTypes.add(node.type);
            node.children.forEach(collectTypes);
        }
    };
    collectTypes(rootId);
    // Generate imports
    const imports = [];
    if (options.format === 'tsx' || options.format === 'jsx') {
        if (options.signalBindings) {
            imports.push(`import { signal, memo } from ${quote}@philjs/core${quote}${semi}`);
        }
    }
    if (options.componentImports && componentTypes.size > 0) {
        const componentImportList = Array.from(componentTypes)
            .filter(type => !['Frame', 'Box', 'Flex', 'Grid', 'Text', 'Heading', 'Paragraph'].includes(type))
            .sort();
        if (componentImportList.length > 0) {
            imports.push(`import { ${componentImportList.join(', ')} } from ${quote}@philjs/ui${quote}${semi}`);
        }
    }
    // Generate JSX content
    const jsxContent = generateNodeJSX(rootNode, nodes, options, options.wrapInFunction ? 2 : 0);
    // Build final code
    let code = '';
    // Add imports
    if (imports.length > 0 && !options.minify) {
        code += imports.join('\n') + '\n\n';
    }
    // Add props interface for TypeScript
    if (options.format === 'tsx' && options.addPropsInterface && !options.minify) {
        code += `interface ${options.componentName}Props {\n`;
        code += `${options.indent}// Add your props here\n`;
        code += `}\n\n`;
    }
    // Add component function
    if (options.wrapInFunction) {
        const propsType = options.format === 'tsx' ? `: ${options.componentName}Props` : '';
        const exportPrefix = options.exportType === 'default' ? 'export default ' :
            options.exportType === 'named' ? 'export ' : '';
        code += `${exportPrefix}function ${options.componentName}(props${propsType}) {\n`;
        code += `${options.indent}return (\n`;
        code += jsxContent + '\n';
        code += `${options.indent})${semi}\n`;
        code += `}\n`;
    }
    else {
        code += jsxContent;
    }
    return {
        code: options.minify ? code.replace(/\n/g, '').replace(/\s+/g, ' ') : code,
        imports,
        filename: `${options.componentName}.${options.format === 'tsx' ? 'tsx' : 'jsx'}`,
        language: options.format === 'philjs' ? 'philjs' : options.format,
    };
}
/**
 * Generate code as a string without wrapper
 */
export function generateJSXString(nodes, rootId, options = {}) {
    const result = generateCode(nodes, rootId, {
        ...options,
        wrapInFunction: false,
        componentImports: false,
    });
    return result.code;
}
/**
 * Generate inline CSS from styles
 */
export function generateInlineCSS(styles) {
    const cssProperties = [];
    for (const [key, value] of Object.entries(styles)) {
        if (value === undefined || value === null)
            continue;
        const cssKey = camelToKebab(key);
        const cssValue = styleValueToString(value);
        if (cssValue) {
            cssProperties.push(`${cssKey}: ${cssValue};`);
        }
    }
    return cssProperties.join(' ');
}
/**
 * Generate a CSS class from styles
 */
export function generateCSSClass(className, styles) {
    const cssProperties = [];
    for (const [key, value] of Object.entries(styles)) {
        if (value === undefined || value === null)
            continue;
        const cssKey = camelToKebab(key);
        const cssValue = styleValueToString(value);
        if (cssValue) {
            cssProperties.push(`  ${cssKey}: ${cssValue};`);
        }
    }
    return `.${className} {\n${cssProperties.join('\n')}\n}`;
}
/**
 * Export design as JSON
 */
export function exportAsJSON(nodes, rootId, metadata) {
    return JSON.stringify({
        version: '1.0',
        timestamp: Date.now(),
        rootId,
        nodes,
        metadata,
    }, null, 2);
}
export default {
    generateCode,
    generateJSXString,
    generateInlineCSS,
    generateCSSClass,
    exportAsJSON,
};
//# sourceMappingURL=CodeGenerator.js.map