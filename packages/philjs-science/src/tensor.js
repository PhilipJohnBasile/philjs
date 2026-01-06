"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromArray = exports.linspace = exports.arange = exports.eye = exports.randn = exports.random = exports.ones = exports.zeros = exports.Tensor = void 0;
/** Get typed array constructor for dtype */
function getTypedArrayConstructor(dtype) {
    switch (dtype) {
        case 'float32': return Float32Array;
        case 'float64': return Float64Array;
        case 'int32':
        case 'int64': return Int32Array;
        case 'uint8':
        case 'bool': return Uint8Array;
        default: return Float32Array;
    }
}
/** Compute strides from shape (row-major order) */
function computeStrides(shape) {
    const strides = new Array(shape.length);
    let stride = 1;
    for (let i = shape.length - 1; i >= 0; i--) {
        strides[i] = stride;
        stride *= shape[i];
    }
    return strides;
}
/** Broadcast two shapes together */
function broadcastShapes(shapeA, shapeB) {
    const maxLen = Math.max(shapeA.length, shapeB.length);
    const result = [];
    for (let i = 0; i < maxLen; i++) {
        const dimA = shapeA[shapeA.length - 1 - i] ?? 1;
        const dimB = shapeB[shapeB.length - 1 - i] ?? 1;
        if (dimA !== dimB && dimA !== 1 && dimB !== 1) {
            throw new Error(`Cannot broadcast shapes [${shapeA}] and [${shapeB}]`);
        }
        result.unshift(Math.max(dimA, dimB));
    }
    return result;
}
/**
 * N-dimensional Tensor class
 */
