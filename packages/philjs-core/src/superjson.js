/**
 * SuperJSON-style serialization for PhilJS
 * Handles complex data types that JSON doesn't support natively:
 * - Date objects
 * - Map and Set
 * - RegExp
 * - BigInt
 * - undefined
 * - Binary data (Buffer, Uint8Array, etc.)
 * - Custom type registration
 *
 * @example
 * ```ts
 * import { serialize, deserialize } from '@philjs/core/superjson';
 *
 * const data = {
 *   date: new Date(),
 *   map: new Map([['key', 'value']]),
 *   regex: /test/gi,
 *   bigint: 9007199254740991n,
 *   undef: undefined,
 * };
 *
 * const serialized = serialize(data);
 * const deserialized = deserialize(serialized);
 * ```
 */
// ============================================================================
// Built-in Type Identifiers
// ============================================================================
const TYPE_DATE = 'Date';
const TYPE_MAP = 'Map';
const TYPE_SET = 'Set';
const TYPE_REGEXP = 'RegExp';
const TYPE_BIGINT = 'bigint';
const TYPE_UNDEFINED = 'undefined';
const TYPE_NAN = 'NaN';
const TYPE_INFINITY = 'Infinity';
const TYPE_NEG_INFINITY = '-Infinity';
const TYPE_NEG_ZERO = '-0';
const TYPE_UINT8ARRAY = 'Uint8Array';
const TYPE_UINT16ARRAY = 'Uint16Array';
const TYPE_UINT32ARRAY = 'Uint32Array';
const TYPE_INT8ARRAY = 'Int8Array';
const TYPE_INT16ARRAY = 'Int16Array';
const TYPE_INT32ARRAY = 'Int32Array';
const TYPE_FLOAT32ARRAY = 'Float32Array';
const TYPE_FLOAT64ARRAY = 'Float64Array';
const TYPE_ARRAYBUFFER = 'ArrayBuffer';
const TYPE_DATAVIEW = 'DataView';
function pathToString(path) {
    if (path.length === 0)
        return '$';
    return path.reduce((acc, segment, i) => {
        if (typeof segment === 'number') {
            return `${acc}[${segment}]`;
        }
        return i === 0 ? segment : `${acc}.${segment}`;
    }, '$');
}
function addToMeta(meta, path, type) {
    const pathStr = pathToString(path);
    if (!meta.values) {
        meta.values = {};
    }
    const existing = meta.values[pathStr];
    if (existing === undefined) {
        meta.values[pathStr] = type;
    }
    else if (Array.isArray(existing)) {
        existing.push(type);
    }
    else {
        meta.values[pathStr] = [existing, type];
    }
}
// ============================================================================
// Built-in Type Handlers
// ============================================================================
function isDate(value) {
    return value instanceof Date;
}
function isMap(value) {
    return value instanceof Map;
}
function isSet(value) {
    return value instanceof Set;
}
function isRegExp(value) {
    return value instanceof RegExp;
}
function isBigInt(value) {
    return typeof value === 'bigint';
}
function isUndefined(value) {
    return value === undefined;
}
function isNaN(value) {
    return typeof value === 'number' && Number.isNaN(value);
}
function isInfinity(value) {
    return value === Infinity;
}
function isNegInfinity(value) {
    return value === -Infinity;
}
function isNegZero(value) {
    return Object.is(value, -0);
}
function isUint8Array(value) {
    return value instanceof Uint8Array;
}
function isUint16Array(value) {
    return value instanceof Uint16Array;
}
function isUint32Array(value) {
    return value instanceof Uint32Array;
}
function isInt8Array(value) {
    return value instanceof Int8Array;
}
function isInt16Array(value) {
    return value instanceof Int16Array;
}
function isInt32Array(value) {
    return value instanceof Int32Array;
}
function isFloat32Array(value) {
    return value instanceof Float32Array;
}
function isFloat64Array(value) {
    return value instanceof Float64Array;
}
function isArrayBuffer(value) {
    return value instanceof ArrayBuffer;
}
function isDataView(value) {
    return value instanceof DataView;
}
// Array-like to array converter
function typedArrayToArray(arr) {
    return Array.from(arr);
}
function arrayBufferToArray(buffer) {
    return Array.from(new Uint8Array(buffer));
}
function arrayToUint8Array(arr) {
    return new Uint8Array(arr);
}
function arrayToUint16Array(arr) {
    return new Uint16Array(arr);
}
function arrayToUint32Array(arr) {
    return new Uint32Array(arr);
}
function arrayToInt8Array(arr) {
    return new Int8Array(arr);
}
function arrayToInt16Array(arr) {
    return new Int16Array(arr);
}
function arrayToInt32Array(arr) {
    return new Int32Array(arr);
}
function arrayToFloat32Array(arr) {
    return new Float32Array(arr);
}
function arrayToFloat64Array(arr) {
    return new Float64Array(arr);
}
function arrayToArrayBuffer(arr) {
    return new Uint8Array(arr).buffer;
}
function arrayToDataView(arr) {
    return new DataView(new Uint8Array(arr).buffer);
}
// ============================================================================
// Serialization
// ============================================================================
/**
 * Serialize data with support for complex types.
 */
