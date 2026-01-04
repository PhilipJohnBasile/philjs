import type { Sensor, SensorOptions } from '../types.js';
export interface TouchSensorOptions extends SensorOptions {
    activationConstraint?: {
        delay?: number;
        tolerance?: number;
        distance?: number;
    };
}
export declare function TouchSensor(options?: TouchSensorOptions): Sensor;
export declare function LongPressSensor(delayMs?: number): Sensor;
export declare function ImmediateTouchSensor(): Sensor;
export declare function preventScrolling(element: HTMLElement): () => void;
//# sourceMappingURL=touch.d.ts.map