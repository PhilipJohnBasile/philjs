/**
 * @file Three.js Integration Types
 * @description Type definitions for Three.js integration with PhilJS
 */
/**
 * Three.js module type (imported dynamically)
 */
export interface ThreeModule {
    Scene: new () => ThreeScene;
    PerspectiveCamera: new (fov: number, aspect: number, near: number, far: number) => ThreePerspectiveCamera;
    OrthographicCamera: new (left: number, right: number, top: number, bottom: number, near: number, far: number) => ThreeOrthographicCamera;
    WebGLRenderer: new (options?: ThreeRendererOptions) => ThreeRenderer;
    Clock: new (autoStart?: boolean) => ThreeClock;
    Vector3: new (x?: number, y?: number, z?: number) => ThreeVector3;
    Quaternion: new (x?: number, y?: number, z?: number, w?: number) => ThreeQuaternion;
    Euler: new (x?: number, y?: number, z?: number, order?: string) => ThreeEuler;
    Color: new (color?: number | string) => ThreeColor;
    TextureLoader: new () => ThreeTextureLoader;
    GLTFLoader?: new () => ThreeGLTFLoader;
    [key: string]: unknown;
}
export interface ThreeScene {
    add: (object: ThreeObject3D) => void;
    remove: (object: ThreeObject3D) => void;
    children: ThreeObject3D[];
    background: ThreeColor | null;
    fog: unknown;
    traverse: (callback: (object: ThreeObject3D) => void) => void;
}
export interface ThreeObject3D {
    position: ThreeVector3;
    rotation: ThreeEuler;
    quaternion: ThreeQuaternion;
    scale: ThreeVector3;
    visible: boolean;
    name: string;
    userData: Record<string, unknown>;
    parent: ThreeObject3D | null;
    children: ThreeObject3D[];
    add: (object: ThreeObject3D) => void;
    remove: (object: ThreeObject3D) => void;
    traverse: (callback: (object: ThreeObject3D) => void) => void;
    lookAt: (target: ThreeVector3) => void;
}
export interface ThreeCamera extends ThreeObject3D {
    matrixWorldInverse: {
        elements: number[];
    };
    projectionMatrix: {
        elements: number[];
    };
    updateProjectionMatrix: () => void;
}
export interface ThreePerspectiveCamera extends ThreeCamera {
    fov: number;
    aspect: number;
    near: number;
    far: number;
}
export interface ThreeOrthographicCamera extends ThreeCamera {
    left: number;
    right: number;
    top: number;
    bottom: number;
    near: number;
    far: number;
    zoom: number;
}
export interface ThreeRendererOptions {
    canvas?: HTMLCanvasElement;
    antialias?: boolean;
    alpha?: boolean;
    premultipliedAlpha?: boolean;
    preserveDrawingBuffer?: boolean;
    powerPreference?: 'default' | 'high-performance' | 'low-power';
    depth?: boolean;
    stencil?: boolean;
    logarithmicDepthBuffer?: boolean;
}
export interface ThreeRenderer {
    domElement: HTMLCanvasElement;
    render: (scene: ThreeScene, camera: ThreeCamera) => void;
    setSize: (width: number, height: number, updateStyle?: boolean) => void;
    setPixelRatio: (ratio: number) => void;
    setClearColor: (color: ThreeColor | number | string, alpha?: number) => void;
    getSize: (target: {
        width: number;
        height: number;
    }) => {
        width: number;
        height: number;
    };
    dispose: () => void;
    shadowMap: {
        enabled: boolean;
        type: number;
    };
    toneMapping: number;
    toneMappingExposure: number;
    outputEncoding: number;
}
export interface ThreeClock {
    start: () => void;
    stop: () => void;
    getElapsedTime: () => number;
    getDelta: () => number;
    running: boolean;
    elapsedTime: number;
}
export interface ThreeVector3 {
    x: number;
    y: number;
    z: number;
    set: (x: number, y: number, z: number) => ThreeVector3;
    copy: (v: ThreeVector3) => ThreeVector3;
    add: (v: ThreeVector3) => ThreeVector3;
    sub: (v: ThreeVector3) => ThreeVector3;
    multiplyScalar: (s: number) => ThreeVector3;
    normalize: () => ThreeVector3;
    length: () => number;
    distanceTo: (v: ThreeVector3) => number;
    clone: () => ThreeVector3;
}
export interface ThreeQuaternion {
    x: number;
    y: number;
    z: number;
    w: number;
    set: (x: number, y: number, z: number, w: number) => ThreeQuaternion;
    setFromEuler: (euler: ThreeEuler) => ThreeQuaternion;
    slerp: (q: ThreeQuaternion, t: number) => ThreeQuaternion;
    clone: () => ThreeQuaternion;
}
export interface ThreeEuler {
    x: number;
    y: number;
    z: number;
    order: string;
    set: (x: number, y: number, z: number, order?: string) => ThreeEuler;
    clone: () => ThreeEuler;
}
export interface ThreeColor {
    r: number;
    g: number;
    b: number;
    set: (color: number | string) => ThreeColor;
    setRGB: (r: number, g: number, b: number) => ThreeColor;
    getHex: () => number;
    clone: () => ThreeColor;
}
export interface ThreeTexture {
    image: HTMLImageElement | HTMLCanvasElement;
    needsUpdate: boolean;
    dispose: () => void;
}
export interface ThreeTextureLoader {
    load: (url: string, onLoad?: (texture: ThreeTexture) => void, onProgress?: (event: ProgressEvent) => void, onError?: (error: Error) => void) => ThreeTexture;
    loadAsync: (url: string, onProgress?: (event: ProgressEvent) => void) => Promise<ThreeTexture>;
}
export interface ThreeGLTFLoader {
    load: (url: string, onLoad: (gltf: ThreeGLTF) => void, onProgress?: (event: ProgressEvent) => void, onError?: (error: Error) => void) => void;
    loadAsync: (url: string, onProgress?: (event: ProgressEvent) => void) => Promise<ThreeGLTF>;
}
export interface ThreeGLTF {
    scene: ThreeScene;
    scenes: ThreeScene[];
    cameras: ThreeCamera[];
    animations: unknown[];
    asset: Record<string, unknown>;
}
/**
 * PhilJS Three.js integration types
 */
export interface ThreeCanvasProps {
    id?: string;
    width?: number;
    height?: number;
    antialias?: boolean;
    alpha?: boolean;
    shadows?: boolean;
    pixelRatio?: number;
    clearColor?: number | string;
    clearAlpha?: number;
    autoResize?: boolean;
    camera?: {
        fov?: number;
        near?: number;
        far?: number;
        position?: [number, number, number];
        lookAt?: [number, number, number];
    };
    onInit?: (state: ThreeState) => void;
    onCreated?: (state: ThreeState) => void;
    onFrame?: (info: FrameInfo, state: ThreeState) => void;
    onResize?: (width: number, height: number) => void;
    onError?: (error: Error) => void;
    style?: Record<string, string | number>;
    className?: string;
}
export interface ThreeState {
    scene: ThreeScene;
    camera: ThreePerspectiveCamera;
    renderer: ThreeRenderer;
    clock: ThreeClock;
    canvas: HTMLCanvasElement;
    size: {
        width: number;
        height: number;
    };
    THREE: ThreeModule;
}
export interface FrameInfo {
    time: number;
    delta: number;
    state: ThreeState;
}
export interface LoaderResult<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    progress: number;
}
//# sourceMappingURL=types.d.ts.map