/**
 * XML Export Module
 * Handles XML generation with customizable structure
 */
/**
 * Convert data to XML string
 */
export function toXML(data, options = {}) {
    const { rootElement = 'root', declaration = true, version = '1.0', encoding = 'UTF-8', pretty = true, indent = '  ', namespace, } = options;
    const lines = [];
    // XML declaration
    if (declaration) {
        lines.push(`<?xml version="${version}" encoding="${encoding}"?>`);
    }
    // Root element
    const nsAttr = namespace?.uri
        ? ` xmlns${namespace.prefix ? ':' + namespace.prefix : ''}="${namespace.uri}"`
        : '';
    lines.push(`<${rootElement}${nsAttr}>`);
    // Convert data to XML
    const content = valueToXML(data, options, pretty ? 1 : 0, indent);
    lines.push(content);
    // Close root element
    lines.push(`</${rootElement}>`);
    return pretty ? lines.join('\n') : lines.join('');
}
/**
 * Convert array of objects to XML
 */
export function arrayToXML(data, options = {}) {
    const { rootElement = 'items', itemElement = 'item', declaration = true, version = '1.0', encoding = 'UTF-8', pretty = true, indent = '  ', namespace, } = options;
    const lines = [];
    // XML declaration
    if (declaration) {
        lines.push(`<?xml version="${version}" encoding="${encoding}"?>`);
    }
    // Root element
    const nsAttr = namespace?.uri
        ? ` xmlns${namespace.prefix ? ':' + namespace.prefix : ''}="${namespace.uri}"`
        : '';
    lines.push(`<${rootElement}${nsAttr}>`);
    // Convert each item
    for (const item of data) {
        const itemContent = objectToXML(item, itemElement, options, pretty ? 1 : 0, indent);
        lines.push(itemContent);
    }
    // Close root element
    lines.push(`</${rootElement}>`);
    return pretty ? lines.join('\n') : lines.join('');
}
/**
 * Stream large datasets to XML with progress tracking
 */
export async function* streamToXML(data, options = {}) {
    const { rootElement = 'items', itemElement = 'item', declaration = true, version = '1.0', encoding = 'UTF-8', pretty = true, indent = '  ', namespace, chunkSize = 1000, onProgress, onChunk, } = options;
    const isArray = Array.isArray(data);
    const totalItems = isArray ? data.length : undefined;
    let processedItems = 0;
    let chunkIndex = 0;
    // XML declaration
    if (declaration) {
        yield `<?xml version="${version}" encoding="${encoding}"?>${pretty ? '\n' : ''}`;
    }
    // Root element
    const nsAttr = namespace?.uri
        ? ` xmlns${namespace.prefix ? ':' + namespace.prefix : ''}="${namespace.uri}"`
        : '';
    yield `<${rootElement}${nsAttr}>${pretty ? '\n' : ''}`;
    const iterate = async function* () {
        if (isArray) {
            for (const item of data) {
                yield item;
            }
        }
        else {
            for await (const item of data) {
                yield item;
            }
        }
    };
    let buffer = [];
    for await (const item of iterate()) {
        buffer.push(item);
        processedItems++;
        if (buffer.length >= chunkSize) {
            const chunk = buffer
                .map(item => objectToXML(item, itemElement, options, pretty ? 1 : 0, indent))
                .join(pretty ? '\n' : '');
            onChunk?.(chunk, chunkIndex);
            yield chunk + (pretty ? '\n' : '');
            buffer = [];
            chunkIndex++;
            if (totalItems) {
                onProgress?.(processedItems / totalItems, processedItems);
            }
        }
    }
    // Process remaining items
    if (buffer.length > 0) {
        const chunk = buffer
            .map(item => objectToXML(item, itemElement, options, pretty ? 1 : 0, indent))
            .join(pretty ? '\n' : '');
        onChunk?.(chunk, chunkIndex);
        yield chunk + (pretty ? '\n' : '');
    }
    // Close root element
    yield `</${rootElement}>`;
    onProgress?.(1, processedItems);
}
/**
 * Convert a value to XML
 */
