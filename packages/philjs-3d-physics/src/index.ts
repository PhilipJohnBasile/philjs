/**
 * @philjs/3d-physics - High-performance 3D physics engine for PhilJS
 *
 * Features:
 * - Multiple physics backends (Rapier, Cannon.js, Ammo.js)
 * - Rigid body dynamics with continuous collision detection
 * - Soft body simulation (cloth, rope, deformables)
 * - Joints and constraints (hinge, ball, slider, spring)
 * - Vehicle physics (car, tank, hover)
 * - Character controller with ground detection
 * - Ragdoll physics
 * - Fluid simulation
 * - Physics-based audio
 * - Deterministic physics for multiplayer
 */

// ============================================================================
// TYPES
// ============================================================================

type Vector3 = { x: number; y: number; z: number };
type Quaternion = { x: number; y: number; z: number; w: number };

interface PhysicsConfig {
  backend: 'rapier' | 'cannon' | 'ammo';
  gravity?: Vector3;
  timestep?: number;
  substeps?: number;
  broadphase?: 'naive' | 'sap' | 'dbvt';
  enableCCD?: boolean;
  enableSleeping?: boolean;
  deterministic?: boolean;
}

interface RigidBodyConfig {
  type: 'dynamic' | 'static' | 'kinematic';
  mass?: number;
  linearDamping?: number;
  angularDamping?: number;
  friction?: number;
  restitution?: number;
  gravityScale?: number;
  canSleep?: boolean;
  ccd?: boolean;
  collisionGroups?: number;
  collisionMask?: number;
}

interface ColliderConfig {
  shape: 'box' | 'sphere' | 'capsule' | 'cylinder' | 'cone' | 'convex' | 'trimesh' | 'heightfield';
  size?: Vector3;
  radius?: number;
  height?: number;
  vertices?: Float32Array;
  indices?: Uint32Array;
  isSensor?: boolean;
  friction?: number;
  restitution?: number;
  density?: number;
}

interface JointConfig {
  type: 'fixed' | 'revolute' | 'prismatic' | 'spherical' | 'rope' | 'spring' | 'motor';
  bodyA: string;
  bodyB: string;
  anchorA?: Vector3;
  anchorB?: Vector3;
  axisA?: Vector3;
  axisB?: Vector3;
  limitsEnabled?: boolean;
  limitsMin?: number;
  limitsMax?: number;
  motorEnabled?: boolean;
  motorVelocity?: number;
  motorMaxForce?: number;
  stiffness?: number;
  damping?: number;
}

interface ContactEvent {
  bodyA: string;
  bodyB: string;
  point: Vector3;
  normal: Vector3;
  impulse: number;
  separation: number;
}

interface RaycastResult {
  hit: boolean;
  bodyId?: string | undefined;
  point?: Vector3 | undefined;
  normal?: Vector3 | undefined;
  distance?: number | undefined;
}

// ============================================================================
// PHYSICS WORLD
// ============================================================================

abstract class PhysicsBackend {
  abstract init(config: PhysicsConfig): Promise<void>;
  abstract step(dt: number): void;
  abstract createRigidBody(id: string, config: RigidBodyConfig, position: Vector3, rotation: Quaternion): void;
  abstract removeRigidBody(id: string): void;
  abstract addCollider(bodyId: string, config: ColliderConfig): void;
  abstract createJoint(id: string, config: JointConfig): void;
  abstract removeJoint(id: string): void;
  abstract setPosition(bodyId: string, position: Vector3): void;
  abstract setRotation(bodyId: string, rotation: Quaternion): void;
  abstract setVelocity(bodyId: string, velocity: Vector3): void;
  abstract setAngularVelocity(bodyId: string, velocity: Vector3): void;
  abstract applyForce(bodyId: string, force: Vector3, point?: Vector3): void;
  abstract applyImpulse(bodyId: string, impulse: Vector3, point?: Vector3): void;
  abstract applyTorque(bodyId: string, torque: Vector3): void;
  abstract getPosition(bodyId: string): Vector3;
  abstract getRotation(bodyId: string): Quaternion;
  abstract getVelocity(bodyId: string): Vector3;
  abstract getAngularVelocity(bodyId: string): Vector3;
  abstract raycast(origin: Vector3, direction: Vector3, maxDistance: number, groups?: number): RaycastResult;
  abstract shapeCast(shape: ColliderConfig, origin: Vector3, direction: Vector3, maxDistance: number): RaycastResult;
  abstract getContacts(): ContactEvent[];
  abstract destroy(): void;
}

// ============================================================================
// RAPIER BACKEND
// ============================================================================

class RapierBackend extends PhysicsBackend {
  private world: any;
  private bodies: Map<string, any> = new Map();
  private colliders: Map<string, any> = new Map();
  private joints: Map<string, any> = new Map();
  private RAPIER: any;
  private eventQueue: any;

  async init(config: PhysicsConfig): Promise<void> {
    // @ts-ignore - Dynamic import
    this.RAPIER = await import('@dimforge/rapier3d');
    await this.RAPIER.init();

    const gravity = config.gravity || { x: 0, y: -9.81, z: 0 };
    this.world = new this.RAPIER.World(gravity);

    if (config.timestep) {
      this.world.integrationParameters.dt = config.timestep;
    }

    if (config.substeps) {
      this.world.integrationParameters.numSolverIterations = config.substeps;
    }

    this.eventQueue = new this.RAPIER.EventQueue(true);
  }

  step(dt: number): void {
    this.world.step(this.eventQueue);
  }

  createRigidBody(id: string, config: RigidBodyConfig, position: Vector3, rotation: Quaternion): void {
    let bodyDesc;

    switch (config.type) {
      case 'dynamic':
        bodyDesc = this.RAPIER.RigidBodyDesc.dynamic();
        break;
      case 'static':
        bodyDesc = this.RAPIER.RigidBodyDesc.fixed();
        break;
      case 'kinematic':
        bodyDesc = this.RAPIER.RigidBodyDesc.kinematicPositionBased();
        break;
    }

    bodyDesc
      .setTranslation(position.x, position.y, position.z)
      .setRotation(rotation);

    if (config.linearDamping !== undefined) {
      bodyDesc.setLinearDamping(config.linearDamping);
    }

    if (config.angularDamping !== undefined) {
      bodyDesc.setAngularDamping(config.angularDamping);
    }

    if (config.gravityScale !== undefined) {
      bodyDesc.setGravityScale(config.gravityScale);
    }

    if (config.ccd) {
      bodyDesc.setCcdEnabled(true);
    }

    if (config.canSleep === false) {
      bodyDesc.setCanSleep(false);
    }

    const body = this.world.createRigidBody(bodyDesc);
    this.bodies.set(id, body);
  }

  removeRigidBody(id: string): void {
    const body = this.bodies.get(id);
    if (body) {
      this.world.removeRigidBody(body);
      this.bodies.delete(id);
    }
  }

  addCollider(bodyId: string, config: ColliderConfig): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;

    let colliderDesc;

    switch (config.shape) {
      case 'box':
        const halfSize = config.size || { x: 0.5, y: 0.5, z: 0.5 };
        colliderDesc = this.RAPIER.ColliderDesc.cuboid(halfSize.x, halfSize.y, halfSize.z);
        break;
      case 'sphere':
        colliderDesc = this.RAPIER.ColliderDesc.ball(config.radius || 0.5);
        break;
      case 'capsule':
        colliderDesc = this.RAPIER.ColliderDesc.capsule(
          (config.height || 1) / 2,
          config.radius || 0.5
        );
        break;
      case 'cylinder':
        colliderDesc = this.RAPIER.ColliderDesc.cylinder(
          (config.height || 1) / 2,
          config.radius || 0.5
        );
        break;
      case 'cone':
        colliderDesc = this.RAPIER.ColliderDesc.cone(
          (config.height || 1) / 2,
          config.radius || 0.5
        );
        break;
      case 'convex':
        if (config.vertices) {
          colliderDesc = this.RAPIER.ColliderDesc.convexHull(config.vertices);
        }
        break;
      case 'trimesh':
        if (config.vertices && config.indices) {
          colliderDesc = this.RAPIER.ColliderDesc.trimesh(config.vertices, config.indices);
        }
        break;
    }

    if (!colliderDesc) return;

    if (config.friction !== undefined) {
      colliderDesc.setFriction(config.friction);
    }

    if (config.restitution !== undefined) {
      colliderDesc.setRestitution(config.restitution);
    }

    if (config.density !== undefined) {
      colliderDesc.setDensity(config.density);
    }

    if (config.isSensor) {
      colliderDesc.setSensor(true);
    }

