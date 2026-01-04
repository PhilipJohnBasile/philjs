# @philjs/3d-physics

The `@philjs/3d-physics` package provides a high-performance, backend-agnostic 3D physics engine for PhilJS applications. It supports multiple physics backends (Rapier, Cannon.js, Ammo.js), rigid body dynamics, joints and constraints, vehicle physics, character controllers, ragdoll systems, and seamless integration with `@philjs/3d`.

## Installation

```bash
npm install @philjs/3d-physics
```

## Features

- **Multiple Physics Backends** - Rapier, Cannon.js, and Ammo.js support
- **Rigid Body Dynamics** - Dynamic, static, and kinematic bodies with continuous collision detection
- **Collider Shapes** - Box, sphere, capsule, cylinder, cone, convex hull, and triangle mesh
- **Joints and Constraints** - Fixed, revolute, prismatic, spherical, rope, spring, and motor joints
- **Character Controller** - Ground detection, movement, jumping, slope handling
- **Vehicle Physics** - Wheel suspension, steering, engine force, braking
- **Ragdoll Physics** - Full humanoid ragdoll with bone structure and joint limits
- **Raycasting and Shape Casting** - Query the physics world for intersections
- **Collision Events** - Contact detection with impulse and separation data
- **Deterministic Physics** - Support for multiplayer synchronization
- **React Hooks** - Convenient hooks for physics integration

---

## Physics Worlds and Configuration

The physics world is the central manager for all physics simulation. It wraps the underlying physics backend and provides a unified API.

### Creating a Physics World

```typescript
import { PhysicsWorld, type PhysicsConfig } from '@philjs/3d-physics';

const config: PhysicsConfig = {
  backend: 'rapier',        // 'rapier' | 'cannon' | 'ammo'
  gravity: { x: 0, y: -9.81, z: 0 },
  timestep: 1 / 60,         // Fixed timestep (default: 1/60)
  substeps: 4,              // Solver iterations
  broadphase: 'dbvt',       // 'naive' | 'sap' | 'dbvt'
  enableCCD: true,          // Continuous collision detection
  enableSleeping: true,     // Allow bodies to sleep when inactive
  deterministic: false,     // Deterministic simulation for multiplayer
};

const world = new PhysicsWorld(config);
await world.init();
world.start();
```

### PhysicsConfig Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `backend` | `'rapier' \| 'cannon' \| 'ammo'` | Required | Physics engine backend |
| `gravity` | `Vector3` | `{ x: 0, y: -9.81, z: 0 }` | World gravity |
| `timestep` | `number` | `1/60` | Fixed simulation timestep |
| `substeps` | `number` | `4` | Solver iteration count |
| `broadphase` | `'naive' \| 'sap' \| 'dbvt'` | `'dbvt'` | Broad phase algorithm |
| `enableCCD` | `boolean` | `false` | Enable continuous collision detection |
| `enableSleeping` | `boolean` | `true` | Allow inactive bodies to sleep |
| `deterministic` | `boolean` | `false` | Enable deterministic simulation |

### Physics Backends Comparison

| Backend | Performance | Features | Bundle Size | Best For |
|---------|-------------|----------|-------------|----------|
| **Rapier** | Excellent | Full-featured | ~400KB | Games, simulations |
| **Cannon.js** | Good | Good basics | ~150KB | Simple games, prototypes |
| **Ammo.js** | Very Good | Bullet physics | ~1MB | Complex simulations |

### Starting and Stopping

```typescript
// Start the physics simulation
world.start();

// Stop the simulation
world.stop();

// Clean up resources
world.destroy();
```

---

## Rigid Bodies

Rigid bodies are the fundamental physics objects. They can be dynamic (affected by forces), static (immovable), or kinematic (controlled programmatically).

### Creating Rigid Bodies

```typescript
import { type RigidBodyConfig, type Vector3, type Quaternion } from '@philjs/3d-physics';

// Dynamic body (affected by physics)
world.createRigidBody('ball', {
  type: 'dynamic',
  mass: 1,
  linearDamping: 0.1,
  angularDamping: 0.1,
  friction: 0.5,
  restitution: 0.7,       // Bounciness
  gravityScale: 1,
  canSleep: true,
  ccd: true,              // Continuous collision detection
  collisionGroups: 1,
  collisionMask: -1,
}, { x: 0, y: 5, z: 0 });  // Initial position

// Static body (immovable)
world.createRigidBody('ground', {
  type: 'static',
  friction: 0.8,
  restitution: 0.2,
}, { x: 0, y: 0, z: 0 });

// Kinematic body (programmatically controlled)
world.createRigidBody('platform', {
  type: 'kinematic',
  canSleep: false,
}, { x: 0, y: 2, z: 0 });
```

