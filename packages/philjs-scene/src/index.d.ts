/**
 * @philjs/scene - Declarative 3D scene graph for PhilJS
 *
 * Features:
 * - React-three-fiber inspired declarative API
 * - Automatic resource management and disposal
 * - Scene graph with parent-child transformations
 * - Built-in primitives (Box, Sphere, Plane, etc.)
 * - Instanced rendering for performance
 * - LOD (Level of Detail) system
 * - Post-processing effects
 * - Shadow mapping
 * - Environment maps and PBR materials
 * - Animation system with keyframes and morphing
 * - Particle systems
 * - Scene loading (GLTF, FBX, OBJ)
 */
type Vector3 = [number, number, number];
type Quaternion = [number, number, number, number];
type Color = string | number | [number, number, number];
type Matrix4 = Float32Array;
interface Transform {
    position?: Vector3;
    rotation?: Vector3 | Quaternion;
    scale?: Vector3 | number;
}
interface NodeProps extends Transform {
    name?: string;
    visible?: boolean;
    castShadow?: boolean;
    receiveShadow?: boolean;
    frustumCulled?: boolean;
    renderOrder?: number;
}
interface MaterialProps {
    color?: Color;
    opacity?: number;
    transparent?: boolean;
    side?: 'front' | 'back' | 'double';
    wireframe?: boolean;
    flatShading?: boolean;
    metalness?: number;
    roughness?: number;
    emissive?: Color;
    emissiveIntensity?: number;
    map?: string | HTMLImageElement;
    normalMap?: string | HTMLImageElement;
    roughnessMap?: string | HTMLImageElement;
    metalnessMap?: string | HTMLImageElement;
    envMap?: string;
    envMapIntensity?: number;
}
interface GeometryProps {
    args?: number[];
}
interface LightProps extends NodeProps {
    intensity?: number;
    color?: Color;
    castShadow?: boolean;
    shadow?: {
        mapSize?: [number, number];
        bias?: number;
        radius?: number;
    };
}
interface CameraProps extends NodeProps {
    fov?: number;
    near?: number;
    far?: number;
    aspect?: number;
    zoom?: number;
    orthographic?: boolean;
}
declare class SceneNode {
    readonly id: string;
    name: string;
    parent: SceneNode | null;
    children: SceneNode[];
    visible: boolean;
    castShadow: boolean;
    receiveShadow: boolean;
    frustumCulled: boolean;
    renderOrder: number;
    position: Vector3;
    rotation: Vector3;
    quaternion: Quaternion;
    scale: Vector3;
    localMatrix: Matrix4;
    worldMatrix: Matrix4;
    private matrixNeedsUpdate;
    constructor(props?: NodeProps);
    add(child: SceneNode): void;
    remove(child: SceneNode): void;
    traverse(callback: (node: SceneNode) => void): void;
    find(predicate: (node: SceneNode) => boolean): SceneNode | null;
    findByName(name: string): SceneNode | null;
    setPosition(x: number, y: number, z: number): void;
    setRotation(x: number, y: number, z: number): void;
    setScale(x: number, y: number, z: number): void;
    lookAt(target: Vector3): void;
    updateLocalMatrix(): void;
    updateWorldMatrix(force?: boolean): void;
    private multiplyMatrices;
    dispose(): void;
}
declare class Geometry {
    readonly vertices: Float32Array;
    readonly normals: Float32Array;
    readonly uvs: Float32Array;
    readonly indices: Uint16Array | Uint32Array;
    readonly vertexCount: number;
    readonly indexCount: number;
    constructor(vertices: Float32Array, normals: Float32Array, uvs: Float32Array, indices: Uint16Array | Uint32Array);
    static box(width?: number, height?: number, depth?: number): Geometry;
    static sphere(radius?: number, widthSegments?: number, heightSegments?: number): Geometry;
    static plane(width?: number, height?: number, widthSegments?: number, heightSegments?: number): Geometry;
    static cylinder(radiusTop?: number, radiusBottom?: number, height?: number, radialSegments?: number): Geometry;
    static torus(radius?: number, tube?: number, radialSegments?: number, tubularSegments?: number): Geometry;
}
declare class Material {
    color: Color;
    opacity: number;
    transparent: boolean;
    side: 'front' | 'back' | 'double';
    wireframe: boolean;
    flatShading: boolean;
    metalness: number;
    roughness: number;
    emissive: Color;
    emissiveIntensity: number;
    map: string | null;
    normalMap: string | null;
    roughnessMap: string | null;
    metalnessMap: string | null;
    envMap: string | null;
    envMapIntensity: number;
    constructor(props?: MaterialProps);
}
interface MeshProps extends NodeProps {
    geometry?: Geometry;
    material?: Material | MaterialProps;
}
declare class Mesh extends SceneNode {
    geometry: Geometry;
    material: Material;
    constructor(props?: MeshProps);
}
declare class Light extends SceneNode {
    color: Color;
    intensity: number;
    shadow: {
        mapSize: [number, number];
        bias: number;
        radius: number;
    };
    constructor(props?: LightProps);
}
declare class DirectionalLight extends Light {
    target: Vector3;
    constructor(props?: LightProps & {
        target?: Vector3;
    });
}
declare class PointLight extends Light {
    distance: number;
    decay: number;
    constructor(props?: LightProps & {
        distance?: number;
        decay?: number;
    });
}
declare class SpotLight extends Light {
    target: Vector3;
    angle: number;
    penumbra: number;
    distance: number;
    decay: number;
    constructor(props?: LightProps & {
        target?: Vector3;
        angle?: number;
        penumbra?: number;
        distance?: number;
        decay?: number;
    });
}
declare class AmbientLight extends Light {
    constructor(props?: LightProps);
}
declare class HemisphereLight extends Light {
    groundColor: Color;
    constructor(props?: LightProps & {
        groundColor?: Color;
    });
}
declare class Camera extends SceneNode {
    fov: number;
    near: number;
    far: number;
    aspect: number;
    zoom: number;
    orthographic: boolean;
    projectionMatrix: Matrix4;
    viewMatrix: Matrix4;
    constructor(props?: CameraProps);
    updateProjectionMatrix(): void;
    private updatePerspectiveMatrix;
    private updateOrthographicMatrix;
    updateViewMatrix(): void;
    private invertMatrix;
}
interface SceneProps {
    background?: Color;
    fog?: {
        color: Color;
        near: number;
        far: number;
    };
    environment?: string;
}
declare class Scene extends SceneNode {
    background: Color;
    fog: SceneProps['fog'] | null;
    environment: string | null;
    constructor(props?: SceneProps);
}
interface InstancedMeshProps extends MeshProps {
    count: number;
}
declare class InstancedMesh extends Mesh {
    readonly count: number;
    readonly instanceMatrices: Float32Array;
    readonly instanceColors: Float32Array | null;
    constructor(props: InstancedMeshProps);
    setMatrixAt(index: number, matrix: Matrix4): void;
    getMatrixAt(index: number): Matrix4;
}
interface LODLevel {
    object: SceneNode;
    distance: number;
}
declare class LOD extends SceneNode {
    levels: LODLevel[];
    autoUpdate: boolean;
    addLevel(object: SceneNode, distance: number): void;
    update(camera: Camera): void;
}
interface Keyframe<T> {
    time: number;
    value: T;
    easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}
