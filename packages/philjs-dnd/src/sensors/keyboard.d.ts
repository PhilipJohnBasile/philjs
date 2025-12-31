import type { Sensor, SensorOptions, Position } from '../types.js';
export interface KeyboardSensorOptions extends SensorOptions {
    keyboardCodes?: {
        start?: string[];
        cancel?: string[];
        end?: string[];
        up?: string[];
        down?: string[];
        left?: string[];
        right?: string[];
    };
    moveStep?: number;
    moveStepLarge?: number;
}
export declare function KeyboardSensor(options?: KeyboardSensorOptions): Sensor;
export declare function WasdKeyboardSensor(options?: Omit<KeyboardSensorOptions, 'keyboardCodes'>): Sensor;
export declare function VimKeyboardSensor(options?: Omit<KeyboardSensorOptions, 'keyboardCodes'>): Sensor;
export interface KeyboardCoordinates {
    currentCoordinates: Position;
    context: {
        activeRect: DOMRect | null;
        droppableRects: Map<string, DOMRect>;
        droppableOrder: string[];
    };
}
export declare function getNextDroppableId(direction: 'up' | 'down' | 'left' | 'right', context: KeyboardCoordinates['context'], currentOverId?: string | null): string | null;
export declare function getDroppableCenter(droppableId: string, rects: Map<string, DOMRect>): Position | null;
//# sourceMappingURL=keyboard.d.ts.map