import { describe, it, expect, vi } from 'vitest';
import { ROSBridge } from '../ros-bridge.js';

describe('PhilJS Robotics: ROS Bridge', () => {
    it('should connect to ROS bridge websocket', () => {
        const bridge = new ROSBridge('ws://localhost:9090');
        // Mock connection logic if specific implementation requires it
        expect(bridge.url).toBe('ws://localhost:9090');
    });

    it('should create topics', () => {
        const bridge = new ROSBridge('ws://localhost:9090');
        const topic = bridge.topic({ name: '/cmd_vel', messageType: 'geometry_msgs/Twist' });

        expect(topic.name).toBe('/cmd_vel');
        expect(topic.messageType).toBe('geometry_msgs/Twist');
    });

    it('should publish messages', () => {
        const bridge = new ROSBridge('ws://localhost:9090');
        const topic = bridge.topic({ name: '/test', messageType: 'std_msgs/String' });

        // Should not throw
        expect(() => topic.publish({ data: 'hello' })).not.toThrow();
    });
});
