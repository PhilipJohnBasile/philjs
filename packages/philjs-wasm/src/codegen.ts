/**
 * PhilJS WASM Code Generator
 *
 * Generates JavaScript/TypeScript bindings from Rust source files.
 * Competes directly with Dioxus's code generation capabilities.
 */

// ============================================================================
// Rust Type Definitions
// ============================================================================

/**
 * Parsed Rust type
 */
export interface RustType {
  /** The raw type string */
  raw: string;
  /** The base type name */
  name: string;
  /** Generic parameters if any */
  generics?: RustType[];
  /** Whether the type is a reference */
  isReference?: boolean;
  /** Whether the type is mutable */
  isMutable?: boolean;
  /** Lifetime if present */
  lifetime?: string;
  /** Whether the type is optional (Option<T>) */
  isOptional?: boolean;
  /** Whether the type is a Result */
  isResult?: boolean;
}

/**
 * Parsed Rust function
 */
export interface RustFunction {
  /** Function name */
  name: string;
  /** Original Rust name (before transformation) */
  rustName: string;
  /** Function documentation */
  doc?: string;
  /** Whether the function is async */
  isAsync: boolean;
  /** Whether the function is public */
  isPublic: boolean;
  /** Whether it has #[wasm_bindgen] */
  hasWasmBindgen: boolean;
  /** wasm_bindgen attributes */
  wasmBindgenAttrs?: WasmBindgenAttrs;
  /** Function parameters */
  params: RustParam[];
  /** Return type */
  returnType?: RustType;
  /** Generic type parameters */
  generics?: string[];
}

/**
 * Parsed Rust parameter
 */
export interface RustParam {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: RustType;
  /** Whether the parameter is self */
  isSelf?: boolean;
  /** Whether the parameter is mutable self */
  isMutSelf?: boolean;
}

/**
 * Parsed Rust struct
 */
export interface RustStruct {
  /** Struct name */
  name: string;
  /** Original Rust name */
  rustName: string;
  /** Struct documentation */
  doc?: string;
  /** Whether the struct is public */
  isPublic: boolean;
  /** Whether it has #[wasm_bindgen] */
  hasWasmBindgen: boolean;
  /** wasm_bindgen attributes */
  wasmBindgenAttrs?: WasmBindgenAttrs;
  /** Struct fields */
  fields: RustField[];
  /** Generic type parameters */
  generics?: string[];
  /** Derived traits */
  derives?: string[];
}

/**
 * Parsed Rust field
 */
export interface RustField {
  /** Field name */
  name: string;
  /** Field type */
  type: RustType;
  /** Whether the field is public */
  isPublic: boolean;
  /** Field documentation */
  doc?: string;
  /** Getter attribute from wasm_bindgen */
  hasGetter?: boolean;
  /** Setter attribute from wasm_bindgen */
  hasSetter?: boolean;
}

/**
 * Parsed Rust enum
 */
export interface RustEnum {
  /** Enum name */
  name: string;
  /** Original Rust name */
  rustName: string;
  /** Enum documentation */
  doc?: string;
  /** Whether the enum is public */
  isPublic: boolean;
  /** Whether it has #[wasm_bindgen] */
  hasWasmBindgen: boolean;
  /** wasm_bindgen attributes */
  wasmBindgenAttrs?: WasmBindgenAttrs;
  /** Enum variants */
  variants: RustEnumVariant[];
  /** Generic type parameters */
  generics?: string[];
}

/**
 * Parsed Rust enum variant
 */
export interface RustEnumVariant {
  /** Variant name */
  name: string;
  /** Variant documentation */
  doc?: string;
  /** Tuple fields for tuple variants */
  tupleFields?: RustType[];
  /** Struct fields for struct variants */
  structFields?: RustField[];
  /** Discriminant value if specified */
  discriminant?: number | string;
}

/**
 * wasm_bindgen attribute options
 */
export interface WasmBindgenAttrs {
  /** JavaScript name override */
  jsName?: string;
  /** TypeScript type override */
  typescript_type?: string;
  /** Constructor marker */
  isConstructor?: boolean;
  /** Method marker */
  method?: boolean;
  /** Getter marker */
  getter?: boolean;
  /** Setter marker */
  setter?: boolean;
  /** Catch attribute for Result */
  catch?: boolean;
  /** Skip attribute */
  skip?: boolean;
  /** Final attribute */
  final?: boolean;
  /** Structural attribute */
  structural?: boolean;
  /** Module name */
  module?: string;
}