### RigidBodyConfig Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `'dynamic' \| 'static' \| 'kinematic'` | Required | Body type |
| `mass` | `number` | `1` | Body mass (dynamic only) |
| `linearDamping` | `number` | `0.01` | Linear velocity damping |
| `angularDamping` | `number` | `0.01` | Angular velocity damping |
| `friction` | `number` | `0.3` | Surface friction |
| `restitution` | `number` | `0.3` | Bounciness (0-1) |
| `gravityScale` | `number` | `1` | Gravity multiplier |
| `canSleep` | `boolean` | `true` | Allow sleeping |
| `ccd` | `boolean` | `false` | Continuous collision detection |
| `collisionGroups` | `number` | `1` | Collision group bitmask |
| `collisionMask` | `number` | `-1` | Collision filter mask |

### Body Types Explained

**Dynamic Bodies:**
- Affected by gravity, forces, and collisions
- Use for objects that should move realistically (balls, boxes, characters)
- Have mass and respond to physics simulation

**Static Bodies:**
- Never move, infinite mass
- Use for ground, walls, and fixed obstacles
- Very efficient for collision detection

**Kinematic Bodies:**
- Move only when you set their position/velocity directly
- Not affected by forces or collisions with other kinematic/static bodies
- Use for moving platforms, doors, elevators

### Removing Bodies

```typescript
world.removeRigidBody('ball');
```

---

## Colliders and Shapes

Colliders define the physical shape of a rigid body for collision detection.

### Adding Colliders

```typescript
import { type ColliderConfig } from '@philjs/3d-physics';

// Box collider
world.addCollider('box', {
  shape: 'box',
  size: { x: 1, y: 1, z: 1 },  // Half-extents
  friction: 0.5,
  restitution: 0.3,
});

// Sphere collider
world.addCollider('ball', {
  shape: 'sphere',
  radius: 0.5,
});

// Capsule collider (great for characters)
world.addCollider('character', {
  shape: 'capsule',
  radius: 0.3,
  height: 1.8,
});

// Cylinder collider
world.addCollider('barrel', {
  shape: 'cylinder',
  radius: 0.5,
  height: 1.2,
});

// Cone collider
world.addCollider('cone', {
  shape: 'cone',
  radius: 0.5,
  height: 1.0,
});

// Convex hull (from vertices)
world.addCollider('rock', {
  shape: 'convex',
  vertices: new Float32Array([
    0, 1, 0,    // vertex 0
    -1, 0, 0,   // vertex 1
    1, 0, 0,    // vertex 2
    0, 0, 1,    // vertex 3
    0, 0, -1,   // vertex 4
  ]),
});

// Triangle mesh (for complex static geometry)
world.addCollider('terrain', {
  shape: 'trimesh',
  vertices: terrainVertices,   // Float32Array
  indices: terrainIndices,     // Uint32Array
});

// Sensor (triggers events but no physical response)
world.addCollider('trigger', {
  shape: 'box',
  size: { x: 2, y: 2, z: 2 },
  isSensor: true,
});
```

### ColliderConfig Options

| Option | Type | Description |
|--------|------|-------------|
| `shape` | `'box' \| 'sphere' \| 'capsule' \| 'cylinder' \| 'cone' \| 'convex' \| 'trimesh' \| 'heightfield'` | Shape type |
| `size` | `Vector3` | Half-extents for box |
| `radius` | `number` | Radius for sphere, capsule, cylinder, cone |
| `height` | `number` | Height for capsule, cylinder, cone |
| `vertices` | `Float32Array` | Vertex data for convex/trimesh |
| `indices` | `Uint32Array` | Index data for trimesh |
| `isSensor` | `boolean` | Trigger-only collider |
| `friction` | `number` | Surface friction |
| `restitution` | `number` | Bounciness |
| `density` | `number` | Mass density |

### Shape Selection Guide

| Shape | Use Case | Performance |
|-------|----------|-------------|
| `sphere` | Balls, projectiles | Fastest |
| `box` | Crates, buildings | Fast |
| `capsule` | Characters, pills | Fast |
| `cylinder` | Barrels, columns | Medium |
| `cone` | Spikes, traffic cones | Medium |
| `convex` | Irregular objects | Slower |
| `trimesh` | Terrain, complex static | Slowest (static only) |

---

## Forces and Impulses

Forces and impulses allow you to affect the motion of dynamic bodies.

### Applying Forces

Forces are applied continuously and accumulate over the simulation step:

```typescript
// Apply force at center of mass
world.applyForce('ball', { x: 0, y: 100, z: 0 });

// Apply force at a specific point (creates torque)
world.applyForce('ball',
  { x: 50, y: 0, z: 0 },        // Force vector
  { x: 0, y: 0.5, z: 0 }        // Application point
);

// Apply torque (rotational force)
world.applyTorque('ball', { x: 0, y: 10, z: 0 });
```

### Applying Impulses

Impulses cause an instant change in velocity:

```typescript
// Apply impulse at center of mass
world.applyImpulse('ball', { x: 0, y: 5, z: 0 });

// Apply impulse at a point (creates angular velocity)
world.applyImpulse('ball',
  { x: 5, y: 0, z: 0 },        // Impulse vector
  { x: 0, y: 0.5, z: 0 }       // Application point
);
```

### Forces vs Impulses

