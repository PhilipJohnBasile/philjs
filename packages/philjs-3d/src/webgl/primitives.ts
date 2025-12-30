/**
 * @file 3D Primitives
 * @description Generate basic 3D primitive geometries
 */

import type { PrimitiveGeometry } from './types.js';

/**
 * Create a cube geometry
 */
export function createCube(size: number = 1): PrimitiveGeometry {
  const s = size / 2;

  // prettier-ignore
  const vertices = new Float32Array([
    // Front face
    -s, -s,  s,
     s, -s,  s,
     s,  s,  s,
    -s,  s,  s,
    // Back face
    -s, -s, -s,
    -s,  s, -s,
     s,  s, -s,
     s, -s, -s,
    // Top face
    -s,  s, -s,
    -s,  s,  s,
     s,  s,  s,
     s,  s, -s,
    // Bottom face
    -s, -s, -s,
     s, -s, -s,
     s, -s,  s,
    -s, -s,  s,
    // Right face
     s, -s, -s,
     s,  s, -s,
     s,  s,  s,
     s, -s,  s,
    // Left face
    -s, -s, -s,
    -s, -s,  s,
    -s,  s,  s,
    -s,  s, -s,
  ]);

  // prettier-ignore
  const normals = new Float32Array([
    // Front
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    // Back
    0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
    // Top
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
    // Bottom
    0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
    // Right
    1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
    // Left
    -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
  ]);

  // prettier-ignore
  const uvs = new Float32Array([
    // Front
    0, 0,  1, 0,  1, 1,  0, 1,
    // Back
    1, 0,  1, 1,  0, 1,  0, 0,
    // Top
    0, 1,  0, 0,  1, 0,  1, 1,
    // Bottom
    1, 1,  0, 1,  0, 0,  1, 0,
    // Right
    1, 0,  1, 1,  0, 1,  0, 0,
    // Left
    0, 0,  1, 0,  1, 1,  0, 1,
  ]);

  // prettier-ignore
  const indices = new Uint16Array([
    0,  1,  2,    0,  2,  3,   // Front
    4,  5,  6,    4,  6,  7,   // Back
    8,  9,  10,   8,  10, 11,  // Top
    12, 13, 14,   12, 14, 15,  // Bottom
    16, 17, 18,   16, 18, 19,  // Right
    20, 21, 22,   20, 22, 23,  // Left
  ]);

  return { vertices, normals, uvs, indices };
}

/**
 * Create a sphere geometry using UV mapping
 */
export function createSphere(
  radius: number = 0.5,
  widthSegments: number = 32,
  heightSegments: number = 16
): PrimitiveGeometry {
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Generate vertices, normals, and UVs
  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const phi = v * Math.PI;

    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const theta = u * Math.PI * 2;

      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      const nx = cosTheta * sinPhi;
      const ny = cosPhi;
      const nz = sinTheta * sinPhi;

      vertices.push(radius * nx, radius * ny, radius * nz);
      normals.push(nx, ny, nz);
      uvs.push(u, 1 - v);
    }
  }

  // Generate indices
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const a = y * (widthSegments + 1) + x;
      const b = a + widthSegments + 1;

      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const indexArray = indices.length > 65535
    ? new Uint32Array(indices)
    : new Uint16Array(indices);

  return {
    vertices: new Float32Array(vertices),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: indexArray,
  };
}

/**
 * Create a plane geometry
 */
export function createPlane(
  width: number = 1,
  height: number = 1,
  widthSegments: number = 1,
  heightSegments: number = 1
): PrimitiveGeometry {
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const halfWidth = width / 2;
  const halfHeight = height / 2;

  const segmentWidth = width / widthSegments;
  const segmentHeight = height / heightSegments;

  // Generate vertices
  for (let iy = 0; iy <= heightSegments; iy++) {
    const y = iy * segmentHeight - halfHeight;

    for (let ix = 0; ix <= widthSegments; ix++) {
      const x = ix * segmentWidth - halfWidth;

      vertices.push(x, 0, y);
      normals.push(0, 1, 0);
      uvs.push(ix / widthSegments, 1 - iy / heightSegments);
    }
  }

  // Generate indices
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = ix + (widthSegments + 1) * iy;
      const b = ix + (widthSegments + 1) * (iy + 1);
      const c = ix + 1 + (widthSegments + 1) * (iy + 1);
      const d = ix + 1 + (widthSegments + 1) * iy;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices),
  };
}

