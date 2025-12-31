# @philjs/3d-physics

High-performance 3D physics engine for PhilJS applications with multiple backend support.

![Node 24+](https://img.shields.io/badge/Node-24%2B-brightgreen)
![TypeScript 6](https://img.shields.io/badge/TypeScript-6-blue)

## Features

- Multiple physics backends (Rapier, Cannon.js, Ammo.js)
- Rigid body dynamics with continuous collision detection
- Soft body simulation (cloth, rope, deformables)
- Joints and constraints (hinge, ball, slider, spring)
- Vehicle physics (car, tank, hover)
- Character controller with ground detection
- Ragdoll physics
- Deterministic physics for multiplayer

## Installation

```bash
npm install @philjs/3d-physics
```

## Usage

### Basic Physics World

```typescript
import { PhysicsWorld, usePhysicsWorld, useRigidBody } from '@philjs/3d-physics';

// Create a physics world with Rapier backend
const world = await PhysicsWorld.create({
  backend: 'rapier',
  gravity: { x: 0, y: -9.81, z: 0 },
  enableCCD: true,
  enableSleeping: true
});

// Add a dynamic rigid body
world.createRigidBody('ball', {
  type: 'dynamic',
  mass: 1,
  friction: 0.5,
  restitution: 0.7
}, { x: 0, y: 10, z: 0 }, { x: 0, y: 0, z: 0, w: 1 });

world.addCollider('ball', {
  shape: 'sphere',
  radius: 0.5
});

// Step the simulation
world.step(1/60);
```

### Character Controller

```typescript
import { useCharacterController } from '@philjs/3d-physics';

const controller = useCharacterController(world, 'player', {
  height: 1.8,
  radius: 0.3,
  stepHeight: 0.35,
  slopeLimit: 45,
  speed: 5,
  jumpForce: 8
});

// Move the character
controller.move({ x: 1, y: 0, z: 0 });
controller.jump();

// Check ground state
if (controller.isGrounded()) {
  // Character is on the ground
}
```

### Vehicle Physics

```typescript
import { useVehicle } from '@philjs/3d-physics';

const vehicle = useVehicle(world, 'car', {
  chassis: {
    mass: 1500,
    size: { x: 2, y: 0.5, z: 4 }
  },
  wheels: [
    { position: { x: -0.8, y: -0.3, z: 1.2 }, radius: 0.4, isSteering: true },
    { position: { x: 0.8, y: -0.3, z: 1.2 }, radius: 0.4, isSteering: true },
    { position: { x: -0.8, y: -0.3, z: -1.2 }, radius: 0.4, isDrive: true },
    { position: { x: 0.8, y: -0.3, z: -1.2 }, radius: 0.4, isDrive: true }
  ],
  maxSpeed: 50,
  acceleration: 20
});

// Control the vehicle
vehicle.accelerate(1.0);   // 0-1 throttle
vehicle.steer(-0.5);       // -1 to 1 steering
vehicle.brake(0.8);        // 0-1 brake force
```

### Ragdoll Physics

```typescript
import { useRagdoll } from '@philjs/3d-physics';

const ragdoll = useRagdoll(world, 'enemy', { x: 0, y: 5, z: 0 }, {
  scale: 1.0,
  limbMass: 2
});

// Get bone positions for rendering
const headPos = ragdoll.getBonePosition('head');
const headRot = ragdoll.getBoneRotation('head');

// Apply impact force
ragdoll.applyImpulse('chest', { x: 100, y: 50, z: 0 });
```

### Raycasting

```typescript
// Cast a ray
const hit = world.raycast(
  { x: 0, y: 10, z: 0 },  // origin
  { x: 0, y: -1, z: 0 },  // direction
  100                      // max distance
);

if (hit.hit) {
  console.log('Hit body:', hit.bodyId);
  console.log('Hit point:', hit.point);
  console.log('Distance:', hit.distance);
}
```

## API Reference

### PhysicsWorld

| Method | Description |
|--------|-------------|
| `create(config)` | Create a new physics world |
| `step(dt)` | Step the simulation |
| `createRigidBody(id, config, position, rotation)` | Create a rigid body |
| `removeRigidBody(id)` | Remove a rigid body |
| `addCollider(bodyId, config)` | Add a collider to a body |
| `createJoint(id, config)` | Create a joint between bodies |
| `raycast(origin, direction, maxDistance)` | Cast a ray |
| `getPosition(bodyId)` | Get body position |
| `applyForce(bodyId, force)` | Apply force to a body |
| `applyImpulse(bodyId, impulse)` | Apply impulse to a body |

### Hooks

| Hook | Description |
|------|-------------|
| `usePhysicsWorld(config)` | Create and manage a physics world |
| `useRigidBody(world, id, config)` | Create and manage a rigid body |
| `useCharacterController(world, id, config)` | Character controller with movement |
| `useVehicle(world, id, config)` | Vehicle physics controller |
| `useRagdoll(world, id, position, config)` | Ragdoll physics system |

### Types

```typescript
interface PhysicsConfig {
  backend: 'rapier' | 'cannon' | 'ammo';
  gravity?: Vector3;
  timestep?: number;
  substeps?: number;
  enableCCD?: boolean;
  enableSleeping?: boolean;
  deterministic?: boolean;
}

interface RigidBodyConfig {
  type: 'dynamic' | 'static' | 'kinematic';
  mass?: number;
  friction?: number;
  restitution?: number;
  linearDamping?: number;
  angularDamping?: number;
}

interface ColliderConfig {
  shape: 'box' | 'sphere' | 'capsule' | 'cylinder' | 'convex' | 'trimesh';
  size?: Vector3;
  radius?: number;
  height?: number;
  isSensor?: boolean;
}
```

## License

MIT
