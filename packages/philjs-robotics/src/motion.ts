/**
 * Motion control and path planning for robotics
 */

import type { Point3D, Pose, Twist, Quaternion } from './sensors.js';

export interface Waypoint {
  pose: Pose;
  velocity?: number;
  tolerance?: { position: number; orientation: number };
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

export const DEFAULT_CONSTRAINTS: MotionConstraints = {
  maxLinearVelocity: 1.0,
  maxAngularVelocity: 1.0,
  maxLinearAcceleration: 0.5,
  maxAngularAcceleration: 0.5,
};

/**
 * PID Controller for motion control
 */
export class PIDController {
  private kp: number;
  private ki: number;
  private kd: number;
  private integral = 0;
  private lastError = 0;
  private lastTime: number | null = null;
  private outputMin: number;
  private outputMax: number;

  constructor(
    kp: number,
    ki: number,
    kd: number,
    outputMin = -Infinity,
    outputMax = Infinity
  ) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.outputMin = outputMin;
    this.outputMax = outputMax;
  }

  compute(setpoint: number, measurement: number): number {
    const now = Date.now();
    const error = setpoint - measurement;

    let dt = 0.01; // Default to 10ms if no previous time
    if (this.lastTime !== null) {
      dt = (now - this.lastTime) / 1000;
    }
    this.lastTime = now;

    // Proportional term
    const p = this.kp * error;

    // Integral term with anti-windup
    this.integral += error * dt;
    const i = this.ki * this.integral;

    // Derivative term
    const d = this.kd * ((error - this.lastError) / dt);
    this.lastError = error;

    // Calculate output and clamp
    const output = p + i + d;
    return Math.max(this.outputMin, Math.min(this.outputMax, output));
  }

  reset(): void {
    this.integral = 0;
    this.lastError = 0;
    this.lastTime = null;
  }

  setGains(kp: number, ki: number, kd: number): void {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
  }
}

/**
 * Differential drive controller
 */
export class DifferentialDriveController {
  private wheelBase: number;
  private wheelRadius: number;
  private linearPID: PIDController;
  private angularPID: PIDController;

  constructor(wheelBase: number, wheelRadius: number) {
    this.wheelBase = wheelBase;
    this.wheelRadius = wheelRadius;
    this.linearPID = new PIDController(1.0, 0.1, 0.05, -1, 1);
    this.angularPID = new PIDController(2.0, 0.1, 0.1, -1, 1);
  }

  /**
   * Convert unicycle model (v, omega) to wheel velocities
   */
  toWheelVelocities(linear: number, angular: number): { left: number; right: number } {
    const left = (linear - (angular * this.wheelBase) / 2) / this.wheelRadius;
    const right = (linear + (angular * this.wheelBase) / 2) / this.wheelRadius;
    return { left, right };
  }

  /**
   * Convert wheel velocities to unicycle model
   */
  fromWheelVelocities(leftVel: number, rightVel: number): Twist {
    const linear = ((leftVel + rightVel) / 2) * this.wheelRadius;
    const angular = ((rightVel - leftVel) * this.wheelRadius) / this.wheelBase;

    return {
      linear: { x: linear, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angular },
    };
  }

  /**
   * Compute command to reach target pose
   */
  computeCommand(
    currentPose: Pose,
    targetPose: Pose,
    constraints: MotionConstraints = DEFAULT_CONSTRAINTS
  ): Twist {
    // Calculate distance and angle to target
    const dx = targetPose.position.x - currentPose.position.x;
    const dy = targetPose.position.y - currentPose.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToTarget = Math.atan2(dy, dx);

    // Get current yaw from quaternion
    const currentYaw = quaternionToYaw(currentPose.orientation);
    const angleError = normalizeAngle(angleToTarget - currentYaw);

    // Compute control signals
    let linearVel = this.linearPID.compute(0, -distance);
    let angularVel = this.angularPID.compute(0, -angleError);

    // Apply constraints
    linearVel = Math.max(
      -constraints.maxLinearVelocity,
      Math.min(constraints.maxLinearVelocity, linearVel)
    );
    angularVel = Math.max(
      -constraints.maxAngularVelocity,
      Math.min(constraints.maxAngularVelocity, angularVel)
    );

    // Reduce linear velocity when angle error is large
    if (Math.abs(angleError) > Math.PI / 4) {
      linearVel *= 0.5;
    }

    return {
      linear: { x: linearVel, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angularVel },
    };
  }