| Aspect | Force | Impulse |
|--------|-------|---------|
| Effect | Gradual acceleration | Instant velocity change |
| Duration | Applied each frame | Applied once |
| Use Case | Engines, gravity | Explosions, jumps |
| Units | Newtons (N) | Newton-seconds (Ns) |

### Setting Velocities Directly

```typescript
// Set linear velocity
world.setVelocity('ball', { x: 5, y: 0, z: 0 });

// Set angular velocity
world.setAngularVelocity('ball', { x: 0, y: 3.14, z: 0 });

// Get velocities
const velocity = world.getVelocity('ball');
const angularVelocity = world.getAngularVelocity('ball');
```

### Setting Positions and Rotations

```typescript
// Set position (teleport)
world.setPosition('ball', { x: 0, y: 10, z: 0 });

// Set rotation
world.setRotation('ball', { x: 0, y: 0, z: 0, w: 1 });

// Get transforms
const position = world.getPosition('ball');
const rotation = world.getRotation('ball');
```

---

## Collision Detection and Events

The physics world emits events for collisions and provides query methods for spatial queries.

### Collision Events

```typescript
// Listen for collision events
const unsubscribe = world.on('collision', (contact: ContactEvent) => {
  console.log(`Collision between ${contact.bodyA} and ${contact.bodyB}`);
  console.log(`  Point: ${contact.point.x}, ${contact.point.y}, ${contact.point.z}`);
  console.log(`  Normal: ${contact.normal.x}, ${contact.normal.y}, ${contact.normal.z}`);
  console.log(`  Impulse: ${contact.impulse}`);
  console.log(`  Separation: ${contact.separation}`);
});

// Stop listening
unsubscribe();
```

### ContactEvent Structure

```typescript
interface ContactEvent {
  bodyA: string;      // First body ID
  bodyB: string;      // Second body ID
  point: Vector3;     // Contact point in world space
  normal: Vector3;    // Contact normal (from A to B)
  impulse: number;    // Impact impulse magnitude
  separation: number; // Penetration depth (negative = overlapping)
}
```

### Update Events

```typescript
world.on('update', ({ dt, alpha }) => {
  // dt: time since last physics step
  // alpha: interpolation factor for rendering

  // Use alpha to interpolate between physics states
  const renderPosition = lerp(previousPosition, currentPosition, alpha);
});
```

### Raycasting

Cast a ray to find intersections with physics objects:

```typescript
import { type RaycastResult } from '@philjs/3d-physics';

const result: RaycastResult = world.raycast(
  { x: 0, y: 5, z: 0 },      // Origin
  { x: 0, y: -1, z: 0 },     // Direction (normalized)
  100                         // Max distance
);

if (result.hit) {
  console.log(`Hit body: ${result.bodyId}`);
  console.log(`Hit point: ${result.point.x}, ${result.point.y}, ${result.point.z}`);
  console.log(`Hit normal: ${result.normal.x}, ${result.normal.y}, ${result.normal.z}`);
  console.log(`Distance: ${result.distance}`);
}
```

### Shape Casting

Cast a shape along a ray to find intersections:

```typescript
const result = world.shapeCast(
  { shape: 'sphere', radius: 0.5 },  // Shape to cast
  { x: 0, y: 5, z: 0 },              // Origin
  { x: 0, y: -1, z: 0 },             // Direction
  100                                 // Max distance
);
```

---

## Constraints and Joints

Joints connect two rigid bodies and constrain their relative motion.

### Creating Joints

```typescript
import { type JointConfig } from '@philjs/3d-physics';

// Fixed joint (rigid connection)
world.createJoint('weld', {
  type: 'fixed',
  bodyA: 'body1',
  bodyB: 'body2',
  anchorA: { x: 0, y: 0.5, z: 0 },
  anchorB: { x: 0, y: -0.5, z: 0 },
});

// Revolute joint (hinge)
world.createJoint('hinge', {
  type: 'revolute',
  bodyA: 'door',
  bodyB: 'frame',
  anchorA: { x: -0.5, y: 0, z: 0 },
  anchorB: { x: 0.5, y: 0, z: 0 },
  axisA: { x: 0, y: 1, z: 0 },       // Rotation axis
  limitsEnabled: true,
  limitsMin: 0,
  limitsMax: Math.PI / 2,           // 90 degrees
  motorEnabled: true,
  motorVelocity: 2,
  motorMaxForce: 100,
});

// Prismatic joint (slider)
world.createJoint('slider', {
  type: 'prismatic',
  bodyA: 'platform',
  bodyB: 'base',
  axisA: { x: 0, y: 1, z: 0 },
  limitsEnabled: true,
  limitsMin: 0,
  limitsMax: 2,
});

// Spherical joint (ball socket)
world.createJoint('ballSocket', {
  type: 'spherical',
  bodyA: 'arm',
  bodyB: 'shoulder',
  anchorA: { x: 0, y: 0.5, z: 0 },
  anchorB: { x: 0, y: -0.1, z: 0 },
});

// Rope joint (distance constraint)
world.createJoint('rope', {
  type: 'rope',
  bodyA: 'anchor',
  bodyB: 'weight',
  anchorA: { x: 0, y: 0, z: 0 },
  anchorB: { x: 0, y: 0, z: 0 },
});

// Spring joint
world.createJoint('spring', {
  type: 'spring',
  bodyA: 'mass1',
  bodyB: 'mass2',
  anchorA: { x: 0, y: 0, z: 0 },
  anchorB: { x: 0, y: 0, z: 0 },
  stiffness: 100,    // Spring constant
  damping: 10,       // Damping coefficient
});
```