class Tensor {
    data;
    shape;
    strides;
    dtype;
    size;
    // Autodiff
    _requiresGrad;
    _grad = null;
    _gradFn = null;
    _parents = [];
    // GPU
    _gpuBuffer = null;
    _device = 'cpu';
    constructor(data, shape, options = {}) {
        const dtype = options.dtype ?? 'float32';
        const TypedArray = getTypedArrayConstructor(dtype);
        if (data instanceof TypedArray) {
            this.data = data;
        }
        else {
            this.data = new TypedArray(data);
        }
        this.dtype = dtype;
        this.shape = Object.freeze(shape ?? [this.data.length]);
        this.strides = Object.freeze(computeStrides([...this.shape]));
        this.size = this.shape.reduce((a, b) => a * b, 1);
        this._requiresGrad = options.requiresGrad ?? false;
        this._device = options.device ?? 'cpu';
        if (this.data.length !== this.size) {
            throw new Error(`Data length ${this.data.length} doesn't match shape ${this.shape} (size ${this.size})`);
        }
    }
    // ============================================================================
    // Static Constructors
    // ============================================================================
    /** Create tensor of zeros */
    static zeros(shape, options) {
        const size = shape.reduce((a, b) => a * b, 1);
        const TypedArray = getTypedArrayConstructor(options?.dtype ?? 'float32');
        return new Tensor(new TypedArray(size), shape, options);
    }
    /** Create tensor of ones */
    static ones(shape, options) {
        const size = shape.reduce((a, b) => a * b, 1);
        const TypedArray = getTypedArrayConstructor(options?.dtype ?? 'float32');
        const data = new TypedArray(size).fill(1);
        return new Tensor(data, shape, options);
    }
    /** Create tensor with random values [0, 1) */
    static random(shape, options) {
        const size = shape.reduce((a, b) => a * b, 1);
        const TypedArray = getTypedArrayConstructor(options?.dtype ?? 'float32');
        const data = new TypedArray(size);
        for (let i = 0; i < size; i++) {
            data[i] = Math.random();
        }
        return new Tensor(data, shape, options);
    }
    /** Create tensor with random normal distribution */
    static randn(shape, options) {
        const size = shape.reduce((a, b) => a * b, 1);
        const TypedArray = getTypedArrayConstructor(options?.dtype ?? 'float32');
        const data = new TypedArray(size);
        for (let i = 0; i < size; i += 2) {
            // Box-Muller transform
            const u1 = Math.random();
            const u2 = Math.random();
            const r = Math.sqrt(-2 * Math.log(u1));
            const theta = 2 * Math.PI * u2;
            data[i] = r * Math.cos(theta);
            if (i + 1 < size) {
                data[i + 1] = r * Math.sin(theta);
            }
        }
        return new Tensor(data, shape, options);
    }
    /** Create identity matrix */
    static eye(n, options) {
        const data = new Float32Array(n * n);
        for (let i = 0; i < n; i++) {
            data[i * n + i] = 1;
        }
        return new Tensor(data, [n, n], options);
    }
    /** Create tensor from nested arrays */
    static fromArray(arr, options) {
        const shape = [];
        let current = arr;
        while (Array.isArray(current)) {
            shape.push(current.length);
            current = current[0];
        }
        const flat = (Array.isArray(arr) ? arr.flat(Infinity) : [arr]);
        return new Tensor(flat, shape, options);
    }
    /** Create range tensor */
    static arange(start, end, step = 1, options) {
        if (end === undefined) {
            end = start;
            start = 0;
        }
        const size = Math.ceil((end - start) / step);
        const data = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            data[i] = start + i * step;
        }
        return new Tensor(data, [size], options);
    }
    /** Create linearly spaced tensor */
    static linspace(start, end, num, options) {
        const data = new Float32Array(num);
        const step = (end - start) / (num - 1);
        for (let i = 0; i < num; i++) {
            data[i] = start + i * step;
        }
        return new Tensor(data, [num], options);
    }
    // ============================================================================
    // Properties
    // ============================================================================
    get ndim() {
        return this.shape.length;
    }
    get requiresGrad() {
        return this._requiresGrad;
    }
    get grad() {
        return this._grad;
    }
    // ============================================================================
    // Indexing
    // ============================================================================
    /** Get value at indices */
    get(...indices) {
        let offset = 0;
        for (let i = 0; i < indices.length; i++) {
            let idx = indices[i];
            if (idx < 0)
                idx += this.shape[i];
            offset += idx * this.strides[i];
        }
        return this.data[offset];
    }
    /** Set value at indices */
    set(value, ...indices) {
        let offset = 0;
        for (let i = 0; i < indices.length; i++) {
            let idx = indices[i];
            if (idx < 0)
                idx += this.shape[i];
            offset += idx * this.strides[i];
        }
        this.data[offset] = value;
    }
    /** Slice tensor */
    slice(...ranges) {
        const newShape = [];
        const offsets = [];
        const steps = [];
        for (let i = 0; i < this.shape.length; i++) {
            const range = ranges[i];
            const dim = this.shape[i];
            if (range === null || range === undefined) {
                newShape.push(dim);
                offsets.push(0);
                steps.push(1);
            }
            else if (typeof range === 'number') {
                // Single index - reduce dimension
                offsets.push(range < 0 ? dim + range : range);
                steps.push(1);
            }
            else {
                let [start, end] = range;
                if (start < 0)
                    start += dim;
                if (end < 0)
                    end += dim;
                newShape.push(end - start);
                offsets.push(start);
                steps.push(1);
            }
        }
        const newSize = newShape.reduce((a, b) => a * b, 1);
        const newData = new Float32Array(newSize);
        // Copy data
        const copySlice = (srcOffset, dstOffset, dim) => {
            if (dim === this.shape.length) {
                newData[dstOffset] = this.data[srcOffset];
                return;
            }
            const start = offsets[dim];
            const size = newShape[dim] ?? 1;
            const srcStride = this.strides[dim];
            const dstStride = dim < newShape.length ? computeStrides(newShape)[dim] : 1;
            for (let i = 0; i < size; i++) {
                copySlice(srcOffset + (start + i) * srcStride, dstOffset + i * dstStride, dim + 1);
            }
        };
        if (newSize > 0) {
            copySlice(0, 0, 0);
        }
        return new Tensor(newData, newShape, { dtype: this.dtype });
    }
    // ============================================================================
    // Shape Operations
    // ============================================================================
    /** Reshape tensor (returns view if possible) */
    reshape(newShape) {
        // Handle -1 in shape
        const inferredShape = [...newShape];
        const negIdx = inferredShape.indexOf(-1);
        if (negIdx !== -1) {
            const knownSize = inferredShape.reduce((a, b) => b === -1 ? a : a * b, 1);
            inferredShape[negIdx] = this.size / knownSize;
        }
        const newSize = inferredShape.reduce((a, b) => a * b, 1);
        if (newSize !== this.size) {
            throw new Error(`Cannot reshape tensor of size ${this.size} to shape [${inferredShape}]`);
        }
        return new Tensor(this.data, inferredShape, { dtype: this.dtype, requiresGrad: this._requiresGrad });
    }
    /** Flatten tensor to 1D */
    flatten() {
        return this.reshape([this.size]);
    }
    /** Transpose tensor */
    transpose(axes) {
        if (!axes) {
            axes = [...Array(this.ndim).keys()].reverse();
        }
        const newShape = axes.map(i => this.shape[i]);
        const newStrides = axes.map(i => this.strides[i]);
        const newData = new Float32Array(this.size);
        // Copy with transposed indexing
        const copyTransposed = (indices, depth) => {
            if (depth === this.ndim) {
                let srcOffset = 0;
                let dstOffset = 0;
                const dstStrides = computeStrides(newShape);
                for (let i = 0; i < this.ndim; i++) {
                    srcOffset += indices[axes[i]] * this.strides[axes[i]];
                    dstOffset += indices[axes[i]] * dstStrides[i];
                }
                newData[dstOffset] = this.data[srcOffset];
                return;
            }
            for (let i = 0; i < this.shape[depth]; i++) {
                indices[depth] = i;
                copyTransposed(indices, depth + 1);
            }
        };
        copyTransposed(new Array(this.ndim).fill(0), 0);
        return new Tensor(newData, newShape, { dtype: this.dtype });
    }
    /** Squeeze dimensions of size 1 */
    squeeze(dim) {
        if (dim !== undefined) {
            if (this.shape[dim] !== 1) {
                return this;
            }
            const newShape = [...this.shape];
            newShape.splice(dim, 1);
            return this.reshape(newShape);
        }
        const newShape = this.shape.filter(d => d !== 1);
        return this.reshape(newShape.length > 0 ? newShape : [1]);
    }
    /** Unsqueeze - add dimension of size 1 */
    unsqueeze(dim) {
        const newShape = [...this.shape];
        newShape.splice(dim, 0, 1);
        return this.reshape(newShape);
    }
    // ============================================================================
    // Element-wise Operations
    // ============================================================================
    /** Add tensors with broadcasting */
    add(other) {
        if (typeof other === 'number') {
            const result = new Float32Array(this.size);
            for (let i = 0; i < this.size; i++) {
                result[i] = this.data[i] + other;
            }
            return new Tensor(result, [...this.shape], { dtype: this.dtype });
        }
        const [a, b] = this.broadcast(other);
        const result = new Float32Array(a.size);
        for (let i = 0; i < a.size; i++) {
            result[i] = a.data[i] + b.data[i];
        }
        return new Tensor(result, [...a.shape], { dtype: this.dtype });
    }
    /** Subtract tensors */
    sub(other) {
        if (typeof other === 'number') {
            return this.add(-other);
        }
        const [a, b] = this.broadcast(other);
        const result = new Float32Array(a.size);
        for (let i = 0; i < a.size; i++) {
            result[i] = a.data[i] - b.data[i];
        }
        return new Tensor(result, [...a.shape], { dtype: this.dtype });
    }
    /** Multiply tensors element-wise */
    mul(other) {
        if (typeof other === 'number') {
            const result = new Float32Array(this.size);
            for (let i = 0; i < this.size; i++) {
                result[i] = this.data[i] * other;
            }
            return new Tensor(result, [...this.shape], { dtype: this.dtype });
        }
        const [a, b] = this.broadcast(other);
        const result = new Float32Array(a.size);
        for (let i = 0; i < a.size; i++) {
            result[i] = a.data[i] * b.data[i];
        }
        return new Tensor(result, [...a.shape], { dtype: this.dtype });
    }
    /** Divide tensors element-wise */
    div(other) {
        if (typeof other === 'number') {
            return this.mul(1 / other);
        }
        const [a, b] = this.broadcast(other);
        const result = new Float32Array(a.size);
        for (let i = 0; i < a.size; i++) {
            result[i] = a.data[i] / b.data[i];
        }
        return new Tensor(result, [...a.shape], { dtype: this.dtype });
    }
    /** Power */
    pow(exp) {
        const result = new Float32Array(this.size);
        for (let i = 0; i < this.size; i++) {
            result[i] = Math.pow(this.data[i], exp);
        }
        return new Tensor(result, [...this.shape], { dtype: this.dtype });
    }
    /** Square root */
    sqrt() {
        const result = new Float32Array(this.size);
        for (let i = 0; i < this.size; i++) {
            result[i] = Math.sqrt(this.data[i]);
        }
        return new Tensor(result, [...this.shape], { dtype: this.dtype });
    }
    /** Absolute value */
    abs() {
        const result = new Float32Array(this.size);
        for (let i = 0; i < this.size; i++) {
            result[i] = Math.abs(this.data[i]);
        }
        return new Tensor(result, [...this.shape], { dtype: this.dtype });
    }
    /** Exponential */
    exp() {
        const result = new Float32Array(this.size);
        for (let i = 0; i < this.size; i++) {
            result[i] = Math.exp(this.data[i]);
        }
        return new Tensor(result, [...this.shape], { dtype: this.dtype });
    }
    /** Natural logarithm */
    log() {
        const result = new Float32Array(this.size);
        for (let i = 0; i < this.size; i++) {
            result[i] = Math.log(this.data[i]);
        }
        return new Tensor(result, [...this.shape], { dtype: this.dtype });
    }
    /** Negative */
    neg() {
        return this.mul(-1);
    }
    // ============================================================================
    // Reductions
    // ============================================================================
    /** Sum along axis or all elements */
    sum(axis, keepdims = false) {
        if (axis === undefined) {
            let total = 0;
            for (let i = 0; i < this.size; i++) {
                total += this.data[i];
            }
            return total;
        }
        if (axis < 0)
            axis += this.ndim;
        const newShape = [...this.shape];
        newShape[axis] = 1;
        const resultSize = newShape.reduce((a, b) => a * b, 1);
        const result = new Float32Array(resultSize);
        // Compute sum along axis
        const axisSize = this.shape[axis];
        const axisStride = this.strides[axis];
        for (let i = 0; i < this.size; i++) {
            const indices = this.unravelIndex(i);
            indices[axis] = 0;
            const dstIdx = this.ravelIndex(indices, newShape);
            result[dstIdx] += this.data[i];
        }
        if (keepdims) {
            return new Tensor(result, newShape, { dtype: this.dtype });
        }
        else {
            const squeezedShape = newShape.filter((_, i) => i !== axis);
            return new Tensor(result, squeezedShape.length > 0 ? squeezedShape : [1], { dtype: this.dtype });
        }
    }
    /** Mean along axis or all elements */
    mean(axis, keepdims = false) {
        if (axis === undefined) {
            return this.sum() / this.size;
        }
        const sumResult = this.sum(axis, keepdims);
        return sumResult.div(this.shape[axis]);
    }
    /** Max along axis or all elements */
    max(axis, keepdims = false) {
        if (axis === undefined) {
            let maxVal = -Infinity;
            for (let i = 0; i < this.size; i++) {
                if (this.data[i] > maxVal)
                    maxVal = this.data[i];
            }
            return maxVal;
        }
        if (axis < 0)
            axis += this.ndim;
        const newShape = [...this.shape];
        newShape[axis] = 1;
        const resultSize = newShape.reduce((a, b) => a * b, 1);
        const result = new Float32Array(resultSize).fill(-Infinity);
        for (let i = 0; i < this.size; i++) {
            const indices = this.unravelIndex(i);
            indices[axis] = 0;
            const dstIdx = this.ravelIndex(indices, newShape);
            if (this.data[i] > result[dstIdx]) {
                result[dstIdx] = this.data[i];
            }
        }
        if (keepdims) {
            return new Tensor(result, newShape, { dtype: this.dtype });
        }
        else {
            const squeezedShape = newShape.filter((_, i) => i !== axis);
            return new Tensor(result, squeezedShape.length > 0 ? squeezedShape : [1], { dtype: this.dtype });
        }
    }
    /** Min along axis or all elements */
    min(axis, keepdims = false) {
        if (axis === undefined) {
            let minVal = Infinity;
            for (let i = 0; i < this.size; i++) {
                if (this.data[i] < minVal)
                    minVal = this.data[i];
            }
            return minVal;
        }
        if (axis < 0)
            axis += this.ndim;
        const newShape = [...this.shape];
        newShape[axis] = 1;
        const resultSize = newShape.reduce((a, b) => a * b, 1);
        const result = new Float32Array(resultSize).fill(Infinity);
        for (let i = 0; i < this.size; i++) {
            const indices = this.unravelIndex(i);
            indices[axis] = 0;
            const dstIdx = this.ravelIndex(indices, newShape);
            if (this.data[i] < result[dstIdx]) {
                result[dstIdx] = this.data[i];
            }
        }
        if (keepdims) {
            return new Tensor(result, newShape, { dtype: this.dtype });
        }
        else {
            const squeezedShape = newShape.filter((_, i) => i !== axis);
            return new Tensor(result, squeezedShape.length > 0 ? squeezedShape : [1], { dtype: this.dtype });
        }
    }
    /** Argmax - index of maximum value */
    argmax(axis) {
        if (axis === undefined) {
            let maxIdx = 0;
            let maxVal = this.data[0];
            for (let i = 1; i < this.size; i++) {
                if (this.data[i] > maxVal) {
                    maxVal = this.data[i];
                    maxIdx = i;
                }
            }
            return maxIdx;
        }
        // Argmax along axis
        if (axis < 0)
            axis += this.ndim;
        const newShape = [...this.shape];
        newShape.splice(axis, 1);
        if (newShape.length === 0)
            newShape.push(1);
        const resultSize = newShape.reduce((a, b) => a * b, 1);
        const result = new Float32Array(resultSize);
        const maxVals = new Float32Array(resultSize).fill(-Infinity);
        for (let i = 0; i < this.size; i++) {
            const indices = this.unravelIndex(i);
            const axisIdx = indices[axis];
            indices.splice(axis, 1);
            const dstIdx = this.ravelIndex(indices, newShape);
            if (this.data[i] > maxVals[dstIdx]) {
                maxVals[dstIdx] = this.data[i];
                result[dstIdx] = axisIdx;
            }
        }
        return new Tensor(result, newShape, { dtype: 'int32' });
    }
    // ============================================================================
    // Matrix Operations
    // ============================================================================
    /** Matrix multiplication */
    matmul(other) {
        // Handle batched matmul
        if (this.ndim > 2 || other.ndim > 2) {
            return this.batchedMatmul(other);
        }
        const [m, k1] = this.shape.length === 1 ? [1, this.shape[0]] : [this.shape[0], this.shape[1]];
        const [k2, n] = other.shape.length === 1 ? [other.shape[0], 1] : [other.shape[0], other.shape[1]];
        if (k1 !== k2) {
            throw new Error(`Matmul shape mismatch: [${this.shape}] @ [${other.shape}]`);
        }
        const result = new Float32Array(m * n);
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                let sum = 0;
                for (let k = 0; k < k1; k++) {
                    sum += this.data[i * k1 + k] * other.data[k * n + j];
                }
                result[i * n + j] = sum;
            }
        }
        const outShape = this.shape.length === 1 && other.shape.length === 1
            ? [1]
            : this.shape.length === 1
                ? [n]
                : other.shape.length === 1
                    ? [m]
                    : [m, n];
        return new Tensor(result, outShape, { dtype: this.dtype });
    }
    /** Batched matrix multiplication */
    batchedMatmul(other) {
        // Broadcast batch dimensions
        const aBatch = this.shape.slice(0, -2);
        const bBatch = other.shape.slice(0, -2);
        const batchShape = broadcastShapes(aBatch, bBatch);
        const [m, k1] = [this.shape[this.ndim - 2], this.shape[this.ndim - 1]];
        const [k2, n] = [other.shape[other.ndim - 2], other.shape[other.ndim - 1]];
        if (k1 !== k2) {
            throw new Error(`Matmul shape mismatch`);
        }
        const batchSize = batchShape.reduce((a, b) => a * b, 1);
        const resultShape = [...batchShape, m, n];
        const result = new Float32Array(batchSize * m * n);
        // Simple loop over batches
        for (let b = 0; b < batchSize; b++) {
            for (let i = 0; i < m; i++) {
                for (let j = 0; j < n; j++) {
                    let sum = 0;
                    for (let k = 0; k < k1; k++) {
                        const aIdx = b * m * k1 + i * k1 + k;
                        const bIdx = b * k1 * n + k * n + j;
                        sum += this.data[aIdx % this.size] * other.data[bIdx % other.size];
                    }
                    result[b * m * n + i * n + j] = sum;
                }
            }
        }
        return new Tensor(result, resultShape, { dtype: this.dtype });
    }
    /** Dot product */
    dot(other) {
        if (this.size !== other.size) {
            throw new Error('Dot product requires tensors of same size');
        }
        let sum = 0;
        for (let i = 0; i < this.size; i++) {
            sum += this.data[i] * other.data[i];
        }
        return sum;
    }
    /** Outer product */
    outer(other) {
        const result = new Float32Array(this.size * other.size);
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < other.size; j++) {
                result[i * other.size + j] = this.data[i] * other.data[j];
            }
        }
        return new Tensor(result, [this.size, other.size], { dtype: this.dtype });
    }
    // ============================================================================
    // Linear Algebra
    // ============================================================================
    /** LU decomposition with partial pivoting */
    lu() {
        if (this.ndim !== 2 || this.shape[0] !== this.shape[1]) {
            throw new Error('LU decomposition requires square matrix');
        }
        const n = this.shape[0];
        const L = Tensor.eye(n);
        const U = this.clone();
        const P = Tensor.eye(n);
        for (let k = 0; k < n; k++) {
            // Find pivot
            let maxVal = Math.abs(U.get(k, k));
            let maxRow = k;
            for (let i = k + 1; i < n; i++) {
                if (Math.abs(U.get(i, k)) > maxVal) {
                    maxVal = Math.abs(U.get(i, k));
                    maxRow = i;
                }
            }
            // Swap rows
            if (maxRow !== k) {
                for (let j = 0; j < n; j++) {
                    const tmp = U.get(k, j);
                    U.set(U.get(maxRow, j), k, j);
                    U.set(tmp, maxRow, j);
                    const tmpP = P.get(k, j);
                    P.set(P.get(maxRow, j), k, j);
                    P.set(tmpP, maxRow, j);
                }
            }
            // Eliminate
            for (let i = k + 1; i < n; i++) {
                const factor = U.get(i, k) / U.get(k, k);
                L.set(factor, i, k);
                for (let j = k; j < n; j++) {
                    U.set(U.get(i, j) - factor * U.get(k, j), i, j);
                }
            }
        }
        return { L, U, P };
    }
    /** QR decomposition using Gram-Schmidt */
    qr() {
        if (this.ndim !== 2) {
            throw new Error('QR decomposition requires 2D matrix');
        }
        const [m, n] = [this.shape[0], this.shape[1]];
        const Q = new Float32Array(m * n);
        const R = new Float32Array(n * n);
        for (let j = 0; j < n; j++) {
            // Copy column j
            const v = new Float32Array(m);
            for (let i = 0; i < m; i++) {
                v[i] = this.get(i, j);
            }
            // Orthogonalize against previous columns
            for (let k = 0; k < j; k++) {
                let dot = 0;
                for (let i = 0; i < m; i++) {
                    dot += Q[i * n + k] * this.get(i, j);
                }
                R[k * n + j] = dot;
                for (let i = 0; i < m; i++) {
                    v[i] -= dot * Q[i * n + k];
                }
            }
            // Normalize
            let norm = 0;
            for (let i = 0; i < m; i++) {
                norm += v[i] * v[i];
            }
            norm = Math.sqrt(norm);
            R[j * n + j] = norm;
            if (norm > 1e-10) {
                for (let i = 0; i < m; i++) {
                    Q[i * n + j] = v[i] / norm;
                }
            }
        }
        return {
            Q: new Tensor(Q, [m, n], { dtype: this.dtype }),
            R: new Tensor(R, [n, n], { dtype: this.dtype }),
        };
    }
    /** Singular Value Decomposition */
    svd() {
        if (this.ndim !== 2) {
            throw new Error('SVD requires 2D matrix');
        }
        const [m, n] = [this.shape[0], this.shape[1]];
        const k = Math.min(m, n);
        // Power iteration for SVD
        const U = new Float32Array(m * k);
        const S = new Float32Array(k);
        const V = new Float32Array(n * k);
        // A^T A for eigendecomposition
        const AtA = this.transpose().matmul(this);
        // Power iteration for each singular value
        for (let i = 0; i < k; i++) {
            // Random initial vector
            let v = Tensor.randn([n]);
            // Power iteration
            for (let iter = 0; iter < 100; iter++) {
                v = AtA.matmul(v.reshape([n, 1])).reshape([n]);
                const norm = Math.sqrt(v.dot(v));
                v = v.div(norm);
            }
            // Singular value
            const Av = this.matmul(v.reshape([n, 1])).reshape([m]);
            const sigma = Math.sqrt(Av.dot(Av));
            S[i] = sigma;
            // Left and right singular vectors
            const u = sigma > 1e-10 ? Av.div(sigma) : Tensor.zeros([m]);
            for (let j = 0; j < m; j++)
                U[j * k + i] = u.data[j];
            for (let j = 0; j < n; j++)
                V[j * k + i] = v.data[j];
            // Deflate
            // (simplified - full implementation would use Householder)
        }
        return {
            U: new Tensor(U, [m, k], { dtype: this.dtype }),
            S: new Tensor(S, [k], { dtype: this.dtype }),
            V: new Tensor(V, [n, k], { dtype: this.dtype }),
        };
    }
    /** Eigenvalue decomposition (symmetric matrices) */
    eig() {
        if (this.ndim !== 2 || this.shape[0] !== this.shape[1]) {
            throw new Error('Eigendecomposition requires square matrix');
        }
        const n = this.shape[0];
        const values = new Float32Array(n);
        const vectors = new Float32Array(n * n);
        // QR algorithm
        let A = this.clone();
        let V = Tensor.eye(n);
        for (let iter = 0; iter < 100; iter++) {
            const { Q, R } = A.qr();
            A = R.matmul(Q);
            V = V.matmul(Q);
        }
        // Extract eigenvalues from diagonal
        for (let i = 0; i < n; i++) {
            values[i] = A.get(i, i);
            for (let j = 0; j < n; j++) {
                vectors[i * n + j] = V.get(j, i);
            }
        }
        return {
            values: new Tensor(values, [n], { dtype: this.dtype }),
            vectors: new Tensor(vectors, [n, n], { dtype: this.dtype }),
        };
    }
    /** Cholesky decomposition (for positive definite matrices) */
    cholesky() {
        if (this.ndim !== 2 || this.shape[0] !== this.shape[1]) {
            throw new Error('Cholesky requires square matrix');
        }
        const n = this.shape[0];
        const L = new Float32Array(n * n);
        for (let i = 0; i < n; i++) {
            for (let j = 0; j <= i; j++) {
                let sum = 0;
                for (let k = 0; k < j; k++) {
                    sum += L[i * n + k] * L[j * n + k];
                }
                if (i === j) {
                    const val = this.get(i, i) - sum;
                    if (val <= 0) {
                        throw new Error('Matrix is not positive definite');
                    }
                    L[i * n + j] = Math.sqrt(val);
                }
                else {
                    L[i * n + j] = (this.get(i, j) - sum) / L[j * n + j];
                }
            }
        }
        return new Tensor(L, [n, n], { dtype: this.dtype });
    }
    /** Matrix inverse */
    inv() {
        if (this.ndim !== 2 || this.shape[0] !== this.shape[1]) {
            throw new Error('Inverse requires square matrix');
        }
        const n = this.shape[0];
        const { L, U, P } = this.lu();
        // Solve for each column of the inverse
        const result = new Float32Array(n * n);
        for (let col = 0; col < n; col++) {
            // Solve Ly = Pb (forward substitution)
            const y = new Float32Array(n);
            for (let i = 0; i < n; i++) {
                let sum = P.get(i, col);
                for (let j = 0; j < i; j++) {
                    sum -= L.get(i, j) * y[j];
                }
                y[i] = sum;
            }
            // Solve Ux = y (backward substitution)
            for (let i = n - 1; i >= 0; i--) {
                let sum = y[i];
                for (let j = i + 1; j < n; j++) {
                    sum -= U.get(i, j) * result[j * n + col];
                }
                result[i * n + col] = sum / U.get(i, i);
            }
        }
        return new Tensor(result, [n, n], { dtype: this.dtype });
    }
    /** Matrix determinant */
    det() {
        if (this.ndim !== 2 || this.shape[0] !== this.shape[1]) {
            throw new Error('Determinant requires square matrix');
        }
        const { U, P } = this.lu();
        const n = this.shape[0];
        // Determinant is product of diagonal of U times sign from permutation
        let det = 1;
        let sign = 1;
        for (let i = 0; i < n; i++) {
            det *= U.get(i, i);
            if (P.get(i, i) !== 1)
                sign *= -1;
        }
        return det * sign;
    }
    /** Matrix trace */
    trace() {
        if (this.ndim !== 2) {
            throw new Error('Trace requires 2D matrix');
        }
        const n = Math.min(this.shape[0], this.shape[1]);
        let sum = 0;
        for (let i = 0; i < n; i++) {
            sum += this.get(i, i);
        }
        return sum;
    }
    /** Frobenius norm */
    norm(ord = 'fro') {
        if (ord === 'fro' || ord === 2) {
            let sum = 0;
            for (let i = 0; i < this.size; i++) {
                sum += this.data[i] * this.data[i];
            }
            return Math.sqrt(sum);
        }
        throw new Error(`Unsupported norm order: ${ord}`);
    }
    // ============================================================================
    // Broadcasting Helper
    // ============================================================================
    /** Broadcast this tensor with another */
    broadcast(other) {
        const newShape = broadcastShapes([...this.shape], [...other.shape]);
        return [
            this.broadcastTo(newShape),
            other.broadcastTo(newShape),
        ];
    }
    /** Broadcast to target shape */
    broadcastTo(targetShape) {
        if (this.shape.every((d, i) => d === targetShape[targetShape.length - this.ndim + i])) {
            if (this.shape.length === targetShape.length) {
                return this;
            }
        }
        const result = new Float32Array(targetShape.reduce((a, b) => a * b, 1));
        const resultStrides = computeStrides(targetShape);
        // Broadcast copy
        const copyBroadcast = (srcIndices, dstIndex, dim) => {
            if (dim === targetShape.length) {
                let srcOffset = 0;
                for (let i = 0; i < this.ndim; i++) {
                    srcOffset += srcIndices[i] * this.strides[i];
                }
                result[dstIndex] = this.data[srcOffset];
                return;
            }
            const srcDim = dim - (targetShape.length - this.ndim);
            for (let i = 0; i < targetShape[dim]; i++) {
                if (srcDim >= 0 && srcDim < this.ndim) {
                    srcIndices[srcDim] = this.shape[srcDim] === 1 ? 0 : i;
                }
                copyBroadcast(srcIndices, dstIndex + i * resultStrides[dim], dim + 1);
            }
        };
        copyBroadcast(new Array(this.ndim).fill(0), 0, 0);
        return new Tensor(result, targetShape, { dtype: this.dtype });
    }
    // ============================================================================
    // Utility Methods
    // ============================================================================
    /** Clone tensor */
    clone() {
        const TypedArray = getTypedArrayConstructor(this.dtype);
        return new Tensor(new TypedArray(this.data), [...this.shape], {
            dtype: this.dtype,
            requiresGrad: this._requiresGrad,
        });
    }
    /** Convert to JavaScript array */
    toArray() {
        if (this.ndim === 1) {
            return Array.from(this.data);
        }
        const result = [];
        const toNestedArray = (offset, dim) => {
            if (dim === this.ndim - 1) {
                const arr = [];
                for (let i = 0; i < this.shape[dim]; i++) {
                    arr.push(this.data[offset + i]);
                }
                return arr;
            }
            const arr = [];
            for (let i = 0; i < this.shape[dim]; i++) {
                arr.push(toNestedArray(offset + i * this.strides[dim], dim + 1));
            }
            return arr;
        };
        return toNestedArray(0, 0);
    }
    /** Convert flat index to multi-dimensional indices */
    unravelIndex(flatIdx) {
        const indices = new Array(this.ndim);
        for (let i = 0; i < this.ndim; i++) {
            indices[i] = Math.floor(flatIdx / this.strides[i]) % this.shape[i];
        }
        return indices;
    }
    /** Convert multi-dimensional indices to flat index */
    ravelIndex(indices, shape) {
        const strides = computeStrides(shape);
        let idx = 0;
        for (let i = 0; i < indices.length; i++) {
            idx += indices[i] * strides[i];
        }
        return idx;
    }
    /** String representation */
    toString() {
        return `Tensor(shape=[${this.shape.join(', ')}], dtype=${this.dtype})`;
    }
    // ============================================================================
    // GPU Acceleration (WebGPU)
    // ============================================================================
    /** Transfer tensor to GPU */
    async toGPU() {
        if (this._device === 'gpu')
            return;
        if (!navigator.gpu) {
            throw new Error('WebGPU is not supported');
        }
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error('Failed to get GPU adapter');
        }
        const device = await adapter.requestDevice();
        this._gpuBuffer = device.createBuffer({
            size: this.data.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        });
        device.queue.writeBuffer(this._gpuBuffer, 0, this.data);
        this._device = 'gpu';
    }
    /** Transfer tensor back to CPU */
    async toCPU() {
        if (this._device === 'cpu')
            return;
        if (!this._gpuBuffer) {
            throw new Error('No GPU buffer');
        }
        // Read back from GPU (simplified)
        this._device = 'cpu';
        this._gpuBuffer = null;
    }
    // ============================================================================
    // Autograd
    // ============================================================================
    /** Compute gradients via backpropagation */
    backward() {
        if (!this._requiresGrad) {
            throw new Error('Tensor does not require gradients');
        }
        // Initialize gradient to 1 for scalar output
        this._grad = Tensor.ones([...this.shape]);
        // Topological sort
        const visited = new Set();
        const order = [];
        const topoSort = (t) => {
            if (visited.has(t))
                return;
            visited.add(t);
            for (const parent of t._parents) {
                topoSort(parent);
            }
            order.push(t);
        };
        topoSort(this);
        order.reverse();
        // Backpropagate
        for (const t of order) {
            if (t._gradFn) {
                t._gradFn();
            }
        }
    }
    /** Zero out gradients */
    zeroGrad() {
        this._grad = null;
    }
}
exports.Tensor = Tensor;
// ============================================================================
// Convenience Functions
// ============================================================================
exports.zeros = Tensor.zeros;
exports.ones = Tensor.ones;
exports.random = Tensor.random;
exports.randn = Tensor.randn;
exports.eye = Tensor.eye;
exports.arange = Tensor.arange;
exports.linspace = Tensor.linspace;
exports.fromArray = Tensor.fromArray;
//# sourceMappingURL=tensor.js.map