  /**
   * Check if robot has reached target
   */
  hasReached(
    currentPose: Pose,
    targetPose: Pose,
    positionTolerance = 0.1,
    orientationTolerance = 0.1
  ): boolean {
    const dx = targetPose.position.x - currentPose.position.x;
    const dy = targetPose.position.y - currentPose.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const currentYaw = quaternionToYaw(currentPose.orientation);
    const targetYaw = quaternionToYaw(targetPose.orientation);
    const angleError = Math.abs(normalizeAngle(targetYaw - currentYaw));

    return distance < positionTolerance && angleError < orientationTolerance;
  }

  reset(): void {
    this.linearPID.reset();
    this.angularPID.reset();
  }
}

/**
 * Path follower using pure pursuit algorithm
 */
export class PurePursuitController {
  private lookaheadDistance: number;
  private currentWaypointIndex = 0;

  constructor(lookaheadDistance = 0.5) {
    this.lookaheadDistance = lookaheadDistance;
  }

  /**
   * Find the lookahead point on the path
   */
  private findLookaheadPoint(currentPosition: Point3D, path: Path): Point3D | null {
    const waypoints = path.waypoints;
    if (waypoints.length === 0) return null;

    // Start searching from current waypoint
    for (let i = this.currentWaypointIndex; i < waypoints.length - 1; i++) {
      const start = waypoints[i]?.pose.position;
      const end = waypoints[i + 1]?.pose.position;
      if (!start || !end) continue;

      const intersection = this.circleLineIntersection(
        currentPosition,
        this.lookaheadDistance,
        start,
        end
      );

      if (intersection) {
        this.currentWaypointIndex = i;
        return intersection;
      }
    }

    // Return last waypoint if no intersection found
    const lastWaypoint = waypoints[waypoints.length - 1];
    return lastWaypoint?.pose.position ?? null;
  }

  /**
   * Find intersection of circle and line segment
   */
  private circleLineIntersection(
    center: Point3D,
    radius: number,
    lineStart: Point3D,
    lineEnd: Point3D
  ): Point3D | null {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const fx = lineStart.x - center.x;
    const fy = lineStart.y - center.y;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return null;

    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDiscriminant) / (2 * a);
    const t2 = (-b + sqrtDiscriminant) / (2 * a);

    // Choose the point that is ahead on the path
    const t = t2 >= 0 && t2 <= 1 ? t2 : t1 >= 0 && t1 <= 1 ? t1 : null;
    if (t === null) return null;

    return {
      x: lineStart.x + t * dx,
      y: lineStart.y + t * dy,
      z: 0,
    };
  }

  /**
   * Compute steering command
   */
  computeCommand(
    currentPose: Pose,
    path: Path,
    linearVelocity: number
  ): Twist {
    const lookahead = this.findLookaheadPoint(currentPose.position, path);
    if (!lookahead) {
      return { linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } };
    }

    // Transform lookahead point to robot frame
    const currentYaw = quaternionToYaw(currentPose.orientation);
    const dx = lookahead.x - currentPose.position.x;
    const dy = lookahead.y - currentPose.position.y;

    const localX = dx * Math.cos(-currentYaw) - dy * Math.sin(-currentYaw);
    const localY = dx * Math.sin(-currentYaw) + dy * Math.cos(-currentYaw);

    // Calculate curvature
    const curvature = (2 * localY) / (this.lookaheadDistance * this.lookaheadDistance);
    const angularVelocity = linearVelocity * curvature;

    return {
      linear: { x: linearVelocity, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angularVelocity },
    };
  }

  reset(): void {
    this.currentWaypointIndex = 0;
  }

  setLookaheadDistance(distance: number): void {
    this.lookaheadDistance = distance;
  }
}

/**
 * Arm motion planner using trapezoidal velocity profile
 */