### JointConfig Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | `'fixed' \| 'revolute' \| 'prismatic' \| 'spherical' \| 'rope' \| 'spring' \| 'motor'` | Joint type |
| `bodyA` | `string` | First body ID |
| `bodyB` | `string` | Second body ID |
| `anchorA` | `Vector3` | Anchor point on body A (local space) |
| `anchorB` | `Vector3` | Anchor point on body B (local space) |
| `axisA` | `Vector3` | Axis for revolute/prismatic joints |
| `axisB` | `Vector3` | Secondary axis |
| `limitsEnabled` | `boolean` | Enable joint limits |
| `limitsMin` | `number` | Minimum limit (angle or distance) |
| `limitsMax` | `number` | Maximum limit |
| `motorEnabled` | `boolean` | Enable motor |
| `motorVelocity` | `number` | Target motor velocity |
| `motorMaxForce` | `number` | Maximum motor force |
| `stiffness` | `number` | Spring stiffness |
| `damping` | `number` | Spring damping |

### Joint Types Explained

| Joint Type | Degrees of Freedom | Use Case |
|------------|-------------------|----------|
| `fixed` | 0 | Welding objects together |
| `revolute` | 1 rotation | Hinges, doors, wheels |
| `prismatic` | 1 translation | Pistons, sliders |
| `spherical` | 3 rotation | Shoulders, ball sockets |
| `rope` | Distance constraint | Chains, ropes |
| `spring` | Elastic connection | Suspension, springs |

### Removing Joints

```typescript
world.removeJoint('hinge');
```

---

## Character Controller

The `CharacterController` provides a ready-to-use physics-based character with movement, jumping, and ground detection.

### Creating a Character

```typescript
import { CharacterController, type CharacterConfig } from '@philjs/3d-physics';

const config: CharacterConfig = {
  height: 1.8,
  radius: 0.3,
  mass: 70,
  maxSpeed: 5,
  jumpForce: 10,
  groundCheckDistance: 0.1,
  slopeLimit: 45,       // Maximum walkable slope in degrees
  stepHeight: 0.3,      // Maximum step height
};

const character = new CharacterController(world, 'player', config);
```

### Character Movement

```typescript
// Set movement input (normalized direction)
character.move({ x: 0, y: 0, z: 1 });  // Move forward

// Jump (returns false if not grounded)
const jumped = character.jump();

// Update each frame
world.on('update', () => {
  character.update();
});

// Check ground state
const isGrounded = character.getIsGrounded();
const groundNormal = character.getGroundNormal();
```

### Character Events

```typescript
character.on('landed', () => {
  console.log('Character landed');
  playLandingSound();
});

character.on('leftGround', () => {
  console.log('Character left ground');
});

character.on('jumped', () => {
  console.log('Character jumped');
  playJumpSound();
});
```

### CharacterConfig Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `height` | `number` | Required | Character height |
| `radius` | `number` | Required | Capsule radius |
| `mass` | `number` | `70` | Character mass |
| `maxSpeed` | `number` | `5` | Maximum movement speed |
| `jumpForce` | `number` | `10` | Jump impulse |
| `groundCheckDistance` | `number` | `0.1` | Ground detection distance |
| `slopeLimit` | `number` | `45` | Max walkable slope (degrees) |
| `stepHeight` | `number` | `0.3` | Max step height |

---

## Vehicle Physics

The `VehicleController` provides arcade-style vehicle physics with suspension, steering, and acceleration.

### Creating a Vehicle

```typescript
import { VehicleController, type VehicleConfig, type WheelConfig } from '@philjs/3d-physics';

const wheelConfig: WheelConfig = {
  position: { x: 0.8, y: 0, z: 1.2 },
  radius: 0.3,
  suspensionRestLength: 0.3,
  suspensionStiffness: 30,
  suspensionDamping: 4,
  maxSuspensionTravel: 0.2,
  frictionSlip: 2,
  isSteering: true,
  isDriving: true,
};

const vehicleConfig: VehicleConfig = {
  chassisSize: { x: 1, y: 0.5, z: 2 },
  chassisMass: 1000,
  wheels: [
    { ...wheelConfig, position: { x: -0.8, y: 0, z: 1.2 }, isSteering: true },   // Front Left
    { ...wheelConfig, position: { x: 0.8, y: 0, z: 1.2 }, isSteering: true },    // Front Right
    { ...wheelConfig, position: { x: -0.8, y: 0, z: -1.2 }, isSteering: false }, // Rear Left
    { ...wheelConfig, position: { x: 0.8, y: 0, z: -1.2 }, isSteering: false },  // Rear Right
  ],
  maxSteerAngle: Math.PI / 4,
  engineForce: 10000,
  brakeForce: 5000,
};

const vehicle = new VehicleController(world, 'car', vehicleConfig);
```

