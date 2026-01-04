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
type Vector3 = {
    x: number;
    y: number;
    z: number;
};
type Quaternion = {
    x: number;
    y: number;
    z: number;
    w: number;
};
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
declare abstract class PhysicsBackend {
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
declare class RapierBackend extends PhysicsBackend {
    private world;
    private bodies;
    private colliders;
    private joints;
    private RAPIER;
    private eventQueue;
    init(config: PhysicsConfig): Promise<void>;
    step(dt: number): void;
    createRigidBody(id: string, config: RigidBodyConfig, position: Vector3, rotation: Quaternion): void;
    removeRigidBody(id: string): void;
    addCollider(bodyId: string, config: ColliderConfig): void;
    createJoint(id: string, config: JointConfig): void;
    removeJoint(id: string): void;
    setPosition(bodyId: string, position: Vector3): void;
    setRotation(bodyId: string, rotation: Quaternion): void;
    setVelocity(bodyId: string, velocity: Vector3): void;
    setAngularVelocity(bodyId: string, velocity: Vector3): void;
    applyForce(bodyId: string, force: Vector3, point?: Vector3): void;
    applyImpulse(bodyId: string, impulse: Vector3, point?: Vector3): void;
    applyTorque(bodyId: string, torque: Vector3): void;
    getPosition(bodyId: string): Vector3;
    getRotation(bodyId: string): Quaternion;
    getVelocity(bodyId: string): Vector3;
    getAngularVelocity(bodyId: string): Vector3;
    raycast(origin: Vector3, direction: Vector3, maxDistance: number, groups?: number): RaycastResult;
    shapeCast(shape: ColliderConfig, origin: Vector3, direction: Vector3, maxDistance: number): RaycastResult;
    private getBodyIdFromCollider;
    getContacts(): ContactEvent[];
    destroy(): void;
}
declare class CannonBackend extends PhysicsBackend {
    private world;
    private bodies;
    private constraints;
    private springs;
    private CANNON;
    private contactEvents;
    private defaultMaterial;
    init(config: PhysicsConfig): Promise<void>;
    step(dt: number): void;
    createRigidBody(id: string, config: RigidBodyConfig, position: Vector3, rotation: Quaternion): void;
    removeRigidBody(id: string): void;
    addCollider(bodyId: string, config: ColliderConfig): void;
    createJoint(id: string, config: JointConfig): void;
    removeJoint(id: string): void;
    setPosition(bodyId: string, position: Vector3): void;
    setRotation(bodyId: string, rotation: Quaternion): void;
    setVelocity(bodyId: string, velocity: Vector3): void;
    setAngularVelocity(bodyId: string, velocity: Vector3): void;
    applyForce(bodyId: string, force: Vector3, point?: Vector3): void;
    applyImpulse(bodyId: string, impulse: Vector3, point?: Vector3): void;
    applyTorque(bodyId: string, torque: Vector3): void;
    getPosition(bodyId: string): Vector3;
    getRotation(bodyId: string): Quaternion;
    getVelocity(bodyId: string): Vector3;
    getAngularVelocity(bodyId: string): Vector3;
    raycast(origin: Vector3, direction: Vector3, maxDistance: number, _groups?: number): RaycastResult;
    shapeCast(shape: ColliderConfig, origin: Vector3, direction: Vector3, maxDistance: number): RaycastResult;
    private getBodyIdFromBody;
    getContacts(): ContactEvent[];
    destroy(): void;
}
declare class AmmoBackend extends PhysicsBackend {
    private world;
    private bodies;
    private shapes;
    private constraints;
    private Ammo;
    private bodyIdCounter;
    private bodyIndexToId;
    private tempTransform;
    private tempVector;
    private tempQuaternion;
    init(config: PhysicsConfig): Promise<void>;
    step(dt: number): void;
    createRigidBody(id: string, config: RigidBodyConfig, position: Vector3, rotation: Quaternion): void;
    removeRigidBody(id: string): void;
    addCollider(bodyId: string, config: ColliderConfig): void;
    createJoint(id: string, config: JointConfig): void;
    removeJoint(id: string): void;
    setPosition(bodyId: string, position: Vector3): void;
    setRotation(bodyId: string, rotation: Quaternion): void;
    setVelocity(bodyId: string, velocity: Vector3): void;
    setAngularVelocity(bodyId: string, velocity: Vector3): void;
    applyForce(bodyId: string, force: Vector3, point?: Vector3): void;
    applyImpulse(bodyId: string, impulse: Vector3, point?: Vector3): void;
    applyTorque(bodyId: string, torque: Vector3): void;
    getPosition(bodyId: string): Vector3;
    getRotation(bodyId: string): Quaternion;
    getVelocity(bodyId: string): Vector3;
    getAngularVelocity(bodyId: string): Vector3;
    raycast(origin: Vector3, direction: Vector3, maxDistance: number, _groups?: number): RaycastResult;
    shapeCast(_shape: ColliderConfig, origin: Vector3, direction: Vector3, maxDistance: number): RaycastResult;
    getContacts(): ContactEvent[];
    destroy(): void;
}
declare class PhysicsWorld {
    private backend;
    private config;
    private isRunning;
    private lastTime;
    private accumulator;
    private fixedTimestep;
    private listeners;
    constructor(config: PhysicsConfig);
    init(): Promise<void>;
    start(): void;
    stop(): void;
    private tick;
    createRigidBody(id: string, config: RigidBodyConfig, position?: Vector3, rotation?: Quaternion): void;
    removeRigidBody(id: string): void;
    addCollider(bodyId: string, config: ColliderConfig): void;
    createJoint(id: string, config: JointConfig): void;
    removeJoint(id: string): void;
    setPosition(bodyId: string, position: Vector3): void;
    setRotation(bodyId: string, rotation: Quaternion): void;
    getPosition(bodyId: string): Vector3;
    getRotation(bodyId: string): Quaternion;
    setVelocity(bodyId: string, velocity: Vector3): void;
    setAngularVelocity(bodyId: string, velocity: Vector3): void;
    getVelocity(bodyId: string): Vector3;
    getAngularVelocity(bodyId: string): Vector3;
    applyForce(bodyId: string, force: Vector3, point?: Vector3): void;
    applyImpulse(bodyId: string, impulse: Vector3, point?: Vector3): void;
    applyTorque(bodyId: string, torque: Vector3): void;
    raycast(origin: Vector3, direction: Vector3, maxDistance?: number): RaycastResult;
    shapeCast(shape: ColliderConfig, origin: Vector3, direction: Vector3, maxDistance?: number): RaycastResult;
    on(event: string, callback: Function): () => void;
    private emit;
    destroy(): void;
}
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
declare class CharacterController {
    private world;
    private bodyId;
    private config;
    private isGrounded;
    private groundNormal;
    private moveInput;
    private listeners;
    constructor(world: PhysicsWorld, bodyId: string, config: CharacterConfig);
    private setupBody;
    update(): void;
    private checkGround;
    private applyMovement;
    move(input: Vector3): void;
    jump(): boolean;
    getIsGrounded(): boolean;
    getGroundNormal(): Vector3;
    on(event: string, callback: Function): () => void;
    private emit;
}
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
declare class VehicleController {
    private world;
    private chassisId;
    private config;
    private wheelBodies;
    private steerAngle;
    private enginePower;
    private brakePower;
    constructor(world: PhysicsWorld, chassisId: string, config: VehicleConfig);
    private setupVehicle;
    update(): void;
    private applyEngine;
    private applySteering;
    private applyBrakes;
    private applySuspension;
    private rotateVector;
    private eulerToQuaternion;
    setThrottle(value: number): void;
    setSteering(value: number): void;
    setBrake(value: number): void;
    getSpeed(): number;
}
interface RagdollConfig {
    scale?: number;
    boneDensity?: number;
}
declare class Ragdoll {
    private world;
    private id;
    private bones;
    private config;
    constructor(world: PhysicsWorld, id: string, position: Vector3, config?: RagdollConfig);
    private createRagdoll;
    getBonePosition(boneName: string): Vector3 | null;
    getBoneRotation(boneName: string): Quaternion | null;
    applyImpulse(boneName: string, impulse: Vector3): void;
    destroy(): void;
}
declare function usePhysicsWorld(config: PhysicsConfig): {
    world: PhysicsWorld | null;
    isReady: boolean;
};
declare function useRigidBody(world: PhysicsWorld | null, id: string, config: RigidBodyConfig, collider: ColliderConfig, initialPosition?: Vector3): {
    position: Vector3;
    rotation: Quaternion;
    velocity: Vector3;
    applyForce: (force: Vector3) => void;
    applyImpulse: (impulse: Vector3) => void;
};
declare function useCharacterController(world: PhysicsWorld | null, id: string, config: CharacterConfig): {
    position: Vector3;
    isGrounded: boolean;
    move: (input: Vector3) => void;
    jump: () => boolean;
};
declare function useVehicle(world: PhysicsWorld | null, id: string, config: VehicleConfig): {
    position: Vector3;
    rotation: Quaternion;
    speed: number;
    setThrottle: (value: number) => void;
    setSteering: (value: number) => void;
    setBrake: (value: number) => void;
};
declare function useRagdoll(world: PhysicsWorld | null, id: string, position: Vector3, config?: RagdollConfig): {
    getBonePosition: (name: string) => Vector3 | null;
    getBoneRotation: (name: string) => Quaternion | null;
    applyImpulse: (bone: string, impulse: Vector3) => void;
};
export { PhysicsWorld, PhysicsBackend, RapierBackend, CannonBackend, AmmoBackend, CharacterController, VehicleController, Ragdoll, usePhysicsWorld, useRigidBody, useCharacterController, useVehicle, useRagdoll, type Vector3, type Quaternion, type PhysicsConfig, type RigidBodyConfig, type ColliderConfig, type JointConfig, type ContactEvent, type RaycastResult, type CharacterConfig, type WheelConfig, type VehicleConfig, type RagdollConfig };
//# sourceMappingURL=index.d.ts.map