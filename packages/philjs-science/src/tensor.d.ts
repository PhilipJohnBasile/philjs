/**
 * @philjs/science - Tensor
 *
 * Production-grade N-dimensional tensor implementation with:
 * - N-dimensional arrays with strides
 * - Broadcasting support
 * - Linear algebra operations (SVD, QR, eigenvalues, etc.)
 * - Reductions (sum, mean, max, min)
 * - WebGPU acceleration
 * - Automatic differentiation
 */
export type DType = 'float32' | 'float64' | 'int32' | 'int64' | 'uint8' | 'bool';
export interface TensorOptions {
    dtype?: DType;
    requiresGrad?: boolean;
    device?: 'cpu' | 'gpu';
}
/**
 * N-dimensional Tensor class
 */
export declare class Tensor {
    readonly data: Float32Array | Float64Array | Int32Array | Uint8Array;
    readonly shape: readonly number[];
    readonly strides: readonly number[];
    readonly dtype: DType;
    readonly size: number;
    private _requiresGrad;
    private _grad;
    private _gradFn;
    private _parents;
    private _gpuBuffer;
    private _device;
    constructor(data: ArrayLike<number> | Float32Array | Float64Array | Int32Array | Uint8Array, shape?: number[], options?: TensorOptions);
    /** Create tensor of zeros */
    static zeros(shape: number[], options?: TensorOptions): Tensor;
    /** Create tensor of ones */
    static ones(shape: number[], options?: TensorOptions): Tensor;
    /** Create tensor with random values [0, 1) */
    static random(shape: number[], options?: TensorOptions): Tensor;
    /** Create tensor with random normal distribution */
    static randn(shape: number[], options?: TensorOptions): Tensor;
    /** Create identity matrix */
    static eye(n: number, options?: TensorOptions): Tensor;
    /** Create tensor from nested arrays */
    static fromArray(arr: number | number[] | number[][] | number[][][], options?: TensorOptions): Tensor;
    /** Create range tensor */
    static arange(start: number, end?: number, step?: number, options?: TensorOptions): Tensor;
    /** Create linearly spaced tensor */
    static linspace(start: number, end: number, num: number, options?: TensorOptions): Tensor;
    get ndim(): number;
    get requiresGrad(): boolean;
    get grad(): Tensor | null;
    /** Get value at indices */
    get(...indices: number[]): number;
    /** Set value at indices */
    set(value: number, ...indices: number[]): void;
    /** Slice tensor */
    slice(...ranges: Array<number | [number, number] | null>): Tensor;
    /** Reshape tensor (returns view if possible) */
    reshape(newShape: number[]): Tensor;
    /** Flatten tensor to 1D */
    flatten(): Tensor;
    /** Transpose tensor */
    transpose(axes?: number[]): Tensor;
    /** Squeeze dimensions of size 1 */
    squeeze(dim?: number): Tensor;
    /** Unsqueeze - add dimension of size 1 */
    unsqueeze(dim: number): Tensor;
    /** Add tensors with broadcasting */
    add(other: Tensor | number): Tensor;
    /** Subtract tensors */
    sub(other: Tensor | number): Tensor;
    /** Multiply tensors element-wise */
    mul(other: Tensor | number): Tensor;
    /** Divide tensors element-wise */
    div(other: Tensor | number): Tensor;
    /** Power */
    pow(exp: number): Tensor;
    /** Square root */
    sqrt(): Tensor;
    /** Absolute value */
    abs(): Tensor;
    /** Exponential */
    exp(): Tensor;
    /** Natural logarithm */
    log(): Tensor;
    /** Negative */
    neg(): Tensor;
    /** Sum along axis or all elements */
    sum(axis?: number, keepdims?: boolean): Tensor | number;
    /** Mean along axis or all elements */
    mean(axis?: number, keepdims?: boolean): Tensor | number;
    /** Max along axis or all elements */
    max(axis?: number, keepdims?: boolean): Tensor | number;
    /** Min along axis or all elements */
    min(axis?: number, keepdims?: boolean): Tensor | number;
    /** Argmax - index of maximum value */
    argmax(axis?: number): Tensor | number;
    /** Matrix multiplication */
    matmul(other: Tensor): Tensor;
    /** Batched matrix multiplication */
    private batchedMatmul;
    /** Dot product */
    dot(other: Tensor): number;
    /** Outer product */
    outer(other: Tensor): Tensor;
    /** LU decomposition with partial pivoting */
    lu(): {
        L: Tensor;
        U: Tensor;
        P: Tensor;
    };
    /** QR decomposition using Gram-Schmidt */
    qr(): {
        Q: Tensor;
        R: Tensor;
    };
    /** Singular Value Decomposition */
    svd(): {
        U: Tensor;
        S: Tensor;
        V: Tensor;
    };
    /** Eigenvalue decomposition (symmetric matrices) */
    eig(): {
        values: Tensor;
        vectors: Tensor;
    };
    /** Cholesky decomposition (for positive definite matrices) */
    cholesky(): Tensor;
    /** Matrix inverse */
    inv(): Tensor;
    /** Matrix determinant */
    det(): number;
    /** Matrix trace */
    trace(): number;
    /** Frobenius norm */
    norm(ord?: 'fro' | 2): number;
    /** Broadcast this tensor with another */
    broadcast(other: Tensor): [Tensor, Tensor];
    /** Broadcast to target shape */
    broadcastTo(targetShape: number[]): Tensor;
    /** Clone tensor */
    clone(): Tensor;
    /** Convert to JavaScript array */
    toArray(): number[] | number[][] | number[][][];
    /** Convert flat index to multi-dimensional indices */
    private unravelIndex;
    /** Convert multi-dimensional indices to flat index */
    private ravelIndex;
    /** String representation */
    toString(): string;
    /** Transfer tensor to GPU */
    toGPU(): Promise<void>;
    /** Transfer tensor back to CPU */
    toCPU(): Promise<void>;
    /** Compute gradients via backpropagation */
    backward(): void;
    /** Zero out gradients */
    zeroGrad(): void;
}
export declare const zeros: typeof Tensor.zeros;
export declare const ones: typeof Tensor.ones;
export declare const random: typeof Tensor.random;
export declare const randn: typeof Tensor.randn;
export declare const eye: typeof Tensor.eye;
export declare const arange: typeof Tensor.arange;
export declare const linspace: typeof Tensor.linspace;
export declare const fromArray: typeof Tensor.fromArray;
//# sourceMappingURL=tensor.d.ts.map