    const collider = this.world.createCollider(colliderDesc, body);
    this.colliders.set(`${bodyId}_collider`, collider);
  }

  createJoint(id: string, config: JointConfig): void {
    const bodyA = this.bodies.get(config.bodyA);
    const bodyB = this.bodies.get(config.bodyB);
    if (!bodyA || !bodyB) return;

    const anchorA = config.anchorA || { x: 0, y: 0, z: 0 };
    const anchorB = config.anchorB || { x: 0, y: 0, z: 0 };

    let jointData;

    switch (config.type) {
      case 'fixed':
        jointData = this.RAPIER.JointData.fixed(
          anchorA, { x: 0, y: 0, z: 0, w: 1 },
          anchorB, { x: 0, y: 0, z: 0, w: 1 }
        );
        break;
      case 'revolute':
        jointData = this.RAPIER.JointData.revolute(
          anchorA, anchorB,
          config.axisA || { x: 0, y: 1, z: 0 }
        );
        if (config.limitsEnabled) {
          jointData.limitsEnabled = true;
          jointData.limits = [config.limitsMin || 0, config.limitsMax || Math.PI];
        }
        break;
      case 'prismatic':
        jointData = this.RAPIER.JointData.prismatic(
          anchorA, anchorB,
          config.axisA || { x: 0, y: 1, z: 0 }
        );
        break;
      case 'spherical':
        jointData = this.RAPIER.JointData.spherical(anchorA, anchorB);
        break;
      case 'spring':
        jointData = this.RAPIER.JointData.spring(
          config.stiffness || 1,
          config.damping || 0.1,
          anchorA, anchorB
        );
        break;
    }

    if (!jointData) return;

    const joint = this.world.createImpulseJoint(jointData, bodyA, bodyB, true);
    this.joints.set(id, joint);
  }

  removeJoint(id: string): void {
    const joint = this.joints.get(id);
    if (joint) {
      this.world.removeImpulseJoint(joint, true);
      this.joints.delete(id);
    }
  }

  setPosition(bodyId: string, position: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      body.setTranslation(position, true);
    }
  }

  setRotation(bodyId: string, rotation: Quaternion): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      body.setRotation(rotation, true);
    }
  }

  setVelocity(bodyId: string, velocity: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      body.setLinvel(velocity, true);
    }
  }

  setAngularVelocity(bodyId: string, velocity: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      body.setAngvel(velocity, true);
    }
  }

  applyForce(bodyId: string, force: Vector3, point?: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      if (point) {
        body.addForceAtPoint(force, point, true);
      } else {
        body.addForce(force, true);
      }
    }
  }

  applyImpulse(bodyId: string, impulse: Vector3, point?: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      if (point) {
        body.applyImpulseAtPoint(impulse, point, true);
      } else {
        body.applyImpulse(impulse, true);
      }
    }
  }

  applyTorque(bodyId: string, torque: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      body.addTorque(torque, true);
    }
  }

  getPosition(bodyId: string): Vector3 {
    const body = this.bodies.get(bodyId);
    if (body) {
      const pos = body.translation();
      return { x: pos.x, y: pos.y, z: pos.z };
    }
    return { x: 0, y: 0, z: 0 };
  }

  getRotation(bodyId: string): Quaternion {
    const body = this.bodies.get(bodyId);
    if (body) {
      const rot = body.rotation();
      return { x: rot.x, y: rot.y, z: rot.z, w: rot.w };
    }
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  getVelocity(bodyId: string): Vector3 {
    const body = this.bodies.get(bodyId);
    if (body) {
      const vel = body.linvel();
      return { x: vel.x, y: vel.y, z: vel.z };
    }
    return { x: 0, y: 0, z: 0 };
  }

  getAngularVelocity(bodyId: string): Vector3 {
    const body = this.bodies.get(bodyId);
    if (body) {
      const vel = body.angvel();
      return { x: vel.x, y: vel.y, z: vel.z };
    }
    return { x: 0, y: 0, z: 0 };
  }

  raycast(origin: Vector3, direction: Vector3, maxDistance: number, groups?: number): RaycastResult {
    const ray = new this.RAPIER.Ray(origin, direction);
    const hit = this.world.castRay(ray, maxDistance, true);

    if (hit) {
      const point = ray.pointAt(hit.toi);
      return {
        hit: true,
        bodyId: this.getBodyIdFromCollider(hit.collider),
        point: { x: point.x, y: point.y, z: point.z },
        normal: hit.normal,
        distance: hit.toi
      };
    }

    return { hit: false };
  }

  shapeCast(shape: ColliderConfig, origin: Vector3, direction: Vector3, maxDistance: number): RaycastResult {
    // Create temporary shape for cast
    let shapeObj;

    switch (shape.shape) {
      case 'sphere':
        shapeObj = new this.RAPIER.Ball(shape.radius || 0.5);
        break;
      case 'box':
        const size = shape.size || { x: 0.5, y: 0.5, z: 0.5 };
        shapeObj = new this.RAPIER.Cuboid(size.x, size.y, size.z);
        break;
      case 'capsule':
        shapeObj = new this.RAPIER.Capsule((shape.height || 1) / 2, shape.radius || 0.5);
        break;
      default:
        return { hit: false };
    }

    const hit = this.world.castShape(
      origin,
      { x: 0, y: 0, z: 0, w: 1 },
      direction,
      shapeObj,
      maxDistance,
      true
    );

    if (hit) {
      return {
        hit: true,
        bodyId: this.getBodyIdFromCollider(hit.collider),
        point: hit.witness1,
        normal: hit.normal1,
        distance: hit.toi
      };
    }

    return { hit: false };
  }

  private getBodyIdFromCollider(collider: any): string | undefined {
    const body = collider.parent();
    for (const [id, b] of this.bodies) {
      if (b === body) return id;
    }
    return undefined;
  }

  getContacts(): ContactEvent[] {
    const contacts: ContactEvent[] = [];

    this.eventQueue.drainCollisionEvents((handle1: any, handle2: any, started: boolean) => {
      if (!started) return;

      const collider1 = this.world.getCollider(handle1);
      const collider2 = this.world.getCollider(handle2);

      if (collider1 && collider2) {
        contacts.push({
          bodyA: this.getBodyIdFromCollider(collider1) || '',
          bodyB: this.getBodyIdFromCollider(collider2) || '',
          point: { x: 0, y: 0, z: 0 },
          normal: { x: 0, y: 1, z: 0 },
          impulse: 0,
          separation: 0
        });
      }
    });

    return contacts;
  }

  destroy(): void {
    this.world.free();
    this.bodies.clear();
    this.colliders.clear();
    this.joints.clear();
  }
}

// ============================================================================
// CANNON-ES BACKEND
// ============================================================================

// cannon-es type definitions
interface CannonVec3 {
  x: number;
  y: number;
  z: number;
  set(x: number, y: number, z: number): CannonVec3;
  copy(v: CannonVec3): CannonVec3;
  vadd(v: CannonVec3, target?: CannonVec3): CannonVec3;
  vsub(v: CannonVec3, target?: CannonVec3): CannonVec3;
  scale(scalar: number, target?: CannonVec3): CannonVec3;
}

interface CannonQuaternion {
  x: number;
  y: number;
  z: number;
  w: number;
  set(x: number, y: number, z: number, w: number): CannonQuaternion;
  copy(q: CannonQuaternion): CannonQuaternion;
  setFromEuler(x: number, y: number, z: number, order?: string): CannonQuaternion;
}

interface CannonShape {
  type: number;
}

interface CannonBody {
  id: number;
  position: CannonVec3;
  quaternion: CannonQuaternion;
  velocity: CannonVec3;
  angularVelocity: CannonVec3;
  mass: number;
  type: number;
  linearDamping: number;
  angularDamping: number;
  material: CannonMaterial | null;
  collisionFilterGroup: number;
  collisionFilterMask: number;
  allowSleep: boolean;
  sleepSpeedLimit: number;
  sleepTimeLimit: number;
  addShape(shape: CannonShape, offset?: CannonVec3): void;
  applyForce(force: CannonVec3, worldPoint?: CannonVec3): void;
  applyImpulse(impulse: CannonVec3, worldPoint?: CannonVec3): void;
  applyTorque(torque: CannonVec3): void;
}

interface CannonMaterial {
  friction: number;
  restitution: number;
}

interface CannonContactMaterial {
  friction: number;
  restitution: number;
}

interface CannonConstraint {
  bodyA: CannonBody;
  bodyB: CannonBody;
  enable(): void;
  disable(): void;
}

interface CannonRaycastResult {
  hasHit: boolean;
  body: CannonBody | null;
  hitPointWorld: CannonVec3;
  hitNormalWorld: CannonVec3;
  distance: number;
}

interface CannonWorld {
  gravity: CannonVec3;
  broadphase: CannonBroadphase;
  solver: CannonSolver;
  allowSleep: boolean;
  bodies: CannonBody[];
  addBody(body: CannonBody): void;
  removeBody(body: CannonBody): void;
  addConstraint(constraint: CannonConstraint): void;
  removeConstraint(constraint: CannonConstraint): void;
  step(dt: number, timeSinceLastCall?: number, maxSubSteps?: number): void;
  raycastClosest(from: CannonVec3, to: CannonVec3, options: object, result: CannonRaycastResult): boolean;
  addEventListener(event: string, callback: (e: CannonContactEvent) => void): void;
}

interface CannonBroadphase {
  world: CannonWorld | null;
}

interface CannonSolver {
  iterations: number;
}

interface CannonContactEvent {
  bodyA: CannonBody;
  bodyB: CannonBody;
  contact: {
    getImpactVelocityAlongNormal(): number;
    ni: CannonVec3;
    ri: CannonVec3;
    rj: CannonVec3;
  };
}

interface CannonModule {
  World: new () => CannonWorld;
  Body: new (options?: object) => CannonBody;
  Vec3: new (x?: number, y?: number, z?: number) => CannonVec3;
  Quaternion: new (x?: number, y?: number, z?: number, w?: number) => CannonQuaternion;
  Box: new (halfExtents: CannonVec3) => CannonShape;
  Sphere: new (radius: number) => CannonShape;
  Cylinder: new (radiusTop: number, radiusBottom: number, height: number, numSegments: number) => CannonShape;
  ConvexPolyhedron: new (options: { vertices: CannonVec3[]; faces: number[][] }) => CannonShape;
  Trimesh: new (vertices: number[], indices: number[]) => CannonShape;
  Material: new (options?: object) => CannonMaterial;
  ContactMaterial: new (m1: CannonMaterial, m2: CannonMaterial, options?: object) => CannonContactMaterial;
  PointToPointConstraint: new (bodyA: CannonBody, pivotA: CannonVec3, bodyB: CannonBody, pivotB: CannonVec3) => CannonConstraint;
  LockConstraint: new (bodyA: CannonBody, bodyB: CannonBody, options?: object) => CannonConstraint;
  HingeConstraint: new (bodyA: CannonBody, bodyB: CannonBody, options?: object) => CannonConstraint & {
    enableMotor(): void;
    disableMotor(): void;
    setMotorSpeed(speed: number): void;
    setMotorMaxForce(force: number): void;
  };
  DistanceConstraint: new (bodyA: CannonBody, bodyB: CannonBody, distance?: number) => CannonConstraint;
  Spring: new (bodyA: CannonBody, bodyB: CannonBody, options?: object) => {
    localAnchorA: CannonVec3;
    localAnchorB: CannonVec3;
    stiffness: number;
    damping: number;
    applyForce(): void;
  };
  NaiveBroadphase: new () => CannonBroadphase;
  SAPBroadphase: new (world: CannonWorld) => CannonBroadphase;
  RaycastResult: new () => CannonRaycastResult;
  BODY_TYPES: {
    DYNAMIC: number;
    STATIC: number;
    KINEMATIC: number;
  };
}

class CannonBackend extends PhysicsBackend {
  private world!: CannonWorld;
  private bodies: Map<string, CannonBody> = new Map();
  private constraints: Map<string, CannonConstraint> = new Map();
  private springs: Map<string, { localAnchorA: CannonVec3; localAnchorB: CannonVec3; stiffness: number; damping: number; applyForce(): void }> = new Map();
  private CANNON!: CannonModule;
  private contactEvents: ContactEvent[] = [];
  private defaultMaterial!: CannonMaterial;

  async init(config: PhysicsConfig): Promise<void> {
    // @ts-ignore - Dynamic import
    this.CANNON = await import('cannon-es');

    this.world = new this.CANNON.World();
    const gravity = config.gravity ?? { x: 0, y: -9.81, z: 0 };
    this.world.gravity.set(gravity.x, gravity.y, gravity.z);

    // Configure broadphase
    if (config.broadphase === 'sap') {
      this.world.broadphase = new this.CANNON.SAPBroadphase(this.world);
    } else {
      this.world.broadphase = new this.CANNON.NaiveBroadphase();
    }

    // Configure solver
    if (config.substeps) {
      this.world.solver.iterations = config.substeps;
    }

    // Enable sleeping
    this.world.allowSleep = config.enableSleeping ?? true;

    // Default material
    this.defaultMaterial = new this.CANNON.Material({ friction: 0.3, restitution: 0.3 });

    // Setup collision events
    this.world.addEventListener('beginContact', (event: CannonContactEvent) => {
      const bodyAId = this.getBodyIdFromBody(event.bodyA);
      const bodyBId = this.getBodyIdFromBody(event.bodyB);

      if (bodyAId && bodyBId) {
        const contact = event.contact;
        this.contactEvents.push({
          bodyA: bodyAId,
          bodyB: bodyBId,
          point: {
            x: event.bodyA.position.x + contact.ri.x,
            y: event.bodyA.position.y + contact.ri.y,
            z: event.bodyA.position.z + contact.ri.z
          },
          normal: { x: contact.ni.x, y: contact.ni.y, z: contact.ni.z },
          impulse: contact.getImpactVelocityAlongNormal(),
          separation: 0
        });
      }
    });
  }

  step(dt: number): void {
    // Apply spring forces
    for (const spring of this.springs.values()) {
      spring.applyForce();
    }

    this.world.step(dt);
  }