export function serialize(data, options = {}) {
    const { dedupe = true, maxDepth = Infinity, customTypes = [], } = options;
    const meta = {};
    const seen = new Map();
    const customHandlers = [...customTypes].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    function walk(value, path = [], depth = 0) {
        // Check depth limit
        if (depth > maxDepth) {
            return null;
        }
        // Handle primitives (except bigint and special numbers)
        if (value === null || typeof value === 'boolean' || typeof value === 'string') {
            return value;
        }
        // Handle special number cases
        if (isNaN(value)) {
            addToMeta(meta, path, TYPE_NAN);
            return null;
        }
        if (isInfinity(value)) {
            addToMeta(meta, path, TYPE_INFINITY);
            return null;
        }
        if (isNegInfinity(value)) {
            addToMeta(meta, path, TYPE_NEG_INFINITY);
            return null;
        }
        if (isNegZero(value)) {
            addToMeta(meta, path, TYPE_NEG_ZERO);
            return 0;
        }
        if (typeof value === 'number') {
            return value;
        }
        // Handle undefined
        if (isUndefined(value)) {
            addToMeta(meta, path, TYPE_UNDEFINED);
            return null;
        }
        // Handle BigInt
        if (isBigInt(value)) {
            addToMeta(meta, path, TYPE_BIGINT);
            return value.toString();
        }
        // Reference deduplication
        if (dedupe && typeof value === 'object') {
            const seenPath = seen.get(value);
            if (seenPath) {
                if (!meta.referenceMap) {
                    meta.referenceMap = {};
                }
                const currentPathStr = pathToString(path);
                const seenPathStr = pathToString(seenPath);
                meta.referenceMap[currentPathStr] = [seenPathStr];
                return null;
            }
            seen.set(value, path);
        }
        // Try custom handlers first
        for (const handler of customHandlers) {
            if (handler.isApplicable(value)) {
                addToMeta(meta, path, `custom:${handler.name}`);
                return walk(handler.serialize(value), path, depth + 1);
            }
        }
        // Handle Date
        if (isDate(value)) {
            addToMeta(meta, path, TYPE_DATE);
            return value.toISOString();
        }
        // Handle RegExp
        if (isRegExp(value)) {
            addToMeta(meta, path, TYPE_REGEXP);
            return { source: value.source, flags: value.flags };
        }
        // Handle Map
        if (isMap(value)) {
            addToMeta(meta, path, TYPE_MAP);
            const entries = [];
            let i = 0;
            for (const [k, v] of value.entries()) {
                entries.push([
                    walk(k, [...path, i, 0], depth + 1),
                    walk(v, [...path, i, 1], depth + 1),
                ]);
                i++;
            }
            return entries;
        }
        // Handle Set
        if (isSet(value)) {
            addToMeta(meta, path, TYPE_SET);
            const values = [];
            let i = 0;
            for (const v of value.values()) {
                values.push(walk(v, [...path, i], depth + 1));
                i++;
            }
            return values;
        }
        // Handle TypedArrays
        if (isUint8Array(value)) {
            addToMeta(meta, path, TYPE_UINT8ARRAY);
            return typedArrayToArray(value);
        }
        if (isUint16Array(value)) {
            addToMeta(meta, path, TYPE_UINT16ARRAY);
            return typedArrayToArray(value);
        }
        if (isUint32Array(value)) {
            addToMeta(meta, path, TYPE_UINT32ARRAY);
            return typedArrayToArray(value);
        }
        if (isInt8Array(value)) {
            addToMeta(meta, path, TYPE_INT8ARRAY);
            return typedArrayToArray(value);
        }
        if (isInt16Array(value)) {
            addToMeta(meta, path, TYPE_INT16ARRAY);
            return typedArrayToArray(value);
        }
        if (isInt32Array(value)) {
            addToMeta(meta, path, TYPE_INT32ARRAY);
            return typedArrayToArray(value);
        }
        if (isFloat32Array(value)) {
            addToMeta(meta, path, TYPE_FLOAT32ARRAY);
            return typedArrayToArray(value);
        }
        if (isFloat64Array(value)) {
            addToMeta(meta, path, TYPE_FLOAT64ARRAY);
            return typedArrayToArray(value);
        }
        if (isArrayBuffer(value)) {
            addToMeta(meta, path, TYPE_ARRAYBUFFER);
            return arrayBufferToArray(value);
        }
        if (isDataView(value)) {
            addToMeta(meta, path, TYPE_DATAVIEW);
            return arrayBufferToArray(value.buffer);
        }
        // Handle Arrays
        if (Array.isArray(value)) {
            return value.map((item, i) => walk(item, [...path, i], depth + 1));
        }
        // Handle Objects
        if (typeof value === 'object') {
            const result = {};
            for (const [key, val] of Object.entries(value)) {
                result[key] = walk(val, [...path, key], depth + 1);
            }
            return result;
        }
        // Fallback
        return value;
    }
    const json = walk(data);
    // Only include meta if there are transformations
    if (Object.keys(meta.values ?? {}).length === 0 && !meta.referenceMap) {
        return { json };
    }
    return { json, meta };
}
// ============================================================================
// Deserialization
// ============================================================================
/**
 * Deserialize data with type restoration.
 */
