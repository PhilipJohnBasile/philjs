/**
 * @file 3D Primitives
 * @description Generate basic 3D primitive geometries
 */
import type { PrimitiveGeometry } from './types.js';
/**
 * Create a cube geometry
 */
export declare function createCube(size?: number): PrimitiveGeometry;
/**
 * Create a sphere geometry using UV mapping
 */
export declare function createSphere(radius?: number, widthSegments?: number, heightSegments?: number): PrimitiveGeometry;
/**
 * Create a plane geometry
 */
export declare function createPlane(width?: number, height?: number, widthSegments?: number, heightSegments?: number): PrimitiveGeometry;
/**
 * Create a cylinder geometry
 */
export declare function createCylinder(radiusTop?: number, radiusBottom?: number, height?: number, radialSegments?: number, heightSegments?: number, openEnded?: boolean): PrimitiveGeometry;
/**
 * Create a cone geometry
 */
export declare function createCone(radius?: number, height?: number, radialSegments?: number, heightSegments?: number, openEnded?: boolean): PrimitiveGeometry;
/**
 * Create a torus geometry
 */
export declare function createTorus(radius?: number, tube?: number, radialSegments?: number, tubularSegments?: number): PrimitiveGeometry;
/**
 * Create a box with rounded edges
 */
export declare function createRoundedBox(width?: number, height?: number, depth?: number, radius?: number, segments?: number): PrimitiveGeometry;
/**
 * Merge multiple geometries into one
 */
export declare function mergeGeometries(geometries: PrimitiveGeometry[]): PrimitiveGeometry;
/**
 * Transform geometry vertices
 */
export declare function transformGeometry(geometry: PrimitiveGeometry, matrix: Float32Array): PrimitiveGeometry;
//# sourceMappingURL=primitives.d.ts.map