/**
 * Parsed Rust module
 */
export interface RustModule {
  /** Module name */
  name?: string;
  /** Module documentation */
  doc?: string;
  /** Functions in the module */
  functions: RustFunction[];
  /** Structs in the module */
  structs: RustStruct[];
  /** Enums in the module */
  enums: RustEnum[];
  /** Type aliases */
  typeAliases: Map<string, RustType>;
  /** Impl blocks */
  impls: RustImpl[];
}

/**
 * Parsed Rust impl block
 */
export interface RustImpl {
  /** Type being implemented */
  targetType: string;
  /** Trait being implemented (if any) */
  trait?: string;
  /** Methods in the impl */
  methods: RustFunction[];
  /** Generic type parameters */
  generics?: string[];
}

// ============================================================================
// Rust to JS Type Mapper
// ============================================================================

/**
 * Map Rust types to JavaScript/TypeScript types
 */
export class RustToJSMapper {
  private customMappings: Map<string, string> = new Map();

  constructor(customMappings?: Record<string, string>) {
    if (customMappings) {
      for (const [rust, js] of Object.entries(customMappings)) {
        this.customMappings.set(rust, js);
      }
    }
  }

  /**
   * Add a custom type mapping
   */
  addMapping(rustType: string, jsType: string): void {
    this.customMappings.set(rustType, jsType);
  }

