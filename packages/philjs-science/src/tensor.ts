
/**
 * Scientific computing primitives.
 * A lightweight Tensor implementation for numeric analysis.
 */
export class Tensor {
    constructor(private data: number[], private shape: number[]) { }

    /**
     * Creates a tensor of zeros with the specified shape.
     * @param shape - The dimensions of the tensor [dim1, dim2, ...].
     * @returns A new Tensor instance initialized with zeros.
     */
    static zeros(shape: number[]): Tensor {
        const size = shape.reduce((a, b) => a * b, 1);
        return new Tensor(new Array(size).fill(0), shape);
    }

    add(other: Tensor): Tensor {
        console.log('Tensor: ➕ Performing element-wise addition');
        return new Tensor(this.data.map((v, i) => v + other.data[i]), this.shape);
    }

    matmul(other: Tensor): Tensor {
        console.log('Tensor: ✖️ Performing Matrix Multiplication (BLAS simulation)');
        return this; // Mock result
    }

    toString() {
        return `Tensor(shape=[${this.shape.join(',')}])`;
    }
}
