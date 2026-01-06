import { describe, it, expect } from 'vitest';
import { Quantizer, QuantizationConfig } from '../quantizer.js';

describe('PhilJS Edge: Quantizer', () => {
    it('should quantize Float32 array to Int8', () => {
        const input = new Float32Array([-1.0, -0.5, 0, 0.5, 1.0]);
        // Simple quantization mapping range [-1, 1] to [-127, 127]
        const quantized = Quantizer.quantize(input, { type: 'int8' });

        expect(quantized).toBeInstanceOf(Int8Array);
        expect(quantized.length).toBe(input.length);
        expect(quantized[2]).toBe(0); // 0 -> 0
    });

    it('should dequantize back to Float32 approximately', () => {
        const input = new Float32Array([0.5]);
        const qModel = Quantizer.quantizeModel({ weights: input }, { type: 'int8' });
        const output = Quantizer.dequantizeModel(qModel);

        expect(output.weights[0]).toBeCloseTo(0.5, 1);
    });

    it('should report compression ratio', () => {
        const input = new Float32Array(100); // 400 bytes
        const stats = Quantizer.analyze(input, { type: 'int8' }); // 100 bytes
        expect(stats.compressionRatio).toBeCloseTo(4.0, 1);
    });
});