### Controlling the Vehicle

```typescript
// Set throttle (-1 to 1)
vehicle.setThrottle(1);      // Full forward
vehicle.setThrottle(-0.5);   // Half reverse

// Set steering (-1 to 1)
vehicle.setSteering(-0.5);   // Turn left
vehicle.setSteering(1);      // Full right

// Set brake (0 to 1)
vehicle.setBrake(1);         // Full brake

// Get current speed
const speed = vehicle.getSpeed();

// Update each frame
world.on('update', () => {
  vehicle.update();
});
```

### WheelConfig Options

| Option | Type | Description |
|--------|------|-------------|
| `position` | `Vector3` | Wheel position relative to chassis |
| `radius` | `number` | Wheel radius |
| `suspensionRestLength` | `number` | Rest length of suspension |
| `suspensionStiffness` | `number` | Spring stiffness |
| `suspensionDamping` | `number` | Damping coefficient |
| `maxSuspensionTravel` | `number` | Maximum compression |
| `frictionSlip` | `number` | Tire friction coefficient |
| `isSteering` | `boolean` | Can this wheel steer |
| `isDriving` | `boolean` | Is this a drive wheel |

---

## Ragdoll Physics

The `Ragdoll` class creates a physics-based humanoid skeleton for death animations, physics-based characters, or puppet effects.

### Creating a Ragdoll

```typescript
import { Ragdoll, type RagdollConfig } from '@philjs/3d-physics';

const ragdoll = new Ragdoll(world, 'enemy',
  { x: 0, y: 2, z: 0 },  // Initial position
  {
    scale: 1,            // Size multiplier
    boneDensity: 1,      // Mass density
  }
);
```

### Ragdoll Structure

The ragdoll creates a humanoid with these bones:
- `head` - Sphere
- `torso` - Capsule (upper body)
- `pelvis` - Capsule (lower body)
- `upperArmL`, `upperArmR` - Upper arms
- `lowerArmL`, `lowerArmR` - Lower arms
- `upperLegL`, `upperLegR` - Thighs
- `lowerLegL`, `lowerLegR` - Shins

### Interacting with the Ragdoll

```typescript
// Get bone positions for rendering
const headPos = ragdoll.getBonePosition('head');
const headRot = ragdoll.getBoneRotation('head');

// Apply impulse to a bone
ragdoll.applyImpulse('torso', { x: 100, y: 50, z: 0 });

// Clean up
ragdoll.destroy();
```

### Syncing with a 3D Model

```typescript
// In your render loop
const bones = ['head', 'torso', 'pelvis', 'upperArmL', 'upperArmR',
               'lowerArmL', 'lowerArmR', 'upperLegL', 'upperLegR',
               'lowerLegL', 'lowerLegR'];

bones.forEach(boneName => {
  const position = ragdoll.getBonePosition(boneName);
  const rotation = ragdoll.getBoneRotation(boneName);

  if (position && rotation) {
    // Update your 3D model's bone transforms
    model.bones[boneName].position.set(position.x, position.y, position.z);
    model.bones[boneName].quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  }
});
```

---

## Integration with @philjs/3d

The `@philjs/3d-physics` package integrates seamlessly with `@philjs/3d` for rendering physics objects.

### Basic Three.js Integration

```typescript
import { PhysicsWorld, usePhysicsWorld, useRigidBody } from '@philjs/3d-physics';
import { useThree, useFrame, ThreeCanvas } from '@philjs/3d';

function PhysicsScene() {
  const { world, isReady } = usePhysicsWorld({ backend: 'rapier' });

  if (!isReady) return <div>Loading physics...</div>;

  return (
    <ThreeCanvas>
      <PhysicsCube world={world} id="cube1" position={{ x: 0, y: 5, z: 0 }} />
      <PhysicsGround world={world} />
    </ThreeCanvas>
  );
}

function PhysicsCube({ world, id, position }) {
  const { position: physicsPos, rotation } = useRigidBody(
    world,
    id,
    { type: 'dynamic', mass: 1 },
    { shape: 'box', size: { x: 0.5, y: 0.5, z: 0.5 } },
    position
  );

  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(physicsPos.x, physicsPos.y, physicsPos.z);
      meshRef.current.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}
```

### Manual Integration

```typescript
import { PhysicsWorld } from '@philjs/3d-physics';
import { initThree, useFrame } from '@philjs/3d';

// Initialize physics
const physics = new PhysicsWorld({ backend: 'rapier' });
await physics.init();

// Create bodies
physics.createRigidBody('cube', { type: 'dynamic' }, { x: 0, y: 5, z: 0 });
physics.addCollider('cube', { shape: 'box', size: { x: 0.5, y: 0.5, z: 0.5 } });

// Initialize Three.js
const { scene, camera, renderer } = initThree(container);
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
scene.add(cube);

// Start physics
physics.start();

// Sync in render loop
useFrame(() => {
  const pos = physics.getPosition('cube');
  const rot = physics.getRotation('cube');

  cube.position.set(pos.x, pos.y, pos.z);
  cube.quaternion.set(rot.x, rot.y, rot.z, rot.w);
});
```

