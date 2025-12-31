/**
 * PhilJS WASM Code Generator
 *
 * Generates JavaScript/TypeScript bindings from Rust source files.
 * Competes directly with Dioxus's code generation capabilities.
 */
// ============================================================================
// Rust to JS Type Mapper
// ============================================================================
/**
 * Map Rust types to JavaScript/TypeScript types
 */
export class RustToJSMapper {
    customMappings = new Map();
    constructor(customMappings) {
        if (customMappings) {
            for (const [rust, js] of Object.entries(customMappings)) {
                this.customMappings.set(rust, js);
            }
        }
    }
    /**
     * Add a custom type mapping
     */
    addMapping(rustType, jsType) {
        this.customMappings.set(rustType, jsType);
    }
    /**
     * Map a Rust type to TypeScript
     */
    mapType(rustType) {
        // Check custom mappings first
        if (this.customMappings.has(rustType.name)) {
            return this.customMappings.get(rustType.name);
        }
        // Handle Option<T>
        if (rustType.isOptional || rustType.name === 'Option') {
            const inner = rustType.generics?.[0];
            if (inner) {
                return `${this.mapType(inner)} | null`;
            }
            return 'unknown | null';
        }
        // Handle Result<T, E>
        if (rustType.isResult || rustType.name === 'Result') {
            const okType = rustType.generics?.[0];
            if (okType) {
                return `Promise<${this.mapType(okType)}>`;
            }
            return 'Promise<unknown>';
        }
        // Handle Vec<T>
        if (rustType.name === 'Vec') {
            const inner = rustType.generics?.[0];
            if (inner) {
                return `${this.mapType(inner)}[]`;
            }
            return 'unknown[]';
        }
        // Handle arrays [T; N]
        if (rustType.name.startsWith('[') && rustType.name.includes(';')) {
            const match = rustType.name.match(/\[([^;]+);\s*(\d+)\]/);
            if (match?.[1] !== undefined && match[2] !== undefined) {
                const innerType = this.mapTypeString(match[1].trim());
                return `[${Array(parseInt(match[2])).fill(innerType).join(', ')}]`;
            }
        }
        // Handle slices &[T]
        if (rustType.name.startsWith('[')) {
            const inner = rustType.name.slice(1, -1).trim();
            return `${this.mapTypeString(inner)}[]`;
        }
        // Handle HashMap and BTreeMap
        if (rustType.name === 'HashMap' || rustType.name === 'BTreeMap') {
            const keyType = rustType.generics?.[0];
            const valueType = rustType.generics?.[1];
            const keyTs = keyType ? this.mapType(keyType) : 'string';
            const valueTs = valueType ? this.mapType(valueType) : 'unknown';
            return `Map<${keyTs}, ${valueTs}>`;
        }
        // Handle HashSet and BTreeSet
        if (rustType.name === 'HashSet' || rustType.name === 'BTreeSet') {
            const inner = rustType.generics?.[0];
            if (inner) {
                return `Set<${this.mapType(inner)}>`;
            }
            return 'Set<unknown>';
        }
        // Handle Box<T>, Rc<T>, Arc<T> - unwrap them
        if (rustType.name === 'Box' || rustType.name === 'Rc' || rustType.name === 'Arc') {
            const inner = rustType.generics?.[0];
            if (inner) {
                return this.mapType(inner);
            }
        }
        // Handle references - just unwrap them for JS
        if (rustType.isReference) {
            return this.mapTypeString(rustType.name);
        }
        // Primitive type mappings
        return this.mapPrimitiveType(rustType.name);
    }
    /**
     * Map a type string to TypeScript
     */
    mapTypeString(typeStr) {
        const parsed = parseRustType(typeStr);
        return this.mapType(parsed);
    }
    /**
     * Map Rust primitive types to TypeScript
     */
    mapPrimitiveType(name) {
        const primitives = {
            // Integer types -> number
            'i8': 'number',
            'i16': 'number',
            'i32': 'number',
            'u8': 'number',
            'u16': 'number',
            'u32': 'number',
            'isize': 'number',
            'usize': 'number',
            // Large integers -> bigint
            'i64': 'bigint',
            'u64': 'bigint',
            'i128': 'bigint',
            'u128': 'bigint',
            // Float types -> number
            'f32': 'number',
            'f64': 'number',
            // Boolean
            'bool': 'boolean',
            // String types
            'String': 'string',
            'str': 'string',
            '&str': 'string',
            'char': 'string',
            // Unit type
            '()': 'void',
            // WASM-specific types
            'JsValue': 'unknown',
            'JsString': 'string',
            'JsNumber': 'number',
            'JsBoolean': 'boolean',
            'Array': 'unknown[]',
            'Object': 'Record<string, unknown>',
            'Function': '(...args: unknown[]) => unknown',
            // Typed arrays
            'Uint8Array': 'Uint8Array',
            'Int8Array': 'Int8Array',
            'Uint16Array': 'Uint16Array',
            'Int16Array': 'Int16Array',
            'Uint32Array': 'Uint32Array',
            'Int32Array': 'Int32Array',
            'Float32Array': 'Float32Array',
            'Float64Array': 'Float64Array',
            'BigInt64Array': 'BigInt64Array',
            'BigUint64Array': 'BigUint64Array',
            // Self reference - will be replaced with actual type
            'Self': 'this',
        };
        return primitives[name] || name;
    }
}
// ============================================================================
// Rust Parser
// ============================================================================
/**
 * Parse a Rust type string into a RustType
 */
