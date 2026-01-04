
/**
 * Scientific computing primitives.
 * A lightweight Tensor implementation for numeric analysis.
 */
export class Tensor {
    constructor(private data: number[], private shape: number[]) { }

    static zeros(shape: number[]) {
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