### Debug Visualization

```typescript
// Create debug wireframes for colliders
function createDebugShape(shape: ColliderConfig): THREE.Object3D {
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true
  });

  switch (shape.shape) {
    case 'box':
      return new THREE.Mesh(
        new THREE.BoxGeometry(shape.size.x * 2, shape.size.y * 2, shape.size.z * 2),
        material
      );
    case 'sphere':
      return new THREE.Mesh(
        new THREE.SphereGeometry(shape.radius, 16, 16),
        material
      );
    case 'capsule':
      return new THREE.Mesh(
        new THREE.CapsuleGeometry(shape.radius, shape.height - shape.radius * 2, 8, 16),
        material
      );
  }
}
```

---

## React Hooks

The package provides convenient React-style hooks for physics integration.

### usePhysicsWorld

```typescript
import { usePhysicsWorld } from '@philjs/3d-physics';

function Game() {
  const { world, isReady } = usePhysicsWorld({
    backend: 'rapier',
    gravity: { x: 0, y: -9.81, z: 0 },
  });

  if (!isReady) return <LoadingScreen />;

  return <GameScene world={world} />;
}
```

### useRigidBody

```typescript
import { useRigidBody } from '@philjs/3d-physics';

function FallingBox({ world }) {
  const { position, rotation, velocity, applyForce, applyImpulse } = useRigidBody(
    world,
    'box-1',
    { type: 'dynamic', mass: 1 },
    { shape: 'box', size: { x: 0.5, y: 0.5, z: 0.5 } },
    { x: 0, y: 10, z: 0 }  // Initial position
  );

  const handleClick = () => {
    applyImpulse({ x: 0, y: 10, z: 0 });
  };

  return (
    <mesh position={[position.x, position.y, position.z]} onClick={handleClick}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}
```

### useCharacterController

```typescript
import { useCharacterController } from '@philjs/3d-physics';

function Player({ world }) {
  const { position, isGrounded, move, jump } = useCharacterController(
    world,
    'player',
    {
      height: 1.8,
      radius: 0.3,
      maxSpeed: 5,
      jumpForce: 8,
    }
  );

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'w': move({ x: 0, y: 0, z: 1 }); break;
        case 's': move({ x: 0, y: 0, z: -1 }); break;
        case 'a': move({ x: -1, y: 0, z: 0 }); break;
        case 'd': move({ x: 1, y: 0, z: 0 }); break;
        case ' ': jump(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, jump]);

  return <PlayerModel position={position} />;
}
```

### useVehicle

```typescript
import { useVehicle } from '@philjs/3d-physics';

function Car({ world }) {
  const { position, rotation, speed, setThrottle, setSteering, setBrake } = useVehicle(
    world,
    'car',
    vehicleConfig
  );

  // Handle input
  useEffect(() => {
    const handleInput = () => {
      setThrottle(keys.w ? 1 : keys.s ? -0.5 : 0);
      setSteering(keys.a ? -1 : keys.d ? 1 : 0);
      setBrake(keys.space ? 1 : 0);
    };

    const interval = setInterval(handleInput, 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <group position={[position.x, position.y, position.z]}>
      <CarModel rotation={rotation} />
      <Speedometer speed={speed} />
    </group>
  );
}
```

### useRagdoll

```typescript
import { useRagdoll } from '@philjs/3d-physics';

function DeadEnemy({ world, spawnPosition }) {
  const { getBonePosition, getBoneRotation, applyImpulse } = useRagdoll(
    world,
    'enemy-ragdoll',
    spawnPosition,
    { scale: 1 }
  );

  // Apply initial impact
  useEffect(() => {
    applyImpulse('torso', { x: 50, y: 20, z: 0 });
  }, []);

  return <RagdollModel getBonePosition={getBonePosition} getBoneRotation={getBoneRotation} />;
}
```

---

## Performance Optimization

### Body Count Management

```typescript
// Use object pooling for frequently spawned objects
const bodyPool: string[] = [];

function spawnBullet(position: Vector3): string {
  let bulletId = bodyPool.pop();

  if (bulletId) {
    // Reuse existing body
    world.setPosition(bulletId, position);
    world.setVelocity(bulletId, { x: 0, y: 0, z: 0 });
  } else {
    // Create new body
    bulletId = `bullet_${Date.now()}`;
    world.createRigidBody(bulletId, { type: 'dynamic', mass: 0.1 });
    world.addCollider(bulletId, { shape: 'sphere', radius: 0.05 });
    world.setPosition(bulletId, position);
  }

  return bulletId;
}

function recycleBullet(bulletId: string) {
  world.setPosition(bulletId, { x: 0, y: -100, z: 0 }); // Move out of scene
  bodyPool.push(bulletId);
}
```

### Sleep Management

```typescript
// Allow bodies to sleep when inactive
world.createRigidBody('crate', {
  type: 'dynamic',
  canSleep: true,  // Enable sleeping
});

// Disable sleep for always-active objects
world.createRigidBody('player', {
  type: 'dynamic',
  canSleep: false, // Never sleep
});
```