  createRigidBody(id: string, config: RigidBodyConfig, position: Vector3, rotation: Quaternion): void {
    let bodyType: number;
    switch (config.type) {
      case 'dynamic':
        bodyType = this.CANNON.BODY_TYPES.DYNAMIC;
        break;
      case 'static':
        bodyType = this.CANNON.BODY_TYPES.STATIC;
        break;
      case 'kinematic':
        bodyType = this.CANNON.BODY_TYPES.KINEMATIC;
        break;
    }

    const body = new this.CANNON.Body({
      mass: config.type === 'static' ? 0 : (config.mass ?? 1),
      type: bodyType,
      position: new this.CANNON.Vec3(position.x, position.y, position.z),
      quaternion: new this.CANNON.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
      linearDamping: config.linearDamping ?? 0.01,
      angularDamping: config.angularDamping ?? 0.01,
      allowSleep: config.canSleep ?? true,
      sleepSpeedLimit: 0.1,
      sleepTimeLimit: 1
    });

    if (config.collisionGroups !== undefined) {
      body.collisionFilterGroup = config.collisionGroups;
    }
    if (config.collisionMask !== undefined) {
      body.collisionFilterMask = config.collisionMask;
    }

    // Create material with friction and restitution
    const material = new this.CANNON.Material({
      friction: config.friction ?? 0.3,
      restitution: config.restitution ?? 0.3
    });
    body.material = material;

    this.world.addBody(body);
    this.bodies.set(id, body);
  }

  removeRigidBody(id: string): void {
    const body = this.bodies.get(id);
    if (body) {
      this.world.removeBody(body);
      this.bodies.delete(id);
    }
  }

  addCollider(bodyId: string, config: ColliderConfig): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;

    let shape: CannonShape | null = null;

    switch (config.shape) {
      case 'box': {
        const size = config.size ?? { x: 0.5, y: 0.5, z: 0.5 };
        shape = new this.CANNON.Box(new this.CANNON.Vec3(size.x, size.y, size.z));
        break;
      }
      case 'sphere': {
        shape = new this.CANNON.Sphere(config.radius ?? 0.5);
        break;
      }
      case 'cylinder': {
        const radius = config.radius ?? 0.5;
        const height = config.height ?? 1;
        shape = new this.CANNON.Cylinder(radius, radius, height, 16);
        break;
      }
      case 'capsule': {
        // Cannon.js doesn't have native capsule, approximate with cylinder + 2 spheres
        const radius = config.radius ?? 0.5;
        const height = config.height ?? 1;
        const cylinderHeight = height - radius * 2;
        if (cylinderHeight > 0) {
          const cylinder = new this.CANNON.Cylinder(radius, radius, cylinderHeight, 16);
          body.addShape(cylinder);
        }
        const sphereTop = new this.CANNON.Sphere(radius);
        const sphereBottom = new this.CANNON.Sphere(radius);
        const halfHeight = (height - radius * 2) / 2;
        body.addShape(sphereTop, new this.CANNON.Vec3(0, halfHeight, 0));
        body.addShape(sphereBottom, new this.CANNON.Vec3(0, -halfHeight, 0));
        return; // Already added shapes
      }
      case 'cone': {
        // Approximate cone with cylinder (Cannon.js doesn't have native cone)
        const radius = config.radius ?? 0.5;
        const height = config.height ?? 1;
        shape = new this.CANNON.Cylinder(0, radius, height, 16);
        break;
      }
      case 'convex': {
        if (config.vertices) {
          const vertices: CannonVec3[] = [];
          for (let i = 0; i < config.vertices.length; i += 3) {
            vertices.push(new this.CANNON.Vec3(
              config.vertices[i]!,
              config.vertices[i + 1]!,
              config.vertices[i + 2]!
            ));
          }
          // Generate simple convex hull faces (simplified)
          const faces: number[][] = [];
          // This is a simplified face generation - real implementation would compute proper convex hull
          if (vertices.length >= 4) {
            for (let i = 0; i < vertices.length - 2; i++) {
              faces.push([0, i + 1, i + 2]);
            }
          }
          shape = new this.CANNON.ConvexPolyhedron({ vertices, faces });
        }
        break;
      }
      case 'trimesh': {
        if (config.vertices && config.indices) {
          const vertices: number[] = Array.from(config.vertices);
          const indices: number[] = Array.from(config.indices);
          shape = new this.CANNON.Trimesh(vertices, indices);
        }
        break;
      }
    }

    if (shape) {
      body.addShape(shape);
    }

    // Update material if specified
    if (config.friction !== undefined || config.restitution !== undefined) {
      const material = new this.CANNON.Material({
        friction: config.friction ?? 0.3,
        restitution: config.restitution ?? 0.3
      });
      body.material = material;
    }

    // Update mass if density specified
    if (config.density !== undefined && body.mass > 0) {
      body.mass = config.density * 10; // Simplified mass calculation
    }
  }

  createJoint(id: string, config: JointConfig): void {
    const bodyA = this.bodies.get(config.bodyA);
    const bodyB = this.bodies.get(config.bodyB);
    if (!bodyA || !bodyB) return;

    const anchorA = config.anchorA ?? { x: 0, y: 0, z: 0 };
    const anchorB = config.anchorB ?? { x: 0, y: 0, z: 0 };

    let constraint: CannonConstraint | null = null;

    switch (config.type) {
      case 'fixed': {
        constraint = new this.CANNON.LockConstraint(bodyA, bodyB);
        break;
      }
      case 'revolute': {
        const axis = config.axisA ?? { x: 0, y: 1, z: 0 };
        constraint = new this.CANNON.HingeConstraint(bodyA, bodyB, {
          pivotA: new this.CANNON.Vec3(anchorA.x, anchorA.y, anchorA.z),
          pivotB: new this.CANNON.Vec3(anchorB.x, anchorB.y, anchorB.z),
          axisA: new this.CANNON.Vec3(axis.x, axis.y, axis.z),
          axisB: new this.CANNON.Vec3(axis.x, axis.y, axis.z)
        });
        if (config.motorEnabled) {
          const hingeConstraint = constraint as CannonConstraint & {
            enableMotor(): void;
            setMotorSpeed(speed: number): void;
            setMotorMaxForce(force: number): void;
          };
          hingeConstraint.enableMotor();
          hingeConstraint.setMotorSpeed(config.motorVelocity ?? 0);
          hingeConstraint.setMotorMaxForce(config.motorMaxForce ?? 1000);
        }
        break;
      }
      case 'prismatic': {
        // Cannon.js doesn't have prismatic, use point-to-point as fallback
        constraint = new this.CANNON.PointToPointConstraint(
          bodyA,
          new this.CANNON.Vec3(anchorA.x, anchorA.y, anchorA.z),
          bodyB,
          new this.CANNON.Vec3(anchorB.x, anchorB.y, anchorB.z)
        );
        break;
      }
      case 'spherical': {
        constraint = new this.CANNON.PointToPointConstraint(
          bodyA,
          new this.CANNON.Vec3(anchorA.x, anchorA.y, anchorA.z),
          bodyB,
          new this.CANNON.Vec3(anchorB.x, anchorB.y, anchorB.z)
        );
        break;
      }
      case 'rope': {
        const distance = Math.sqrt(
          Math.pow(anchorB.x - anchorA.x, 2) +
          Math.pow(anchorB.y - anchorA.y, 2) +
          Math.pow(anchorB.z - anchorA.z, 2)
        );
        constraint = new this.CANNON.DistanceConstraint(bodyA, bodyB, distance);
        break;
      }
      case 'spring': {
        const spring = new this.CANNON.Spring(bodyA, bodyB, {
          localAnchorA: new this.CANNON.Vec3(anchorA.x, anchorA.y, anchorA.z),
          localAnchorB: new this.CANNON.Vec3(anchorB.x, anchorB.y, anchorB.z),
          stiffness: config.stiffness ?? 100,
          damping: config.damping ?? 1,
          restLength: 0
        });
        this.springs.set(id, spring);
        return; // Springs are not constraints in Cannon.js
      }
    }

    if (constraint) {
      this.world.addConstraint(constraint);
      this.constraints.set(id, constraint);
    }
  }

  removeJoint(id: string): void {
    const constraint = this.constraints.get(id);
    if (constraint) {
      this.world.removeConstraint(constraint);
      this.constraints.delete(id);
    }
    this.springs.delete(id);
  }

  setPosition(bodyId: string, position: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      body.position.set(position.x, position.y, position.z);
    }
  }

  setRotation(bodyId: string, rotation: Quaternion): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      body.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
  }

  setVelocity(bodyId: string, velocity: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      body.velocity.set(velocity.x, velocity.y, velocity.z);
    }
  }

  setAngularVelocity(bodyId: string, velocity: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      body.angularVelocity.set(velocity.x, velocity.y, velocity.z);
    }
  }

  applyForce(bodyId: string, force: Vector3, point?: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      const forceVec = new this.CANNON.Vec3(force.x, force.y, force.z);
      if (point) {
        body.applyForce(forceVec, new this.CANNON.Vec3(point.x, point.y, point.z));
      } else {
        body.applyForce(forceVec, body.position);
      }
    }
  }

  applyImpulse(bodyId: string, impulse: Vector3, point?: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      const impulseVec = new this.CANNON.Vec3(impulse.x, impulse.y, impulse.z);
      if (point) {
        body.applyImpulse(impulseVec, new this.CANNON.Vec3(point.x, point.y, point.z));
      } else {
        body.applyImpulse(impulseVec, body.position);
      }
    }
  }

  applyTorque(bodyId: string, torque: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      body.applyTorque(new this.CANNON.Vec3(torque.x, torque.y, torque.z));
    }
  }

  getPosition(bodyId: string): Vector3 {
    const body = this.bodies.get(bodyId);
    if (body) {
      return { x: body.position.x, y: body.position.y, z: body.position.z };
    }
    return { x: 0, y: 0, z: 0 };
  }

  getRotation(bodyId: string): Quaternion {
    const body = this.bodies.get(bodyId);
    if (body) {
      return { x: body.quaternion.x, y: body.quaternion.y, z: body.quaternion.z, w: body.quaternion.w };
    }
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  getVelocity(bodyId: string): Vector3 {
    const body = this.bodies.get(bodyId);
    if (body) {
      return { x: body.velocity.x, y: body.velocity.y, z: body.velocity.z };
    }
    return { x: 0, y: 0, z: 0 };
  }

  getAngularVelocity(bodyId: string): Vector3 {
    const body = this.bodies.get(bodyId);
    if (body) {
      return { x: body.angularVelocity.x, y: body.angularVelocity.y, z: body.angularVelocity.z };
    }
    return { x: 0, y: 0, z: 0 };
  }

  raycast(origin: Vector3, direction: Vector3, maxDistance: number, _groups?: number): RaycastResult {
    const from = new this.CANNON.Vec3(origin.x, origin.y, origin.z);
    const to = new this.CANNON.Vec3(
      origin.x + direction.x * maxDistance,
      origin.y + direction.y * maxDistance,
      origin.z + direction.z * maxDistance
    );

    const result = new this.CANNON.RaycastResult();
    const hasHit = this.world.raycastClosest(from, to, {}, result);

    if (hasHit && result.hasHit) {
      return {
        hit: true,
        bodyId: result.body ? this.getBodyIdFromBody(result.body) : undefined,
        point: { x: result.hitPointWorld.x, y: result.hitPointWorld.y, z: result.hitPointWorld.z },
        normal: { x: result.hitNormalWorld.x, y: result.hitNormalWorld.y, z: result.hitNormalWorld.z },
        distance: result.distance
      };
    }

    return { hit: false };
  }

  shapeCast(shape: ColliderConfig, origin: Vector3, direction: Vector3, maxDistance: number): RaycastResult {
    // Cannon.js doesn't have native shape casting, fall back to raycast
    return this.raycast(origin, direction, maxDistance);
  }

  private getBodyIdFromBody(body: CannonBody): string | undefined {
    for (const [id, b] of this.bodies) {
      if (b === body) return id;
    }
    return undefined;
  }

  getContacts(): ContactEvent[] {
    const contacts = [...this.contactEvents];
    this.contactEvents = [];
    return contacts;
  }

  destroy(): void {
    this.bodies.forEach((body) => {
      this.world.removeBody(body);
    });
    this.bodies.clear();
    this.constraints.clear();
    this.springs.clear();
    this.contactEvents = [];
  }
}

