export interface ModelConfig {
    path: string;
    format: 'onnx' | 'tflite' | 'gguf';
    quantization?: 'q4' | 'q8' | 'fp16';
}
export declare class EdgeModel {
    private config;
    constructor(config: ModelConfig);
    static load(path: string): Promise<EdgeModel>;
    run(input: any): Promise<{
        label: string;
        confidence: number;
        latency: string;
    }>;
}