export function parseRustType(typeStr) {
    let str = typeStr.trim();
    // Handle references
    let isReference = false;
    let isMutable = false;
    let lifetime;
    if (str.startsWith('&')) {
        isReference = true;
        str = str.slice(1).trim();
        // Check for lifetime
        if (str.startsWith("'")) {
            const endLifetime = str.indexOf(' ');
            if (endLifetime > 0) {
                lifetime = str.slice(0, endLifetime);
                str = str.slice(endLifetime + 1).trim();
            }
        }
        // Check for mut
        if (str.startsWith('mut ')) {
            isMutable = true;
            str = str.slice(4).trim();
        }
    }
    // Handle Option and Result specially
    const isOptional = str.startsWith('Option<');
    const isResult = str.startsWith('Result<');
    // Parse generics
    let name = str;
    let generics;
    const genericStart = str.indexOf('<');
    if (genericStart > 0) {
        name = str.slice(0, genericStart);
        const genericStr = str.slice(genericStart + 1, findMatchingBracket(str, genericStart));
        generics = splitGenericParams(genericStr).map(g => parseRustType(g.trim()));
    }
    const result = {
        raw: typeStr,
        name,
        isReference,
        isMutable,
        isOptional,
        isResult
    };
    if (generics !== undefined)
        result.generics = generics;
    if (lifetime !== undefined)
        result.lifetime = lifetime;
    return result;
}
/**
 * Find the matching closing bracket
 */
function findMatchingBracket(str, openPos) {
    let depth = 1;
    for (let i = openPos + 1; i < str.length; i++) {
        if (str[i] === '<')
            depth++;
        else if (str[i] === '>') {
            depth--;
            if (depth === 0)
                return i;
        }
    }
    return str.length;
}
/**
 * Split generic parameters, respecting nested brackets
 */
