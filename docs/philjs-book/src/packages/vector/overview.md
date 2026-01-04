# @philjs/vector

Vector math and geometry utilities for PhilJS 2D/3D applications.

## Installation

```bash
npm install @philjs/vector
```

## Overview

`@philjs/vector` provides vector math for PhilJS:

- **2D Vectors**: Vec2 operations
- **3D Vectors**: Vec3 operations
- **Matrices**: 2D and 3D transformations
- **Quaternions**: 3D rotations
- **Geometry**: Lines, rays, intersections
- **SIMD Optimization**: Hardware acceleration

## Quick Start

```typescript
import { Vec2, Vec3, Mat4 } from '@philjs/vector';

// 2D vector operations
const a = Vec2.create(1, 2);
const b = Vec2.create(3, 4);
const sum = Vec2.add(a, b); // { x: 4, y: 6 }
const dot = Vec2.dot(a, b); // 11
const len = Vec2.length(a); // 2.236...

// 3D vector operations
const v = Vec3.create(1, 2, 3);
const normalized = Vec3.normalize(v);
const cross = Vec3.cross(v, Vec3.UP);
```

## Vec2 Operations

```typescript
import { Vec2 } from '@philjs/vector';

// Creation
const v = Vec2.create(x, y);
const zero = Vec2.zero();
const one = Vec2.one();

// Operations
Vec2.add(a, b);
Vec2.sub(a, b);
Vec2.mul(a, b);
Vec2.scale(a, scalar);
Vec2.dot(a, b);
Vec2.cross(a, b); // Returns scalar (z-component)
Vec2.length(a);
Vec2.normalize(a);
Vec2.lerp(a, b, t);
Vec2.angle(a, b);
Vec2.rotate(a, radians);
```

## Vec3 Operations

```typescript
import { Vec3 } from '@philjs/vector';

// Creation
const v = Vec3.create(x, y, z);
Vec3.UP;     // { x: 0, y: 1, z: 0 }
Vec3.RIGHT;  // { x: 1, y: 0, z: 0 }
Vec3.FORWARD; // { x: 0, y: 0, z: 1 }

// Operations
Vec3.add(a, b);
Vec3.sub(a, b);
Vec3.cross(a, b);
Vec3.dot(a, b);
Vec3.normalize(a);
Vec3.lerp(a, b, t);
Vec3.slerp(a, b, t);
Vec3.reflect(v, normal);
Vec3.project(a, b);
```

## Matrices

```typescript
import { Mat4, Mat3 } from '@philjs/vector';

// 4x4 transformation matrix
const model = Mat4.identity();
Mat4.translate(model, Vec3.create(1, 2, 3));
Mat4.rotateY(model, Math.PI / 4);
Mat4.scale(model, Vec3.create(2, 2, 2));

// Transform a point
const worldPos = Mat4.transformPoint(model, localPos);

// Camera matrices
const view = Mat4.lookAt(eye, target, up);
const proj = Mat4.perspective(fov, aspect, near, far);
const mvp = Mat4.multiply(proj, Mat4.multiply(view, model));
```

## Quaternions

```typescript
import { Quat } from '@philjs/vector';

// Create from axis-angle
const q = Quat.fromAxisAngle(Vec3.UP, Math.PI / 2);

// Create from euler angles
const rotation = Quat.fromEuler(pitch, yaw, roll);

// Operations
Quat.multiply(a, b);
Quat.slerp(a, b, t);
Quat.rotateVector(q, v);
Quat.toMatrix(q);
```

## Geometry

```typescript
import { Ray, Line, intersect } from '@philjs/vector';

// Ray casting
const ray = Ray.create(origin, direction);
const hit = Ray.intersectPlane(ray, planeNormal, planeDistance);

// Line segment
const line = Line.create(start, end);
const closest = Line.closestPoint(line, point);

// Intersections
const intersection = intersect.rayTriangle(ray, v0, v1, v2);
const overlap = intersect.aabbAabb(box1, box2);
```

## See Also

- [@philjs/3d](../3d/overview.md) - 3D rendering
- [@philjs/3d-physics](../3d-physics/overview.md) - Physics engine
- [@philjs/motion](../motion/overview.md) - Animation
