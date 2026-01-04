/**
 * @philjs/webgpu - WebGPU Integration for High-Performance Rendering
 *
 * Leverage next-generation GPU APIs for:
 * - GPU-accelerated UI rendering
 * - Compute shaders for complex animations
 * - Parallel DOM diffing on GPU
 * - WebGPU-powered canvas components
 * - Real-time effects and filters
 * - GPU-based layout calculations
 *
 * NO OTHER FRAMEWORK HAS THIS.
 */
export type {};
declare global {
    interface Navigator {
        readonly gpu: GPU;
    }
    interface GPU {
        requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
        getPreferredCanvasFormat(): GPUTextureFormat;
    }
    interface GPURequestAdapterOptions {
        powerPreference?: 'low-power' | 'high-performance' | undefined;
    }
    interface GPUAdapter {
        requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
        readonly features: GPUSupportedFeatures;
        readonly limits: GPUSupportedLimits;
    }
    interface GPUDeviceDescriptor {
        requiredFeatures?: GPUFeatureName[] | undefined;
        requiredLimits?: Record<string, number> | undefined;
    }
    interface GPUSupportedFeatures extends Set<string> {
    }
    interface GPUSupportedLimits {
        readonly maxBufferSize: number;
        readonly maxTextureDimension1D: number;
        readonly maxTextureDimension2D: number;
        readonly maxTextureDimension3D: number;
    }
    interface GPUDevice {
        readonly features: GPUSupportedFeatures;
        readonly limits: GPUSupportedLimits;
        readonly queue: GPUQueue;
        readonly lost: Promise<GPUDeviceLostInfo>;
        createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
        createTexture(descriptor: GPUTextureDescriptor): GPUTexture;
        createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
        createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline;
        createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
        createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
        createCommandEncoder(descriptor?: GPUCommandEncoderDescriptor): GPUCommandEncoder;
        destroy(): void;
    }
    interface GPUDeviceLostInfo {
        readonly reason: 'destroyed' | 'unknown';
        readonly message: string;
    }
    interface GPUQueue {
        submit(commandBuffers: GPUCommandBuffer[]): void;
        writeBuffer(buffer: GPUBuffer, bufferOffset: number, data: ArrayBuffer | ArrayBufferView): void;
    }
    interface GPUBuffer {
        readonly size: number;
        readonly usage: GPUBufferUsageFlags;
        getMappedRange(offset?: number, size?: number): ArrayBuffer;
        unmap(): void;
        destroy(): void;
    }
    interface GPUBufferDescriptor {
        label?: string | undefined;
        size: number;
        usage: GPUBufferUsageFlags;
        mappedAtCreation?: boolean | undefined;
    }
    interface GPUTexture {
        readonly width: number;
        readonly height: number;
        readonly format: GPUTextureFormat;
        createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView;
        destroy(): void;
    }
    interface GPUTextureDescriptor {
        label?: string | undefined;
        size: GPUExtent3DStrict;
        format: GPUTextureFormat;
        usage: GPUTextureUsageFlags;
        mipLevelCount?: number | undefined;
        sampleCount?: number | undefined;
        dimension?: GPUTextureDimension | undefined;
    }
    interface GPUExtent3DStrict {
        width: number;
        height?: number | undefined;
        depthOrArrayLayers?: number | undefined;
    }
    interface GPUTextureView {
    }
    interface GPUTextureViewDescriptor {
        format?: GPUTextureFormat | undefined;
        dimension?: GPUTextureViewDimension | undefined;
    }
    interface GPUShaderModule {
    }
    interface GPUShaderModuleDescriptor {
        label?: string | undefined;
        code: string;
    }
    interface GPURenderPipeline {
        getBindGroupLayout(index: number): GPUBindGroupLayout;
    }
    interface GPURenderPipelineDescriptor {
        label?: string | undefined;
        layout: GPUPipelineLayout | 'auto';
        vertex: GPUVertexState;
        primitive?: GPUPrimitiveState | undefined;
        depthStencil?: GPUDepthStencilState | undefined;
        multisample?: GPUMultisampleState | undefined;
        fragment?: GPUFragmentState | undefined;
    }
    interface GPUComputePipeline {
        getBindGroupLayout(index: number): GPUBindGroupLayout;
    }
    interface GPUComputePipelineDescriptor {
        label?: string | undefined;
        layout: GPUPipelineLayout | 'auto';
        compute: GPUProgrammableStage;
    }
    interface GPUProgrammableStage {
        module: GPUShaderModule;
        entryPoint: string;
        constants?: Record<string, number> | undefined;
    }
    interface GPUVertexState extends GPUProgrammableStage {
        buffers?: GPUVertexBufferLayout[] | undefined;
    }
    interface GPUVertexBufferLayout {
        arrayStride: number;
        stepMode?: 'vertex' | 'instance' | undefined;
        attributes: GPUVertexAttribute[];
    }
    interface GPUVertexAttribute {
        format: GPUVertexFormat;
        offset: number;
        shaderLocation: number;
    }
    interface GPUPrimitiveState {
        topology?: GPUPrimitiveTopology | undefined;
        stripIndexFormat?: GPUIndexFormat | undefined;
        frontFace?: 'ccw' | 'cw' | undefined;
        cullMode?: 'none' | 'front' | 'back' | undefined;
    }
    interface GPUDepthStencilState {
        format: GPUTextureFormat;
        depthWriteEnabled: boolean;
        depthCompare: GPUCompareFunction;
    }
    interface GPUMultisampleState {
        count?: number | undefined;
        mask?: number | undefined;
        alphaToCoverageEnabled?: boolean | undefined;
    }
    interface GPUFragmentState extends GPUProgrammableStage {
        targets: (GPUColorTargetState | null)[];
    }
    interface GPUColorTargetState {
        format: GPUTextureFormat;
        blend?: GPUBlendState | undefined;
        writeMask?: GPUColorWriteFlags | undefined;
    }
    interface GPUBlendState {
        color: GPUBlendComponent;
        alpha: GPUBlendComponent;
    }
    interface GPUBlendComponent {
        operation?: GPUBlendOperation | undefined;
        srcFactor?: GPUBlendFactor | undefined;
        dstFactor?: GPUBlendFactor | undefined;
    }
    interface GPUBindGroup {
    }
    interface GPUBindGroupDescriptor {
        label?: string | undefined;
        layout: GPUBindGroupLayout;
        entries: GPUBindGroupEntry[];
    }
    interface GPUBindGroupEntry {
        binding: number;
        resource: GPUBindingResource;
    }
    interface GPUBindGroupLayout {
    }
    interface GPUPipelineLayout {
    }
    interface GPUCommandEncoder {
        beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
        beginComputePass(descriptor?: GPUComputePassDescriptor): GPUComputePassEncoder;
        copyBufferToBuffer(source: GPUBuffer, sourceOffset: number, destination: GPUBuffer, destinationOffset: number, size: number): void;
        finish(descriptor?: GPUCommandBufferDescriptor): GPUCommandBuffer;
    }
    interface GPUCommandEncoderDescriptor {
        label?: string | undefined;
    }
    interface GPUCommandBuffer {
    }
    interface GPUCommandBufferDescriptor {
        label?: string | undefined;
    }
    interface GPURenderPassEncoder {
        setPipeline(pipeline: GPURenderPipeline): void;
        setBindGroup(index: number, bindGroup: GPUBindGroup): void;
        setVertexBuffer(slot: number, buffer: GPUBuffer): void;
        setIndexBuffer(buffer: GPUBuffer, indexFormat: GPUIndexFormat): void;
        draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void;
        drawIndexed(indexCount: number, instanceCount?: number, firstIndex?: number, baseVertex?: number, firstInstance?: number): void;
        end(): void;
    }
    interface GPURenderPassDescriptor {
        label?: string | undefined;
        colorAttachments: (GPURenderPassColorAttachment | null)[];
        depthStencilAttachment?: GPURenderPassDepthStencilAttachment | undefined;
    }
    interface GPURenderPassColorAttachment {
        view: GPUTextureView;
        resolveTarget?: GPUTextureView | undefined;
        clearValue?: GPUColor | undefined;
        loadOp: GPULoadOp;
        storeOp: GPUStoreOp;
    }
    interface GPURenderPassDepthStencilAttachment {
        view: GPUTextureView;
        depthClearValue?: number | undefined;
        depthLoadOp?: GPULoadOp | undefined;
        depthStoreOp?: GPUStoreOp | undefined;
        depthReadOnly?: boolean | undefined;
        stencilClearValue?: number | undefined;
        stencilLoadOp?: GPULoadOp | undefined;
        stencilStoreOp?: GPUStoreOp | undefined;
        stencilReadOnly?: boolean | undefined;
    }
    interface GPUColor {
        r: number;
        g: number;
        b: number;
        a: number;
    }
    interface GPUComputePassEncoder {
        setPipeline(pipeline: GPUComputePipeline): void;
        setBindGroup(index: number, bindGroup: GPUBindGroup): void;
        dispatchWorkgroups(workgroupCountX: number, workgroupCountY?: number, workgroupCountZ?: number): void;
        end(): void;
    }
    interface GPUComputePassDescriptor {
        label?: string | undefined;
    }
    interface GPUCanvasContext {
        configure(configuration: GPUCanvasConfiguration): void;
        unconfigure(): void;
        getCurrentTexture(): GPUTexture;
    }
    interface GPUCanvasConfiguration {
        device: GPUDevice;
        format: GPUTextureFormat;
        usage?: GPUTextureUsageFlags | undefined;
        viewFormats?: GPUTextureFormat[] | undefined;
        colorSpace?: 'srgb' | 'display-p3' | undefined;
        alphaMode?: GPUCanvasAlphaMode | undefined;
    }
    interface HTMLCanvasElement {
        getContext(contextId: 'webgpu'): GPUCanvasContext | null;
    }
    type GPUTextureFormat = 'bgra8unorm' | 'rgba8unorm' | 'rgba16float' | 'rgba32float' | 'depth24plus' | 'depth24plus-stencil8' | 'depth32float' | string;
    type GPUTextureDimension = '1d' | '2d' | '3d';
    type GPUTextureViewDimension = '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
    type GPUBufferUsageFlags = number;
    type GPUTextureUsageFlags = number;
    type GPUColorWriteFlags = number;
    type GPUFeatureName = string;
    type GPUVertexFormat = 'float32' | 'float32x2' | 'float32x3' | 'float32x4' | 'uint32' | 'sint32' | string;
    type GPUPrimitiveTopology = 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
    type GPUIndexFormat = 'uint16' | 'uint32';
    type GPUCompareFunction = 'never' | 'less' | 'equal' | 'less-equal' | 'greater' | 'not-equal' | 'greater-equal' | 'always';
    type GPUBlendOperation = 'add' | 'subtract' | 'reverse-subtract' | 'min' | 'max';
    type GPUBlendFactor = 'zero' | 'one' | 'src' | 'one-minus-src' | 'src-alpha' | 'one-minus-src-alpha' | 'dst' | 'one-minus-dst' | 'dst-alpha' | 'one-minus-dst-alpha' | 'constant' | 'one-minus-constant';
    type GPULoadOp = 'load' | 'clear';
    type GPUStoreOp = 'store' | 'discard';
    type GPUCanvasAlphaMode = 'opaque' | 'premultiplied';
    type GPUBindingResource = GPUTextureView | GPUSampler | GPUBufferBinding | GPUExternalTexture;
    interface GPUSampler {
    }
    interface GPUBufferBinding {
        buffer: GPUBuffer;
        offset?: number | undefined;
        size?: number | undefined;
    }
    interface GPUExternalTexture {
    }
    const GPUBufferUsage: {
        readonly MAP_READ: number;
        readonly MAP_WRITE: number;
        readonly COPY_SRC: number;
        readonly COPY_DST: number;
        readonly INDEX: number;
        readonly VERTEX: number;
        readonly UNIFORM: number;
        readonly STORAGE: number;
        readonly INDIRECT: number;
        readonly QUERY_RESOLVE: number;
    };
    const GPUTextureUsage: {
        readonly COPY_SRC: number;
        readonly COPY_DST: number;
        readonly TEXTURE_BINDING: number;
        readonly STORAGE_BINDING: number;
        readonly RENDER_ATTACHMENT: number;
    };
}
export interface WebGPUConfig {
    /** Canvas element or selector */
    canvas?: HTMLCanvasElement | string;
    /** Preferred GPU power preference */
    powerPreference?: 'low-power' | 'high-performance';
    /** Enable compute shaders */
    enableCompute?: boolean;
    /** Antialiasing samples */
    antialias?: boolean;
    /** Alpha mode for compositing */
    alphaMode?: 'opaque' | 'premultiplied';
    /** Maximum buffer size in bytes */
    maxBufferSize?: number;
}
export interface GPUComponentProps {
    width: number;
    height: number;
    render: (ctx: GPURenderContext) => void;
    compute?: (ctx: GPUComputeContext) => void;
    onFrame?: (deltaTime: number) => void;
}
export interface GPURenderContext {
    device: GPUDevice;
    context: GPUCanvasContext;
    format: GPUTextureFormat;
    encoder: GPUCommandEncoder;
    pass: GPURenderPassEncoder;
    createBuffer: (data: Float32Array | Uint32Array, usage: GPUBufferUsageFlags) => GPUBuffer;
    createTexture: (width: number, height: number, format?: GPUTextureFormat) => GPUTexture;
    createPipeline: (descriptor: GPURenderPipelineDescriptor) => GPURenderPipeline;
}
export interface GPUComputeContext {
    device: GPUDevice;
    encoder: GPUCommandEncoder;
    pass: GPUComputePassEncoder;
    createBuffer: (data: Float32Array | Uint32Array, usage: GPUBufferUsageFlags) => GPUBuffer;
    createPipeline: (descriptor: GPUComputePipelineDescriptor) => GPUComputePipeline;
    dispatch: (pipeline: GPUComputePipeline, x: number, y?: number, z?: number) => void;
}
export interface ShaderModule {
    vertex?: string;
    fragment?: string;
    compute?: string;
}
export interface GPUAnimation {
    id: string;
    duration: number;
    easing: (t: number) => number;
    update: (progress: number) => Float32Array;
}
export interface ParallelDiffResult {
    patches: DOMPatch[];
    computeTime: number;
}
export interface DOMPatch {
    type: 'insert' | 'remove' | 'update' | 'move';
    path: number[];
    value?: unknown;
    oldValue?: unknown;
}
export declare function isWebGPUSupported(): Promise<boolean>;
export declare function isWebGPUSupportedSync(): boolean;
export declare class WebGPUContext {
    private adapter;
    private device;
    private context;
    private format;
    private config;
    private canvas;
    private bufferCache;
    private pipelineCache;
    private shaderCache;
    constructor(config?: WebGPUConfig);
    initialize(canvas?: HTMLCanvasElement): Promise<boolean>;
    getDevice(): GPUDevice | null;
    getContext(): GPUCanvasContext | null;
    getFormat(): GPUTextureFormat;
    createBuffer(data: Float32Array | Uint32Array, usage: GPUBufferUsageFlags, label?: string): GPUBuffer;
    getBuffer(label: string): GPUBuffer | undefined;
    createTexture(width: number, height: number, format?: GPUTextureFormat, usage?: GPUTextureUsageFlags): GPUTexture;
    createShaderModule(code: string, label?: string): GPUShaderModule;
    createRenderPipeline(descriptor: GPURenderPipelineDescriptor, label?: string): GPURenderPipeline;
    createComputePipeline(descriptor: GPUComputePipelineDescriptor, label?: string): GPUComputePipeline;
    beginRenderPass(colorAttachments?: GPURenderPassColorAttachment[]): {
        encoder: GPUCommandEncoder;
        pass: GPURenderPassEncoder;
    } | null;
    submit(encoder: GPUCommandEncoder): void;
    beginComputePass(): {
        encoder: GPUCommandEncoder;
        pass: GPUComputePassEncoder;
    } | null;
    destroy(): void;
}
export declare const BuiltInShaders: {
    basic2D: string;
    texturedQuad: string;
    blur: string;
    parallelSum: string;
    animate: string;
};
export declare class GPUCanvas {
    private ctx;
    private canvas;
    private isRunning;
    private frameCallback;
    private lastTime;
    constructor(canvas: HTMLCanvasElement, config?: WebGPUConfig);
    initialize(): Promise<boolean>;
    getContext(): WebGPUContext;
    onFrame(callback: (deltaTime: number) => void): void;
    start(): void;
    stop(): void;
    private loop;
    destroy(): void;
}
export declare class GPUEffects {
    private ctx;
    private blurPipeline;
    constructor(ctx: WebGPUContext);
    initialize(): Promise<void>;
    blur(inputTexture: GPUTexture, outputTexture: GPUTexture, width: number, height: number): void;
}
export declare class GPUAnimator {
    private ctx;
    private pipeline;
    private animations;
    private animationBuffer;
    private resultBuffer;
    constructor(ctx: WebGPUContext);
    initialize(): Promise<void>;
    addAnimation(animation: GPUAnimation): void;
    removeAnimation(id: string): void;
    update(currentTime: number): Map<string, Float32Array>;
}
export declare class GPUDiffer {
    private ctx;
    private pipeline;
    constructor(ctx: WebGPUContext);
    initialize(): Promise<void>;
    diff(oldTree: unknown[], newTree: unknown[]): ParallelDiffResult;
    private diffNodes;
}
export declare function initWebGPU(config?: WebGPUConfig): Promise<WebGPUContext | null>;
export declare function getWebGPUContext(): WebGPUContext | null;
export declare function useWebGPU(): {
    supported: boolean;
    context: WebGPUContext | null;
    device: GPUDevice | null;
};
export declare function useGPUCanvas(canvas: HTMLCanvasElement, config?: WebGPUConfig): {
    initialize: () => Promise<boolean>;
    context: WebGPUContext | null;
    start: () => void;
    stop: () => void;
    onFrame: (callback: (dt: number) => void) => void;
};
export declare function useGPUEffects(): {
    blur: (input: GPUTexture, output: GPUTexture, w: number, h: number) => void;
} | null;
export declare function useGPUAnimator(): GPUAnimator | null;
//# sourceMappingURL=index.d.ts.map