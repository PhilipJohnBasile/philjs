/**
 * YAML Export Module
 * Handles YAML generation with formatting options
 */
import YAML from 'yaml';
/**
 * Convert data to YAML string
 */
export function toYAML(data, options = {}) {
    const { indent = 2, lineWidth = 80, defaultQuoteType = 'single', forceQuotes = false, sortKeys = false, includeNulls = true, dateFormat = 'iso', formatDate, comment, transform, fields, excludeFields, } = options;
    // Pre-process data
    const processedData = processData(data, {
        includeNulls,
        dateFormat,
        ...(formatDate !== undefined ? { formatDate } : {}),
        ...(transform !== undefined ? { transform } : {}),
        ...(fields !== undefined ? { fields } : {}),
        ...(excludeFields !== undefined ? { excludeFields } : {}),
    });
    // Create YAML document
    const doc = new YAML.Document(processedData);
    // Add comment if provided
    if (comment) {
        doc.commentBefore = comment;
    }
    // Generate YAML string
    return doc.toString({
        indent,
        lineWidth,
        defaultStringType: forceQuotes
            ? defaultQuoteType === 'double'
                ? YAML.Scalar.QUOTE_DOUBLE
                : YAML.Scalar.QUOTE_SINGLE
            : YAML.Scalar.PLAIN,
        sortMapEntries: sortKeys ? true : undefined,
    });
}
/**
 * Convert array to YAML with document separators
 */
export function arrayToYAMLDocuments(data, options = {}) {
    const { indent = 2, lineWidth = 80, sortKeys = false, includeNulls = true, dateFormat = 'iso', formatDate, transform, fields, excludeFields, } = options;
    const documents = [];
    for (const item of data) {
        const processedItem = processData(item, {
            includeNulls,
            dateFormat,
            ...(formatDate !== undefined ? { formatDate } : {}),
            ...(transform !== undefined ? { transform } : {}),
            ...(fields !== undefined ? { fields } : {}),
            ...(excludeFields !== undefined ? { excludeFields } : {}),
        });
        const doc = new YAML.Document(processedItem);
        documents.push(doc.toString({
            indent,
            lineWidth,
            sortMapEntries: sortKeys ? true : undefined,
        }));
    }
    return documents.join('---\n');
}
/**
 * Stream large datasets to YAML with progress tracking
 */
export async function* streamToYAML(data, options = {}) {
    const { chunkSize = 100, onProgress, onChunk, indent = 2, lineWidth = 80, sortKeys = false, includeNulls = true, dateFormat = 'iso', formatDate, transform, fields, excludeFields, } = options;
    const isArray = Array.isArray(data);
    const totalItems = isArray ? data.length : undefined;
    let processedItems = 0;
    let chunkIndex = 0;
    let isFirst = true;
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
            const chunks = [];
            for (const bufItem of buffer) {
                const processedItem = processData(bufItem, {
                    includeNulls,
                    dateFormat,
                    ...(formatDate !== undefined ? { formatDate } : {}),
                    ...(transform !== undefined ? { transform } : {}),
                    ...(fields !== undefined ? { fields } : {}),
                    ...(excludeFields !== undefined ? { excludeFields } : {}),
                });
                const doc = new YAML.Document(processedItem);
                const yamlStr = doc.toString({
                    indent,
                    lineWidth,
                    sortMapEntries: sortKeys ? true : undefined,
                });
                chunks.push((isFirst ? '' : '---\n') + yamlStr);
                isFirst = false;
            }
            const chunkStr = chunks.join('');
            onChunk?.(chunkStr, chunkIndex);
            yield chunkStr;
            buffer = [];
            chunkIndex++;
            if (totalItems) {
                onProgress?.(processedItems / totalItems, processedItems);
            }
        }
    }
    // Process remaining items
    if (buffer.length > 0) {
        const chunks = [];
        for (const bufItem of buffer) {
            const processedItem = processData(bufItem, {
                includeNulls,
                dateFormat,
                ...(formatDate !== undefined ? { formatDate } : {}),
                ...(transform !== undefined ? { transform } : {}),
                ...(fields !== undefined ? { fields } : {}),
                ...(excludeFields !== undefined ? { excludeFields } : {}),
            });
            const doc = new YAML.Document(processedItem);
            const yamlStr = doc.toString({
                indent,
                lineWidth,
                sortMapEntries: sortKeys ? true : undefined,
            });
            chunks.push((isFirst ? '' : '---\n') + yamlStr);
            isFirst = false;
        }
        const chunkStr = chunks.join('');
        onChunk?.(chunkStr, chunkIndex);
        yield chunkStr;
    }
    onProgress?.(1, processedItems);
}
/**
 * Process data according to options
 */
function processData(data, options) {
    const { includeNulls, dateFormat, formatDate, transform, fields, excludeFields } = options;
    const processValue = (key, value) => {
        // Handle null
        if (value === null || value === undefined) {
            return includeNulls ? null : undefined;
        }
        // Handle dates
        if (value instanceof Date) {
            if (formatDate) {
                return formatDate(value);
            }
            switch (dateFormat) {
                case 'timestamp':
                    return value.getTime();
                case 'string':
                    return value.toLocaleString();
                case 'iso':
                default:
                    return value.toISOString();
            }
        }
        // Handle arrays
        if (Array.isArray(value)) {
            return value.map((item, index) => processValue(String(index), item));
        }
        // Handle objects
        if (typeof value === 'object') {
            return processObject(value);
        }
        // Apply transform
        if (transform) {
            return transform(key, value);
        }
        return value;
    };
    const processObject = (obj) => {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            // Field filtering
            if (fields && !fields.includes(key)) {
                continue;
            }
            if (excludeFields?.includes(key)) {
                continue;
            }
            const processed = processValue(key, value);
            if (processed !== undefined) {
                result[key] = processed;
            }
        }
        return result;
    };
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        return processObject(data);
    }
    return processValue('', data);
}
/**
 * Create a YAML Blob for download
 */
export function createYAMLBlob(yaml) {
    return new Blob([yaml], { type: 'application/x-yaml;charset=utf-8' });
}
/**
 * Parse YAML string to data
 */
export function parseYAML(yaml) {
    return YAML.parse(yaml);
}
/**
 * Parse YAML with multiple documents
 */
export function parseYAMLDocuments(yaml) {
    return YAML.parseAllDocuments(yaml).map(doc => doc.toJSON());
}
/**
 * Validate YAML string
 */
export function validateYAML(yaml) {
    try {
        YAML.parse(yaml);
        return { valid: true, errors: [] };
    }
    catch (error) {
        return {
            valid: false,
            errors: [error instanceof Error ? error.message : String(error)],
        };
    }
}
//# sourceMappingURL=yaml.js.map