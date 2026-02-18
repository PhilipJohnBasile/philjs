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
  colors?: { r: number; g: number; b: number }[];
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
  pose: { pose: Pose; covariance: number[] };
  twist: { twist: Twist; covariance: number[] };
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
export abstract class Sensor<T> {
  protected frameId: string;
  protected lastReading: SensorReading<T> | null = null;
  protected listeners: Set<(reading: SensorReading<T>) => void> = new Set();

  constructor(frameId: string) {
    this.frameId = frameId;
  }

  subscribe(callback: (reading: SensorReading<T>) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  protected emit(data: T): void {
    const reading: SensorReading<T> = {
      timestamp: Date.now(),
      frameId: this.frameId,
      data,
    };
    this.lastReading = reading;
    this.listeners.forEach((cb) => cb(reading));
  }

  getLastReading(): SensorReading<T> | null {
    return this.lastReading;
  }

  abstract start(): Promise<void>;
  abstract stop(): void;
}

/**
 * Lidar sensor wrapper
 */
export class LidarSensor extends Sensor<LaserScan> {
  private topic: string;
  private unsubscribe?: () => void;

  constructor(frameId: string, topic = '/scan') {
    super(frameId);
    this.topic = topic;
  }

  async start(): Promise<void> {
    // Implementation would connect to ROS topic
  }

  stop(): void {
    this.unsubscribe?.();
  }

  /**
   * Convert laser scan to 2D point cloud
   */
  toPoints(scan: LaserScan): Point3D[] {
    const points: Point3D[] = [];
    let angle = scan.angleMin;

    for (const range of scan.ranges) {
      if (range >= scan.rangeMin && range <= scan.rangeMax) {
        points.push({
          x: range * Math.cos(angle),
          y: range * Math.sin(angle),
          z: 0,
        });
      }
      angle += scan.angleIncrement;
    }

    return points;
  }

  /**
   * Find closest obstacle
   */
  closestObstacle(scan: LaserScan): { distance: number; angle: number } | null {
    let minDistance = Infinity;
    let minAngle = 0;
    let angle = scan.angleMin;

    for (const range of scan.ranges) {
      if (range >= scan.rangeMin && range <= scan.rangeMax && range < minDistance) {
        minDistance = range;
        minAngle = angle;
      }
      angle += scan.angleIncrement;
    }

    return minDistance === Infinity ? null : { distance: minDistance, angle: minAngle };
  }
}

/**
 * Camera sensor wrapper
 */
export class CameraSensor extends Sensor<Image> {
  private topic: string;
  private info: CameraInfo | null = null;

  constructor(frameId: string, topic = '/camera/image_raw') {
    super(frameId);
    this.topic = topic;
  }

  async start(): Promise<void> {
    // Implementation would connect to ROS topic
  }

  stop(): void {}

  getCameraInfo(): CameraInfo | null {
    return this.info;
  }

  /**
   * Convert image to ImageData for canvas rendering
   */
  toImageData(image: Image): ImageData {
    const { width, height, encoding, data } = image;
    const rgba = new Uint8ClampedArray(width * height * 4);

    for (let i = 0; i < width * height; i++) {
      switch (encoding) {
        case 'rgb8':
          rgba[i * 4] = data[i * 3] ?? 0;
          rgba[i * 4 + 1] = data[i * 3 + 1] ?? 0;
          rgba[i * 4 + 2] = data[i * 3 + 2] ?? 0;
          rgba[i * 4 + 3] = 255;
          break;
        case 'bgr8':
          rgba[i * 4] = data[i * 3 + 2] ?? 0;
          rgba[i * 4 + 1] = data[i * 3 + 1] ?? 0;
          rgba[i * 4 + 2] = data[i * 3] ?? 0;
          rgba[i * 4 + 3] = 255;
          break;
        case 'mono8':
          rgba[i * 4] = data[i] ?? 0;
          rgba[i * 4 + 1] = data[i] ?? 0;
          rgba[i * 4 + 2] = data[i] ?? 0;
          rgba[i * 4 + 3] = 255;
          break;
        case 'rgba8':
          rgba[i * 4] = data[i * 4] ?? 0;
          rgba[i * 4 + 1] = data[i * 4 + 1] ?? 0;
          rgba[i * 4 + 2] = data[i * 4 + 2] ?? 0;
          rgba[i * 4 + 3] = data[i * 4 + 3] ?? 255;
          break;
        default:
          rgba[i * 4] = 0;
          rgba[i * 4 + 1] = 0;
          rgba[i * 4 + 2] = 0;
          rgba[i * 4 + 3] = 255;
      }
    }

    return new ImageData(rgba, width, height);
  }
}

/**
 * IMU sensor wrapper
 */
export class IMUSensor extends Sensor<IMUData> {
  constructor(frameId: string) {
    super(frameId);
  }

  async start(): Promise<void> {}
  stop(): void {}

  /**
   * Convert quaternion to Euler angles (roll, pitch, yaw)
   */
  toEuler(q: Quaternion): { roll: number; pitch: number; yaw: number } {
    const { x, y, z, w } = q;

    // Roll (x-axis rotation)
    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    // Pitch (y-axis rotation)
    const sinp = 2 * (w * y - z * x);
    const pitch = Math.abs(sinp) >= 1 ? (Math.sign(sinp) * Math.PI) / 2 : Math.asin(sinp);

    // Yaw (z-axis rotation)
    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return { roll, pitch, yaw };
  }
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

export class GPSSensor extends Sensor<NavSatFix> {
  constructor(frameId: string) {
    super(frameId);
  }

  async start(): Promise<void> {}
  stop(): void {}

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   */
  static distance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate bearing between two GPS coordinates
   */
  static bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  }
}
