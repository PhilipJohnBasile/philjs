/**
 * Motion control and path planning for robotics
 */
import type { Pose, Twist, Quaternion } from './sensors.js';
export interface Waypoint {
    pose: Pose;
    velocity?: number;
    tolerance?: {
        position: number;
        orientation: number;
    };
}
export interface Path {
    waypoints: Waypoint[];
    frameId: string;
}
export interface TrajectoryPoint {
    positions: number[];
    velocities?: number[];
    accelerations?: number[];
    effort?: number[];
    timeFromStart: number;
}
export interface JointTrajectory {
    jointNames: string[];
    points: TrajectoryPoint[];
}
export interface MotionConstraints {
    maxLinearVelocity: number;
    maxAngularVelocity: number;
    maxLinearAcceleration: number;
    maxAngularAcceleration: number;
}
export declare const DEFAULT_CONSTRAINTS: MotionConstraints;
/**
 * PID Controller for motion control
 */
export declare class PIDController {
    private kp;
    private ki;
    private kd;
    private integral;
    private lastError;
    private lastTime;
    private outputMin;
    private outputMax;
    constructor(kp: number, ki: number, kd: number, outputMin?: number, outputMax?: number);
    compute(setpoint: number, measurement: number): number;
    reset(): void;
    setGains(kp: number, ki: number, kd: number): void;
}
/**
 * Differential drive controller
 */
export declare class DifferentialDriveController {
    private wheelBase;
    private wheelRadius;
    private linearPID;
    private angularPID;
    constructor(wheelBase: number, wheelRadius: number);
    /**
     * Convert unicycle model (v, omega) to wheel velocities
     */
    toWheelVelocities(linear: number, angular: number): {
        left: number;
        right: number;
    };
    /**
     * Convert wheel velocities to unicycle model
     */
    fromWheelVelocities(leftVel: number, rightVel: number): Twist;
    /**
     * Compute command to reach target pose
     */
    computeCommand(currentPose: Pose, targetPose: Pose, constraints?: MotionConstraints): Twist;
    /**
     * Check if robot has reached target
     */
    hasReached(currentPose: Pose, targetPose: Pose, positionTolerance?: number, orientationTolerance?: number): boolean;
    reset(): void;
}
/**
 * Path follower using pure pursuit algorithm
 */
export declare class PurePursuitController {
    private lookaheadDistance;
    private currentWaypointIndex;
    constructor(lookaheadDistance?: number);
    /**
     * Find the lookahead point on the path
     */
    private findLookaheadPoint;
    /**
     * Find intersection of circle and line segment
     */
    private circleLineIntersection;
    /**
     * Compute steering command
     */
    computeCommand(currentPose: Pose, path: Path, linearVelocity: number): Twist;
    reset(): void;
    setLookaheadDistance(distance: number): void;
}
/**
 * Arm motion planner using trapezoidal velocity profile
 */
export declare class ArmMotionPlanner {
    private maxVelocity;
    private maxAcceleration;
    constructor(jointCount: number, maxVelocity?: number, maxAcceleration?: number);
    /**
     * Plan trajectory from current to target joint positions
     */
    planTrajectory(jointNames: string[], currentPositions: number[], targetPositions: number[], duration?: number): JointTrajectory;
    private interpolate;
}
export declare function yawToQuaternion(yaw: number): Quaternion;
export declare function createPose(x: number, y: number, yaw: number): Pose;