export function deserialize(result, options = {}) {
    const { customTypes = [] } = options;
    const { json, meta } = result;
    if (!meta || (!meta.values && !meta.referenceMap)) {
        return json;
    }
    // Store meta in a const for use in nested function (TypeScript narrowing doesn't work in nested functions)
    const metaData = meta;
    const customHandlers = new Map(customTypes.map(handler => [handler.name, handler]));
    // Build reference map
    const referenceCache = new Map();
    function walk(value, path = []) {
        const pathStr = pathToString(path);
        // Check for reference
        if (metaData.referenceMap?.[pathStr]) {
            const refPathStr = metaData.referenceMap[pathStr][0];
            if (refPathStr !== undefined) {
                const cached = referenceCache.get(refPathStr);
                if (cached !== undefined) {
                    return cached;
                }
            }
        }
        // Check for type transformation
        const types = metaData.values?.[pathStr];
        if (types) {
            const typeList = Array.isArray(types) ? types : [types];
            // Apply transformations in order
            let transformed = value;
            for (const type of typeList) {
                // Handle custom types
                if (type.startsWith('custom:')) {
                    const handlerName = type.slice(7);
                    const handler = customHandlers.get(handlerName);
                    if (handler) {
                        transformed = handler.deserialize(transformed);
                        continue;
                    }
                }
                // Handle built-in types
                switch (type) {
                    case TYPE_DATE:
                        transformed = new Date(transformed);
                        break;
                    case TYPE_REGEXP: {
                        const { source, flags } = transformed;
                        transformed = new RegExp(source, flags);
                        break;
                    }
                    case TYPE_MAP: {
                        const entries = transformed;
                        transformed = new Map(entries.map(([k, v], i) => [
                            walk(k, [...path, i, 0]),
                            walk(v, [...path, i, 1]),
                        ]));
                        break;
                    }
                    case TYPE_SET: {
                        const values = transformed;
                        transformed = new Set(values.map((v, i) => walk(v, [...path, i])));
                        break;
                    }
                    case TYPE_BIGINT:
                        transformed = BigInt(transformed);
                        break;
                    case TYPE_UNDEFINED:
                        transformed = undefined;
                        break;
                    case TYPE_NAN:
                        transformed = NaN;
                        break;
                    case TYPE_INFINITY:
                        transformed = Infinity;
                        break;
                    case TYPE_NEG_INFINITY:
                        transformed = -Infinity;
                        break;
                    case TYPE_NEG_ZERO:
                        transformed = -0;
                        break;
                    case TYPE_UINT8ARRAY:
                        transformed = arrayToUint8Array(transformed);
                        break;
                    case TYPE_UINT16ARRAY:
                        transformed = arrayToUint16Array(transformed);
                        break;
                    case TYPE_UINT32ARRAY:
                        transformed = arrayToUint32Array(transformed);
                        break;
                    case TYPE_INT8ARRAY:
                        transformed = arrayToInt8Array(transformed);
                        break;
                    case TYPE_INT16ARRAY:
                        transformed = arrayToInt16Array(transformed);
                        break;
                    case TYPE_INT32ARRAY:
                        transformed = arrayToInt32Array(transformed);
                        break;
                    case TYPE_FLOAT32ARRAY:
                        transformed = arrayToFloat32Array(transformed);
                        break;
                    case TYPE_FLOAT64ARRAY:
                        transformed = arrayToFloat64Array(transformed);
                        break;
                    case TYPE_ARRAYBUFFER:
                        transformed = arrayToArrayBuffer(transformed);
                        break;
                    case TYPE_DATAVIEW:
                        transformed = arrayToDataView(transformed);
                        break;
                }
            }
            // Cache the transformed value for reference deduplication
            referenceCache.set(pathStr, transformed);
            return transformed;
        }
        // Recursively process objects and arrays
        if (Array.isArray(value)) {
            return value.map((item, i) => walk(item, [...path, i]));
        }
        if (value !== null && typeof value === 'object') {
            const result = {};
            for (const [key, val] of Object.entries(value)) {
                result[key] = walk(val, [...path, key]);
            }
            return result;
        }
        return value;
    }
    return walk(json);
}
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Serialize and stringify to JSON string.
 */
