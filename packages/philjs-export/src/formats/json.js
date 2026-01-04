/**
 * JSON Export Module
 * Handles JSON generation with formatting options
 */
/**
 * Convert data to JSON string with formatting
 */
export function toJSON(data, options = {}) {
    const { pretty = true, indent = 2, includeNull = true, dateFormat = 'iso', formatDate, sortKeys = false, transform, fields, excludeFields, maxDepth, } = options;
    const replacer = (key, value) => {
        // Handle depth limiting
        if (maxDepth !== undefined) {
            const depth = getDepth(key, value);
            if (depth > maxDepth) {
                return '[Max Depth Reached]';
            }
        }
        // Handle field filtering
        if (key && fields && !fields.includes(key)) {
            return undefined;
        }
        if (key && excludeFields?.includes(key)) {
            return undefined;
        }
        // Handle null values
        if (value === null && !includeNull) {
            return undefined;
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
        // Apply custom transform
        if (transform) {
            return transform(key, value);
        }
        return value;
    };
    // Sort keys if requested
    let processedData = data;
    if (sortKeys && typeof data === 'object' && data !== null) {
        processedData = sortObjectKeys(data);
    }
    if (pretty) {
        return JSON.stringify(processedData, replacer, indent);
    }
    return JSON.stringify(processedData, replacer);
}
/**
 * Stream large arrays to JSON with progress tracking
 */
export async function* streamToJSON(data, options = {}) {
    const { chunkSize = 1000, onProgress, onChunk, ...jsonOptions } = options;
    const isArray = Array.isArray(data);
    const totalItems = isArray ? data.length : undefined;
    let processedItems = 0;
    let chunkIndex = 0;
    let isFirst = true;
    // Start array
    yield '[';
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
                .map(item => toJSON(item, { ...jsonOptions, pretty: false }))
                .join(',');
            const chunkStr = isFirst ? chunk : ',' + chunk;
            onChunk?.(chunkStr, chunkIndex);
            yield chunkStr;
            buffer = [];
            isFirst = false;
            chunkIndex++;
            if (totalItems) {
                onProgress?.(processedItems / totalItems, processedItems);
            }
        }
    }
    // Process remaining items
    if (buffer.length > 0) {
        const chunk = buffer
            .map(item => toJSON(item, { ...jsonOptions, pretty: false }))
            .join(',');
        const chunkStr = isFirst ? chunk : ',' + chunk;
        onChunk?.(chunkStr, chunkIndex);
        yield chunkStr;
    }
    // End array
    yield ']';
    onProgress?.(1, processedItems);
}
/**
 * Convert to JSON Lines format (NDJSON)
 */
export function toJSONLines(data, options = {}) {
    return data
        .map(item => toJSON(item, { ...options, pretty: false }))
        .join('\n');
}
/**
 * Stream to JSON Lines format
 */
export async function* streamToJSONLines(data, options = {}) {
    const { chunkSize = 1000, onProgress, onChunk, ...jsonOptions } = options;
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
            const chunk = buffer
                .map(item => toJSON(item, { ...jsonOptions, pretty: false }))
                .join('\n');
            const chunkStr = isFirst ? chunk : '\n' + chunk;
            onChunk?.(chunkStr, chunkIndex);
            yield chunkStr;
            buffer = [];
            isFirst = false;
            chunkIndex++;
            if (totalItems) {
                onProgress?.(processedItems / totalItems, processedItems);
            }
        }
    }
    // Process remaining items
    if (buffer.length > 0) {
        const chunk = buffer
            .map(item => toJSON(item, { ...jsonOptions, pretty: false }))
            .join('\n');
        const chunkStr = isFirst ? chunk : '\n' + chunk;
        onChunk?.(chunkStr, chunkIndex);
        yield chunkStr;
    }
    onProgress?.(1, processedItems);
}
/**
 * Create a JSON Blob for download
 */
export function createJSONBlob(json) {
    return new Blob([json], { type: 'application/json;charset=utf-8' });
}
/**
 * Parse JSON string to data
 */
export function parseJSON(json) {
    return JSON.parse(json);
}
/**
 * Parse JSON Lines (NDJSON) to array
 */
export function parseJSONLines(jsonLines) {
    return jsonLines
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
}
/**
 * Sort object keys recursively
 */
function sortObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }
    const sorted = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sorted[key] = sortObjectKeys(obj[key]);
    }
    return sorted;
}
/**
 * Get the depth of a key in the object tree
 * This is a simplified implementation
 */
function getDepth(_key, _value) {
    // In JSON.stringify replacer, we can track depth by key patterns
    // This is a simplified version - for real depth tracking,
    // you'd need to maintain state during the stringify process
    return 0;
}
//# sourceMappingURL=json.js.map