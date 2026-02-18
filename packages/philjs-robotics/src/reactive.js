/**
 * PhilJS reactive integration for robotics
 *
 * Provides signals and reactive primitives for robot state management
 */
/**
 * Create a robot state signal from ROS topic
 */
export function createRobotSignal(robot, topic, messageType, initialValue) {
    let value = initialValue;
    const listeners = new Set();
    robot.subscribe(topic, messageType, (msg) => {
        value = msg;
        listeners.forEach((cb) => cb(value));
    });
    const signal = () => value;
    signal.get = () => value;
    signal.subscribe = (callback) => {
        listeners.add(callback);
        return () => listeners.delete(callback);
    };
    return signal;
}
/**
 * Robot state manager with reactive signals
 */
export class ReactiveRobot {
    robot;
    // Core state signals
    pose;
    velocity;
    odometry;
    scan;
    imu;
    joints;
    battery;
    gps;
    constructor(robot) {
        this.robot = robot;
        // Initialize with null values
        const nullPose = null;
        const nullTwist = null;
        const nullOdom = null;
        const nullScan = null;
        const nullImu = null;
        const nullJoints = null;
        const nullBattery = null;
        const nullGps = null;
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
    setVelocity(linear, angular) {
        this.robot.move(linear, angular);
    }
    /**
     * Stop the robot
     */
    stop() {
        this.robot.move(0, 0);
    }
    /**
     * Emergency stop
     */
    emergencyStop() {
        this.stop();
        // Could also disable motors, set brakes, etc.
    }
    /**
     * Get the underlying robot connection
     */
    getRobot() {
        return this.robot;
    }
}
/**
 * Create a reactive robot from a ROS bridge connection
 */
export async function createReactiveRobot(url) {
    const { Robot } = await import('./ros-bridge.js');
    const robot = await Robot.connect(url);
    return new ReactiveRobot(robot);
}
/**
 * Computed signal for derived robot state
 */
export function computed(signals, compute) {
    let value = compute();
    const listeners = new Set();
    // Subscribe to all input signals
    signals.forEach((signal) => {
        signal.subscribe(() => {
            value = compute();
            listeners.forEach((cb) => cb(value));
        });
    });
    const result = () => value;
    result.get = () => value;
    result.subscribe = (callback) => {
        listeners.add(callback);
        return () => listeners.delete(callback);
    };
    return result;
}
/**
 * Effect that runs when robot state changes
 */
export function robotEffect(signals, effect) {
    let cleanup;
    const unsubscribes = [];
    const run = () => {
        if (typeof cleanup === 'function')
            cleanup();
        cleanup = effect();
    };
    signals.forEach((signal) => {
        unsubscribes.push(signal.subscribe(run));
    });
    // Run initially
    run();
    return () => {
        unsubscribes.forEach((unsub) => unsub());
        if (typeof cleanup === 'function')
            cleanup();
    };
}
/**
 * Debounce robot state updates
 */
export function debounced(signal, delay) {
    let value = signal.get();
    let timeoutId = null;
    const listeners = new Set();
    signal.subscribe((newValue) => {
        if (timeoutId)
            clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            value = newValue;
            listeners.forEach((cb) => cb(value));
        }, delay);
    });
    const result = () => value;
    result.get = () => value;
    result.subscribe = (callback) => {
        listeners.add(callback);
        return () => listeners.delete(callback);
    };
    return result;
}
/**
 * Throttle robot state updates
 */
export function throttled(signal, interval) {
    let value = signal.get();
    let lastUpdate = 0;
    const listeners = new Set();
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
    result.subscribe = (callback) => {
        listeners.add(callback);
        return () => listeners.delete(callback);
    };
    return result;
}
//# sourceMappingURL=reactive.js.map