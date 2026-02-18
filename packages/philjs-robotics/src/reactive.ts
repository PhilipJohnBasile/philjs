/**
 * PhilJS reactive integration for robotics
 *
 * Provides signals and reactive primitives for robot state management
 */

import type {
  Pose,
  Twist,
  LaserScan,
  IMUData,
  JointState,
  Odometry,
  BatteryState,
  NavSatFix,
} from './sensors.js';
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
export function createRobotSignal<T>(
  robot: Robot,
  topic: string,
  messageType: string,
  initialValue: T
): RobotSignal<T> {
  let value = initialValue;
  const listeners = new Set<(value: T) => void>();

  robot.subscribe(topic, messageType, (msg: T) => {
    value = msg;
    listeners.forEach((cb) => cb(value));
  });

  const signal = () => value;
  signal.get = () => value;
  signal.subscribe = (callback: (value: T) => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };

  return signal;
}

/**
 * Robot state manager with reactive signals
 */
export class ReactiveRobot {
  private robot: Robot;

  // Core state signals
  readonly pose: RobotSignal<Pose | null>;
  readonly velocity: RobotSignal<Twist | null>;
  readonly odometry: RobotSignal<Odometry | null>;
  readonly scan: RobotSignal<LaserScan | null>;
  readonly imu: RobotSignal<IMUData | null>;
  readonly joints: RobotSignal<JointState | null>;
  readonly battery: RobotSignal<BatteryState | null>;
  readonly gps: RobotSignal<NavSatFix | null>;

  constructor(robot: Robot) {
    this.robot = robot;

    // Initialize with null values
    const nullPose: Pose | null = null;
    const nullTwist: Twist | null = null;
    const nullOdom: Odometry | null = null;
    const nullScan: LaserScan | null = null;
    const nullImu: IMUData | null = null;
    const nullJoints: JointState | null = null;
    const nullBattery: BatteryState | null = null;
    const nullGps: NavSatFix | null = null;

    this.pose = createRobotSignal(robot, '/pose', 'geometry_msgs/PoseStamped', nullPose);
    this.velocity = createRobotSignal(robot, '/cmd_vel', 'geometry_msgs/Twist', nullTwist);
    this.odometry = createRobotSignal(robot, '/odom', 'nav_msgs/Odometry', nullOdom);
    this.scan = createRobotSignal(robot, '/scan', 'sensor_msgs/LaserScan', nullScan);
    this.imu = createRobotSignal(robot, '/imu', 'sensor_msgs/Imu', nullImu);
    this.joints = createRobotSignal(robot, '/joint_states', 'sensor_msgs/JointState', nullJoints);
    this.battery = createRobotSignal(robot, '/battery', 'sensor_msgs/BatteryState', nullBattery);
    this.gps = createRobotSignal(robot, '/gps/fix', 'sensor_msgs/NavSatFix', nullGps);
  }

  /**
   * Send velocity command
   */
  setVelocity(linear: number, angular: number): void {
    this.robot.move(linear, angular);
  }

  /**
   * Stop the robot
   */
  stop(): void {
    this.robot.move(0, 0);
  }

  /**
   * Emergency stop
   */
  emergencyStop(): void {
    this.stop();
    // Could also disable motors, set brakes, etc.
  }

  /**
   * Get the underlying robot connection
   */
  getRobot(): Robot {
    return this.robot;
  }
}

/**
 * Create a reactive robot from a ROS bridge connection
 */
export async function createReactiveRobot(url: string): Promise<ReactiveRobot> {
  const { Robot } = await import('./ros-bridge.js');
  const robot = await Robot.connect(url);
  return new ReactiveRobot(robot);
}

/**
 * Computed signal for derived robot state
 */
export function computed<T>(
  signals: RobotSignal<unknown>[],
  compute: () => T
): RobotSignal<T> {
  let value = compute();
  const listeners = new Set<(value: T) => void>();

  // Subscribe to all input signals
  signals.forEach((signal) => {
    signal.subscribe(() => {
      value = compute();
      listeners.forEach((cb) => cb(value));
    });
  });

  const result = () => value;
  result.get = () => value;
  result.subscribe = (callback: (value: T) => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };

  return result;
}

/**
 * Effect that runs when robot state changes
 */
export function robotEffect(
  signals: RobotSignal<unknown>[],
  effect: () => void | (() => void)
): () => void {
  let cleanup: void | (() => void);
  const unsubscribes: (() => void)[] = [];

  const run = () => {
    if (typeof cleanup === 'function') cleanup();
    cleanup = effect();
  };

  signals.forEach((signal) => {
    unsubscribes.push(signal.subscribe(run));
  });

  // Run initially
  run();

  return () => {
    unsubscribes.forEach((unsub) => unsub());
    if (typeof cleanup === 'function') cleanup();
  };
}

/**
 * Debounce robot state updates
 */
export function debounced<T>(
  signal: RobotSignal<T>,
  delay: number
): RobotSignal<T> {
  let value = signal.get();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<(value: T) => void>();

  signal.subscribe((newValue) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      value = newValue;
      listeners.forEach((cb) => cb(value));
    }, delay);
  });

  const result = () => value;
  result.get = () => value;
  result.subscribe = (callback: (value: T) => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };

  return result;
}

/**
 * Throttle robot state updates
 */
export function throttled<T>(
  signal: RobotSignal<T>,
  interval: number
): RobotSignal<T> {
  let value = signal.get();
  let lastUpdate = 0;
  const listeners = new Set<(value: T) => void>();

  signal.subscribe((newValue) => {
    const now = Date.now();
    if (now - lastUpdate >= interval) {
      lastUpdate = now;
      value = newValue;
      listeners.forEach((cb) => cb(value));
    }
  });

  const result = () => value;
  result.get = () => value;
  result.subscribe = (callback: (value: T) => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };

  return result;
}