### Collision Filtering

```typescript
// Use collision groups to reduce checks
const PLAYER = 1;
const ENEMY = 2;
const PROJECTILE = 4;
const ENVIRONMENT = 8;

// Player collides with everything
world.createRigidBody('player', {
  type: 'dynamic',
  collisionGroups: PLAYER,
  collisionMask: ENEMY | PROJECTILE | ENVIRONMENT,
});

// Enemy projectiles don't collide with other enemies
world.createRigidBody('enemy-bullet', {
  type: 'dynamic',
  collisionGroups: PROJECTILE,
  collisionMask: PLAYER | ENVIRONMENT,
});
```

### Simplified Colliders

```typescript
// Use simple shapes instead of complex meshes
// GOOD: Simple box for a crate
world.addCollider('crate', { shape: 'box', size: { x: 0.5, y: 0.5, z: 0.5 } });

// BAD: Complex trimesh for a crate
world.addCollider('crate', { shape: 'trimesh', vertices: crateVertices, indices: crateIndices });

// Use convex decomposition for complex dynamic objects
// Instead of one concave trimesh, use multiple convex hulls
complexShape.convexParts.forEach((part, i) => {
  world.addCollider(`complex_${i}`, { shape: 'convex', vertices: part.vertices });
});
```

### Broadphase Selection

```typescript
// Choose appropriate broadphase for your scene
// 'dbvt' (default) - Dynamic BVH, good for general use
// 'sap' - Sweep and prune, good for uniform distributions
// 'naive' - Simple but slow, only for very few objects

new PhysicsWorld({
  backend: 'rapier',
  broadphase: 'dbvt', // Best for most games
});
```

### Fixed Timestep Tuning

```typescript
// Balance accuracy vs performance
new PhysicsWorld({
  backend: 'rapier',
  timestep: 1 / 60,   // Standard 60Hz physics
  substeps: 4,        // Solver iterations
});

// For fast-moving objects, use CCD instead of smaller timesteps
world.createRigidBody('bullet', {
  type: 'dynamic',
  ccd: true,  // Continuous collision detection
});
```

---

## Complete Usage Examples

### Falling Cubes Demo

```typescript
import { PhysicsWorld } from '@philjs/3d-physics';
import { initThree, useFrame, createCube } from '@philjs/3d';

async function main() {
  // Initialize physics
  const physics = new PhysicsWorld({
    backend: 'rapier',
    gravity: { x: 0, y: -9.81, z: 0 },
  });
  await physics.init();

  // Create ground
  physics.createRigidBody('ground', { type: 'static' }, { x: 0, y: 0, z: 0 });
  physics.addCollider('ground', {
    shape: 'box',
    size: { x: 10, y: 0.5, z: 10 },
    friction: 0.8,
  });

  // Create falling cubes
  const cubes: Array<{ id: string; mesh: THREE.Mesh }> = [];

  for (let i = 0; i < 50; i++) {
    const id = `cube_${i}`;
    const position = {
      x: (Math.random() - 0.5) * 5,
      y: 5 + i * 1.5,
      z: (Math.random() - 0.5) * 5,
    };

    physics.createRigidBody(id, {
      type: 'dynamic',
      mass: 1,
      restitution: 0.3,
    }, position);

    physics.addCollider(id, {
      shape: 'box',
      size: { x: 0.5, y: 0.5, z: 0.5 }
    });

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff
      })
    );
    scene.add(mesh);
    cubes.push({ id, mesh });
  }

  // Start physics
  physics.start();

  // Render loop
  useFrame(() => {
    cubes.forEach(({ id, mesh }) => {
      const pos = physics.getPosition(id);
      const rot = physics.getRotation(id);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
    });
  });
}
```

### Character Controller Example

```typescript
import { PhysicsWorld, CharacterController } from '@philjs/3d-physics';

async function createGame() {
  const physics = new PhysicsWorld({ backend: 'cannon' });
  await physics.init();

  // Create level geometry
  physics.createRigidBody('floor', { type: 'static' }, { x: 0, y: 0, z: 0 });
  physics.addCollider('floor', { shape: 'box', size: { x: 50, y: 0.5, z: 50 } });

  // Create platforms
  const platforms = [
    { x: 5, y: 2, z: 0 },
    { x: 10, y: 4, z: 5 },
    { x: 15, y: 6, z: -2 },
  ];

  platforms.forEach((pos, i) => {
    const id = `platform_${i}`;
    physics.createRigidBody(id, { type: 'static' }, pos);
    physics.addCollider(id, { shape: 'box', size: { x: 2, y: 0.25, z: 2 } });
  });

  // Create character
  const character = new CharacterController(physics, 'player', {
    height: 1.8,
    radius: 0.4,
    maxSpeed: 8,
    jumpForce: 12,
  });

  physics.setPosition('player', { x: 0, y: 3, z: 0 });

  // Input handling
  const keys = { w: false, a: false, s: false, d: false, space: false };

  document.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
    if (e.key === ' ') keys.space = true;
  });

  document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
    if (e.key === ' ') keys.space = false;
  });

  // Game loop
  physics.on('update', () => {
    // Calculate movement direction
    const moveDir = { x: 0, y: 0, z: 0 };
    if (keys.w) moveDir.z += 1;
    if (keys.s) moveDir.z -= 1;
    if (keys.a) moveDir.x -= 1;
    if (keys.d) moveDir.x += 1;

    // Normalize
    const len = Math.sqrt(moveDir.x * moveDir.x + moveDir.z * moveDir.z);
    if (len > 0) {
      moveDir.x /= len;
      moveDir.z /= len;
    }

    character.move(moveDir);

    if (keys.space) {
      character.jump();
    }

    character.update();
  });

  physics.start();
}
```

