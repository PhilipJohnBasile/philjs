/**
 * PhilJS reactive integration for robotics
 *
 * Provides signals and reactive primitives for robot state management
 */
import type { Pose, Twist, LaserScan, IMUData, JointState, Odometry, BatteryState, NavSatFix } from './sensors.js';
import type { Robot } from './ros-bridge.js';
/**
 * Signal-like interface for robot state
 * Compatible with @philjs/core signals
 */
export interface RobotSignal<T> {
    (): T;
    get(): T;
    subscribe(callback: (value: T) => void): () => void;
}
/**
 * Create a robot state signal from ROS topic
 */
export declare function createRobotSignal<T>(robot: Robot, topic: string, messageType: string, initialValue: T): RobotSignal<T>;
/**
 * Robot state manager with reactive signals
 */
export declare class ReactiveRobot {
    private robot;
    readonly pose: RobotSignal<Pose | null>;
    readonly velocity: RobotSignal<Twist | null>;
    readonly odometry: RobotSignal<Odometry | null>;
    readonly scan: RobotSignal<LaserScan | null>;
    readonly imu: RobotSignal<IMUData | null>;
    readonly joints: RobotSignal<JointState | null>;
    readonly battery: RobotSignal<BatteryState | null>;
    readonly gps: RobotSignal<NavSatFix | null>;
    constructor(robot: Robot);
    /**
     * Send velocity command
     */
    setVelocity(linear: number, angular: number): void;
    /**
     * Stop the robot
     */
    stop(): void;
    /**
     * Emergency stop
     */
    emergencyStop(): void;
    /**
     * Get the underlying robot connection
     */
    getRobot(): Robot;
}
/**
 * Create a reactive robot from a ROS bridge connection
 */
export declare function createReactiveRobot(url: string): Promise<ReactiveRobot>;
/**
 * Computed signal for derived robot state
 */
export declare function computed<T>(signals: RobotSignal<unknown>[], compute: () => T): RobotSignal<T>;
/**
 * Effect that runs when robot state changes
 */
export declare function robotEffect(signals: RobotSignal<unknown>[], effect: () => void | (() => void)): () => void;
/**
 * Debounce robot state updates
 */
export declare function debounced<T>(signal: RobotSignal<T>, delay: number): RobotSignal<T>;
/**
 * Throttle robot state updates
 */
export declare function throttled<T>(signal: RobotSignal<T>, interval: number): RobotSignal<T>;
