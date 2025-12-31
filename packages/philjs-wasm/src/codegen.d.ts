/**
 * PhilJS WASM Code Generator
 *
 * Generates JavaScript/TypeScript bindings from Rust source files.
 * Competes directly with Dioxus's code generation capabilities.
 */
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
/**
 * Map Rust types to JavaScript/TypeScript types
 */
export declare class RustToJSMapper {
    private customMappings;
    constructor(customMappings?: Record<string, string>);
    /**
     * Add a custom type mapping
     */
    addMapping(rustType: string, jsType: string): void;
    /**
     * Map a Rust type to TypeScript
     */
    mapType(rustType: RustType): string;
    /**
     * Map a type string to TypeScript
     */
    mapTypeString(typeStr: string): string;
    /**
     * Map Rust primitive types to TypeScript
     */
    private mapPrimitiveType;
}
/**
 * Parse a Rust type string into a RustType
 */
export declare function parseRustType(typeStr: string): RustType;
/**
 * Parse a complete Rust module
 */
export declare function parseRustModule(code: string): RustModule;
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
 * Generate TypeScript types from Rust types
 */
export declare function generateTypeScriptTypes(module: RustModule, options?: CodegenOptions): string;
/**
 * Generate JS wrapper for a Rust function
 */
export declare function generateJSWrapper(fn: RustFunction, options?: CodegenOptions): string;
/**
 * Generate PhilJS component binding from a Rust struct
 */
export declare function generateComponentBinding(struct: RustStruct, methods?: RustFunction[], options?: CodegenOptions): string;
/**
 * Generate signal bindings for a Rust struct
 */
export declare function generateSignalBinding(struct: RustStruct, options?: CodegenOptions): string;
/**
 * Generate all bindings from a Rust file
 */
export declare function generateBindings(rustCode: string, options?: CodegenOptions): string;
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
//# sourceMappingURL=codegen.d.ts.map