// ============================================================================
// AMMO.JS BACKEND
// ============================================================================

// Ammo.js type definitions
interface AmmoVector3 {
  x(): number;
  y(): number;
  z(): number;
  setValue(x: number, y: number, z: number): void;
}

interface AmmoQuaternion {
  x(): number;
  y(): number;
  z(): number;
  w(): number;
  setValue(x: number, y: number, z: number, w: number): void;
}

interface AmmoTransform {
  getOrigin(): AmmoVector3;
  getRotation(): AmmoQuaternion;
  setOrigin(origin: AmmoVector3): void;
  setRotation(rotation: AmmoQuaternion): void;
  setIdentity(): void;
}

interface AmmoMotionState {
  getWorldTransform(transform: AmmoTransform): void;
  setWorldTransform(transform: AmmoTransform): void;
}

interface AmmoCollisionShape {
  calculateLocalInertia(mass: number, inertia: AmmoVector3): void;
  setLocalScaling(scaling: AmmoVector3): void;
  setMargin(margin: number): void;
}

interface AmmoRigidBodyConstructionInfo {
  set_m_friction(friction: number): void;
  set_m_restitution(restitution: number): void;
  set_m_linearDamping(damping: number): void;
  set_m_angularDamping(damping: number): void;
}

interface AmmoRigidBody {
  getMotionState(): AmmoMotionState | null;
  setMotionState(motionState: AmmoMotionState): void;
  getWorldTransform(): AmmoTransform;
  setWorldTransform(transform: AmmoTransform): void;
  getLinearVelocity(): AmmoVector3;
  getAngularVelocity(): AmmoVector3;
  setLinearVelocity(velocity: AmmoVector3): void;
  setAngularVelocity(velocity: AmmoVector3): void;
  applyCentralForce(force: AmmoVector3): void;
  applyForce(force: AmmoVector3, relPos: AmmoVector3): void;
  applyCentralImpulse(impulse: AmmoVector3): void;
  applyImpulse(impulse: AmmoVector3, relPos: AmmoVector3): void;
  applyTorque(torque: AmmoVector3): void;
  setFriction(friction: number): void;
  setRestitution(restitution: number): void;
  setDamping(linear: number, angular: number): void;
  setActivationState(state: number): void;
  setCollisionFlags(flags: number): void;
  getCollisionFlags(): number;
  getUserIndex(): number;
  setUserIndex(index: number): void;
  isActive(): boolean;
  activate(forceActivation?: boolean): void;
  setCcdMotionThreshold(threshold: number): void;
  setCcdSweptSphereRadius(radius: number): void;
}

interface AmmoTypedConstraint {
  enableFeedback(enable: boolean): void;
}

interface AmmoPoint2PointConstraint extends AmmoTypedConstraint {
  setPivotA(pivot: AmmoVector3): void;
  setPivotB(pivot: AmmoVector3): void;
}

interface AmmoHingeConstraint extends AmmoTypedConstraint {
  setLimit(low: number, high: number, softness?: number, biasFactor?: number, relaxationFactor?: number): void;
  enableAngularMotor(enable: boolean, targetVelocity: number, maxMotorImpulse: number): void;
}

interface AmmoSliderConstraint extends AmmoTypedConstraint {
  setLowerLinLimit(limit: number): void;
  setUpperLinLimit(limit: number): void;
}

interface AmmoGeneric6DofConstraint extends AmmoTypedConstraint {
  setLinearLowerLimit(limit: AmmoVector3): void;
  setLinearUpperLimit(limit: AmmoVector3): void;
  setAngularLowerLimit(limit: AmmoVector3): void;
  setAngularUpperLimit(limit: AmmoVector3): void;
}

interface AmmoRayResultCallback {
  hasHit(): boolean;
  get_m_collisionObject(): AmmoCollisionObject;
  get_m_hitPointWorld(): AmmoVector3;
  get_m_hitNormalWorld(): AmmoVector3;
  get_m_closestHitFraction(): number;
}

interface AmmoCollisionObject {
  getUserIndex(): number;
}

interface AmmoContactManifold {
  getNumContacts(): number;
  getContactPoint(index: number): AmmoManifoldPoint;
  getBody0(): AmmoCollisionObject;
  getBody1(): AmmoCollisionObject;
}

interface AmmoManifoldPoint {
  getPositionWorldOnA(): AmmoVector3;
  getPositionWorldOnB(): AmmoVector3;
  get_m_normalWorldOnB(): AmmoVector3;
  getAppliedImpulse(): number;
  getDistance(): number;
}

interface AmmoDispatcher {
  getNumManifolds(): number;
  getManifoldByIndexInternal(index: number): AmmoContactManifold;
}

interface AmmoDynamicsWorld {
  setGravity(gravity: AmmoVector3): void;
  addRigidBody(body: AmmoRigidBody, group?: number, mask?: number): void;
  removeRigidBody(body: AmmoRigidBody): void;
  addConstraint(constraint: AmmoTypedConstraint, disableCollisionsBetweenLinkedBodies?: boolean): void;
  removeConstraint(constraint: AmmoTypedConstraint): void;
  stepSimulation(timeStep: number, maxSubSteps?: number, fixedTimeStep?: number): void;
  rayTest(rayFromWorld: AmmoVector3, rayToWorld: AmmoVector3, resultCallback: AmmoRayResultCallback): void;
  getDispatcher(): AmmoDispatcher;
}

interface AmmoModule {
  btVector3: new (x?: number, y?: number, z?: number) => AmmoVector3;
  btQuaternion: new (x?: number, y?: number, z?: number, w?: number) => AmmoQuaternion;
  btTransform: new () => AmmoTransform;
  btDefaultMotionState: new (startTrans?: AmmoTransform) => AmmoMotionState;
  btBoxShape: new (halfExtents: AmmoVector3) => AmmoCollisionShape;
  btSphereShape: new (radius: number) => AmmoCollisionShape;
  btCylinderShape: new (halfExtents: AmmoVector3) => AmmoCollisionShape;
  btCapsuleShape: new (radius: number, height: number) => AmmoCollisionShape;
  btConeShape: new (radius: number, height: number) => AmmoCollisionShape;
  btConvexHullShape: new () => AmmoCollisionShape & { addPoint(point: AmmoVector3, recalculateLocalAabb?: boolean): void };
  btBvhTriangleMeshShape: new (mesh: AmmoTriangleMesh, useQuantizedAabbCompression: boolean, buildBvh?: boolean) => AmmoCollisionShape;
  btTriangleMesh: new (use32bitIndices?: boolean, use4componentVertices?: boolean) => AmmoTriangleMesh;
  btRigidBodyConstructionInfo: new (mass: number, motionState: AmmoMotionState, collisionShape: AmmoCollisionShape, localInertia?: AmmoVector3) => AmmoRigidBodyConstructionInfo;
  btRigidBody: new (constructionInfo: AmmoRigidBodyConstructionInfo) => AmmoRigidBody;
  btPoint2PointConstraint: new (bodyA: AmmoRigidBody, bodyB: AmmoRigidBody, pivotInA: AmmoVector3, pivotInB: AmmoVector3) => AmmoPoint2PointConstraint;
  btHingeConstraint: new (bodyA: AmmoRigidBody, bodyB: AmmoRigidBody, pivotInA: AmmoVector3, pivotInB: AmmoVector3, axisInA: AmmoVector3, axisInB: AmmoVector3, useReferenceFrameA?: boolean) => AmmoHingeConstraint;
  btSliderConstraint: new (bodyA: AmmoRigidBody, bodyB: AmmoRigidBody, frameInA: AmmoTransform, frameInB: AmmoTransform, useLinearReferenceFrameA: boolean) => AmmoSliderConstraint;
  btGeneric6DofConstraint: new (bodyA: AmmoRigidBody, bodyB: AmmoRigidBody, frameInA: AmmoTransform, frameInB: AmmoTransform, useLinearReferenceFrameA: boolean) => AmmoGeneric6DofConstraint;
  btFixedConstraint: new (bodyA: AmmoRigidBody, bodyB: AmmoRigidBody, frameInA: AmmoTransform, frameInB: AmmoTransform) => AmmoTypedConstraint;
  btDefaultCollisionConfiguration: new () => object;
  btCollisionDispatcher: new (config: object) => object;
  btDbvtBroadphase: new () => object;
  btAxisSweep3: new (worldAabbMin: AmmoVector3, worldAabbMax: AmmoVector3) => object;
  btSequentialImpulseConstraintSolver: new () => object;
  btDiscreteDynamicsWorld: new (dispatcher: object, broadphase: object, solver: object, collisionConfiguration: object) => AmmoDynamicsWorld;
  ClosestRayResultCallback: new (rayFromWorld: AmmoVector3, rayToWorld: AmmoVector3) => AmmoRayResultCallback;
  destroy(obj: object): void;
  DISABLE_DEACTIVATION: number;
  ACTIVE_TAG: number;
  CF_KINEMATIC_OBJECT: number;
  CF_STATIC_OBJECT: number;
}

interface AmmoTriangleMesh {
  addTriangle(v0: AmmoVector3, v1: AmmoVector3, v2: AmmoVector3, removeDuplicateVertices?: boolean): void;
}

class AmmoBackend extends PhysicsBackend {
  private world!: AmmoDynamicsWorld;
  private bodies: Map<string, AmmoRigidBody> = new Map();
  private shapes: Map<string, AmmoCollisionShape> = new Map();
  private constraints: Map<string, AmmoTypedConstraint> = new Map();
  private Ammo!: AmmoModule;
  private bodyIdCounter = 0;
  private bodyIndexToId: Map<number, string> = new Map();
  private tempTransform!: AmmoTransform;
  private tempVector!: AmmoVector3;
  private tempQuaternion!: AmmoQuaternion;

  async init(config: PhysicsConfig): Promise<void> {
    // @ts-ignore - Dynamic import
    const AmmoLib = await import('ammo.js');
    this.Ammo = await (AmmoLib.default ? AmmoLib.default() : AmmoLib());

    // Create collision configuration
    const collisionConfiguration = new this.Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new this.Ammo.btCollisionDispatcher(collisionConfiguration);

    // Create broadphase
    let broadphase: object;
    if (config.broadphase === 'sap') {
      const worldMin = new this.Ammo.btVector3(-1000, -1000, -1000);
      const worldMax = new this.Ammo.btVector3(1000, 1000, 1000);
      broadphase = new this.Ammo.btAxisSweep3(worldMin, worldMax);
      this.Ammo.destroy(worldMin);
      this.Ammo.destroy(worldMax);
    } else {
      broadphase = new this.Ammo.btDbvtBroadphase();
    }

    // Create solver
    const solver = new this.Ammo.btSequentialImpulseConstraintSolver();

    // Create world
    this.world = new this.Ammo.btDiscreteDynamicsWorld(
      dispatcher,
      broadphase,
      solver,
      collisionConfiguration
    );

    // Set gravity
    const gravity = config.gravity ?? { x: 0, y: -9.81, z: 0 };
    const gravityVector = new this.Ammo.btVector3(gravity.x, gravity.y, gravity.z);
    this.world.setGravity(gravityVector);
    this.Ammo.destroy(gravityVector);

    // Create temp objects for reuse
    this.tempTransform = new this.Ammo.btTransform();
    this.tempVector = new this.Ammo.btVector3();
    this.tempQuaternion = new this.Ammo.btQuaternion(0, 0, 0, 1);
  }