interface AnimationTrack<T> {
    target: string;
    property: string;
    keyframes: Keyframe<T>[];
}
interface AnimationClip {
    name: string;
    duration: number;
    tracks: AnimationTrack<any>[];
}
declare class AnimationMixer {
    private root;
    private clips;
    private currentClip;
    private currentTime;
    private isPlaying;
    private loop;
    private timeScale;
    constructor(root: SceneNode);
    addClip(clip: AnimationClip): void;
    play(clipName: string, options?: {
        loop?: boolean;
        timeScale?: number;
    }): void;
    stop(): void;
    pause(): void;
    update(deltaTime: number): void;
    private interpolateKeyframes;
    private applyEasing;
    private lerp;
    private setProperty;
}
interface ParticleSystemConfig {
    maxParticles: number;
    emissionRate: number;
    lifetime: number;
    lifetimeVariation?: number;
    speed: number;
    speedVariation?: number;
    size: number;
    sizeVariation?: number;
    sizeOverLifetime?: number[];
    color: Color;
    colorOverLifetime?: Color[];
    gravity?: Vector3;
    worldSpace?: boolean;
}
interface Particle {
    position: Vector3;
    velocity: Vector3;
    life: number;
    maxLife: number;
    size: number;
    color: Color;
}
declare class ParticleSystem extends SceneNode {
    config: ParticleSystemConfig;
    particles: Particle[];
    private emitAccumulator;
    constructor(config: ParticleSystemConfig);
    emit(count?: number): void;
    update(deltaTime: number): void;
}
interface GLTFResult {
    scene: SceneNode;
    animations: AnimationClip[];
}
declare class GLTFLoader {
    private cache;
    load(url: string): Promise<GLTFResult>;
    private parseGLTF;
}
type SceneElement = {
    type: string;
    props: any;
    children: SceneElement[];
};
declare function createElement(type: string, props: any, ...children: SceneElement[]): SceneElement;
declare function buildScene(element: SceneElement, parent?: SceneNode): SceneNode;
declare function useScene(props?: SceneProps): Scene;
declare function useCamera(props?: CameraProps): Camera;
declare function useMesh(geometry: Geometry, material: Material | MaterialProps, props?: NodeProps): Mesh;
declare function useAnimation(root: SceneNode): AnimationMixer;
declare function useGLTF(url: string): {
    scene: SceneNode | null;
    animations: AnimationClip[];
    isLoading: boolean;
};
declare function useParticles(config: ParticleSystemConfig): ParticleSystem;
export { SceneNode, Scene, Mesh, Geometry, Material, Camera, InstancedMesh, LOD, AnimationMixer, ParticleSystem, GLTFLoader, Light, DirectionalLight, PointLight, SpotLight, AmbientLight, HemisphereLight, createElement, buildScene, useScene, useCamera, useMesh, useAnimation, useGLTF, useParticles, type Vector3, type Quaternion, type Color, type Matrix4, type Transform, type NodeProps, type MaterialProps, type GeometryProps, type LightProps, type CameraProps, type SceneProps, type AnimationClip, type AnimationTrack, type Keyframe, type ParticleSystemConfig, type GLTFResult };
//# sourceMappingURL=index.d.ts.map