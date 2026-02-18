/**
 * Sensor abstractions for robotics applications
 */
/**
 * Abstract sensor class for common functionality
 */
export class Sensor {
    frameId;
    lastReading = null;
    listeners = new Set();
    constructor(frameId) {
        this.frameId = frameId;
    }
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
    emit(data) {
        const reading = {
            timestamp: Date.now(),
            frameId: this.frameId,
            data,
        };
        this.lastReading = reading;
        this.listeners.forEach((cb) => cb(reading));
    }
    getLastReading() {
        return this.lastReading;
    }
}
/**
 * Lidar sensor wrapper
 */
export class LidarSensor extends Sensor {
    topic;
    unsubscribe;
    constructor(frameId, topic = '/scan') {
        super(frameId);
        this.topic = topic;
    }
    async start() {
        // Implementation would connect to ROS topic
    }
    stop() {
        this.unsubscribe?.();
    }
    /**
     * Convert laser scan to 2D point cloud
     */
    toPoints(scan) {
        const points = [];
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
    closestObstacle(scan) {
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
export class CameraSensor extends Sensor {
    topic;
    info = null;
    constructor(frameId, topic = '/camera/image_raw') {
        super(frameId);
        this.topic = topic;
    }
    async start() {
        // Implementation would connect to ROS topic
    }
    stop() { }
    getCameraInfo() {
        return this.info;
    }
    /**
     * Convert image to ImageData for canvas rendering
     */
    toImageData(image) {
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
export class IMUSensor extends Sensor {
    constructor(frameId) {
        super(frameId);
    }
    async start() { }
    stop() { }
    /**
     * Convert quaternion to Euler angles (roll, pitch, yaw)
     */
    toEuler(q) {
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
export class GPSSensor extends Sensor {
    constructor(frameId) {
        super(frameId);
    }
    async start() { }
    stop() { }
    /**
     * Calculate distance between two GPS coordinates (Haversine formula)
     */
    static distance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
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
    static bearing(lat1, lon1, lat2, lon2) {
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const lat1Rad = (lat1 * Math.PI) / 180;
        const lat2Rad = (lat2 * Math.PI) / 180;
        const y = Math.sin(dLon) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
        return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    }
}
//# sourceMappingURL=sensors.js.map