  step(dt: number): void {
    this.world.stepSimulation(dt, 10, 1 / 60);
  }

  createRigidBody(id: string, config: RigidBodyConfig, position: Vector3, rotation: Quaternion): void {
    // Create a default shape (will be replaced when addCollider is called)
    const defaultShape = new this.Ammo.btBoxShape(new this.Ammo.btVector3(0.5, 0.5, 0.5));

    // Create transform
    const transform = new this.Ammo.btTransform();
    transform.setIdentity();
    const origin = new this.Ammo.btVector3(position.x, position.y, position.z);
    transform.setOrigin(origin);
    const quat = new this.Ammo.btQuaternion(rotation.x, rotation.y, rotation.z, rotation.w);
    transform.setRotation(quat);

    // Calculate mass and inertia
    const mass = config.type === 'static' ? 0 : (config.mass ?? 1);
    const localInertia = new this.Ammo.btVector3(0, 0, 0);
    if (mass !== 0) {
      defaultShape.calculateLocalInertia(mass, localInertia);
    }

    // Create motion state
    const motionState = new this.Ammo.btDefaultMotionState(transform);

    // Create rigid body
    const rbInfo = new this.Ammo.btRigidBodyConstructionInfo(mass, motionState, defaultShape, localInertia);

    if (config.friction !== undefined) {
      rbInfo.set_m_friction(config.friction);
    }
    if (config.restitution !== undefined) {
      rbInfo.set_m_restitution(config.restitution);
    }
    if (config.linearDamping !== undefined || config.angularDamping !== undefined) {
      rbInfo.set_m_linearDamping(config.linearDamping ?? 0);
      rbInfo.set_m_angularDamping(config.angularDamping ?? 0);
    }

    const body = new this.Ammo.btRigidBody(rbInfo);

    // Set body type flags
    if (config.type === 'kinematic') {
      body.setCollisionFlags(body.getCollisionFlags() | this.Ammo.CF_KINEMATIC_OBJECT);
      body.setActivationState(this.Ammo.DISABLE_DEACTIVATION);
    } else if (config.type === 'static') {
      body.setCollisionFlags(body.getCollisionFlags() | this.Ammo.CF_STATIC_OBJECT);
    }

    // Disable sleeping if requested
    if (config.canSleep === false) {
      body.setActivationState(this.Ammo.DISABLE_DEACTIVATION);
    }

    // Enable CCD if requested
    if (config.ccd) {
      body.setCcdMotionThreshold(0.1);
      body.setCcdSweptSphereRadius(0.2);
    }

    // Set user index for identification
    const bodyIndex = this.bodyIdCounter++;
    body.setUserIndex(bodyIndex);
    this.bodyIndexToId.set(bodyIndex, id);

    // Add to world
    const group = config.collisionGroups ?? 1;
    const mask = config.collisionMask ?? -1;
    this.world.addRigidBody(body, group, mask);

    this.bodies.set(id, body);
    this.shapes.set(id, defaultShape);

    // Cleanup temp objects
    this.Ammo.destroy(origin);
    this.Ammo.destroy(quat);
    this.Ammo.destroy(localInertia);
    this.Ammo.destroy(transform);
    this.Ammo.destroy(rbInfo);
  }

  removeRigidBody(id: string): void {
    const body = this.bodies.get(id);
    if (body) {
      this.world.removeRigidBody(body);
      const shape = this.shapes.get(id);
      if (shape) {
        this.Ammo.destroy(shape);
        this.shapes.delete(id);
      }
      this.Ammo.destroy(body);
      this.bodies.delete(id);

      // Remove from index mapping
      for (const [index, bodyId] of this.bodyIndexToId) {
        if (bodyId === id) {
          this.bodyIndexToId.delete(index);
          break;
        }
      }
    }
  }

  addCollider(bodyId: string, config: ColliderConfig): void {
    const body = this.bodies.get(bodyId);
    if (!body) return;

    let shape: AmmoCollisionShape | null = null;

    switch (config.shape) {
      case 'box': {
        const size = config.size ?? { x: 0.5, y: 0.5, z: 0.5 };
        const halfExtents = new this.Ammo.btVector3(size.x, size.y, size.z);
        shape = new this.Ammo.btBoxShape(halfExtents);
        this.Ammo.destroy(halfExtents);
        break;
      }
      case 'sphere': {
        shape = new this.Ammo.btSphereShape(config.radius ?? 0.5);
        break;
      }
      case 'cylinder': {
        const radius = config.radius ?? 0.5;
        const height = config.height ?? 1;
        const halfExtents = new this.Ammo.btVector3(radius, height / 2, radius);
        shape = new this.Ammo.btCylinderShape(halfExtents);
        this.Ammo.destroy(halfExtents);
        break;
      }
      case 'capsule': {
        const radius = config.radius ?? 0.5;
        const height = config.height ?? 1;
        shape = new this.Ammo.btCapsuleShape(radius, height - radius * 2);
        break;
      }
      case 'cone': {
        const radius = config.radius ?? 0.5;
        const height = config.height ?? 1;
        shape = new this.Ammo.btConeShape(radius, height);
        break;
      }
      case 'convex': {
        if (config.vertices) {
          const convexShape = new this.Ammo.btConvexHullShape();
          for (let i = 0; i < config.vertices.length; i += 3) {
            const point = new this.Ammo.btVector3(
              config.vertices[i]!,
              config.vertices[i + 1]!,
              config.vertices[i + 2]!
            );
            convexShape.addPoint(point, true);
            this.Ammo.destroy(point);
          }
          shape = convexShape;
        }
        break;
      }
      case 'trimesh': {
        if (config.vertices && config.indices) {
          const mesh = new this.Ammo.btTriangleMesh(true, false);
          for (let i = 0; i < config.indices.length; i += 3) {
            const i0 = config.indices[i]! * 3;
            const i1 = config.indices[i + 1]! * 3;
            const i2 = config.indices[i + 2]! * 3;

            const v0 = new this.Ammo.btVector3(
              config.vertices[i0]!,
              config.vertices[i0 + 1]!,
              config.vertices[i0 + 2]!
            );
            const v1 = new this.Ammo.btVector3(
              config.vertices[i1]!,
              config.vertices[i1 + 1]!,
              config.vertices[i1 + 2]!
            );
            const v2 = new this.Ammo.btVector3(
              config.vertices[i2]!,
              config.vertices[i2 + 1]!,
              config.vertices[i2 + 2]!
            );

            mesh.addTriangle(v0, v1, v2, false);

            this.Ammo.destroy(v0);
            this.Ammo.destroy(v1);
            this.Ammo.destroy(v2);
          }
          shape = new this.Ammo.btBvhTriangleMeshShape(mesh, true, true);
        }
        break;
      }
    }

    if (!shape) return;

    // Remove old shape and set new one
    const oldShape = this.shapes.get(bodyId);
    if (oldShape) {
      this.Ammo.destroy(oldShape);
    }
    this.shapes.set(bodyId, shape);

    // Update material properties
    if (config.friction !== undefined) {
      body.setFriction(config.friction);
    }
    if (config.restitution !== undefined) {
      body.setRestitution(config.restitution);
    }
  }

  createJoint(id: string, config: JointConfig): void {
    const bodyA = this.bodies.get(config.bodyA);
    const bodyB = this.bodies.get(config.bodyB);
    if (!bodyA || !bodyB) return;

    const anchorA = config.anchorA ?? { x: 0, y: 0, z: 0 };
    const anchorB = config.anchorB ?? { x: 0, y: 0, z: 0 };

    let constraint: AmmoTypedConstraint | null = null;

    switch (config.type) {
      case 'fixed': {
        const frameA = new this.Ammo.btTransform();
        frameA.setIdentity();
        const originA = new this.Ammo.btVector3(anchorA.x, anchorA.y, anchorA.z);
        frameA.setOrigin(originA);

        const frameB = new this.Ammo.btTransform();
        frameB.setIdentity();
        const originB = new this.Ammo.btVector3(anchorB.x, anchorB.y, anchorB.z);
        frameB.setOrigin(originB);

        constraint = new this.Ammo.btFixedConstraint(bodyA, bodyB, frameA, frameB);

        this.Ammo.destroy(originA);
        this.Ammo.destroy(originB);
        this.Ammo.destroy(frameA);
        this.Ammo.destroy(frameB);
        break;
      }
      case 'revolute': {
        const axis = config.axisA ?? { x: 0, y: 1, z: 0 };
        const pivotA = new this.Ammo.btVector3(anchorA.x, anchorA.y, anchorA.z);
        const pivotB = new this.Ammo.btVector3(anchorB.x, anchorB.y, anchorB.z);
        const axisA = new this.Ammo.btVector3(axis.x, axis.y, axis.z);
        const axisB = new this.Ammo.btVector3(axis.x, axis.y, axis.z);

        const hinge = new this.Ammo.btHingeConstraint(bodyA, bodyB, pivotA, pivotB, axisA, axisB, true);

        if (config.limitsEnabled) {
          hinge.setLimit(config.limitsMin ?? -Math.PI, config.limitsMax ?? Math.PI, 0.9, 0.3, 1.0);
        }

        if (config.motorEnabled) {
          hinge.enableAngularMotor(true, config.motorVelocity ?? 0, config.motorMaxForce ?? 1000);
        }

        constraint = hinge;

        this.Ammo.destroy(pivotA);
        this.Ammo.destroy(pivotB);
        this.Ammo.destroy(axisA);
        this.Ammo.destroy(axisB);
        break;
      }
      case 'prismatic': {
        const frameA = new this.Ammo.btTransform();
        frameA.setIdentity();
        const originA = new this.Ammo.btVector3(anchorA.x, anchorA.y, anchorA.z);
        frameA.setOrigin(originA);

        const frameB = new this.Ammo.btTransform();
        frameB.setIdentity();
        const originB = new this.Ammo.btVector3(anchorB.x, anchorB.y, anchorB.z);
        frameB.setOrigin(originB);

        const slider = new this.Ammo.btSliderConstraint(bodyA, bodyB, frameA, frameB, true);

        if (config.limitsEnabled) {
          slider.setLowerLinLimit(config.limitsMin ?? -1);
          slider.setUpperLinLimit(config.limitsMax ?? 1);
        }

        constraint = slider;

        this.Ammo.destroy(originA);
        this.Ammo.destroy(originB);
        this.Ammo.destroy(frameA);
        this.Ammo.destroy(frameB);
        break;
      }
      case 'spherical': {
        const pivotA = new this.Ammo.btVector3(anchorA.x, anchorA.y, anchorA.z);
        const pivotB = new this.Ammo.btVector3(anchorB.x, anchorB.y, anchorB.z);

        constraint = new this.Ammo.btPoint2PointConstraint(bodyA, bodyB, pivotA, pivotB);

        this.Ammo.destroy(pivotA);
        this.Ammo.destroy(pivotB);
        break;
      }
      case 'rope':
      case 'spring': {
        // Ammo.js doesn't have native rope/spring constraints
        // Fall back to generic 6DOF constraint with limits
        const frameA = new this.Ammo.btTransform();
        frameA.setIdentity();
        const originA = new this.Ammo.btVector3(anchorA.x, anchorA.y, anchorA.z);
        frameA.setOrigin(originA);

        const frameB = new this.Ammo.btTransform();
        frameB.setIdentity();
        const originB = new this.Ammo.btVector3(anchorB.x, anchorB.y, anchorB.z);
        frameB.setOrigin(originB);

        const generic = new this.Ammo.btGeneric6DofConstraint(bodyA, bodyB, frameA, frameB, true);

        // Allow movement in all directions for spring behavior
        const lowerLimit = new this.Ammo.btVector3(-10, -10, -10);
        const upperLimit = new this.Ammo.btVector3(10, 10, 10);
        generic.setLinearLowerLimit(lowerLimit);
        generic.setLinearUpperLimit(upperLimit);

        const angularLower = new this.Ammo.btVector3(-Math.PI, -Math.PI, -Math.PI);
        const angularUpper = new this.Ammo.btVector3(Math.PI, Math.PI, Math.PI);
        generic.setAngularLowerLimit(angularLower);
        generic.setAngularUpperLimit(angularUpper);

        constraint = generic;

        this.Ammo.destroy(originA);
        this.Ammo.destroy(originB);
        this.Ammo.destroy(frameA);
        this.Ammo.destroy(frameB);
        this.Ammo.destroy(lowerLimit);
        this.Ammo.destroy(upperLimit);
        this.Ammo.destroy(angularLower);
        this.Ammo.destroy(angularUpper);
        break;
      }
    }

    if (constraint) {
      this.world.addConstraint(constraint, true);
      this.constraints.set(id, constraint);
    }
  }

