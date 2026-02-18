export interface QuantizationConfig {
    sourceModelPath: string;
    targetFormat: 'int8' | 'uint8' | 'float16';
    calibrationData?: any[];
}
export interface QuantizeOptions {
    type: 'int8' | 'uint8' | 'float16';
}
export interface QuantizedModel {
    weights: Int8Array | Uint8Array | Float32Array;
    scale: number;
    zeroPoint: number;
    originalType: string;
}
export interface QuantizationStats {
    compressionRatio: number;
    originalSize: number;
    compressedSize: number;
}
/**
 * Static Quantizer utilities for edge deployment
 */
export declare const Quantizer: {
    /**
     * Quantize a Float32Array to lower precision
     */
    quantize(input: Float32Array, options: QuantizeOptions): Int8Array | Uint8Array | Float32Array;
    /**
     * Quantize an entire model
     */
    quantizeModel(model: {
        weights: Float32Array;
    }, options: QuantizeOptions): QuantizedModel;
    /**
     * Dequantize a model back to Float32
     */
    dequantizeModel(model: QuantizedModel): {
        weights: Float32Array;
    };
    /**
     * Analyze compression stats
     */
    analyze(input: Float32Array, options: QuantizeOptions): QuantizationStats;
};
/**
 * Simulates model quantization for edge deployment.
 * Reduces model size by converting weights from Float32 to lower precision.
 *
 * @param config - Configuration specifying the source model and target precision.
 * @returns Metadata about the quantized model including size reduction.
 */
export declare function quantizeModel(config: QuantizationConfig): Promise<{
    outputPath: string;
    originalSize: number;
    compressedSize: number;
    precision: string;
}>;