  /**
   * Map a Rust type to TypeScript
   */
  mapType(rustType: RustType): string {
    // Check custom mappings first
    if (this.customMappings.has(rustType.name)) {
      return this.customMappings.get(rustType.name)!;
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
      if (match) {
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
  mapTypeString(typeStr: string): string {
    const parsed = parseRustType(typeStr);
    return this.mapType(parsed);
  }

  /**
   * Map Rust primitive types to TypeScript
   */
  private mapPrimitiveType(name: string): string {
    const primitives: Record<string, string> = {
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
export function parseRustType(typeStr: string): RustType {
  let str = typeStr.trim();

  // Handle references
  let isReference = false;
  let isMutable = false;
  let lifetime: string | undefined;

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
  let generics: RustType[] | undefined;

  const genericStart = str.indexOf('<');
  if (genericStart > 0) {
    name = str.slice(0, genericStart);
    const genericStr = str.slice(genericStart + 1, findMatchingBracket(str, genericStart));
    generics = splitGenericParams(genericStr).map(g => parseRustType(g.trim()));
  }

  return {
    raw: typeStr,
    name,
    generics,
    isReference,
    isMutable,
    lifetime,
    isOptional,
    isResult
  };
}

/**
 * Find the matching closing bracket
 */
function findMatchingBracket(str: string, openPos: number): number {
  let depth = 1;
  for (let i = openPos + 1; i < str.length; i++) {
    if (str[i] === '<') depth++;
    else if (str[i] === '>') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return str.length;
}

/**
 * Split generic parameters, respecting nested brackets
 */
function splitGenericParams(str: string): string[] {
  const params: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of str) {
    if (char === '<') depth++;
    else if (char === '>') depth--;
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
function parseWasmBindgenAttrs(attrStr: string): WasmBindgenAttrs {
  const attrs: WasmBindgenAttrs = {};

  // Handle simple marker
  if (!attrStr || attrStr === 'wasm_bindgen') {
    return attrs;
  }

  // Extract content between parentheses
  const match = attrStr.match(/wasm_bindgen\s*\(([^)]*)\)/);
  if (!match) return attrs;

  const content = match[1];
  const parts = content.split(',').map(p => p.trim());

  for (const part of parts) {
    if (part.includes('=')) {
      const [key, value] = part.split('=').map(s => s.trim());
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
    } else {
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
function extractDocComment(lines: string[], endIndex: number): string | undefined {
  const docLines: string[] = [];
  let i = endIndex - 1;

  while (i >= 0) {
    const line = lines[i].trim();
    if (line.startsWith('///')) {
      docLines.unshift(line.slice(3).trim());
      i--;
    } else if (line.startsWith('#[')) {
      // Skip attributes
      i--;
    } else if (line === '') {
      i--;
    } else {
      break;
    }
  }

  return docLines.length > 0 ? docLines.join('\n') : undefined;
}

/**
 * Parse a Rust function signature
 */
function parseRustFunction(signature: string, attrs: string[] = []): RustFunction | null {
  // Extract wasm_bindgen attributes
  let hasWasmBindgen = false;
  let wasmBindgenAttrs: WasmBindgenAttrs | undefined;

  for (const attr of attrs) {
    if (attr.includes('wasm_bindgen')) {
      hasWasmBindgen = true;
      wasmBindgenAttrs = parseWasmBindgenAttrs(attr);
    }
  }

  // Match function signature
  const fnMatch = signature.match(
    /^(pub\s+)?(async\s+)?fn\s+(\w+)(<[^>]+>)?\s*\(([^)]*)\)(\s*->\s*(.+?))?(?:\s*where\s+.+)?$/s
  );

  if (!fnMatch) return null;

  const [, pubMarker, asyncMarker, name, genericsStr, paramsStr, , returnTypeStr] = fnMatch;

  // Parse parameters
  const params: RustParam[] = [];
  if (paramsStr.trim()) {
    const paramParts = splitParams(paramsStr);
    for (const param of paramParts) {
      const trimmed = param.trim();

      if (trimmed === 'self') {
        params.push({ name: 'self', type: { raw: 'Self', name: 'Self' }, isSelf: true });
      } else if (trimmed === '&self') {
        params.push({ name: 'self', type: { raw: '&Self', name: 'Self', isReference: true }, isSelf: true });
      } else if (trimmed === '&mut self') {
        params.push({ name: 'self', type: { raw: '&mut Self', name: 'Self', isReference: true, isMutable: true }, isSelf: true, isMutSelf: true });
      } else {
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
  let generics: string[] | undefined;
  if (genericsStr) {
    generics = genericsStr.slice(1, -1).split(',').map(g => g.trim());
  }

  // Determine JS name
  const jsName = wasmBindgenAttrs?.jsName || snakeToCamel(name);

  return {
    name: jsName,
    rustName: name,
    isAsync: !!asyncMarker,
    isPublic: !!pubMarker,
    hasWasmBindgen,
    wasmBindgenAttrs,
    params,
    returnType: returnTypeStr ? parseRustType(returnTypeStr.trim()) : undefined,
    generics
  };
}

/**
 * Split function parameters, respecting nested brackets
 */
function splitParams(str: string): string[] {
  const params: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of str) {
    if (char === '<' || char === '(' || char === '[' || char === '{') depth++;
    else if (char === '>' || char === ')' || char === ']' || char === '}') depth--;
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
function parseRustStruct(code: string, attrs: string[] = []): RustStruct | null {
  // Extract wasm_bindgen attributes
  let hasWasmBindgen = false;
  let wasmBindgenAttrs: WasmBindgenAttrs | undefined;
  let derives: string[] = [];

  for (const attr of attrs) {
    if (attr.includes('wasm_bindgen')) {
      hasWasmBindgen = true;
      wasmBindgenAttrs = parseWasmBindgenAttrs(attr);
    }
    if (attr.includes('derive')) {
      const deriveMatch = attr.match(/derive\s*\(([^)]+)\)/);
      if (deriveMatch) {
        derives = deriveMatch[1].split(',').map(d => d.trim());
      }
    }
  }

  // Match struct signature
  const structMatch = code.match(
    /^(pub\s+)?struct\s+(\w+)(<[^>]+>)?(?:\s*where\s+[^{]+)?\s*\{/
  );

  if (!structMatch) {
    // Try unit struct or tuple struct
    const unitMatch = code.match(/^(pub\s+)?struct\s+(\w+)(<[^>]+>)?\s*;/);
    if (unitMatch) {
      const [, pubMarker, name, genericsStr] = unitMatch;
      return {
        name: wasmBindgenAttrs?.jsName || name,
        rustName: name,
        isPublic: !!pubMarker,
        hasWasmBindgen,
        wasmBindgenAttrs,
        fields: [],
        generics: genericsStr ? genericsStr.slice(1, -1).split(',').map(g => g.trim()) : undefined,
        derives
      };
    }
    return null;
  }

  const [, pubMarker, name, genericsStr] = structMatch;

  // Parse fields
  const fieldsStart = code.indexOf('{') + 1;
  const fieldsEnd = findMatchingBrace(code, code.indexOf('{'));
  const fieldsStr = code.slice(fieldsStart, fieldsEnd);

  const fields: RustField[] = [];
  const fieldLines = fieldsStr.split('\n');
  let currentDoc = '';
  let currentAttrs: string[] = [];

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

      let hasGetter = false;
      let hasSetter = false;

      for (const attr of currentAttrs) {
        if (attr.includes('wasm_bindgen') && attr.includes('getter')) hasGetter = true;
        if (attr.includes('wasm_bindgen') && attr.includes('setter')) hasSetter = true;
      }

      fields.push({
        name: fieldName,
        type: parseRustType(fieldType),
        isPublic: !!fieldPub,
        doc: currentDoc || undefined,
        hasGetter,
        hasSetter
      });

      currentDoc = '';
      currentAttrs = [];
    }
  }

  return {
    name: wasmBindgenAttrs?.jsName || name,
    rustName: name,
    isPublic: !!pubMarker,
    hasWasmBindgen,
    wasmBindgenAttrs,
    fields,
    generics: genericsStr ? genericsStr.slice(1, -1).split(',').map(g => g.trim()) : undefined,
    derives
  };
}

/**
 * Find matching closing brace
 */
function findMatchingBrace(str: string, openPos: number): number {
  let depth = 1;
  for (let i = openPos + 1; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return str.length;
}

/**
 * Parse a Rust enum
 */
function parseRustEnum(code: string, attrs: string[] = []): RustEnum | null {
  // Extract wasm_bindgen attributes
  let hasWasmBindgen = false;
  let wasmBindgenAttrs: WasmBindgenAttrs | undefined;

  for (const attr of attrs) {
    if (attr.includes('wasm_bindgen')) {
      hasWasmBindgen = true;
      wasmBindgenAttrs = parseWasmBindgenAttrs(attr);
    }
  }

  // Match enum signature
  const enumMatch = code.match(
    /^(pub\s+)?enum\s+(\w+)(<[^>]+>)?\s*\{/
  );

  if (!enumMatch) return null;

  const [, pubMarker, name, genericsStr] = enumMatch;

  // Parse variants
  const variantsStart = code.indexOf('{') + 1;
  const variantsEnd = findMatchingBrace(code, code.indexOf('{'));
  const variantsStr = code.slice(variantsStart, variantsEnd);

  const variants: RustEnumVariant[] = [];
  const variantLines = variantsStr.split('\n');
  let currentDoc = '';

  for (const line of variantLines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('///')) {
      currentDoc += (currentDoc ? '\n' : '') + trimmed.slice(3).trim();
      continue;
    }

    if (!trimmed || trimmed.startsWith('#[')) continue;

    // Parse variant - handle unit, tuple, and struct variants
    const unitMatch = trimmed.match(/^(\w+)\s*(?:=\s*(\d+))?\s*,?\s*$/);
    const tupleMatch = trimmed.match(/^(\w+)\s*\(([^)]+)\)\s*,?\s*$/);
    const structMatch = trimmed.match(/^(\w+)\s*\{([^}]+)\}\s*,?\s*$/);

    if (tupleMatch) {
      const [, variantName, fieldsStr] = tupleMatch;
      variants.push({
        name: variantName,
        doc: currentDoc || undefined,
        tupleFields: fieldsStr.split(',').map(f => parseRustType(f.trim()))
      });
      currentDoc = '';
    } else if (structMatch) {
      const [, variantName, fieldsStr] = structMatch;
      const structFields: RustField[] = [];
      for (const field of fieldsStr.split(',')) {
        const match = field.trim().match(/(\w+)\s*:\s*(.+)/);
        if (match) {
          structFields.push({
            name: match[1],
            type: parseRustType(match[2]),
            isPublic: true
          });
        }
      }
      variants.push({
        name: variantName,
        doc: currentDoc || undefined,
        structFields
      });
      currentDoc = '';
    } else if (unitMatch) {
      const [, variantName, discriminant] = unitMatch;
      variants.push({
        name: variantName,
        doc: currentDoc || undefined,
        discriminant: discriminant ? parseInt(discriminant) : undefined
      });
      currentDoc = '';
    }
  }

  return {
    name: wasmBindgenAttrs?.jsName || name,
    rustName: name,
    isPublic: !!pubMarker,
    hasWasmBindgen,
    wasmBindgenAttrs,
    variants,
    generics: genericsStr ? genericsStr.slice(1, -1).split(',').map(g => g.trim()) : undefined
  };
}

/**
 * Parse a complete Rust module
 */
export function parseRustModule(code: string): RustModule {
  const module: RustModule = {
    functions: [],
    structs: [],
    enums: [],
    typeAliases: new Map(),
    impls: []
  };

  // Remove block comments
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');

  const lines = code.split('\n');
  let currentAttrs: string[] = [];
  let currentDoc = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

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
        signature += ' ' + lines[i].trim();
      }
      // Remove the body
      signature = signature.replace(/\s*\{[\s\S]*$/, '').replace(/\s*;[\s\S]*$/, '');

      const fn = parseRustFunction(signature, currentAttrs);
      if (fn) {
        fn.doc = currentDoc || undefined;
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
      let braceDepth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

      while ((braceDepth > 0 || !structCode.includes('{')) && i < lines.length - 1) {
        i++;
        structCode += '\n' + lines[i];
        braceDepth += (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
      }

      const struct = parseRustStruct(structCode, currentAttrs);
      if (struct) {
        struct.doc = currentDoc || undefined;
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
      let braceDepth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

      while ((braceDepth > 0 || !enumCode.includes('{')) && i < lines.length - 1) {
        i++;
        enumCode += '\n' + lines[i];
        braceDepth += (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
      }

      const enumDef = parseRustEnum(enumCode, currentAttrs);
      if (enumDef) {
        enumDef.doc = currentDoc || undefined;
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
      if (typeMatch) {
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
      let braceDepth = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

      while ((braceDepth > 0 || !implCode.includes('{')) && i < lines.length - 1) {
        i++;
        implCode += '\n' + lines[i];
        braceDepth += (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
      }

      // Parse impl header
      const implMatch = implCode.match(/^impl\s+(?:(<[^>]+>)\s+)?(?:(\w+)\s+for\s+)?(\w+)/);
      if (implMatch) {
        const [, genericsStr, traitName, typeName] = implMatch;

        // Parse methods in impl
        const methods: RustFunction[] = [];
        const implBody = implCode.slice(implCode.indexOf('{') + 1, findMatchingBrace(implCode, implCode.indexOf('{')));
        const methodMatches = implBody.matchAll(/((?:#\[.*?\]\s*)*)(?:pub\s+)?(?:async\s+)?fn\s+\w+[^{;]+/g);

        for (const match of methodMatches) {
          const attrs = match[1] ? match[1].split('#[').filter(a => a).map(a => '#[' + a.trim()) : [];
          const fn = parseRustFunction(match[0].trim(), attrs);
          if (fn) methods.push(fn);
        }

        module.impls.push({
          targetType: typeName,
          trait: traitName,
          methods,
          generics: genericsStr ? genericsStr.slice(1, -1).split(',').map(g => g.trim()) : undefined
        });
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

// ============================================================================
// Code Generation
// ============================================================================

/**
 * Options for code generation
 */
export interface CodegenOptions {
  /** Whether to generate TypeScript types */
  typescript?: boolean;
  /** Whether to generate JSDoc comments */
  jsdoc?: boolean;
  /** Custom type mapper */
  typeMapper?: RustToJSMapper;
  /** Module name for imports */
  moduleName?: string;
  /** Whether to generate PhilJS component bindings */
  philjs?: boolean;
  /** Whether to generate signal bindings */
  signals?: boolean;
  /** Indentation (default: 2 spaces) */
  indent?: string;
}

/**
 * Convert snake_case to camelCase
 */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert snake_case to PascalCase
 */
function snakeToPascal(str: string): string {
  const camel = snakeToCamel(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Generate TypeScript types from Rust types
 */
export function generateTypeScriptTypes(
  module: RustModule,
  options: CodegenOptions = {}
): string {
  const {
    typeMapper = new RustToJSMapper(),
    jsdoc = true,
    indent = '  '
  } = options;

  const lines: string[] = [
    '// Auto-generated TypeScript types from Rust',
    '// Generated by philjs-wasm codegen',
    ''
  ];

  // Generate struct interfaces
  for (const struct of module.structs) {
    if (!struct.isPublic && !struct.hasWasmBindgen) continue;

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
      if (!field.isPublic && !struct.hasWasmBindgen) continue;

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
    if (!enumDef.isPublic && !enumDef.hasWasmBindgen) continue;

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
    } else {
      // Generate as discriminated union
      const variants: string[] = [];
      for (const variant of enumDef.variants) {
        if (variant.tupleFields) {
          const fields = variant.tupleFields.map((t, i) =>
            `_${i}: ${typeMapper.mapType(t)}`
          ).join('; ');
          variants.push(`{ type: '${variant.name}'; ${fields} }`);
        } else if (variant.structFields) {
          const fields = variant.structFields.map(f =>
            `${f.name}: ${typeMapper.mapType(f.type)}`
          ).join('; ');
          variants.push(`{ type: '${variant.name}'; ${fields} }`);
        } else {
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
export function generateJSWrapper(
  fn: RustFunction,
  options: CodegenOptions = {}
): string {
  const {
    typeMapper = new RustToJSMapper(),
    jsdoc = true,
    indent = '  ',
    moduleName = 'wasmModule'
  } = options;

  const lines: string[] = [];

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
  } else {
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
export function generateComponentBinding(
  struct: RustStruct,
  methods: RustFunction[] = [],
  options: CodegenOptions = {}
): string {
  const {
    typeMapper = new RustToJSMapper(),
    jsdoc = true,
    indent = '  ',
    moduleName = 'wasmModule'
  } = options;

  const lines: string[] = [
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
      if (!method.params.some(p => p.isSelf)) continue;

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
export function generateSignalBinding(
  struct: RustStruct,
  options: CodegenOptions = {}
): string {
  const {
    typeMapper = new RustToJSMapper(),
    indent = '  ',
    moduleName = 'wasmModule'
  } = options;

  const lines: string[] = [
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
    if (!field.isPublic) continue;

    const tsType = typeMapper.mapType(field.type);
    const signalCreator = getSignalCreatorForType(field.type);

    lines.push(`${indent}signals.${field.name} = ${signalCreator}(module, initialValues.${field.name});`);
  }

  lines.push('');
  lines.push(`${indent}return signals as {`);
  for (const field of struct.fields) {
    if (!field.isPublic) continue;
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
function getSignalCreatorForType(type: RustType): string {
  const name = type.name;

  if (name === 'i32' || name === 'u32') return 'createI32Signal';
  if (name === 'i64' || name === 'u64') return 'createI64Signal';
  if (name === 'f32') return 'createF32Signal';
  if (name === 'f64') return 'createF64Signal';
  if (name === 'bool') return 'createBoolSignal';

  return 'createRustSignal';
}

/**
 * Generate all bindings from a Rust file
 */
export function generateBindings(
  rustCode: string,
  options: CodegenOptions = {}
): string {
  const {
    typescript = true,
    philjs = true,
    signals = true,
    indent = '  '
  } = options;

  const module = parseRustModule(rustCode);
  const typeMapper = options.typeMapper || new RustToJSMapper();

  const lines: string[] = [
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
  const publicFunctions = module.functions.filter(
    fn => fn.isPublic || fn.hasWasmBindgen
  );

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
      } else {
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
    const componentStructs = module.structs.filter(
      s => s.hasWasmBindgen || s.derives?.includes('Component')
    );

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
    const signalStructs = module.structs.filter(
      s => s.hasWasmBindgen && s.fields.some(f => f.isPublic)
    );

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

// ============================================================================
// CLI Support Types
// ============================================================================

/**
 * Options for the CLI codegen command
 */
export interface CodegenCLIOptions {
  /** Input Rust file path */
  input: string;
  /** Output file path (default: input with .ts extension) */
  output?: string;
  /** Watch mode */
  watch?: boolean;
  /** Generate TypeScript types */
  typescript?: boolean;
  /** Generate PhilJS component bindings */
  philjs?: boolean;
  /** Generate signal bindings */
  signals?: boolean;
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Result of code generation
 */
export interface CodegenResult {
  /** Whether generation succeeded */
  success: boolean;
  /** Output file path */
  outputPath?: string;
  /** Generated code */
  code?: string;
  /** Error message if failed */
  error?: string;
  /** Warnings during generation */
  warnings?: string[];
  /** Statistics about generated code */
  stats?: {
    functions: number;
    structs: number;
    enums: number;
    typeAliases: number;
  };
}
