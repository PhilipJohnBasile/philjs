/**
 * Sensor abstractions for robotics applications
 */
export interface SensorReading<T> {
    timestamp: number;
    frameId: string;
    data: T;
}
export interface Point3D {
    x: number;
    y: number;
    z: number;
}
export interface Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
}
export interface Pose {
    position: Point3D;
    orientation: Quaternion;
}
export interface Twist {
    linear: Point3D;
    angular: Point3D;
}
export interface LaserScan {
    angleMin: number;
    angleMax: number;
    angleIncrement: number;
    timeIncrement: number;
    scanTime: number;
    rangeMin: number;
    rangeMax: number;
    ranges: number[];
    intensities?: number[];
}
export interface PointCloud {
    points: Point3D[];
    colors?: {
        r: number;
        g: number;
        b: number;
    }[];
    intensities?: number[];
}
export interface IMUData {
    orientation: Quaternion;
    angularVelocity: Point3D;
    linearAcceleration: Point3D;
    orientationCovariance?: number[];
    angularVelocityCovariance?: number[];
    linearAccelerationCovariance?: number[];
}
export interface CameraInfo {
    width: number;
    height: number;
    distortionModel: string;
    distortionCoefficients: number[];
    intrinsicMatrix: number[];
    rectificationMatrix: number[];
    projectionMatrix: number[];
}
export interface Image {
    width: number;
    height: number;
    encoding: 'rgb8' | 'rgba8' | 'bgr8' | 'mono8' | 'mono16' | 'depth16' | 'depth32f';
    isBigEndian: boolean;
    step: number;
    data: Uint8Array;
}
export interface JointState {
    name: string[];
    position: number[];
    velocity: number[];
    effort: number[];
}
export interface Odometry {
    pose: {
        pose: Pose;
        covariance: number[];
    };
    twist: {
        twist: Twist;
        covariance: number[];
    };
}
export interface BatteryState {
    voltage: number;
    current: number;
    charge: number;
    capacity: number;
    designCapacity: number;
    percentage: number;
    powerSupplyStatus: 'unknown' | 'charging' | 'discharging' | 'not_charging' | 'full';
    powerSupplyHealth: 'unknown' | 'good' | 'overheat' | 'dead' | 'overvoltage' | 'unspecified';
    powerSupplyTechnology: 'unknown' | 'nimh' | 'lion' | 'lipo' | 'life' | 'nicd' | 'limn';
    present: boolean;
    cellVoltage?: number[];
    cellTemperature?: number[];
    location: string;
    serialNumber: string;
}
/**
 * Abstract sensor class for common functionality
 */
export declare abstract class Sensor<T> {
    protected frameId: string;
    protected lastReading: SensorReading<T> | null;
    protected listeners: Set<(reading: SensorReading<T>) => void>;
    constructor(frameId: string);
    subscribe(callback: (reading: SensorReading<T>) => void): () => void;
    protected emit(data: T): void;
    getLastReading(): SensorReading<T> | null;
    abstract start(): Promise<void>;
    abstract stop(): void;
}
/**
 * Lidar sensor wrapper
 */
export declare class LidarSensor extends Sensor<LaserScan> {
    private topic;
    private unsubscribe?;
    constructor(frameId: string, topic?: string);
    start(): Promise<void>;
    stop(): void;
    /**
     * Convert laser scan to 2D point cloud
     */
    toPoints(scan: LaserScan): Point3D[];
    /**
     * Find closest obstacle
     */
    closestObstacle(scan: LaserScan): {
        distance: number;
        angle: number;
    } | null;
}
/**
 * Camera sensor wrapper
 */
export declare class CameraSensor extends Sensor<Image> {
    private topic;
    private info;
    constructor(frameId: string, topic?: string);
    start(): Promise<void>;
    stop(): void;
    getCameraInfo(): CameraInfo | null;
    /**
     * Convert image to ImageData for canvas rendering
     */
    toImageData(image: Image): ImageData;
}
/**
 * IMU sensor wrapper
 */
export declare class IMUSensor extends Sensor<IMUData> {
    constructor(frameId: string);
    start(): Promise<void>;
    stop(): void;
    /**
     * Convert quaternion to Euler angles (roll, pitch, yaw)
     */
    toEuler(q: Quaternion): {
        roll: number;
        pitch: number;
        yaw: number;
    };
}
/**
 * GPS sensor wrapper
 */
export interface NavSatFix {
    latitude: number;
    longitude: number;
    altitude: number;
    positionCovariance: number[];
    positionCovarianceType: 'unknown' | 'approximated' | 'diagonal_known' | 'known';
    status: 'no_fix' | 'fix' | 'sbas_fix' | 'gbas_fix';
}
export declare class GPSSensor extends Sensor<NavSatFix> {
    constructor(frameId: string);
    start(): Promise<void>;
    stop(): void;
    /**
     * Calculate distance between two GPS coordinates (Haversine formula)
     */
    static distance(lat1: number, lon1: number, lat2: number, lon2: number): number;
    /**
     * Calculate bearing between two GPS coordinates
     */
    static bearing(lat1: number, lon1: number, lat2: number, lon2: number): number;
}
