/**
 * Mock WebAssembly Runtime for Edge AI.
 * Simulates the low-level bridge between JS and WASM.
 */
export declare class WasmRuntime {
    private memory;
    private instance;
    init(wasmPath: string, memoryPages?: number): Promise<boolean>;
    runInference(inputData: Float32Array): {
        status: string;
        outputPtr: number;
    } | {
        status: string;
        outputPtr?: undefined;
    };
}