export function stringify(data, options) {
    return JSON.stringify(serialize(data, options));
}
/**
 * Parse JSON string and deserialize.
 */
export function parse(json, options) {
    return deserialize(JSON.parse(json), options);
}
/**
 * Check if a value needs SuperJSON serialization.
 */
export function needsSerialization(value) {
    if (value === null || typeof value !== 'object') {
        return typeof value === 'bigint' || value === undefined ||
            Number.isNaN(value) || Object.is(value, -0) ||
            value === Infinity || value === -Infinity;
    }
    if (isDate(value) || isRegExp(value) || isMap(value) || isSet(value)) {
        return true;
    }
    if (isUint8Array(value) || isUint16Array(value) || isUint32Array(value) ||
        isInt8Array(value) || isInt16Array(value) || isInt32Array(value) ||
        isFloat32Array(value) || isFloat64Array(value) ||
        isArrayBuffer(value) || isDataView(value)) {
        return true;
    }
    if (Array.isArray(value)) {
        return value.some(needsSerialization);
    }
    return Object.values(value).some(needsSerialization);
}
// ============================================================================
// Custom Type Registration
// ============================================================================
const globalCustomTypes = [];
/**
 * Register a custom type handler globally.
 */
export function registerCustomType(handler) {
    globalCustomTypes.push(handler);
    globalCustomTypes.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
/**
 * Get all registered custom type handlers.
 */
export function getCustomTypes() {
    return [...globalCustomTypes];
}
/**
 * Clear all registered custom type handlers.
 */
export function clearCustomTypes() {
    globalCustomTypes.length = 0;
}
/**
 * Create a serializer/deserializer with custom types baked in.
 */
export function createSuperJSON(customTypes = []) {
    const allCustomTypes = [...globalCustomTypes, ...customTypes];
    return {
        serialize: (data, options) => serialize(data, { ...options, customTypes: allCustomTypes }),
        deserialize: (result, options) => deserialize(result, { ...options, customTypes: allCustomTypes }),
        stringify: (data, options) => stringify(data, { ...options, customTypes: allCustomTypes }),
        parse: (json, options) => parse(json, { ...options, customTypes: allCustomTypes }),
    };
}
//# sourceMappingURL=superjson.js.map