### Vehicle Racing Example

```typescript
import { PhysicsWorld, VehicleController } from '@philjs/3d-physics';

async function createRacingGame() {
  const physics = new PhysicsWorld({ backend: 'ammo' });
  await physics.init();

  // Create track
  physics.createRigidBody('track', { type: 'static' });
  physics.addCollider('track', {
    shape: 'trimesh',
    vertices: trackVertices,
    indices: trackIndices,
    friction: 0.9,
  });

  // Create vehicle
  const car = new VehicleController(physics, 'player-car', {
    chassisSize: { x: 0.9, y: 0.4, z: 2.0 },
    chassisMass: 1200,
    maxSteerAngle: Math.PI / 6,
    engineForce: 15000,
    brakeForce: 8000,
    wheels: [
      { // Front Left
        position: { x: -0.8, y: 0, z: 1.3 },
        radius: 0.35,
        suspensionRestLength: 0.35,
        suspensionStiffness: 40,
        suspensionDamping: 6,
        maxSuspensionTravel: 0.25,
        frictionSlip: 2.5,
        isSteering: true,
        isDriving: false,
      },
      { // Front Right
        position: { x: 0.8, y: 0, z: 1.3 },
        radius: 0.35,
        suspensionRestLength: 0.35,
        suspensionStiffness: 40,
        suspensionDamping: 6,
        maxSuspensionTravel: 0.25,
        frictionSlip: 2.5,
        isSteering: true,
        isDriving: false,
      },
      { // Rear Left
        position: { x: -0.8, y: 0, z: -1.2 },
        radius: 0.35,
        suspensionRestLength: 0.35,
        suspensionStiffness: 35,
        suspensionDamping: 5,
        maxSuspensionTravel: 0.25,
        frictionSlip: 2.0,
        isSteering: false,
        isDriving: true,
      },
      { // Rear Right
        position: { x: 0.8, y: 0, z: -1.2 },
        radius: 0.35,
        suspensionRestLength: 0.35,
        suspensionStiffness: 35,
        suspensionDamping: 5,
        maxSuspensionTravel: 0.25,
        frictionSlip: 2.0,
        isSteering: false,
        isDriving: true,
      },
    ],
  });

  // Game loop with input
  physics.on('update', () => {
    car.setThrottle(gamepad.leftStickY);
    car.setSteering(gamepad.leftStickX);
    car.setBrake(gamepad.rightTrigger);
    car.update();

    // Update HUD
    speedometer.value = car.getSpeed() * 3.6; // Convert to km/h
  });

  physics.start();
}
```

---

## API Reference

### Core Classes

| Class | Description |
|-------|-------------|
| `PhysicsWorld` | Main physics world manager |
| `PhysicsBackend` | Abstract backend interface |
| `RapierBackend` | Rapier physics implementation |
| `CannonBackend` | Cannon.js implementation |
| `AmmoBackend` | Ammo.js implementation |
| `CharacterController` | Physics-based character |
| `VehicleController` | Vehicle physics |
| `Ragdoll` | Ragdoll physics |

### Hooks

| Hook | Description |
|------|-------------|
| `usePhysicsWorld` | Create and manage physics world |
| `useRigidBody` | Create and track rigid body |
| `useCharacterController` | Character with movement |
| `useVehicle` | Vehicle with controls |
| `useRagdoll` | Ragdoll physics |

### Types

| Type | Description |
|------|-------------|
| `Vector3` | 3D vector `{ x, y, z }` |
| `Quaternion` | Rotation `{ x, y, z, w }` |
| `PhysicsConfig` | World configuration |
| `RigidBodyConfig` | Body properties |
| `ColliderConfig` | Collider shape/properties |
| `JointConfig` | Joint configuration |
| `ContactEvent` | Collision event data |
| `RaycastResult` | Raycast hit result |
| `CharacterConfig` | Character properties |
| `WheelConfig` | Vehicle wheel config |
| `VehicleConfig` | Vehicle properties |
| `RagdollConfig` | Ragdoll properties |

---

## See Also

- [@philjs/3d](../3d/overview.md) - 3D graphics and rendering
- [WebGPU Platform](../../platforms/webgpu.md) - GPU-accelerated graphics
- [Game Development Patterns](../../patterns/game-dev.md) - Common game patterns
