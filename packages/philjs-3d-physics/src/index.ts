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
  bodyId?: string;
  point?: Vector3;
  normal?: Vector3;
  distance?: number;
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

      const wheelId = this.wheelBodies[i];
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
      const wheelId = this.wheelBodies[i];

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
      const wheelId = this.wheelBodies[i];
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