export class ArmMotionPlanner {
  private maxVelocity: number[];
  private maxAcceleration: number[];

  constructor(jointCount: number, maxVelocity = 1.0, maxAcceleration = 0.5) {
    this.maxVelocity = new Array(jointCount).fill(maxVelocity);
    this.maxAcceleration = new Array(jointCount).fill(maxAcceleration);
  }

  /**
   * Plan trajectory from current to target joint positions
   */
  planTrajectory(
    jointNames: string[],
    currentPositions: number[],
    targetPositions: number[],
    duration?: number
  ): JointTrajectory {
    const n = currentPositions.length;
    const points: TrajectoryPoint[] = [];

    // Calculate minimum duration for each joint
    const minDurations = currentPositions.map((start, i) => {
      const distance = Math.abs((targetPositions[i] ?? 0) - start);
      const vMax = this.maxVelocity[i] ?? 1;
      const aMax = this.maxAcceleration[i] ?? 0.5;

      // Time to accelerate/decelerate
      const tAccel = vMax / aMax;
      const dAccel = 0.5 * aMax * tAccel * tAccel;

      if (distance < 2 * dAccel) {
        // Triangular profile
        return 2 * Math.sqrt(distance / aMax);
      } else {
        // Trapezoidal profile
        const tCruise = (distance - 2 * dAccel) / vMax;
        return 2 * tAccel + tCruise;
      }
    });

    // Use provided duration or maximum of minimum durations
    const totalDuration = duration ?? Math.max(...minDurations);

    // Generate points at regular intervals
    const dt = 0.05; // 50ms intervals
    for (let t = 0; t <= totalDuration; t += dt) {
      const positions: number[] = [];
      const velocities: number[] = [];

      for (let i = 0; i < n; i++) {
        const start = currentPositions[i] ?? 0;
        const end = targetPositions[i] ?? 0;
        const { position, velocity } = this.interpolate(start, end, t, totalDuration, i);
        positions.push(position);
        velocities.push(velocity);
      }

      points.push({
        positions,
        velocities,
        timeFromStart: t,
      });
    }

    // Ensure we end exactly at target
    points.push({
      positions: [...targetPositions],
      velocities: new Array(n).fill(0),
      timeFromStart: totalDuration,
    });

    return { jointNames, points };
  }

  private interpolate(
    start: number,
    end: number,
    t: number,
    duration: number,
    jointIndex: number
  ): { position: number; velocity: number } {
    const distance = end - start;
    const sign = Math.sign(distance);
    const absDistance = Math.abs(distance);

    const aMax = this.maxAcceleration[jointIndex] ?? 0.5;
    const vMax = Math.min(
      this.maxVelocity[jointIndex] ?? 1,
      Math.sqrt(absDistance * aMax)
    );

    const tAccel = vMax / aMax;
    const tDecel = duration - tAccel;

    let position: number;
    let velocity: number;

    if (t <= tAccel) {
      // Acceleration phase
      velocity = aMax * t;
      position = start + sign * 0.5 * aMax * t * t;
    } else if (t <= tDecel) {
      // Cruise phase
      velocity = vMax;
      const dAccel = 0.5 * aMax * tAccel * tAccel;
      position = start + sign * (dAccel + vMax * (t - tAccel));
    } else {
      // Deceleration phase
      const tRemaining = duration - t;
      velocity = aMax * tRemaining;
      const dDecel = 0.5 * aMax * tRemaining * tRemaining;
      position = end - sign * dDecel;
    }

    return { position, velocity: sign * velocity };
  }
}

// Utility functions
function quaternionToYaw(q: Quaternion): number {
  const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
  const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
  return Math.atan2(siny_cosp, cosy_cosp);
}

function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

export function yawToQuaternion(yaw: number): Quaternion {
  return {
    x: 0,
    y: 0,
    z: Math.sin(yaw / 2),
    w: Math.cos(yaw / 2),
  };
}

export function createPose(x: number, y: number, yaw: number): Pose {
  return {
    position: { x, y, z: 0 },
    orientation: yawToQuaternion(yaw),
  };
}