function valueToXML(value, options, depth, indent) {
    const prefix = options.pretty !== false ? indent.repeat(depth) : '';
    if (value === null || value === undefined) {
        return '';
    }
    if (Array.isArray(value)) {
        const itemElement = options.itemElement || 'item';
        return value
            .map(item => {
            if (typeof item === 'object' && item !== null) {
                return objectToXML(item, itemElement, options, depth, indent);
            }
            return `${prefix}<${itemElement}>${escapeXML(String(item))}</${itemElement}>`;
        })
            .join(options.pretty !== false ? '\n' : '');
    }
    if (typeof value === 'object') {
        return objectContentToXML(value, options, depth, indent);
    }
    return escapeXML(formatValue(value, options));
}
/**
 * Convert an object to XML element
 */
function objectToXML(obj, elementName, options, depth, indent) {
    const prefix = options.pretty !== false ? indent.repeat(depth) : '';
    const { attributeKeys = [], elementNames = {} } = options;
    // Build attributes
    const attrs = [];
    const elements = {};
    for (const [key, value] of Object.entries(obj)) {
        if (attributeKeys.includes(key) && isPrimitive(value)) {
            attrs.push(`${key}="${escapeXMLAttr(formatValue(value, options))}"`);
        }
        else {
            elements[key] = value;
        }
    }
    const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    const name = elementNames[elementName] || elementName;
    // Check if element has content
    const hasContent = Object.keys(elements).length > 0;
    if (!hasContent) {
        return `${prefix}<${name}${attrStr}/>`;
    }
    const content = objectContentToXML(elements, options, depth + 1, indent);
    const newline = options.pretty !== false ? '\n' : '';
    return `${prefix}<${name}${attrStr}>${newline}${content}${newline}${prefix}</${name}>`;
}
/**
 * Convert object content to XML (without wrapper element)
 */
function objectContentToXML(obj, options, depth, indent) {
    const prefix = options.pretty !== false ? indent.repeat(depth) : '';
    const { elementNames = {}, cdataKeys = [], attributeKeys = [] } = options;
    const lines = [];
    for (const [key, value] of Object.entries(obj)) {
        // Skip attribute keys (already handled)
        if (attributeKeys.includes(key)) {
            continue;
        }
        // Apply transform
        const transformedValue = options.transform ? options.transform(key, value) : value;
        const elemName = elementNames[key] || key;
        if (transformedValue === null || transformedValue === undefined) {
            lines.push(`${prefix}<${elemName}/>`);
            continue;
        }
        if (Array.isArray(transformedValue)) {
            // Handle arrays - wrap in container or inline
            for (const item of transformedValue) {
                if (typeof item === 'object' && item !== null) {
                    lines.push(objectToXML(item, elemName, options, depth, indent));
                }
                else {
                    lines.push(`${prefix}<${elemName}>${escapeXML(formatValue(item, options))}</${elemName}>`);
                }
            }
        }
        else if (typeof transformedValue === 'object') {
            lines.push(objectToXML(transformedValue, elemName, options, depth, indent));
        }
        else {
            const text = formatValue(transformedValue, options);
            if (cdataKeys.includes(key)) {
                lines.push(`${prefix}<${elemName}><![CDATA[${text}]]></${elemName}>`);
            }
            else {
                lines.push(`${prefix}<${elemName}>${escapeXML(text)}</${elemName}>`);
            }
        }
    }
    return lines.join(options.pretty !== false ? '\n' : '');
}
/**
 * Format a value for XML output
 */
function formatValue(value, options) {
    if (value === null || value === undefined) {
        return '';
    }
    if (value instanceof Date) {
        if (options.formatDate) {
            return options.formatDate(value);
        }
        switch (options.dateFormat) {
            case 'timestamp':
                return String(value.getTime());
            case 'string':
                return value.toLocaleString();
            case 'iso':
            default:
                return value.toISOString();
        }
    }
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }
    return String(value);
}
/**
 * Escape special XML characters in content
 */
function escapeXML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
/**
 * Escape special XML characters in attributes
 */
function escapeXMLAttr(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
/**
 * Check if a value is a primitive type
 */
function isPrimitive(value) {
    return (value === null ||
        value === undefined ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean');
}
/**
 * Create an XML Blob for download
 */
export function createXMLBlob(xml) {
    return new Blob([xml], { type: 'application/xml;charset=utf-8' });
}
/**
 * Parse XML string to object (requires DOMParser)
 */
export function parseXML(xml) {
    if (typeof DOMParser === 'undefined') {
        throw new Error('DOMParser is not available in this environment');
    }
    const parser = new DOMParser();
    return parser.parseFromString(xml, 'application/xml');
}
//# sourceMappingURL=xml.js.map