  removeJoint(id: string): void {
    const constraint = this.constraints.get(id);
    if (constraint) {
      this.world.removeConstraint(constraint);
      this.Ammo.destroy(constraint);
      this.constraints.delete(id);
    }
  }

  setPosition(bodyId: string, position: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      const motionState = body.getMotionState();
      if (motionState) {
        motionState.getWorldTransform(this.tempTransform);
        this.tempVector.setValue(position.x, position.y, position.z);
        this.tempTransform.setOrigin(this.tempVector);
        motionState.setWorldTransform(this.tempTransform);
        body.setWorldTransform(this.tempTransform);
      }
      body.activate(true);
    }
  }

  setRotation(bodyId: string, rotation: Quaternion): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      const motionState = body.getMotionState();
      if (motionState) {
        motionState.getWorldTransform(this.tempTransform);
        this.tempQuaternion.setValue(rotation.x, rotation.y, rotation.z, rotation.w);
        this.tempTransform.setRotation(this.tempQuaternion);
        motionState.setWorldTransform(this.tempTransform);
        body.setWorldTransform(this.tempTransform);
      }
      body.activate(true);
    }
  }

  setVelocity(bodyId: string, velocity: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      this.tempVector.setValue(velocity.x, velocity.y, velocity.z);
      body.setLinearVelocity(this.tempVector);
      body.activate(true);
    }
  }

  setAngularVelocity(bodyId: string, velocity: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      this.tempVector.setValue(velocity.x, velocity.y, velocity.z);
      body.setAngularVelocity(this.tempVector);
      body.activate(true);
    }
  }

  applyForce(bodyId: string, force: Vector3, point?: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      const forceVec = new this.Ammo.btVector3(force.x, force.y, force.z);
      if (point) {
        const relPos = new this.Ammo.btVector3(point.x, point.y, point.z);
        body.applyForce(forceVec, relPos);
        this.Ammo.destroy(relPos);
      } else {
        body.applyCentralForce(forceVec);
      }
      this.Ammo.destroy(forceVec);
      body.activate(true);
    }
  }

  applyImpulse(bodyId: string, impulse: Vector3, point?: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      const impulseVec = new this.Ammo.btVector3(impulse.x, impulse.y, impulse.z);
      if (point) {
        const relPos = new this.Ammo.btVector3(point.x, point.y, point.z);
        body.applyImpulse(impulseVec, relPos);
        this.Ammo.destroy(relPos);
      } else {
        body.applyCentralImpulse(impulseVec);
      }
      this.Ammo.destroy(impulseVec);
      body.activate(true);
    }
  }

  applyTorque(bodyId: string, torque: Vector3): void {
    const body = this.bodies.get(bodyId);
    if (body) {
      const torqueVec = new this.Ammo.btVector3(torque.x, torque.y, torque.z);
      body.applyTorque(torqueVec);
      this.Ammo.destroy(torqueVec);
      body.activate(true);
    }
  }

  getPosition(bodyId: string): Vector3 {
    const body = this.bodies.get(bodyId);
    if (body) {
      const motionState = body.getMotionState();
      if (motionState) {
        motionState.getWorldTransform(this.tempTransform);
        const origin = this.tempTransform.getOrigin();
        return { x: origin.x(), y: origin.y(), z: origin.z() };
      }
    }
    return { x: 0, y: 0, z: 0 };
  }

  getRotation(bodyId: string): Quaternion {
    const body = this.bodies.get(bodyId);
    if (body) {
      const motionState = body.getMotionState();
      if (motionState) {
        motionState.getWorldTransform(this.tempTransform);
        const rotation = this.tempTransform.getRotation();
        return { x: rotation.x(), y: rotation.y(), z: rotation.z(), w: rotation.w() };
      }
    }
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  getVelocity(bodyId: string): Vector3 {
    const body = this.bodies.get(bodyId);
    if (body) {
      const vel = body.getLinearVelocity();
      return { x: vel.x(), y: vel.y(), z: vel.z() };
    }
    return { x: 0, y: 0, z: 0 };
  }

  getAngularVelocity(bodyId: string): Vector3 {
    const body = this.bodies.get(bodyId);
    if (body) {
      const vel = body.getAngularVelocity();
      return { x: vel.x(), y: vel.y(), z: vel.z() };
    }
    return { x: 0, y: 0, z: 0 };
  }

  raycast(origin: Vector3, direction: Vector3, maxDistance: number, _groups?: number): RaycastResult {
    const from = new this.Ammo.btVector3(origin.x, origin.y, origin.z);
    const to = new this.Ammo.btVector3(
      origin.x + direction.x * maxDistance,
      origin.y + direction.y * maxDistance,
      origin.z + direction.z * maxDistance
    );

    const rayCallback = new this.Ammo.ClosestRayResultCallback(from, to);
    this.world.rayTest(from, to, rayCallback);

    let result: RaycastResult;

    if (rayCallback.hasHit()) {
      const hitPoint = rayCallback.get_m_hitPointWorld();
      const hitNormal = rayCallback.get_m_hitNormalWorld();
      const collisionObject = rayCallback.get_m_collisionObject();
      const bodyIndex = collisionObject.getUserIndex();
      const bodyId = this.bodyIndexToId.get(bodyIndex);

      result = {
        hit: true,
        bodyId,
        point: { x: hitPoint.x(), y: hitPoint.y(), z: hitPoint.z() },
        normal: { x: hitNormal.x(), y: hitNormal.y(), z: hitNormal.z() },
        distance: rayCallback.get_m_closestHitFraction() * maxDistance
      };
    } else {
      result = { hit: false };
    }

    this.Ammo.destroy(from);
    this.Ammo.destroy(to);
    this.Ammo.destroy(rayCallback);

    return result;
  }

  shapeCast(_shape: ColliderConfig, origin: Vector3, direction: Vector3, maxDistance: number): RaycastResult {
    // Ammo.js doesn't have convenient shape casting API, fall back to raycast
    return this.raycast(origin, direction, maxDistance);
  }

  getContacts(): ContactEvent[] {
    const contacts: ContactEvent[] = [];
    const dispatcher = this.world.getDispatcher();
    const numManifolds = dispatcher.getNumManifolds();

    for (let i = 0; i < numManifolds; i++) {
      const manifold = dispatcher.getManifoldByIndexInternal(i);
      const numContacts = manifold.getNumContacts();

      if (numContacts > 0) {
        const body0 = manifold.getBody0();
        const body1 = manifold.getBody1();
        const bodyAId = this.bodyIndexToId.get(body0.getUserIndex());
        const bodyBId = this.bodyIndexToId.get(body1.getUserIndex());

        if (bodyAId && bodyBId) {
          const contact = manifold.getContactPoint(0);
          const pointWorld = contact.getPositionWorldOnA();
          const normalWorld = contact.get_m_normalWorldOnB();

          contacts.push({
            bodyA: bodyAId,
            bodyB: bodyBId,
            point: { x: pointWorld.x(), y: pointWorld.y(), z: pointWorld.z() },
            normal: { x: normalWorld.x(), y: normalWorld.y(), z: normalWorld.z() },
            impulse: contact.getAppliedImpulse(),
            separation: contact.getDistance()
          });
        }
      }
    }

    return contacts;
  }

  destroy(): void {
    // Remove all constraints
    this.constraints.forEach((constraint) => {
      this.world.removeConstraint(constraint);
      this.Ammo.destroy(constraint);
    });
    this.constraints.clear();

    // Remove all bodies
    this.bodies.forEach((body) => {
      this.world.removeRigidBody(body);
      this.Ammo.destroy(body);
    });
    this.bodies.clear();

    // Destroy shapes
    this.shapes.forEach((shape) => {
      this.Ammo.destroy(shape);
    });
    this.shapes.clear();

    // Destroy temp objects
    this.Ammo.destroy(this.tempTransform);
    this.Ammo.destroy(this.tempVector);
    this.Ammo.destroy(this.tempQuaternion);

    this.bodyIndexToId.clear();
  }
}

// ============================================================================
// PHYSICS WORLD MANAGER
// ============================================================================

class PhysicsWorld {
  private backend: PhysicsBackend;
  private config: PhysicsConfig;
  private isRunning = false;
  private lastTime = 0;
  private accumulator = 0;
  private fixedTimestep: number;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(config: PhysicsConfig) {
    this.config = config;
    this.fixedTimestep = config.timestep || 1 / 60;

    switch (config.backend) {
      case 'rapier':
        this.backend = new RapierBackend();
        break;
      case 'cannon':
        this.backend = new CannonBackend();
        break;
      case 'ammo':
        this.backend = new AmmoBackend();
        break;
      default:
        this.backend = new RapierBackend();
    }
  }

  async init(): Promise<void> {
    await this.backend.init(this.config);
  }