/**
 * Create a cylinder geometry
 */
export function createCylinder(
  radiusTop: number = 0.5,
  radiusBottom: number = 0.5,
  height: number = 1,
  radialSegments: number = 32,
  heightSegments: number = 1,
  openEnded: boolean = false
): PrimitiveGeometry {
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const halfHeight = height / 2;
  let index = 0;

  // Generate body
  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const radius = v * (radiusBottom - radiusTop) + radiusTop;
    const py = v * height - halfHeight;

    for (let x = 0; x <= radialSegments; x++) {
      const u = x / radialSegments;
      const theta = u * Math.PI * 2;

      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      vertices.push(radius * sinTheta, py, radius * cosTheta);

      // Calculate normal
      const slope = (radiusBottom - radiusTop) / height;
      const normalLen = Math.sqrt(1 + slope * slope);
      normals.push(sinTheta / normalLen, slope / normalLen, cosTheta / normalLen);

      uvs.push(u, 1 - v);
    }
  }

  // Generate body indices
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < radialSegments; x++) {
      const a = y * (radialSegments + 1) + x;
      const b = a + radialSegments + 1;

      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  // Generate caps
  if (!openEnded) {
    // Top cap
    if (radiusTop > 0) {
      index = vertices.length / 3;
      const centerIndex = index;

      // Center vertex
      vertices.push(0, halfHeight, 0);
      normals.push(0, 1, 0);
      uvs.push(0.5, 0.5);

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * Math.PI * 2;

        vertices.push(radiusTop * Math.sin(theta), halfHeight, radiusTop * Math.cos(theta));
        normals.push(0, 1, 0);
        uvs.push(0.5 + 0.5 * Math.sin(theta), 0.5 + 0.5 * Math.cos(theta));
      }

      for (let x = 0; x < radialSegments; x++) {
        indices.push(centerIndex, centerIndex + x + 2, centerIndex + x + 1);
      }
    }

    // Bottom cap
    if (radiusBottom > 0) {
      index = vertices.length / 3;
      const centerIndex = index;

      // Center vertex
      vertices.push(0, -halfHeight, 0);
      normals.push(0, -1, 0);
      uvs.push(0.5, 0.5);

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * Math.PI * 2;

        vertices.push(radiusBottom * Math.sin(theta), -halfHeight, radiusBottom * Math.cos(theta));
        normals.push(0, -1, 0);
        uvs.push(0.5 + 0.5 * Math.sin(theta), 0.5 - 0.5 * Math.cos(theta));
      }

      for (let x = 0; x < radialSegments; x++) {
        indices.push(centerIndex, centerIndex + x + 1, centerIndex + x + 2);
      }
    }
  }

  const indexArray = indices.length > 65535
    ? new Uint32Array(indices)
    : new Uint16Array(indices);

  return {
    vertices: new Float32Array(vertices),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: indexArray,
  };
}

/**
 * Create a cone geometry
 */
export function createCone(
  radius: number = 0.5,
  height: number = 1,
  radialSegments: number = 32,
  heightSegments: number = 1,
  openEnded: boolean = false
): PrimitiveGeometry {
  return createCylinder(0, radius, height, radialSegments, heightSegments, openEnded);
}

/**
 * Create a torus geometry
 */
