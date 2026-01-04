/**
 * @file Camera and Projection Utilities
 * @description Camera management and matrix utilities for 3D rendering
 */
import type { Camera, CameraOptions } from './types.js';
/**
 * Create a 4x4 identity matrix
 */
export declare function mat4Identity(): Float32Array;
/**
 * Multiply two 4x4 matrices
 */
export declare function mat4Multiply(a: Float32Array, b: Float32Array): Float32Array;
/**
 * Create a perspective projection matrix
 */
export declare function mat4Perspective(fov: number, aspect: number, near: number, far: number): Float32Array;
/**
 * Create an orthographic projection matrix
 */
export declare function mat4Orthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): Float32Array;
/**
 * Create a look-at view matrix
 */
export declare function mat4LookAt(eye: Float32Array | number[], target: Float32Array | number[], up: Float32Array | number[]): Float32Array;
/**
 * Create a translation matrix
 */
export declare function mat4Translate(x: number, y: number, z: number): Float32Array;
/**
 * Create a rotation matrix around X axis
 */
export declare function mat4RotateX(angle: number): Float32Array;
/**
 * Create a rotation matrix around Y axis
 */
export declare function mat4RotateY(angle: number): Float32Array;
/**
 * Create a rotation matrix around Z axis
 */
export declare function mat4RotateZ(angle: number): Float32Array;
/**
 * Create a scale matrix
 */
export declare function mat4Scale(x: number, y: number, z: number): Float32Array;
/**
 * Invert a 4x4 matrix
 */
export declare function mat4Invert(m: Float32Array): Float32Array;
/**
 * Transpose a 4x4 matrix
 */
export declare function mat4Transpose(m: Float32Array): Float32Array;
/**
 * Extract 3x3 normal matrix from 4x4 model-view matrix
 */
export declare function mat3FromMat4(m: Float32Array): Float32Array;
/**
 * Invert and transpose 3x3 matrix for normal transformation
 */
export declare function mat3InvertTranspose(m: Float32Array): Float32Array;
/**
 * Create a camera with default settings
 */
export declare function createCamera(options?: CameraOptions): Camera;
/**
 * Update camera view matrix
 */
export declare function updateCameraView(camera: Camera): void;
/**
 * Update camera projection matrix
 */
export declare function updateCameraProjection(camera: Camera): void;
/**
 * Set camera position
 */
export declare function setCameraPosition(camera: Camera, x: number, y: number, z: number): void;
/**
 * Set camera target
 */
export declare function setCameraTarget(camera: Camera, x: number, y: number, z: number): void;
/**
 * Set camera aspect ratio
 */
export declare function setCameraAspect(camera: Camera, aspect: number): void;
/**
 * Orbit camera around target
 */
export declare function orbitCamera(camera: Camera, deltaX: number, deltaY: number): void;
/**
 * Zoom camera
 */
export declare function zoomCamera(camera: Camera, delta: number): void;
/**
 * Get view-projection matrix
 */
export declare function getViewProjectionMatrix(camera: Camera): Float32Array;
//# sourceMappingURL=camera.d.ts.map