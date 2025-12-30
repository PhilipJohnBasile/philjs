/**
 * @file Camera and Projection Utilities
 * @description Camera management and matrix utilities for 3D rendering
 */

import type { Camera, CameraOptions } from './types.js';

/**
 * Create a 4x4 identity matrix
 */
export function mat4Identity(): Float32Array {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

/**
 * Multiply two 4x4 matrices
 */
export function mat4Multiply(a: Float32Array, b: Float32Array): Float32Array {
  const result = new Float32Array(16);

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[i * 4 + k]! * b[k * 4 + j]!;
      }
      result[i * 4 + j] = sum;
    }
  }

  return result;
}

/**
 * Create a perspective projection matrix
 */
export function mat4Perspective(
  fov: number,
  aspect: number,
  near: number,
  far: number
): Float32Array {
  const f = 1.0 / Math.tan(fov / 2);
  const nf = 1 / (near - far);

  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

/**
 * Create an orthographic projection matrix
 */
export function mat4Orthographic(
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number
): Float32Array {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);

  return new Float32Array([
    -2 * lr, 0, 0, 0,
    0, -2 * bt, 0, 0,
    0, 0, 2 * nf, 0,
    (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1,
  ]);
}

/**
 * Create a look-at view matrix
 */
export function mat4LookAt(
  eye: Float32Array | number[],
  target: Float32Array | number[],
  up: Float32Array | number[]
): Float32Array {
  const zAxis = normalize([
    eye[0]! - target[0]!,
    eye[1]! - target[1]!,
    eye[2]! - target[2]!,
  ]);

  const xAxis = normalize(cross(up as number[], zAxis));
  const yAxis = normalize(cross(zAxis, xAxis));

  return new Float32Array([
    xAxis[0]!, yAxis[0]!, zAxis[0]!, 0,
    xAxis[1]!, yAxis[1]!, zAxis[1]!, 0,
    xAxis[2]!, yAxis[2]!, zAxis[2]!, 0,
    -dot(xAxis, eye as number[]), -dot(yAxis, eye as number[]), -dot(zAxis, eye as number[]), 1,
  ]);
}

/**
 * Create a translation matrix
 */
export function mat4Translate(x: number, y: number, z: number): Float32Array {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1,
  ]);
}

/**
 * Create a rotation matrix around X axis
 */
export function mat4RotateX(angle: number): Float32Array {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1,
  ]);
}

/**
 * Create a rotation matrix around Y axis
 */
export function mat4RotateY(angle: number): Float32Array {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1,
  ]);
}

/**
 * Create a rotation matrix around Z axis
 */