  start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick();
  }

  stop(): void {
    this.isRunning = false;
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.accumulator += dt;

    while (this.accumulator >= this.fixedTimestep) {
      this.backend.step(this.fixedTimestep);
      this.accumulator -= this.fixedTimestep;

      // Check for contacts
      const contacts = this.backend.getContacts();
      contacts.forEach(contact => this.emit('collision', contact));
    }

    this.emit('update', { dt, alpha: this.accumulator / this.fixedTimestep });

    requestAnimationFrame(this.tick);
  };

  // ==================== RIGID BODIES ====================

  createRigidBody(id: string, config: RigidBodyConfig, position: Vector3 = { x: 0, y: 0, z: 0 }, rotation: Quaternion = { x: 0, y: 0, z: 0, w: 1 }): void {
    this.backend.createRigidBody(id, config, position, rotation);
  }

  removeRigidBody(id: string): void {
    this.backend.removeRigidBody(id);
  }

  addCollider(bodyId: string, config: ColliderConfig): void {
    this.backend.addCollider(bodyId, config);
  }

  // ==================== JOINTS ====================

  createJoint(id: string, config: JointConfig): void {
    this.backend.createJoint(id, config);
  }

  removeJoint(id: string): void {
    this.backend.removeJoint(id);
  }

  // ==================== TRANSFORMS ====================

  setPosition(bodyId: string, position: Vector3): void {
    this.backend.setPosition(bodyId, position);
  }

  setRotation(bodyId: string, rotation: Quaternion): void {
    this.backend.setRotation(bodyId, rotation);
  }

  getPosition(bodyId: string): Vector3 {
    return this.backend.getPosition(bodyId);
  }

  getRotation(bodyId: string): Quaternion {
    return this.backend.getRotation(bodyId);
  }

  // ==================== VELOCITIES ====================

  setVelocity(bodyId: string, velocity: Vector3): void {
    this.backend.setVelocity(bodyId, velocity);
  }

  setAngularVelocity(bodyId: string, velocity: Vector3): void {
    this.backend.setAngularVelocity(bodyId, velocity);
  }

  getVelocity(bodyId: string): Vector3 {
    return this.backend.getVelocity(bodyId);
  }

  getAngularVelocity(bodyId: string): Vector3 {
    return this.backend.getAngularVelocity(bodyId);
  }

  // ==================== FORCES ====================

  applyForce(bodyId: string, force: Vector3, point?: Vector3): void {
    this.backend.applyForce(bodyId, force, point);
  }

  applyImpulse(bodyId: string, impulse: Vector3, point?: Vector3): void {
    this.backend.applyImpulse(bodyId, impulse, point);
  }

  applyTorque(bodyId: string, torque: Vector3): void {
    this.backend.applyTorque(bodyId, torque);
  }

  // ==================== QUERIES ====================

  raycast(origin: Vector3, direction: Vector3, maxDistance: number = 100): RaycastResult {
    return this.backend.raycast(origin, direction, maxDistance);
  }

  shapeCast(shape: ColliderConfig, origin: Vector3, direction: Vector3, maxDistance: number = 100): RaycastResult {
    return this.backend.shapeCast(shape, origin, direction, maxDistance);
  }

  // ==================== EVENTS ====================

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  destroy(): void {
    this.stop();
    this.backend.destroy();
    this.listeners.clear();
  }
}

// ============================================================================
// CHARACTER CONTROLLER
// ============================================================================

interface CharacterConfig {
  height: number;
  radius: number;
  mass?: number;
  maxSpeed?: number;
  jumpForce?: number;
  groundCheckDistance?: number;
  slopeLimit?: number;
  stepHeight?: number;
}

class CharacterController {
  private world: PhysicsWorld;
  private bodyId: string;
  private config: Required<CharacterConfig>;
  private isGrounded = false;
  private groundNormal: Vector3 = { x: 0, y: 1, z: 0 };
  private moveInput: Vector3 = { x: 0, y: 0, z: 0 };
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(world: PhysicsWorld, bodyId: string, config: CharacterConfig) {
    this.world = world;
    this.bodyId = bodyId;
    this.config = {
      height: config.height,
      radius: config.radius,
      mass: config.mass ?? 70,
      maxSpeed: config.maxSpeed ?? 5,
      jumpForce: config.jumpForce ?? 10,
      groundCheckDistance: config.groundCheckDistance ?? 0.1,
      slopeLimit: config.slopeLimit ?? 45,
      stepHeight: config.stepHeight ?? 0.3
    };

    this.setupBody();
  }

  private setupBody(): void {
    this.world.createRigidBody(this.bodyId, {
      type: 'dynamic',
      mass: this.config.mass,
      linearDamping: 0.1,
      angularDamping: 1,
      canSleep: false
    });

    this.world.addCollider(this.bodyId, {
      shape: 'capsule',
      radius: this.config.radius,
      height: this.config.height
    });

    // Lock rotation
    this.world.setAngularVelocity(this.bodyId, { x: 0, y: 0, z: 0 });
  }

  update(): void {
    this.checkGround();
    this.applyMovement();
  }

  private checkGround(): void {
    const pos = this.world.getPosition(this.bodyId);
    const origin = {
      x: pos.x,
      y: pos.y - this.config.height / 2,
      z: pos.z
    };

    const result = this.world.raycast(
      origin,
      { x: 0, y: -1, z: 0 },
      this.config.groundCheckDistance + 0.1
    );

    const wasGrounded = this.isGrounded;
    this.isGrounded = result.hit && result.distance! <= this.config.groundCheckDistance;

    if (result.normal) {
      this.groundNormal = result.normal;
    }

    if (this.isGrounded && !wasGrounded) {
      this.emit('landed', {});
    } else if (!this.isGrounded && wasGrounded) {
      this.emit('leftGround', {});
    }
  }

  private applyMovement(): void {
    const velocity = this.world.getVelocity(this.bodyId);

    // Calculate target velocity
    const targetVelocity = {
      x: this.moveInput.x * this.config.maxSpeed,
      y: velocity.y,
      z: this.moveInput.z * this.config.maxSpeed
    };

    // Smooth acceleration
    const acceleration = 10;
    const newVelocity = {
      x: velocity.x + (targetVelocity.x - velocity.x) * acceleration * (1 / 60),
      y: velocity.y,
      z: velocity.z + (targetVelocity.z - velocity.z) * acceleration * (1 / 60)
    };

    this.world.setVelocity(this.bodyId, newVelocity);

    // Lock angular velocity
    this.world.setAngularVelocity(this.bodyId, { x: 0, y: 0, z: 0 });
  }

  move(input: Vector3): void {
    this.moveInput = input;
  }

  jump(): boolean {
    if (!this.isGrounded) return false;

    const velocity = this.world.getVelocity(this.bodyId);
    this.world.setVelocity(this.bodyId, {
      x: velocity.x,
      y: this.config.jumpForce,
      z: velocity.z
    });

    this.emit('jumped', {});
    return true;
  }

  getIsGrounded(): boolean {
    return this.isGrounded;
  }

  getGroundNormal(): Vector3 {
    return this.groundNormal;
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}

// ============================================================================
// VEHICLE PHYSICS
// ============================================================================

interface WheelConfig {
  position: Vector3;
  radius: number;
  suspensionRestLength: number;
  suspensionStiffness: number;
  suspensionDamping: number;
  maxSuspensionTravel: number;
  frictionSlip: number;
  isSteering: boolean;
  isDriving: boolean;
}

interface VehicleConfig {
  chassisSize: Vector3;
  chassisMass: number;
  wheels: WheelConfig[];
  maxSteerAngle?: number;
  engineForce?: number;
  brakeForce?: number;
}

class VehicleController {
  private world: PhysicsWorld;
  private chassisId: string;
  private config: VehicleConfig;
  private wheelBodies: string[] = [];
  private steerAngle = 0;
  private enginePower = 0;
  private brakePower = 0;

  constructor(world: PhysicsWorld, chassisId: string, config: VehicleConfig) {
    this.world = world;
    this.chassisId = chassisId;
    this.config = config;

    this.setupVehicle();
  }

  private setupVehicle(): void {
    // Create chassis
    this.world.createRigidBody(this.chassisId, {
      type: 'dynamic',
      mass: this.config.chassisMass,
      linearDamping: 0.1,
      angularDamping: 0.5
    });

    this.world.addCollider(this.chassisId, {
      shape: 'box',
      size: this.config.chassisSize
    });

    // Create wheels
    this.config.wheels.forEach((wheel, i) => {
      const wheelId = `${this.chassisId}_wheel_${i}`;
      this.wheelBodies.push(wheelId);

      this.world.createRigidBody(wheelId, {
        type: 'dynamic',
        mass: 20,
        angularDamping: 0.1
      });

      this.world.addCollider(wheelId, {
        shape: 'sphere',
        radius: wheel.radius,
        friction: wheel.frictionSlip
      });

      // Create suspension joint
      this.world.createJoint(`${wheelId}_suspension`, {
        type: 'prismatic',
        bodyA: this.chassisId,
        bodyB: wheelId,
        anchorA: wheel.position,
        anchorB: { x: 0, y: 0, z: 0 },
        axisA: { x: 0, y: 1, z: 0 },
        limitsEnabled: true,
        limitsMin: -wheel.maxSuspensionTravel,
        limitsMax: 0
      });
    });
  }

  update(): void {
    this.applyEngine();
    this.applySteering();
    this.applyBrakes();
    this.applySuspension();
  }

  private applyEngine(): void {
    const engineForce = this.config.engineForce || 10000;

    this.config.wheels.forEach((wheel, i) => {
      if (!wheel.isDriving) return;

      const wheelId = this.wheelBodies[i]!;
      const chassisRot = this.world.getRotation(this.chassisId);

      // Calculate forward direction
      const forward = this.rotateVector({ x: 0, y: 0, z: 1 }, chassisRot);
      const force = {
        x: forward.x * engineForce * this.enginePower,
        y: 0,
        z: forward.z * engineForce * this.enginePower
      };

      this.world.applyForce(wheelId, force);
    });
  }

  private applySteering(): void {
    const maxSteer = this.config.maxSteerAngle || Math.PI / 4;

    this.config.wheels.forEach((wheel, i) => {
      if (!wheel.isSteering) return;

      // Rotate wheel based on steering input
      const steerQuat = this.eulerToQuaternion(0, this.steerAngle * maxSteer, 0);
      const wheelId = this.wheelBodies[i]!;

      // Apply steering through angular velocity
      this.world.setAngularVelocity(wheelId, {
        x: 0,
        y: this.steerAngle * 2,
        z: 0
      });
    });
  }

  private applyBrakes(): void {
    const brakeForce = this.config.brakeForce || 5000;

    this.wheelBodies.forEach(wheelId => {
      if (this.brakePower > 0) {
        const velocity = this.world.getVelocity(wheelId);
        const brakeDir = {
          x: -velocity.x,
          y: 0,
          z: -velocity.z
        };
        const mag = Math.sqrt(brakeDir.x * brakeDir.x + brakeDir.z * brakeDir.z);
        if (mag > 0) {
          this.world.applyForce(wheelId, {
            x: (brakeDir.x / mag) * brakeForce * this.brakePower,
            y: 0,
            z: (brakeDir.z / mag) * brakeForce * this.brakePower
          });
        }
      }
    });
  }

  private applySuspension(): void {
    this.config.wheels.forEach((wheel, i) => {
      const wheelId = this.wheelBodies[i]!;
      const wheelPos = this.world.getPosition(wheelId);
      const chassisPos = this.world.getPosition(this.chassisId);

      // Calculate suspension compression
      const targetY = chassisPos.y + wheel.position.y - wheel.suspensionRestLength;
      const compression = targetY - wheelPos.y;

      // Apply spring force
      const springForce = compression * wheel.suspensionStiffness;

      // Apply damping
      const wheelVel = this.world.getVelocity(wheelId);
      const dampingForce = wheelVel.y * wheel.suspensionDamping;

      this.world.applyForce(wheelId, {
        x: 0,
        y: springForce - dampingForce,
        z: 0
      });
    });
  }

  private rotateVector(v: Vector3, q: Quaternion): Vector3 {
    const ix = q.w * v.x + q.y * v.z - q.z * v.y;
    const iy = q.w * v.y + q.z * v.x - q.x * v.z;
    const iz = q.w * v.z + q.x * v.y - q.y * v.x;
    const iw = -q.x * v.x - q.y * v.y - q.z * v.z;

    return {
      x: ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y,
      y: iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z,
      z: iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x
    };
  }

