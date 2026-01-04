import type { Sensor, SensorOptions } from '../types.js';
export interface MouseSensorOptions extends SensorOptions {
    activationConstraint?: {
        distance?: number;
        delay?: number;
        tolerance?: number;
    };
}
export declare function MouseSensor(options?: MouseSensorOptions): Sensor;
export declare function PointerSensor(options?: MouseSensorOptions): Sensor;
export declare function DelayedMouseSensor(delayMs?: number): Sensor;
export declare function DistanceMouseSensor(distancePx?: number): Sensor;
//# sourceMappingURL=mouse.d.ts.map