export function mat4RotateZ(angle: number): Float32Array {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    c, s, 0, 0,
    -s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

/**
 * Create a scale matrix
 */
export function mat4Scale(x: number, y: number, z: number): Float32Array {
  return new Float32Array([
    x, 0, 0, 0,
    0, y, 0, 0,
    0, 0, z, 0,
    0, 0, 0, 1,
  ]);
}

/**
 * Invert a 4x4 matrix
 */
export function mat4Invert(m: Float32Array): Float32Array {
  const result = new Float32Array(16);

  const m00 = m[0]!, m01 = m[1]!, m02 = m[2]!, m03 = m[3]!;
  const m10 = m[4]!, m11 = m[5]!, m12 = m[6]!, m13 = m[7]!;
  const m20 = m[8]!, m21 = m[9]!, m22 = m[10]!, m23 = m[11]!;
  const m30 = m[12]!, m31 = m[13]!, m32 = m[14]!, m33 = m[15]!;

  const tmp0 = m22 * m33 - m23 * m32;
  const tmp1 = m21 * m33 - m23 * m31;
  const tmp2 = m21 * m32 - m22 * m31;
  const tmp3 = m20 * m33 - m23 * m30;
  const tmp4 = m20 * m32 - m22 * m30;
  const tmp5 = m20 * m31 - m21 * m30;

  const t0 = tmp0 * m11 - tmp1 * m12 + tmp2 * m13;
  const t1 = -(tmp0 * m10 - tmp3 * m12 + tmp4 * m13);
  const t2 = tmp1 * m10 - tmp3 * m11 + tmp5 * m13;
  const t3 = -(tmp2 * m10 - tmp4 * m11 + tmp5 * m12);

  const det = 1.0 / (m00 * t0 + m01 * t1 + m02 * t2 + m03 * t3);

  result[0] = t0 * det;
  result[1] = (-(tmp0 * m01 - tmp1 * m02 + tmp2 * m03)) * det;
  result[2] = (m01 * (m12 * m33 - m13 * m32) - m02 * (m11 * m33 - m13 * m31) + m03 * (m11 * m32 - m12 * m31)) * det;
  result[3] = (-(m01 * (m12 * m23 - m13 * m22) - m02 * (m11 * m23 - m13 * m21) + m03 * (m11 * m22 - m12 * m21))) * det;

  result[4] = t1 * det;
  result[5] = (tmp0 * m00 - tmp3 * m02 + tmp4 * m03) * det;
  result[6] = (-(m00 * (m12 * m33 - m13 * m32) - m02 * (m10 * m33 - m13 * m30) + m03 * (m10 * m32 - m12 * m30))) * det;
  result[7] = (m00 * (m12 * m23 - m13 * m22) - m02 * (m10 * m23 - m13 * m20) + m03 * (m10 * m22 - m12 * m20)) * det;

  result[8] = t2 * det;
  result[9] = (-(tmp1 * m00 - tmp3 * m01 + tmp5 * m03)) * det;
  result[10] = (m00 * (m11 * m33 - m13 * m31) - m01 * (m10 * m33 - m13 * m30) + m03 * (m10 * m31 - m11 * m30)) * det;
  result[11] = (-(m00 * (m11 * m23 - m13 * m21) - m01 * (m10 * m23 - m13 * m20) + m03 * (m10 * m21 - m11 * m20))) * det;

  result[12] = t3 * det;
  result[13] = (tmp2 * m00 - tmp4 * m01 + tmp5 * m02) * det;
  result[14] = (-(m00 * (m11 * m32 - m12 * m31) - m01 * (m10 * m32 - m12 * m30) + m02 * (m10 * m31 - m11 * m30))) * det;
  result[15] = (m00 * (m11 * m22 - m12 * m21) - m01 * (m10 * m22 - m12 * m20) + m02 * (m10 * m21 - m11 * m20)) * det;

  return result;
}

/**
 * Transpose a 4x4 matrix
 */
export function mat4Transpose(m: Float32Array): Float32Array {
  return new Float32Array([
    m[0]!, m[4]!, m[8]!, m[12]!,
    m[1]!, m[5]!, m[9]!, m[13]!,
    m[2]!, m[6]!, m[10]!, m[14]!,
    m[3]!, m[7]!, m[11]!, m[15]!,
  ]);
}

/**
 * Extract 3x3 normal matrix from 4x4 model-view matrix
 */
export function mat3FromMat4(m: Float32Array): Float32Array {
  return new Float32Array([
    m[0]!, m[1]!, m[2]!,
    m[4]!, m[5]!, m[6]!,
    m[8]!, m[9]!, m[10]!,
  ]);
}

/**
 * Invert and transpose 3x3 matrix for normal transformation
 */
export function mat3InvertTranspose(m: Float32Array): Float32Array {
  const a00 = m[0]!, a01 = m[1]!, a02 = m[2]!;
  const a10 = m[3]!, a11 = m[4]!, a12 = m[5]!;
  const a20 = m[6]!, a21 = m[7]!, a22 = m[8]!;

  const b01 = a22 * a11 - a12 * a21;
  const b11 = -a22 * a10 + a12 * a20;
  const b21 = a21 * a10 - a11 * a20;

  const det = a00 * b01 + a01 * b11 + a02 * b21;

  if (!det) {
    return new Float32Array(9);
  }

  const invDet = 1.0 / det;

  return new Float32Array([
    b01 * invDet,
    (-a22 * a01 + a02 * a21) * invDet,
    (a12 * a01 - a02 * a11) * invDet,
    b11 * invDet,
    (a22 * a00 - a02 * a20) * invDet,
    (-a12 * a00 + a02 * a10) * invDet,
    b21 * invDet,
    (-a21 * a00 + a01 * a20) * invDet,
    (a11 * a00 - a01 * a10) * invDet,
  ]);
}

// Vector utilities

function normalize(v: number[]): number[] {
  const len = Math.sqrt(v[0]! * v[0]! + v[1]! * v[1]! + v[2]! * v[2]!);
  if (len === 0) return [0, 0, 0];
  return [v[0]! / len, v[1]! / len, v[2]! / len];
}

function cross(a: number[], b: number[]): number[] {
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}

function dot(a: number[], b: number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}

/**
 * Create a camera with default settings
 */
export function createCamera(options: CameraOptions = {}): Camera {
  const position = new Float32Array(options.position ?? [0, 0, 5]);
  const target = new Float32Array(options.target ?? [0, 0, 0]);
  const up = new Float32Array(options.up ?? [0, 1, 0]);
  const fov = options.fov ?? Math.PI / 4;
  const aspect = options.aspect ?? 1;
  const near = options.near ?? 0.1;
  const far = options.far ?? 1000;

  const viewMatrix = mat4LookAt(position, target, up);
  const projectionMatrix = mat4Perspective(fov, aspect, near, far);

  return {
    position,
    target,
    up,
    fov,
    aspect,
    near,
    far,
    viewMatrix,
    projectionMatrix,
  };
}

/**
 * Update camera view matrix
 */
export function updateCameraView(camera: Camera): void {
  const view = mat4LookAt(camera.position, camera.target, camera.up);
  camera.viewMatrix.set(view);
}

/**
 * Update camera projection matrix
 */
export function updateCameraProjection(camera: Camera): void {
  const projection = mat4Perspective(camera.fov, camera.aspect, camera.near, camera.far);
  camera.projectionMatrix.set(projection);
}

/**
 * Set camera position
 */
export function setCameraPosition(camera: Camera, x: number, y: number, z: number): void {
  camera.position[0] = x;
  camera.position[1] = y;
  camera.position[2] = z;
  updateCameraView(camera);
}

/**
 * Set camera target
 */
export function setCameraTarget(camera: Camera, x: number, y: number, z: number): void {
  camera.target[0] = x;
  camera.target[1] = y;
  camera.target[2] = z;
  updateCameraView(camera);
}

/**
 * Set camera aspect ratio
 */
export function setCameraAspect(camera: Camera, aspect: number): void {
  camera.aspect = aspect;
  updateCameraProjection(camera);
}

/**
 * Orbit camera around target
 */
export function orbitCamera(camera: Camera, deltaX: number, deltaY: number): void {
  const dx = camera.position[0]! - camera.target[0]!;
  const dy = camera.position[1]! - camera.target[1]!;
  const dz = camera.position[2]! - camera.target[2]!;

  const radius = Math.sqrt(dx * dx + dy * dy + dz * dz);
  let theta = Math.atan2(dx, dz);
  let phi = Math.acos(dy / radius);

  theta += deltaX;
  phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + deltaY));

  camera.position[0] = camera.target[0]! + radius * Math.sin(phi) * Math.sin(theta);
  camera.position[1] = camera.target[1]! + radius * Math.cos(phi);
  camera.position[2] = camera.target[2]! + radius * Math.sin(phi) * Math.cos(theta);

  updateCameraView(camera);
}

/**
 * Zoom camera
 */
export function zoomCamera(camera: Camera, delta: number): void {
  const dx = camera.position[0]! - camera.target[0]!;
  const dy = camera.position[1]! - camera.target[1]!;
  const dz = camera.position[2]! - camera.target[2]!;

  const factor = 1 + delta;
  camera.position[0] = camera.target[0]! + dx * factor;
  camera.position[1] = camera.target[1]! + dy * factor;
  camera.position[2] = camera.target[2]! + dz * factor;

  updateCameraView(camera);
}

/**
 * Get view-projection matrix
 */
export function getViewProjectionMatrix(camera: Camera): Float32Array {
  return mat4Multiply(camera.projectionMatrix, camera.viewMatrix);
}