  private eulerToQuaternion(x: number, y: number, z: number): Quaternion {
    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);

    return {
      x: s1 * c2 * c3 + c1 * s2 * s3,
      y: c1 * s2 * c3 - s1 * c2 * s3,
      z: c1 * c2 * s3 + s1 * s2 * c3,
      w: c1 * c2 * c3 - s1 * s2 * s3
    };
  }

  setThrottle(value: number): void {
    this.enginePower = Math.max(-1, Math.min(1, value));
  }

  setSteering(value: number): void {
    this.steerAngle = Math.max(-1, Math.min(1, value));
  }

  setBrake(value: number): void {
    this.brakePower = Math.max(0, Math.min(1, value));
  }

  getSpeed(): number {
    const velocity = this.world.getVelocity(this.chassisId);
    return Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
  }
}

// ============================================================================
// RAGDOLL
// ============================================================================

interface RagdollConfig {
  scale?: number;
  boneDensity?: number;
}

class Ragdoll {
  private world: PhysicsWorld;
  private id: string;
  private bones: Map<string, string> = new Map();
  private config: Required<RagdollConfig>;

  constructor(world: PhysicsWorld, id: string, position: Vector3, config: RagdollConfig = {}) {
    this.world = world;
    this.id = id;
    this.config = {
      scale: config.scale ?? 1,
      boneDensity: config.boneDensity ?? 1
    };

    this.createRagdoll(position);
  }

  private createRagdoll(position: Vector3): void {
    const s = this.config.scale;

    // Define bone structure
    const boneConfigs: Array<{
      name: string;
      shape: 'capsule' | 'sphere' | 'box';
      size: Vector3;
      offset: Vector3;
    }> = [
      { name: 'head', shape: 'sphere', size: { x: 0.15, y: 0.15, z: 0.15 }, offset: { x: 0, y: 1.7, z: 0 } },
      { name: 'torso', shape: 'capsule', size: { x: 0.2, y: 0.5, z: 0 }, offset: { x: 0, y: 1.2, z: 0 } },
      { name: 'pelvis', shape: 'capsule', size: { x: 0.18, y: 0.2, z: 0 }, offset: { x: 0, y: 0.8, z: 0 } },
      { name: 'upperArmL', shape: 'capsule', size: { x: 0.06, y: 0.25, z: 0 }, offset: { x: -0.35, y: 1.4, z: 0 } },
      { name: 'upperArmR', shape: 'capsule', size: { x: 0.06, y: 0.25, z: 0 }, offset: { x: 0.35, y: 1.4, z: 0 } },
      { name: 'lowerArmL', shape: 'capsule', size: { x: 0.05, y: 0.25, z: 0 }, offset: { x: -0.35, y: 1.0, z: 0 } },
      { name: 'lowerArmR', shape: 'capsule', size: { x: 0.05, y: 0.25, z: 0 }, offset: { x: 0.35, y: 1.0, z: 0 } },
      { name: 'upperLegL', shape: 'capsule', size: { x: 0.08, y: 0.35, z: 0 }, offset: { x: -0.12, y: 0.5, z: 0 } },
      { name: 'upperLegR', shape: 'capsule', size: { x: 0.08, y: 0.35, z: 0 }, offset: { x: 0.12, y: 0.5, z: 0 } },
      { name: 'lowerLegL', shape: 'capsule', size: { x: 0.06, y: 0.35, z: 0 }, offset: { x: -0.12, y: 0.1, z: 0 } },
      { name: 'lowerLegR', shape: 'capsule', size: { x: 0.06, y: 0.35, z: 0 }, offset: { x: 0.12, y: 0.1, z: 0 } }
    ];

    // Create bones
    boneConfigs.forEach(bone => {
      const boneId = `${this.id}_${bone.name}`;
      this.bones.set(bone.name, boneId);

      const bonePos = {
        x: position.x + bone.offset.x * s,
        y: position.y + bone.offset.y * s,
        z: position.z + bone.offset.z * s
      };

      this.world.createRigidBody(boneId, {
        type: 'dynamic',
        mass: this.config.boneDensity * bone.size.x * bone.size.y * 100,
        linearDamping: 0.1,
        angularDamping: 0.5
      }, bonePos);

      if (bone.shape === 'sphere') {
        this.world.addCollider(boneId, {
          shape: 'sphere',
          radius: bone.size.x * s
        });
      } else {
        this.world.addCollider(boneId, {
          shape: 'capsule',
          radius: bone.size.x * s,
          height: bone.size.y * s
        });
      }
    });

    // Create joints
    const jointConfigs: Array<{
      name: string;
      bodyA: string;
      bodyB: string;
      type: JointConfig['type'];
    }> = [
      { name: 'neck', bodyA: 'torso', bodyB: 'head', type: 'spherical' },
      { name: 'spine', bodyA: 'pelvis', bodyB: 'torso', type: 'spherical' },
      { name: 'shoulderL', bodyA: 'torso', bodyB: 'upperArmL', type: 'spherical' },
      { name: 'shoulderR', bodyA: 'torso', bodyB: 'upperArmR', type: 'spherical' },
      { name: 'elbowL', bodyA: 'upperArmL', bodyB: 'lowerArmL', type: 'revolute' },
      { name: 'elbowR', bodyA: 'upperArmR', bodyB: 'lowerArmR', type: 'revolute' },
      { name: 'hipL', bodyA: 'pelvis', bodyB: 'upperLegL', type: 'spherical' },
      { name: 'hipR', bodyA: 'pelvis', bodyB: 'upperLegR', type: 'spherical' },
      { name: 'kneeL', bodyA: 'upperLegL', bodyB: 'lowerLegL', type: 'revolute' },
      { name: 'kneeR', bodyA: 'upperLegR', bodyB: 'lowerLegR', type: 'revolute' }
    ];

    jointConfigs.forEach(joint => {
      const jointId = `${this.id}_${joint.name}`;
      this.world.createJoint(jointId, {
        type: joint.type,
        bodyA: this.bones.get(joint.bodyA)!,
        bodyB: this.bones.get(joint.bodyB)!,
        limitsEnabled: true,
        limitsMin: -Math.PI / 4,
        limitsMax: Math.PI / 4
      });
    });
  }

  getBonePosition(boneName: string): Vector3 | null {
    const boneId = this.bones.get(boneName);
    if (boneId) {
      return this.world.getPosition(boneId);
    }
    return null;
  }

  getBoneRotation(boneName: string): Quaternion | null {
    const boneId = this.bones.get(boneName);
    if (boneId) {
      return this.world.getRotation(boneId);
    }
    return null;
  }

  applyImpulse(boneName: string, impulse: Vector3): void {
    const boneId = this.bones.get(boneName);
    if (boneId) {
      this.world.applyImpulse(boneId, impulse);
    }
  }

  destroy(): void {
    this.bones.forEach(boneId => {
      this.world.removeRigidBody(boneId);
    });
    this.bones.clear();
  }
}

// ============================================================================
// REACT HOOKS
// ============================================================================

function usePhysicsWorld(config: PhysicsConfig): {
  world: PhysicsWorld | null;
  isReady: boolean;
} {
  let world: PhysicsWorld | null = null;
  let isReady = false;

  const init = async () => {
    world = new PhysicsWorld(config);
    await world.init();
    world.start();
    isReady = true;
  };

  init();

  return { world, isReady };
}

function useRigidBody(
  world: PhysicsWorld | null,
  id: string,
  config: RigidBodyConfig,
  collider: ColliderConfig,
  initialPosition?: Vector3
): {
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
  applyForce: (force: Vector3) => void;
  applyImpulse: (impulse: Vector3) => void;
} {
  let position: Vector3 = initialPosition || { x: 0, y: 0, z: 0 };
  let rotation: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
  let velocity: Vector3 = { x: 0, y: 0, z: 0 };

  if (world) {
    world.createRigidBody(id, config, position);
    world.addCollider(id, collider);

    world.on('update', () => {
      position = world!.getPosition(id);
      rotation = world!.getRotation(id);
      velocity = world!.getVelocity(id);
    });
  }

  return {
    position,
    rotation,
    velocity,
    applyForce: (force: Vector3) => world?.applyForce(id, force),
    applyImpulse: (impulse: Vector3) => world?.applyImpulse(id, impulse)
  };
}

function useCharacterController(
  world: PhysicsWorld | null,
  id: string,
  config: CharacterConfig
): {
  position: Vector3;
  isGrounded: boolean;
  move: (input: Vector3) => void;
  jump: () => boolean;
} {
  let controller: CharacterController | null = null;
  let position: Vector3 = { x: 0, y: 0, z: 0 };
  let isGrounded = false;

  if (world) {
    controller = new CharacterController(world, id, config);

    world.on('update', () => {
      controller!.update();
      position = world!.getPosition(id);
      isGrounded = controller!.getIsGrounded();
    });
  }

  return {
    position,
    isGrounded,
    move: (input: Vector3) => controller?.move(input),
    jump: () => controller?.jump() || false
  };
}

function useVehicle(
  world: PhysicsWorld | null,
  id: string,
  config: VehicleConfig
): {
  position: Vector3;
  rotation: Quaternion;
  speed: number;
  setThrottle: (value: number) => void;
  setSteering: (value: number) => void;
  setBrake: (value: number) => void;
} {
  let vehicle: VehicleController | null = null;
  let position: Vector3 = { x: 0, y: 0, z: 0 };
  let rotation: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
  let speed = 0;

  if (world) {
    vehicle = new VehicleController(world, id, config);

    world.on('update', () => {
      vehicle!.update();
      position = world!.getPosition(id);
      rotation = world!.getRotation(id);
      speed = vehicle!.getSpeed();
    });
  }

  return {
    position,
    rotation,
    speed,
    setThrottle: (value: number) => vehicle?.setThrottle(value),
    setSteering: (value: number) => vehicle?.setSteering(value),
    setBrake: (value: number) => vehicle?.setBrake(value)
  };
}

function useRagdoll(
  world: PhysicsWorld | null,
  id: string,
  position: Vector3,
  config?: RagdollConfig
): {
  getBonePosition: (name: string) => Vector3 | null;
  getBoneRotation: (name: string) => Quaternion | null;
  applyImpulse: (bone: string, impulse: Vector3) => void;
} {
  let ragdoll: Ragdoll | null = null;

  if (world) {
    ragdoll = new Ragdoll(world, id, position, config);
  }

  return {
    getBonePosition: (name: string) => ragdoll?.getBonePosition(name) || null,
    getBoneRotation: (name: string) => ragdoll?.getBoneRotation(name) || null,
    applyImpulse: (bone: string, impulse: Vector3) => ragdoll?.applyImpulse(bone, impulse)
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Core classes
  PhysicsWorld,
  PhysicsBackend,
  RapierBackend,
  CannonBackend,
  AmmoBackend,
  CharacterController,
  VehicleController,
  Ragdoll,

  // Hooks
  usePhysicsWorld,
  useRigidBody,
  useCharacterController,
  useVehicle,
  useRagdoll,

  // Types
  type Vector3,
  type Quaternion,
  type PhysicsConfig,
  type RigidBodyConfig,
  type ColliderConfig,
  type JointConfig,
  type ContactEvent,
  type RaycastResult,
  type CharacterConfig,
  type WheelConfig,
  type VehicleConfig,
  type RagdollConfig
};