function splitGenericParams(str) {
    const params = [];
    let current = '';
    let depth = 0;
    for (const char of str) {
        if (char === '<')
            depth++;
        else if (char === '>')
            depth--;
        else if (char === ',' && depth === 0) {
            params.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    if (current.trim()) {
        params.push(current.trim());
    }
    return params;
}
/**
 * Parse #[wasm_bindgen(...)] attributes
 */
function parseWasmBindgenAttrs(attrStr) {
    const attrs = {};
    // Handle simple marker
    if (!attrStr || attrStr === 'wasm_bindgen') {
        return attrs;
    }
    // Extract content between parentheses
    const match = attrStr.match(/wasm_bindgen\s*\(([^)]*)\)/);
    if (!match?.[1])
        return attrs;
    const content = match[1];
    const parts = content.split(',').map(p => p.trim());
    for (const part of parts) {
        if (part.includes('=')) {
            const splitParts = part.split('=').map(s => s.trim());
            const key = splitParts[0];
            const value = splitParts[1];
            if (key === undefined || value === undefined)
                continue;
            const cleanValue = value.replace(/^["']|["']$/g, '');
            switch (key) {
                case 'js_name':
                    attrs.jsName = cleanValue;
                    break;
                case 'typescript_type':
                    attrs.typescript_type = cleanValue;
                    break;
                case 'module':
                    attrs.module = cleanValue;
                    break;
            }
        }
        else {
            switch (part) {
                case 'constructor':
                    attrs.isConstructor = true;
                    break;
                case 'method':
                    attrs.method = true;
                    break;
                case 'getter':
                    attrs.getter = true;
                    break;
                case 'setter':
                    attrs.setter = true;
                    break;
                case 'catch':
                    attrs.catch = true;
                    break;
                case 'skip':
                    attrs.skip = true;
                    break;
                case 'final':
                    attrs.final = true;
                    break;
                case 'structural':
                    attrs.structural = true;
                    break;
            }
        }
    }
    return attrs;
}
/**
 * Extract documentation comments from Rust code
 */
function extractDocComment(lines, endIndex) {
    const docLines = [];
    let i = endIndex - 1;
    while (i >= 0) {
        const line = lines[i]?.trim() ?? '';
        if (line.startsWith('///')) {
            docLines.unshift(line.slice(3).trim());
            i--;
        }
        else if (line.startsWith('#[')) {
            // Skip attributes
            i--;
        }
        else if (line === '') {
            i--;
        }
        else {
            break;
        }
    }
    return docLines.length > 0 ? docLines.join('\n') : undefined;
}
/**
 * Parse a Rust function signature
 */
function parseRustFunction(signature, attrs = []) {
    // Extract wasm_bindgen attributes
    let hasWasmBindgen = false;
    let wasmBindgenAttrs;
    for (const attr of attrs) {
        if (attr.includes('wasm_bindgen')) {
            hasWasmBindgen = true;
            wasmBindgenAttrs = parseWasmBindgenAttrs(attr);
        }
    }
    // Match function signature
    const fnMatch = signature.match(/^(pub\s+)?(async\s+)?fn\s+(\w+)(<[^>]+>)?\s*\(([^)]*)\)(\s*->\s*(.+?))?(?:\s*where\s+.+)?$/s);
    if (!fnMatch)
        return null;
    const [, pubMarker, asyncMarker, name, genericsStr, paramsStr, , returnTypeStr] = fnMatch;
    if (name === undefined)
        return null;
    // Parse parameters
    const params = [];
    if (paramsStr?.trim()) {
        const paramParts = splitParams(paramsStr);
        for (const param of paramParts) {
            const trimmed = param.trim();
            if (trimmed === 'self') {
                params.push({ name: 'self', type: { raw: 'Self', name: 'Self' }, isSelf: true });
            }
            else if (trimmed === '&self') {
                params.push({ name: 'self', type: { raw: '&Self', name: 'Self', isReference: true }, isSelf: true });
            }
            else if (trimmed === '&mut self') {
                params.push({ name: 'self', type: { raw: '&mut Self', name: 'Self', isReference: true, isMutable: true }, isSelf: true, isMutSelf: true });
            }
            else {
                const colonPos = trimmed.indexOf(':');
                if (colonPos > 0) {
                    const paramName = trimmed.slice(0, colonPos).trim();
                    const paramType = trimmed.slice(colonPos + 1).trim();
                    params.push({
                        name: paramName,
                        type: parseRustType(paramType)
                    });
                }
            }
        }
    }
    // Parse generics
    let generics;
    if (genericsStr) {
        generics = genericsStr.slice(1, -1).split(',').map(g => g.trim());
    }
    // Determine JS name
    const jsName = wasmBindgenAttrs?.jsName ?? snakeToCamel(name);
    const result = {
        name: jsName,
        rustName: name,
        isAsync: !!asyncMarker,
        isPublic: !!pubMarker,
        hasWasmBindgen,
        params,
    };
    if (returnTypeStr)
        result.returnType = parseRustType(returnTypeStr.trim());
    if (wasmBindgenAttrs !== undefined)
        result.wasmBindgenAttrs = wasmBindgenAttrs;
    if (generics !== undefined)
        result.generics = generics;
    return result;
}
/**
 * Split function parameters, respecting nested brackets
 */
function splitParams(str) {
    const params = [];
    let current = '';
    let depth = 0;
    for (const char of str) {
        if (char === '<' || char === '(' || char === '[' || char === '{')
            depth++;
        else if (char === '>' || char === ')' || char === ']' || char === '}')
            depth--;
        else if (char === ',' && depth === 0) {
            params.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    if (current.trim()) {
        params.push(current.trim());
    }
    return params;
}
/**
 * Parse a Rust struct
 */
function parseRustStruct(code, attrs = []) {
    // Extract wasm_bindgen attributes
    let hasWasmBindgen = false;
    let wasmBindgenAttrs;
    let derives = [];
    for (const attr of attrs) {
        if (attr.includes('wasm_bindgen')) {
            hasWasmBindgen = true;
            wasmBindgenAttrs = parseWasmBindgenAttrs(attr);
        }
        if (attr.includes('derive')) {
            const deriveMatch = attr.match(/derive\s*\(([^)]+)\)/);
            if (deriveMatch?.[1]) {
                derives = deriveMatch[1].split(',').map(d => d.trim());
            }
        }
    }
    // Match struct signature
    const structMatch = code.match(/^(pub\s+)?struct\s+(\w+)(<[^>]+>)?(?:\s*where\s+[^{]+)?\s*\{/);
    if (!structMatch) {
        // Try unit struct or tuple struct
        const unitMatch = code.match(/^(pub\s+)?struct\s+(\w+)(<[^>]+>)?\s*;/);
        if (unitMatch) {
            const [, pubMarker, unitName, genericsStr] = unitMatch;
            if (unitName === undefined)
                return null;
            const result = {
                name: wasmBindgenAttrs?.jsName ?? unitName,
                rustName: unitName,
                isPublic: !!pubMarker,
                hasWasmBindgen,
                fields: [],
                derives
            };
            if (wasmBindgenAttrs !== undefined)
                result.wasmBindgenAttrs = wasmBindgenAttrs;
            if (genericsStr)
                result.generics = genericsStr.slice(1, -1).split(',').map(g => g.trim());
            return result;
        }
        return null;
    }
    const [, pubMarker, name, genericsStr] = structMatch;
    if (name === undefined)
        return null;
    // Parse fields
    const fieldsStart = code.indexOf('{') + 1;
    const fieldsEnd = findMatchingBrace(code, code.indexOf('{'));
    const fieldsStr = code.slice(fieldsStart, fieldsEnd);
    const fields = [];
    const fieldLines = fieldsStr.split('\n');
    let currentDoc = '';
    let currentAttrs = [];
    for (const line of fieldLines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('///')) {
            currentDoc += (currentDoc ? '\n' : '') + trimmed.slice(3).trim();
            continue;
        }
        if (trimmed.startsWith('#[')) {
            currentAttrs.push(trimmed);
            continue;
        }
        // Parse field
        const fieldMatch = trimmed.match(/^(pub\s+)?(\w+)\s*:\s*(.+?)\s*,?\s*$/);
        if (fieldMatch) {
            const [, fieldPub, fieldName, fieldType] = fieldMatch;
            if (fieldName === undefined || fieldType === undefined)
                continue;
            let hasGetter = false;
            let hasSetter = false;
            for (const attr of currentAttrs) {
                if (attr.includes('wasm_bindgen') && attr.includes('getter'))
                    hasGetter = true;
                if (attr.includes('wasm_bindgen') && attr.includes('setter'))
                    hasSetter = true;
            }
            const field = {
                name: fieldName,
                type: parseRustType(fieldType),
                isPublic: !!fieldPub,
                hasGetter,
                hasSetter
            };
            if (currentDoc)
                field.doc = currentDoc;
            fields.push(field);
            currentDoc = '';
            currentAttrs = [];
        }
    }
    const result = {
        name: wasmBindgenAttrs?.jsName ?? name,
        rustName: name,
        isPublic: !!pubMarker,
        hasWasmBindgen,
        fields,
        derives
    };
    if (wasmBindgenAttrs !== undefined)
        result.wasmBindgenAttrs = wasmBindgenAttrs;
    if (genericsStr)
        result.generics = genericsStr.slice(1, -1).split(',').map(g => g.trim());
    return result;
}
/**
 * Find matching closing brace
 */
function findMatchingBrace(str, openPos) {
    let depth = 1;
    for (let i = openPos + 1; i < str.length; i++) {
        if (str[i] === '{')
            depth++;
        else if (str[i] === '}') {
            depth--;
            if (depth === 0)
                return i;
        }
    }
    return str.length;
}
/**
 * Parse a Rust enum
 */
function parseRustEnum(code, attrs = []) {
    // Extract wasm_bindgen attributes
    let hasWasmBindgen = false;
    let wasmBindgenAttrs;
    for (const attr of attrs) {
        if (attr.includes('wasm_bindgen')) {
            hasWasmBindgen = true;
            wasmBindgenAttrs = parseWasmBindgenAttrs(attr);
        }
    }
    // Match enum signature
    const enumMatch = code.match(/^(pub\s+)?enum\s+(\w+)(<[^>]+>)?\s*\{/);
    if (!enumMatch)
        return null;
    const [, pubMarker, name, genericsStr] = enumMatch;
    if (name === undefined)
        return null;
    // Parse variants
    const variantsStart = code.indexOf('{') + 1;
    const variantsEnd = findMatchingBrace(code, code.indexOf('{'));
    const variantsStr = code.slice(variantsStart, variantsEnd);
    const variants = [];
    const variantLines = variantsStr.split('\n');
    let currentDoc = '';
    for (const line of variantLines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('///')) {
            currentDoc += (currentDoc ? '\n' : '') + trimmed.slice(3).trim();
            continue;
        }
        if (!trimmed || trimmed.startsWith('#['))
            continue;
        // Parse variant - handle unit, tuple, and struct variants
        const unitMatch = trimmed.match(/^(\w+)\s*(?:=\s*(\d+))?\s*,?\s*$/);
        const tupleMatch = trimmed.match(/^(\w+)\s*\(([^)]+)\)\s*,?\s*$/);
        const structMatch = trimmed.match(/^(\w+)\s*\{([^}]+)\}\s*,?\s*$/);
        if (tupleMatch) {
            const [, tupleVariantName, tupleFieldsStr] = tupleMatch;
            if (tupleVariantName === undefined || tupleFieldsStr === undefined)
                continue;
            const variant = {
                name: tupleVariantName,
                tupleFields: tupleFieldsStr.split(',').map(f => parseRustType(f.trim()))
            };
            if (currentDoc)
                variant.doc = currentDoc;
            variants.push(variant);
            currentDoc = '';
        }
        else if (structMatch) {
            const [, structVariantName, structFieldsStr] = structMatch;
            if (structVariantName === undefined || structFieldsStr === undefined)
                continue;
            const structFields = [];
            for (const field of structFieldsStr.split(',')) {
                const fieldMatch = field.trim().match(/(\w+)\s*:\s*(.+)/);
                if (fieldMatch?.[1] !== undefined && fieldMatch[2] !== undefined) {
                    structFields.push({
                        name: fieldMatch[1],
                        type: parseRustType(fieldMatch[2]),
                        isPublic: true
                    });
                }
            }
            const variant = {
                name: structVariantName,
                structFields
            };
            if (currentDoc)
                variant.doc = currentDoc;
            variants.push(variant);
            currentDoc = '';
        }
        else if (unitMatch) {
            const [, unitVariantName, discriminant] = unitMatch;
            if (unitVariantName === undefined)
                continue;
            const variant = {
                name: unitVariantName,
            };
            if (currentDoc)
                variant.doc = currentDoc;
            if (discriminant !== undefined)
                variant.discriminant = parseInt(discriminant);
            variants.push(variant);
            currentDoc = '';
        }
    }
    const result = {
        name: wasmBindgenAttrs?.jsName ?? name,
        rustName: name,
        isPublic: !!pubMarker,
        hasWasmBindgen,
        variants,
    };
    if (wasmBindgenAttrs !== undefined)
        result.wasmBindgenAttrs = wasmBindgenAttrs;
    if (genericsStr)
        result.generics = genericsStr.slice(1, -1).split(',').map(g => g.trim());
    return result;
}
/**
 * Parse a complete Rust module
 */
export function parseRustModule(code) {
    const module = {
        functions: [],
        structs: [],
        enums: [],
        typeAliases: new Map(),
        impls: []
    };
    // Remove block comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    const lines = code.split('\n');
    let currentAttrs = [];
    let currentDoc = '';
    let i = 0;
    while (i < lines.length) {
        const currentLine = lines[i];
        if (currentLine === undefined) {
            i++;
            continue;
        }
        const line = currentLine.trim();
        // Collect doc comments
        if (line.startsWith('///')) {
            currentDoc += (currentDoc ? '\n' : '') + line.slice(3).trim();
            i++;
            continue;
        }
        // Collect attributes
        if (line.startsWith('#[')) {
            currentAttrs.push(line);
            i++;
            continue;
        }
        // Skip empty lines between attributes
        if (line === '' && currentAttrs.length > 0) {
            i++;
            continue;
        }
        // Parse function
        if (line.match(/^(pub\s+)?(async\s+)?fn\s+/)) {
            // Collect full function signature
            let signature = line;
            while (!signature.includes('{') && !signature.includes(';') && i < lines.length - 1) {
                i++;
                const nextLine = lines[i];
                if (nextLine !== undefined) {
                    signature += ' ' + nextLine.trim();
                }
            }
            // Remove the body
            signature = signature.replace(/\s*\{[\s\S]*$/, '').replace(/\s*;[\s\S]*$/, '');
            const fn = parseRustFunction(signature, currentAttrs);
            if (fn) {
                if (currentDoc)
                    fn.doc = currentDoc;
                module.functions.push(fn);
            }
            currentAttrs = [];
            currentDoc = '';
            i++;
            continue;
        }
        // Parse struct
        if (line.match(/^(pub\s+)?struct\s+/)) {
            // Collect full struct
            let structCode = line;
            let braceDepth = (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
            while ((braceDepth > 0 || !structCode.includes('{')) && i < lines.length - 1) {
                i++;
                const nextLine = lines[i];
                if (nextLine !== undefined) {
                    structCode += '\n' + nextLine;
                    braceDepth += (nextLine.match(/\{/g) ?? []).length - (nextLine.match(/\}/g) ?? []).length;
                }
            }
            const struct = parseRustStruct(structCode, currentAttrs);
            if (struct) {
                if (currentDoc)
                    struct.doc = currentDoc;
                module.structs.push(struct);
            }
            currentAttrs = [];
            currentDoc = '';
            i++;
            continue;
        }
        // Parse enum
        if (line.match(/^(pub\s+)?enum\s+/)) {
            // Collect full enum
            let enumCode = line;
            let braceDepth = (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
            while ((braceDepth > 0 || !enumCode.includes('{')) && i < lines.length - 1) {
                i++;
                const nextLine = lines[i];
                if (nextLine !== undefined) {
                    enumCode += '\n' + nextLine;
                    braceDepth += (nextLine.match(/\{/g) ?? []).length - (nextLine.match(/\}/g) ?? []).length;
                }
            }
            const enumDef = parseRustEnum(enumCode, currentAttrs);
            if (enumDef) {
                if (currentDoc)
                    enumDef.doc = currentDoc;
                module.enums.push(enumDef);
            }
            currentAttrs = [];
            currentDoc = '';
            i++;
            continue;
        }
        // Parse type alias
        if (line.match(/^(pub\s+)?type\s+/)) {
            const typeMatch = line.match(/^(?:pub\s+)?type\s+(\w+)\s*=\s*(.+?)\s*;/);
            if (typeMatch?.[1] !== undefined && typeMatch[2] !== undefined) {
                module.typeAliases.set(typeMatch[1], parseRustType(typeMatch[2]));
            }
            currentAttrs = [];
            currentDoc = '';
            i++;
            continue;
        }
        // Parse impl block
        if (line.match(/^impl\s+/)) {
            // Collect full impl block
            let implCode = line;
            let braceDepth = (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
            while ((braceDepth > 0 || !implCode.includes('{')) && i < lines.length - 1) {
                i++;
                const nextLine = lines[i];
                if (nextLine !== undefined) {
                    implCode += '\n' + nextLine;
                    braceDepth += (nextLine.match(/\{/g) ?? []).length - (nextLine.match(/\}/g) ?? []).length;
                }
            }
            // Parse impl header
            const implMatch = implCode.match(/^impl\s+(?:(<[^>]+>)\s+)?(?:(\w+)\s+for\s+)?(\w+)/);
            if (implMatch) {
                const [, genericsStr, traitName, typeName] = implMatch;
                if (typeName !== undefined) {
                    // Parse methods in impl
                    const methods = [];
                    const implBody = implCode.slice(implCode.indexOf('{') + 1, findMatchingBrace(implCode, implCode.indexOf('{')));
                    const methodMatches = implBody.matchAll(/((?:#\[.*?\]\s*)*)(?:pub\s+)?(?:async\s+)?fn\s+\w+[^{;]+/g);
                    for (const match of methodMatches) {
                        const attrs = match[1] ? match[1].split('#[').filter(a => a).map(a => '#[' + a.trim()) : [];
                        const fn = parseRustFunction(match[0].trim(), attrs);
                        if (fn)
                            methods.push(fn);
                    }
                    const impl = {
                        targetType: typeName,
                        methods,
                    };
                    if (traitName !== undefined)
                        impl.trait = traitName;
                    if (genericsStr)
                        impl.generics = genericsStr.slice(1, -1).split(',').map(g => g.trim());
                    module.impls.push(impl);
                }
            }
            currentAttrs = [];
            currentDoc = '';
            i++;
            continue;
        }
        // Reset for other lines
        if (line !== '') {
            currentAttrs = [];
            currentDoc = '';
        }
        i++;
    }
    return module;
}
/**
 * Convert snake_case to camelCase
 */
function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
/**
 * Convert snake_case to PascalCase
 */
function snakeToPascal(str) {
    const camel = snakeToCamel(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}
/**
 * Generate TypeScript types from Rust types
 */
export function generateTypeScriptTypes(module, options = {}) {
    const { typeMapper = new RustToJSMapper(), jsdoc = true, indent = '  ' } = options;
    const lines = [
        '// Auto-generated TypeScript types from Rust',
        '// Generated by philjs-wasm codegen',
        ''
    ];
    // Generate struct interfaces
    for (const struct of module.structs) {
        if (!struct.isPublic && !struct.hasWasmBindgen)
            continue;
        if (jsdoc && struct.doc) {
            lines.push('/**');
            for (const docLine of struct.doc.split('\n')) {
                lines.push(` * ${docLine}`);
            }
            lines.push(' */');
        }
        const genericsStr = struct.generics?.length
            ? `<${struct.generics.join(', ')}>`
            : '';
        lines.push(`export interface ${struct.name}${genericsStr} {`);
        for (const field of struct.fields) {
            if (!field.isPublic && !struct.hasWasmBindgen)
                continue;
            if (jsdoc && field.doc) {
                lines.push(`${indent}/** ${field.doc.replace(/\n/g, ' ')} */`);
            }
            const tsType = typeMapper.mapType(field.type);
            const optional = field.type.isOptional ? '?' : '';
            lines.push(`${indent}${field.name}${optional}: ${tsType};`);
        }
        lines.push('}');
        lines.push('');
    }
    // Generate enum types
    for (const enumDef of module.enums) {
        if (!enumDef.isPublic && !enumDef.hasWasmBindgen)
            continue;
        if (jsdoc && enumDef.doc) {
            lines.push('/**');
            for (const docLine of enumDef.doc.split('\n')) {
                lines.push(` * ${docLine}`);
            }
            lines.push(' */');
        }
        // Check if it's a simple enum (all unit variants)
        const isSimple = enumDef.variants.every(v => !v.tupleFields && !v.structFields);
        if (isSimple) {
            // Generate as string union
            const variants = enumDef.variants.map(v => `'${v.name}'`).join(' | ');
            lines.push(`export type ${enumDef.name} = ${variants};`);
        }
        else {
            // Generate as discriminated union
            const variants = [];
            for (const variant of enumDef.variants) {
                if (variant.tupleFields) {
                    const fields = variant.tupleFields.map((t, i) => `_${i}: ${typeMapper.mapType(t)}`).join('; ');
                    variants.push(`{ type: '${variant.name}'; ${fields} }`);
                }
                else if (variant.structFields) {
                    const fields = variant.structFields.map(f => `${f.name}: ${typeMapper.mapType(f.type)}`).join('; ');
                    variants.push(`{ type: '${variant.name}'; ${fields} }`);
                }
                else {
                    variants.push(`{ type: '${variant.name}' }`);
                }
            }
            lines.push(`export type ${enumDef.name} = ${variants.join(' | ')};`);
        }
        lines.push('');
    }
    // Generate type aliases
    for (const [name, type] of module.typeAliases) {
        lines.push(`export type ${name} = ${typeMapper.mapType(type)};`);
        lines.push('');
    }
    return lines.join('\n');
}
/**
 * Generate JS wrapper for a Rust function
 */
export function generateJSWrapper(fn, options = {}) {
    const { typeMapper = new RustToJSMapper(), jsdoc = true, indent = '  ', moduleName = 'wasmModule' } = options;
    const lines = [];
    // Generate JSDoc
    if (jsdoc) {
        lines.push('/**');
        if (fn.doc) {
            for (const docLine of fn.doc.split('\n')) {
                lines.push(` * ${docLine}`);
            }
        }
        for (const param of fn.params) {
            if (!param.isSelf) {
                lines.push(` * @param ${param.name} - ${typeMapper.mapType(param.type)}`);
            }
        }
        if (fn.returnType) {
            lines.push(` * @returns ${typeMapper.mapType(fn.returnType)}`);
        }
        lines.push(' */');
    }
    // Generate function
    const params = fn.params
        .filter(p => !p.isSelf)
        .map(p => `${p.name}: ${typeMapper.mapType(p.type)}`);
    const returnType = fn.returnType
        ? typeMapper.mapType(fn.returnType)
        : 'void';
    const asyncKeyword = fn.isAsync || fn.returnType?.isResult ? 'async ' : '';
    const returnTypeAnnotation = fn.isAsync || fn.returnType?.isResult
        ? `Promise<${returnType.replace('Promise<', '').replace(/>$/, '')}>`
        : returnType;
    lines.push(`export ${asyncKeyword}function ${fn.name}(${params.join(', ')}): ${returnTypeAnnotation} {`);
    // Generate function body
    const argList = fn.params
        .filter(p => !p.isSelf)
        .map(p => p.name)
        .join(', ');
    if (fn.returnType?.isResult) {
        lines.push(`${indent}try {`);
        lines.push(`${indent}${indent}return ${asyncKeyword ? 'await ' : ''}${moduleName}.exports.${fn.rustName}(${argList});`);
        lines.push(`${indent}} catch (e) {`);
        lines.push(`${indent}${indent}throw new Error(\`Rust function '${fn.rustName}' failed: \${e}\`);`);
        lines.push(`${indent}}`);
    }
    else {
        const awaitKeyword = fn.isAsync ? 'await ' : '';
        const returnKeyword = fn.returnType ? 'return ' : '';
        lines.push(`${indent}${returnKeyword}${awaitKeyword}${moduleName}.exports.${fn.rustName}(${argList});`);
    }
    lines.push('}');
    return lines.join('\n');
}
/**
 * Generate PhilJS component binding from a Rust struct
 */
export function generateComponentBinding(struct, methods = [], options = {}) {
    const { typeMapper = new RustToJSMapper(), jsdoc = true, indent = '  ', moduleName = 'wasmModule' } = options;
    const lines = [
        '/**',
        ` * PhilJS component wrapper for ${struct.rustName}`,
        ' * Auto-generated from Rust struct',
        ' */'
    ];
    // Generate props interface
    lines.push(`export interface ${struct.name}Props {`);
    for (const field of struct.fields) {
        if (field.isPublic) {
            const tsType = typeMapper.mapType(field.type);
            const optional = field.type.isOptional ? '?' : '';
            lines.push(`${indent}${field.name}${optional}: ${tsType};`);
        }
    }
    lines.push('}');
    lines.push('');
    // Generate component function
    lines.push(`export async function create${struct.name}Component(`);
    lines.push(`${indent}wasmUrl: string,`);
    lines.push(`${indent}options: { hmr?: boolean } = {}`);
    lines.push(`) {`);
    lines.push(`${indent}const { createWasmComponent } = await import('philjs-wasm');`);
    lines.push('');
    lines.push(`${indent}const component = await createWasmComponent(wasmUrl, {`);
    lines.push(`${indent}${indent}renderFn: 'render_${struct.rustName.toLowerCase()}',`);
    lines.push(`${indent}${indent}hmr: options.hmr`);
    lines.push(`${indent}});`);
    lines.push('');
    // Add bound methods
    if (methods.length > 0) {
        lines.push(`${indent}// Bound methods from impl block`);
        for (const method of methods) {
            if (!method.params.some(p => p.isSelf))
                continue;
            const params = method.params
                .filter(p => !p.isSelf)
                .map(p => p.name)
                .join(', ');
            lines.push(`${indent}const ${method.name} = component.bindFunction('${method.rustName}');`);
        }
        lines.push('');
    }
    lines.push(`${indent}return {`);
    lines.push(`${indent}${indent}...component,`);
    for (const method of methods) {
        if (method.params.some(p => p.isSelf)) {
            lines.push(`${indent}${indent}${method.name},`);
        }
    }
    lines.push(`${indent}};`);
    lines.push('}');
    return lines.join('\n');
}
/**
 * Generate signal bindings for a Rust struct
 */
export function generateSignalBinding(struct, options = {}) {
    const { typeMapper = new RustToJSMapper(), indent = '  ', moduleName = 'wasmModule' } = options;
    const lines = [
        '/**',
        ` * Signal bindings for ${struct.rustName}`,
        ' * Enables reactive state sharing between Rust and JavaScript',
        ' */'
    ];
    lines.push(`export function create${struct.name}Signals(`);
    lines.push(`${indent}module: WasmModule,`);
    lines.push(`${indent}initialValues: Partial<${struct.name}Props> = {}`);
    lines.push(`) {`);
    lines.push(`${indent}const signals: Record<string, RustSignal<any>> = {};`);
    lines.push('');
    for (const field of struct.fields) {
        if (!field.isPublic)
            continue;
        const tsType = typeMapper.mapType(field.type);
        const signalCreator = getSignalCreatorForType(field.type);
        lines.push(`${indent}signals.${field.name} = ${signalCreator}(module, initialValues.${field.name});`);
    }
    lines.push('');
    lines.push(`${indent}return signals as {`);
    for (const field of struct.fields) {
        if (!field.isPublic)
            continue;
        const tsType = typeMapper.mapType(field.type);
        lines.push(`${indent}${indent}${field.name}: RustSignal<${tsType}>;`);
    }
    lines.push(`${indent}};`);
    lines.push('}');
    return lines.join('\n');
}
/**
 * Get the appropriate signal creator for a type
 */
function getSignalCreatorForType(type) {
    const name = type.name;
    if (name === 'i32' || name === 'u32')
        return 'createI32Signal';
    if (name === 'i64' || name === 'u64')
        return 'createI64Signal';
    if (name === 'f32')
        return 'createF32Signal';
    if (name === 'f64')
        return 'createF64Signal';
    if (name === 'bool')
        return 'createBoolSignal';
    return 'createRustSignal';
}
/**
 * Generate all bindings from a Rust file
 */
export function generateBindings(rustCode, options = {}) {
    const { typescript = true, philjs = true, signals = true, indent = '  ' } = options;
    const module = parseRustModule(rustCode);
    const typeMapper = options.typeMapper || new RustToJSMapper();
    const lines = [
        '/**',
        ' * Auto-generated bindings from Rust source',
        ' * Generated by philjs-wasm codegen',
        ' *',
        ' * DO NOT EDIT - Changes will be overwritten',
        ' */',
        '',
        "import type { WasmModule, RustSignal } from 'philjs-wasm';",
        "import {",
        `${indent}createWasmComponent,`,
        `${indent}createRustSignal,`,
        `${indent}createI32Signal,`,
        `${indent}createI64Signal,`,
        `${indent}createF32Signal,`,
        `${indent}createF64Signal,`,
        `${indent}createBoolSignal,`,
        `${indent}bindRustFunctions`,
        "} from 'philjs-wasm';",
        ''
    ];
    // Generate TypeScript types
    if (typescript) {
        lines.push('// =============================================================================');
        lines.push('// Type Definitions');
        lines.push('// =============================================================================');
        lines.push('');
        lines.push(generateTypeScriptTypes(module, { ...options, typeMapper }));
    }
    // Generate function wrappers
    const publicFunctions = module.functions.filter(fn => fn.isPublic || fn.hasWasmBindgen);
    if (publicFunctions.length > 0) {
        lines.push('// =============================================================================');
        lines.push('// Function Wrappers');
        lines.push('// =============================================================================');
        lines.push('');
        // Generate factory function that takes module
        lines.push('export function createBindings(wasmModule: WasmModule) {');
        lines.push(`${indent}const exports = wasmModule.exports;`);
        lines.push('');
        for (const fn of publicFunctions) {
            const params = fn.params
                .filter(p => !p.isSelf)
                .map(p => `${p.name}: ${typeMapper.mapType(p.type)}`)
                .join(', ');
            const returnType = fn.returnType
                ? typeMapper.mapType(fn.returnType)
                : 'void';
            const argList = fn.params
                .filter(p => !p.isSelf)
                .map(p => p.name)
                .join(', ');
            const asyncKeyword = fn.isAsync ? 'async ' : '';
            const awaitKeyword = fn.isAsync ? 'await ' : '';
            lines.push(`${indent}function ${fn.name}(${params}): ${returnType} {`);
            if (fn.returnType?.isResult) {
                lines.push(`${indent}${indent}try {`);
                lines.push(`${indent}${indent}${indent}return ${awaitKeyword}(exports.${fn.rustName} as Function)(${argList});`);
                lines.push(`${indent}${indent}} catch (e) {`);
                lines.push(`${indent}${indent}${indent}throw new Error(\`${fn.rustName} failed: \${e}\`);`);
                lines.push(`${indent}${indent}}`);
            }
            else {
                const returnKeyword = fn.returnType ? 'return ' : '';
                lines.push(`${indent}${indent}${returnKeyword}${awaitKeyword}(exports.${fn.rustName} as Function)(${argList});`);
            }
            lines.push(`${indent}}`);
            lines.push('');
        }
        lines.push(`${indent}return {`);
        for (const fn of publicFunctions) {
            lines.push(`${indent}${indent}${fn.name},`);
        }
        lines.push(`${indent}};`);
        lines.push('}');
        lines.push('');
    }
    // Generate component bindings
    if (philjs) {
        const componentStructs = module.structs.filter(s => s.hasWasmBindgen || s.derives?.includes('Component'));
        if (componentStructs.length > 0) {
            lines.push('// =============================================================================');
            lines.push('// Component Bindings');
            lines.push('// =============================================================================');
            lines.push('');
            for (const struct of componentStructs) {
                // Find impl methods for this struct
                const implMethods = module.impls
                    .filter(impl => impl.targetType === struct.rustName)
                    .flatMap(impl => impl.methods);
                lines.push(generateComponentBinding(struct, implMethods, { ...options, typeMapper }));
                lines.push('');
            }
        }
    }
    // Generate signal bindings
    if (signals) {
        const signalStructs = module.structs.filter(s => s.hasWasmBindgen && s.fields.some(f => f.isPublic));
        if (signalStructs.length > 0) {
            lines.push('// =============================================================================');
            lines.push('// Signal Bindings');
            lines.push('// =============================================================================');
            lines.push('');
            for (const struct of signalStructs) {
                lines.push(generateSignalBinding(struct, { ...options, typeMapper }));
                lines.push('');
            }
        }
    }
    return lines.join('\n');
}
//# sourceMappingURL=codegen.js.map