export function createTorus(
  radius: number = 0.5,
  tube: number = 0.2,
  radialSegments: number = 32,
  tubularSegments: number = 24
): PrimitiveGeometry {
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= radialSegments; j++) {
    const v = j / radialSegments;
    const phi = v * Math.PI * 2;

    for (let i = 0; i <= tubularSegments; i++) {
      const u = i / tubularSegments;
      const theta = u * Math.PI * 2;

      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      const centerX = radius * cosTheta;
      const centerZ = radius * sinTheta;

      const x = (radius + tube * cosPhi) * cosTheta;
      const y = tube * sinPhi;
      const z = (radius + tube * cosPhi) * sinTheta;

      vertices.push(x, y, z);

      const nx = cosPhi * cosTheta;
      const ny = sinPhi;
      const nz = cosPhi * sinTheta;
      normals.push(nx, ny, nz);

      uvs.push(u, v);
    }
  }

  for (let j = 0; j < radialSegments; j++) {
    for (let i = 0; i < tubularSegments; i++) {
      const a = (tubularSegments + 1) * j + i;
      const b = (tubularSegments + 1) * (j + 1) + i;
      const c = (tubularSegments + 1) * (j + 1) + i + 1;
      const d = (tubularSegments + 1) * j + i + 1;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const indexArray = indices.length > 65535
    ? new Uint32Array(indices)
    : new Uint16Array(indices);

  return {
    vertices: new Float32Array(vertices),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: indexArray,
  };
}

/**
 * Create a box with rounded edges
 */
export function createRoundedBox(
  width: number = 1,
  height: number = 1,
  depth: number = 1,
  radius: number = 0.1,
  segments: number = 4
): PrimitiveGeometry {
  // For simplicity, use cube with modified dimensions
  // A more complete implementation would generate actual rounded corners
  const innerWidth = width - radius * 2;
  const innerHeight = height - radius * 2;
  const innerDepth = depth - radius * 2;

  // Create base cube
  const cube = createCube(1);

  // Scale vertices to match dimensions
  const vertices = new Float32Array(cube.vertices.length);
  for (let i = 0; i < cube.vertices.length; i += 3) {
    vertices[i] = cube.vertices[i]! * width;
    vertices[i + 1] = cube.vertices[i + 1]! * height;
    vertices[i + 2] = cube.vertices[i + 2]! * depth;
  }

  return {
    vertices,
    normals: cube.normals,
    uvs: cube.uvs,
    indices: cube.indices,
  };
}

/**
 * Merge multiple geometries into one
 */
export function mergeGeometries(geometries: PrimitiveGeometry[]): PrimitiveGeometry {
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  let indexOffset = 0;

  for (const geom of geometries) {
    // Copy vertices
    for (let i = 0; i < geom.vertices.length; i++) {
      vertices.push(geom.vertices[i]!);
    }

    // Copy normals
    for (let i = 0; i < geom.normals.length; i++) {
      normals.push(geom.normals[i]!);
    }

    // Copy UVs
    for (let i = 0; i < geom.uvs.length; i++) {
      uvs.push(geom.uvs[i]!);
    }

    // Copy indices with offset
    for (let i = 0; i < geom.indices.length; i++) {
      indices.push(geom.indices[i]! + indexOffset);
    }

    indexOffset += geom.vertices.length / 3;
  }

  const indexArray = indices.length > 65535
    ? new Uint32Array(indices)
    : new Uint16Array(indices);

  return {
    vertices: new Float32Array(vertices),
    normals: new Float32Array(normals),
    uvs: new Float32Array(uvs),
    indices: indexArray,
  };
}

/**
 * Transform geometry vertices
 */
export function transformGeometry(
  geometry: PrimitiveGeometry,
  matrix: Float32Array
): PrimitiveGeometry {
  const vertices = new Float32Array(geometry.vertices.length);
  const normals = new Float32Array(geometry.normals.length);

  // Transform vertices
  for (let i = 0; i < geometry.vertices.length; i += 3) {
    const x = geometry.vertices[i];
    const y = geometry.vertices[i + 1];
    const z = geometry.vertices[i + 2];

    vertices[i] = matrix[0]! * x! + matrix[4]! * y! + matrix[8]! * z! + matrix[12]!;
    vertices[i + 1] = matrix[1]! * x! + matrix[5]! * y! + matrix[9]! * z! + matrix[13]!;
    vertices[i + 2] = matrix[2]! * x! + matrix[6]! * y! + matrix[10]! * z! + matrix[14]!;
  }

  // Transform normals (using upper-left 3x3 without translation)
  for (let i = 0; i < geometry.normals.length; i += 3) {
    const x = geometry.normals[i];
    const y = geometry.normals[i + 1];
    const z = geometry.normals[i + 2];

    const nx = matrix[0]! * x! + matrix[4]! * y! + matrix[8]! * z!;
    const ny = matrix[1]! * x! + matrix[5]! * y! + matrix[9]! * z!;
    const nz = matrix[2]! * x! + matrix[6]! * y! + matrix[10]! * z!;

    // Normalize
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    normals[i] = nx / len;
    normals[i + 1] = ny / len;
    normals[i + 2] = nz / len;
  }

  return {
    vertices,
    normals,
    uvs: geometry.uvs,
    indices: geometry.indices,
  };
}
