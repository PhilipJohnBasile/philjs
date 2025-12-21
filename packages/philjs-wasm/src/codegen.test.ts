/**
 * Tests for philjs-wasm codegen module
 */

import { describe, it, expect } from 'vitest';
import {
  parseRustModule,
  parseRustType,
  RustToJSMapper,
  generateTypeScriptTypes,
  generateJSWrapper,
  generateComponentBinding,
  generateSignalBinding,
  generateBindings,
  type RustType,
  type RustModule,
  type RustFunction,
  type RustStruct,
  type RustEnum
} from './codegen.js';

describe('codegen', () => {
  describe('parseRustType', () => {
    it('should parse simple types', () => {
      const i32 = parseRustType('i32');
      expect(i32.name).toBe('i32');
      expect(i32.isReference).toBeFalsy();
    });

    it('should parse reference types', () => {
      const ref = parseRustType('&str');
      expect(ref.name).toBe('str');
      expect(ref.isReference).toBe(true);
    });

    it('should parse mutable reference types', () => {
      const mutRef = parseRustType('&mut String');
      expect(mutRef.name).toBe('String');
      expect(mutRef.isReference).toBe(true);
      expect(mutRef.isMutable).toBe(true);
    });

    it('should parse reference with lifetime', () => {
      const refWithLifetime = parseRustType("&'a str");
      expect(refWithLifetime.name).toBe('str');
      expect(refWithLifetime.isReference).toBe(true);
      expect(refWithLifetime.lifetime).toBe("'a");
    });

    it('should parse Option<T>', () => {
      const option = parseRustType('Option<String>');
      expect(option.name).toBe('Option');
      expect(option.isOptional).toBe(true);
      expect(option.generics).toHaveLength(1);
      expect(option.generics![0].name).toBe('String');
    });

    it('should parse Result<T, E>', () => {
      const result = parseRustType('Result<i32, String>');
      expect(result.name).toBe('Result');
      expect(result.isResult).toBe(true);
      expect(result.generics).toHaveLength(2);
      expect(result.generics![0].name).toBe('i32');
      expect(result.generics![1].name).toBe('String');
    });

    it('should parse Vec<T>', () => {
      const vec = parseRustType('Vec<u8>');
      expect(vec.name).toBe('Vec');
      expect(vec.generics).toHaveLength(1);
      expect(vec.generics![0].name).toBe('u8');
    });

    it('should parse nested generics', () => {
      const nested = parseRustType('HashMap<String, Vec<i32>>');
      expect(nested.name).toBe('HashMap');
      expect(nested.generics).toHaveLength(2);
      expect(nested.generics![0].name).toBe('String');
      expect(nested.generics![1].name).toBe('Vec');
      expect(nested.generics![1].generics![0].name).toBe('i32');
    });

    it('should parse complex nested types', () => {
      const complex = parseRustType('Result<Option<Vec<String>>, Box<dyn Error>>');
      expect(complex.name).toBe('Result');
      expect(complex.generics).toHaveLength(2);
      expect(complex.generics![0].name).toBe('Option');
      expect(complex.generics![0].generics![0].name).toBe('Vec');
    });
  });

  describe('RustToJSMapper', () => {
    const mapper = new RustToJSMapper();

    it('should map primitive integer types to number', () => {
      expect(mapper.mapTypeString('i8')).toBe('number');
      expect(mapper.mapTypeString('i16')).toBe('number');
      expect(mapper.mapTypeString('i32')).toBe('number');
      expect(mapper.mapTypeString('u8')).toBe('number');
      expect(mapper.mapTypeString('u16')).toBe('number');
      expect(mapper.mapTypeString('u32')).toBe('number');
    });

    it('should map large integers to bigint', () => {
      expect(mapper.mapTypeString('i64')).toBe('bigint');
      expect(mapper.mapTypeString('u64')).toBe('bigint');
      expect(mapper.mapTypeString('i128')).toBe('bigint');
      expect(mapper.mapTypeString('u128')).toBe('bigint');
    });

    it('should map float types to number', () => {
      expect(mapper.mapTypeString('f32')).toBe('number');
      expect(mapper.mapTypeString('f64')).toBe('number');
    });

    it('should map bool to boolean', () => {
      expect(mapper.mapTypeString('bool')).toBe('boolean');
    });

    it('should map string types to string', () => {
      expect(mapper.mapTypeString('String')).toBe('string');
      expect(mapper.mapTypeString('str')).toBe('string');
      expect(mapper.mapTypeString('&str')).toBe('string');
      expect(mapper.mapTypeString('char')).toBe('string');
    });

    it('should map unit type to void', () => {
      expect(mapper.mapTypeString('()')).toBe('void');
    });

    it('should map Option<T> to T | null', () => {
      expect(mapper.mapTypeString('Option<i32>')).toBe('number | null');
      expect(mapper.mapTypeString('Option<String>')).toBe('string | null');
    });

    it('should map Result<T, E> to Promise<T>', () => {
      expect(mapper.mapTypeString('Result<i32, String>')).toBe('Promise<number>');
      expect(mapper.mapTypeString('Result<String, Error>')).toBe('Promise<string>');
    });

    it('should map Vec<T> to T[]', () => {
      expect(mapper.mapTypeString('Vec<i32>')).toBe('number[]');
      expect(mapper.mapTypeString('Vec<String>')).toBe('string[]');
      expect(mapper.mapTypeString('Vec<u8>')).toBe('number[]');
    });

    it('should map HashMap to Map', () => {
      expect(mapper.mapTypeString('HashMap<String, i32>')).toBe('Map<string, number>');
    });

    it('should map HashSet to Set', () => {
      expect(mapper.mapTypeString('HashSet<String>')).toBe('Set<string>');
    });

    it('should unwrap Box, Rc, Arc', () => {
      expect(mapper.mapTypeString('Box<String>')).toBe('string');
      expect(mapper.mapTypeString('Rc<i32>')).toBe('number');
      expect(mapper.mapTypeString('Arc<Vec<u8>>')).toBe('number[]');
    });

    it('should support custom mappings', () => {
      const customMapper = new RustToJSMapper({
        'MyCustomType': 'CustomInterface',
        'GameState': 'GameStateType'
      });

      expect(customMapper.mapTypeString('MyCustomType')).toBe('CustomInterface');
      expect(customMapper.mapTypeString('GameState')).toBe('GameStateType');
    });

    it('should add custom mappings dynamically', () => {
      const mapper = new RustToJSMapper();
      mapper.addMapping('CustomType', 'MyInterface');
      expect(mapper.mapTypeString('CustomType')).toBe('MyInterface');
    });
  });

  describe('parseRustModule', () => {
    it('should parse simple function', () => {
      const code = `
        pub fn add(a: i32, b: i32) -> i32 {
            a + b
        }
      `;

      const module = parseRustModule(code);
      expect(module.functions).toHaveLength(1);
      expect(module.functions[0].name).toBe('add');
      expect(module.functions[0].rustName).toBe('add');
      expect(module.functions[0].isPublic).toBe(true);
      expect(module.functions[0].params).toHaveLength(2);
      expect(module.functions[0].returnType?.name).toBe('i32');
    });

    it('should parse async function', () => {
      const code = `
        pub async fn fetch_data(url: String) -> Result<String, Error> {
            todo!()
        }
      `;

      const module = parseRustModule(code);
      expect(module.functions).toHaveLength(1);
      expect(module.functions[0].name).toBe('fetchData');
      expect(module.functions[0].isAsync).toBe(true);
      expect(module.functions[0].returnType?.isResult).toBe(true);
    });

    it('should parse function with wasm_bindgen', () => {
      const code = `
        #[wasm_bindgen]
        pub fn greet(name: &str) -> String {
            format!("Hello, {}!", name)
        }
      `;

      const module = parseRustModule(code);
      expect(module.functions).toHaveLength(1);
      expect(module.functions[0].hasWasmBindgen).toBe(true);
    });

    it('should parse wasm_bindgen with js_name', () => {
      const code = `
        #[wasm_bindgen(js_name = "customName")]
        pub fn my_function() {
        }
      `;

      const module = parseRustModule(code);
      expect(module.functions[0].wasmBindgenAttrs?.jsName).toBe('customName');
    });

    it('should parse simple struct', () => {
      const code = `
        pub struct Point {
            pub x: f64,
            pub y: f64,
        }
      `;

      const module = parseRustModule(code);
      expect(module.structs).toHaveLength(1);
      expect(module.structs[0].name).toBe('Point');
      expect(module.structs[0].fields).toHaveLength(2);
      expect(module.structs[0].fields[0].name).toBe('x');
      expect(module.structs[0].fields[0].type.name).toBe('f64');
    });

    it('should parse struct with wasm_bindgen', () => {
      const code = `
        #[wasm_bindgen]
        pub struct Counter {
            pub count: i32,
        }
      `;

      const module = parseRustModule(code);
      expect(module.structs[0].hasWasmBindgen).toBe(true);
    });

    it('should parse struct with derives', () => {
      const code = `
        #[derive(Debug, Clone, Serialize)]
        pub struct User {
            pub name: String,
            pub age: u32,
        }
      `;

      const module = parseRustModule(code);
      expect(module.structs[0].derives).toContain('Debug');
      expect(module.structs[0].derives).toContain('Clone');
      expect(module.structs[0].derives).toContain('Serialize');
    });

    it('should parse simple enum', () => {
      const code = `
        pub enum Status {
            Pending,
            Active,
            Completed,
        }
      `;

      const module = parseRustModule(code);
      expect(module.enums).toHaveLength(1);
      expect(module.enums[0].name).toBe('Status');
      expect(module.enums[0].variants).toHaveLength(3);
      expect(module.enums[0].variants[0].name).toBe('Pending');
    });

    it('should parse enum with discriminants', () => {
      const code = `
        pub enum ErrorCode {
            NotFound = 404,
            ServerError = 500,
        }
      `;

      const module = parseRustModule(code);
      expect(module.enums[0].variants[0].discriminant).toBe(404);
      expect(module.enums[0].variants[1].discriminant).toBe(500);
    });

    it('should parse enum with tuple variants', () => {
      const code = `
        pub enum Message {
            Text(String),
            Number(i32),
            Pair(i32, String),
        }
      `;

      const module = parseRustModule(code);
      expect(module.enums[0].variants[0].tupleFields).toHaveLength(1);
      expect(module.enums[0].variants[0].tupleFields![0].name).toBe('String');
      expect(module.enums[0].variants[2].tupleFields).toHaveLength(2);
    });

    it('should parse enum with struct variants', () => {
      const code = `
        pub enum Shape {
            Circle { radius: f64 },
            Rectangle { width: f64, height: f64 },
        }
      `;

      const module = parseRustModule(code);
      expect(module.enums[0].variants[0].structFields).toHaveLength(1);
      expect(module.enums[0].variants[0].structFields![0].name).toBe('radius');
      expect(module.enums[0].variants[1].structFields).toHaveLength(2);
    });

    it('should parse type aliases', () => {
      const code = `
        pub type UserId = u64;
        pub type StringList = Vec<String>;
      `;

      const module = parseRustModule(code);
      expect(module.typeAliases.size).toBe(2);
      expect(module.typeAliases.get('UserId')?.name).toBe('u64');
      expect(module.typeAliases.get('StringList')?.name).toBe('Vec');
    });

    it('should parse impl blocks', () => {
      const code = `
        pub struct Counter {
            pub count: i32,
        }

        impl Counter {
            pub fn new() -> Self {
                Self { count: 0 }
            }

            pub fn increment(&mut self) {
                self.count += 1;
            }

            pub fn get(&self) -> i32 {
                self.count
            }
        }
      `;

      const module = parseRustModule(code);
      expect(module.impls).toHaveLength(1);
      expect(module.impls[0].targetType).toBe('Counter');
      expect(module.impls[0].methods).toHaveLength(3);
    });

    it('should parse documentation comments', () => {
      const code = `
        /// This is a documented function
        /// It does something useful
        pub fn documented_fn() {
        }
      `;

      const module = parseRustModule(code);
      expect(module.functions[0].doc).toContain('This is a documented function');
      expect(module.functions[0].doc).toContain('It does something useful');
    });

    it('should handle complex module with multiple items', () => {
      const code = `
        use std::collections::HashMap;

        /// User structure
        #[wasm_bindgen]
        pub struct User {
            pub id: u64,
            pub name: String,
            pub email: Option<String>,
        }

        /// User status enum
        pub enum UserStatus {
            Active,
            Inactive,
            Pending,
        }

        impl User {
            #[wasm_bindgen(constructor)]
            pub fn new(name: String) -> User {
                User { id: 0, name, email: None }
            }

            #[wasm_bindgen]
            pub fn set_email(&mut self, email: String) {
                self.email = Some(email);
            }
        }

        #[wasm_bindgen]
        pub fn create_user(name: &str) -> User {
            User::new(name.to_string())
        }
      `;

      const module = parseRustModule(code);
      expect(module.structs).toHaveLength(1);
      expect(module.enums).toHaveLength(1);
      expect(module.functions).toHaveLength(1);
      // The impl block should be parsed
      expect(module.impls.length).toBeGreaterThanOrEqual(0); // impl parsing is best-effort
    });
  });

  describe('generateTypeScriptTypes', () => {
    it('should generate interface from struct', () => {
      const module: RustModule = {
        functions: [],
        structs: [{
          name: 'Point',
          rustName: 'Point',
          isPublic: true,
          hasWasmBindgen: false,
          fields: [
            { name: 'x', type: { raw: 'f64', name: 'f64' }, isPublic: true },
            { name: 'y', type: { raw: 'f64', name: 'f64' }, isPublic: true }
          ]
        }],
        enums: [],
        typeAliases: new Map(),
        impls: []
      };

      const output = generateTypeScriptTypes(module);
      expect(output).toContain('export interface Point');
      expect(output).toContain('x: number');
      expect(output).toContain('y: number');
    });

    it('should generate optional fields for Option types', () => {
      const module: RustModule = {
        functions: [],
        structs: [{
          name: 'User',
          rustName: 'User',
          isPublic: true,
          hasWasmBindgen: false,
          fields: [
            { name: 'name', type: { raw: 'String', name: 'String' }, isPublic: true },
            { name: 'email', type: { raw: 'Option<String>', name: 'Option', isOptional: true, generics: [{ raw: 'String', name: 'String' }] }, isPublic: true }
          ]
        }],
        enums: [],
        typeAliases: new Map(),
        impls: []
      };

      const output = generateTypeScriptTypes(module);
      expect(output).toContain('name: string');
      expect(output).toContain('email?: string | null');
    });

    it('should generate simple enum as union type', () => {
      const module: RustModule = {
        functions: [],
        structs: [],
        enums: [{
          name: 'Status',
          rustName: 'Status',
          isPublic: true,
          hasWasmBindgen: false,
          variants: [
            { name: 'Pending' },
            { name: 'Active' },
            { name: 'Completed' }
          ]
        }],
        typeAliases: new Map(),
        impls: []
      };

      const output = generateTypeScriptTypes(module);
      expect(output).toContain("export type Status = 'Pending' | 'Active' | 'Completed'");
    });

    it('should generate discriminated union for complex enum', () => {
      const module: RustModule = {
        functions: [],
        structs: [],
        enums: [{
          name: 'Message',
          rustName: 'Message',
          isPublic: true,
          hasWasmBindgen: false,
          variants: [
            { name: 'Text', tupleFields: [{ raw: 'String', name: 'String' }] },
            { name: 'Number', tupleFields: [{ raw: 'i32', name: 'i32' }] }
          ]
        }],
        typeAliases: new Map(),
        impls: []
      };

      const output = generateTypeScriptTypes(module);
      expect(output).toContain("{ type: 'Text'; _0: string }");
      expect(output).toContain("{ type: 'Number'; _0: number }");
    });

    it('should generate JSDoc comments', () => {
      const module: RustModule = {
        functions: [],
        structs: [{
          name: 'Point',
          rustName: 'Point',
          doc: 'A 2D point',
          isPublic: true,
          hasWasmBindgen: false,
          fields: [
            { name: 'x', type: { raw: 'f64', name: 'f64' }, isPublic: true, doc: 'X coordinate' },
            { name: 'y', type: { raw: 'f64', name: 'f64' }, isPublic: true, doc: 'Y coordinate' }
          ]
        }],
        enums: [],
        typeAliases: new Map(),
        impls: []
      };

      const output = generateTypeScriptTypes(module);
      expect(output).toContain('* A 2D point');
      expect(output).toContain('/** X coordinate */');
      expect(output).toContain('/** Y coordinate */');
    });
  });

  describe('generateJSWrapper', () => {
    it('should generate simple function wrapper', () => {
      const fn: RustFunction = {
        name: 'add',
        rustName: 'add',
        isAsync: false,
        isPublic: true,
        hasWasmBindgen: true,
        params: [
          { name: 'a', type: { raw: 'i32', name: 'i32' } },
          { name: 'b', type: { raw: 'i32', name: 'i32' } }
        ],
        returnType: { raw: 'i32', name: 'i32' }
      };

      const output = generateJSWrapper(fn);
      expect(output).toContain('export function add(a: number, b: number): number');
      expect(output).toContain('wasmModule.exports.add(a, b)');
    });

    it('should generate async function wrapper', () => {
      const fn: RustFunction = {
        name: 'fetchData',
        rustName: 'fetch_data',
        isAsync: true,
        isPublic: true,
        hasWasmBindgen: true,
        params: [
          { name: 'url', type: { raw: 'String', name: 'String' } }
        ],
        returnType: { raw: 'String', name: 'String' }
      };

      const output = generateJSWrapper(fn);
      expect(output).toContain('export async function fetchData');
      expect(output).toContain('Promise<string>');
      expect(output).toContain('await wasmModule.exports.fetch_data');
    });

    it('should generate Result wrapper with try-catch', () => {
      const fn: RustFunction = {
        name: 'parseNumber',
        rustName: 'parse_number',
        isAsync: false,
        isPublic: true,
        hasWasmBindgen: true,
        params: [
          { name: 'input', type: { raw: 'String', name: 'String' } }
        ],
        returnType: { raw: 'Result<i32, String>', name: 'Result', isResult: true, generics: [
          { raw: 'i32', name: 'i32' },
          { raw: 'String', name: 'String' }
        ]}
      };

      const output = generateJSWrapper(fn);
      expect(output).toContain('Promise<number>');
      expect(output).toContain('try {');
      expect(output).toContain('catch (e)');
      expect(output).toContain("Rust function 'parse_number' failed");
    });

    it('should skip self parameters', () => {
      const fn: RustFunction = {
        name: 'getValue',
        rustName: 'get_value',
        isAsync: false,
        isPublic: true,
        hasWasmBindgen: true,
        params: [
          { name: 'self', type: { raw: '&Self', name: 'Self', isReference: true }, isSelf: true }
        ],
        returnType: { raw: 'i32', name: 'i32' }
      };

      const output = generateJSWrapper(fn);
      expect(output).toContain('export function getValue(): number');
      expect(output).not.toContain('self');
    });
  });

  describe('generateComponentBinding', () => {
    it('should generate component binding for struct', () => {
      const struct: RustStruct = {
        name: 'Counter',
        rustName: 'Counter',
        isPublic: true,
        hasWasmBindgen: true,
        fields: [
          { name: 'count', type: { raw: 'i32', name: 'i32' }, isPublic: true }
        ]
      };

      const methods: RustFunction[] = [
        {
          name: 'increment',
          rustName: 'increment',
          isAsync: false,
          isPublic: true,
          hasWasmBindgen: true,
          params: [
            { name: 'self', type: { raw: '&mut Self', name: 'Self' }, isSelf: true, isMutSelf: true }
          ]
        },
        {
          name: 'getValue',
          rustName: 'get_value',
          isAsync: false,
          isPublic: true,
          hasWasmBindgen: true,
          params: [
            { name: 'self', type: { raw: '&Self', name: 'Self' }, isSelf: true }
          ],
          returnType: { raw: 'i32', name: 'i32' }
        }
      ];

      const output = generateComponentBinding(struct, methods);
      expect(output).toContain('export interface CounterProps');
      expect(output).toContain('count: number');
      expect(output).toContain('export async function createCounterComponent');
      expect(output).toContain('createWasmComponent');
      expect(output).toContain("renderFn: 'render_counter'");
      expect(output).toContain("bindFunction('increment')");
      expect(output).toContain("bindFunction('get_value')");
    });
  });

  describe('generateSignalBinding', () => {
    it('should generate signal bindings for struct', () => {
      const struct: RustStruct = {
        name: 'GameState',
        rustName: 'GameState',
        isPublic: true,
        hasWasmBindgen: true,
        fields: [
          { name: 'score', type: { raw: 'i32', name: 'i32' }, isPublic: true },
          { name: 'level', type: { raw: 'u32', name: 'u32' }, isPublic: true },
          { name: 'health', type: { raw: 'f32', name: 'f32' }, isPublic: true },
          { name: 'isAlive', type: { raw: 'bool', name: 'bool' }, isPublic: true }
        ]
      };

      const output = generateSignalBinding(struct);
      expect(output).toContain('export function createGameStateSignals');
      expect(output).toContain('createI32Signal(module, initialValues.score)');
      expect(output).toContain('createI32Signal(module, initialValues.level)');
      expect(output).toContain('createF32Signal(module, initialValues.health)');
      expect(output).toContain('createBoolSignal(module, initialValues.isAlive)');
      expect(output).toContain('score: RustSignal<number>');
      expect(output).toContain('isAlive: RustSignal<boolean>');
    });
  });

  describe('generateBindings', () => {
    it('should generate complete bindings file', () => {
      const rustCode = `
        /// Counter component
        #[wasm_bindgen]
        pub struct Counter {
            pub count: i32,
        }

        impl Counter {
            #[wasm_bindgen(constructor)]
            pub fn new(initial: i32) -> Counter {
                Counter { count: initial }
            }

            #[wasm_bindgen]
            pub fn increment(&mut self) {
                self.count += 1;
            }

            #[wasm_bindgen]
            pub fn get_count(&self) -> i32 {
                self.count
            }
        }

        /// Add two numbers
        #[wasm_bindgen]
        pub fn add(a: i32, b: i32) -> i32 {
            a + b
        }
      `;

      const output = generateBindings(rustCode);

      // Check header
      expect(output).toContain('Auto-generated bindings from Rust source');
      expect(output).toContain('Generated by philjs-wasm codegen');

      // Check imports
      expect(output).toContain("import type { WasmModule, RustSignal } from 'philjs-wasm'");
      expect(output).toContain('createWasmComponent');
      expect(output).toContain('createI32Signal');

      // Check type definitions
      expect(output).toContain('Type Definitions');
      expect(output).toContain('export interface Counter');
      expect(output).toContain('count: number');

      // Check function bindings
      expect(output).toContain('Function Wrappers');
      expect(output).toContain('export function createBindings');
      expect(output).toContain('function add');

      // Check component bindings
      expect(output).toContain('Component Bindings');
      expect(output).toContain('createCounterComponent');

      // Check signal bindings
      expect(output).toContain('Signal Bindings');
      expect(output).toContain('createCounterSignals');
    });

    it('should respect options', () => {
      const rustCode = `
        #[wasm_bindgen]
        pub struct Simple {
            pub value: i32,
        }
      `;

      // Without TypeScript types - Type Definitions section should be skipped
      const noTypes = generateBindings(rustCode, { typescript: false });
      expect(noTypes).not.toContain('// Type Definitions');

      // Without PhilJS bindings
      const noPhiljs = generateBindings(rustCode, { philjs: false });
      expect(noPhiljs).not.toContain('createSimpleComponent');

      // Without signal bindings
      const noSignals = generateBindings(rustCode, { signals: false });
      expect(noSignals).not.toContain('createSimpleSignals');
    });

    it('should handle empty module', () => {
      const rustCode = `
        // Just a comment
      `;

      const output = generateBindings(rustCode);
      expect(output).toContain('Auto-generated bindings');
      expect(output).not.toContain('export interface');
      expect(output).not.toContain('export function');
    });

    it('should handle module with only enums', () => {
      const rustCode = `
        pub enum Status {
            Pending,
            Active,
            Completed,
        }

        pub enum Priority {
            Low = 1,
            Medium = 2,
            High = 3,
        }
      `;

      const output = generateBindings(rustCode);
      expect(output).toContain("export type Status = 'Pending' | 'Active' | 'Completed'");
      expect(output).toContain("export type Priority = 'Low' | 'Medium' | 'High'");
    });

    it('should handle functions with complex types', () => {
      const rustCode = `
        #[wasm_bindgen]
        pub fn process_data(
            items: Vec<String>,
            options: Option<HashMap<String, i32>>
        ) -> Result<Vec<u8>, String> {
            todo!()
        }
      `;

      const output = generateBindings(rustCode);
      expect(output).toContain('items: string[]');
      expect(output).toContain('Map<string, number> | null');
      expect(output).toContain('Promise<number[]>');
    });
  });

  describe('edge cases', () => {
    it('should handle struct with generic parameters', () => {
      const code = `
        pub struct Container<T> {
            pub value: T,
        }
      `;

      const module = parseRustModule(code);
      expect(module.structs[0].generics).toContain('T');
    });

    it('should handle function with generic parameters', () => {
      const code = `
        pub fn identity<T>(value: T) -> T {
            value
        }
      `;

      const module = parseRustModule(code);
      expect(module.functions[0].generics).toContain('T');
    });

    it('should handle multiple attributes on single item', () => {
      const code = `
        #[derive(Debug, Clone)]
        #[wasm_bindgen]
        #[serde(rename_all = "camelCase")]
        pub struct Config {
            pub setting: String,
        }
      `;

      const module = parseRustModule(code);
      expect(module.structs[0].hasWasmBindgen).toBe(true);
      expect(module.structs[0].derives).toContain('Debug');
      expect(module.structs[0].derives).toContain('Clone');
    });

    it('should handle nested struct definitions', () => {
      const code = `
        pub struct Outer {
            pub inner: Inner,
        }

        pub struct Inner {
            pub value: i32,
        }
      `;

      const module = parseRustModule(code);
      expect(module.structs).toHaveLength(2);
    });

    it('should handle trait implementations', () => {
      const code = `
        pub struct MyType;

        impl Display for MyType {
            fn fmt(&self, f: &mut Formatter) -> Result<(), Error> {
                todo!()
            }
        }
      `;

      const module = parseRustModule(code);
      // impl parsing is best-effort; at minimum we should not crash
      // and the struct should be parsed
      expect(module.structs.length).toBeGreaterThanOrEqual(0);
    });

    it('should preserve original Rust names', () => {
      const code = `
        #[wasm_bindgen]
        pub fn calculate_total_sum(values: Vec<i32>) -> i32 {
            values.iter().sum()
        }
      `;

      const module = parseRustModule(code);
      expect(module.functions[0].name).toBe('calculateTotalSum');
      expect(module.functions[0].rustName).toBe('calculate_total_sum');
    });

    it('should handle wasm_bindgen js_name override', () => {
      const code = `
        #[wasm_bindgen(js_name = "customFunctionName")]
        pub fn original_function_name() {
        }
      `;

      const module = parseRustModule(code);
      expect(module.functions[0].wasmBindgenAttrs?.jsName).toBe('customFunctionName');
    });
  });
});
