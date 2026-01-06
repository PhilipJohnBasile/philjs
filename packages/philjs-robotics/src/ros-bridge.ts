
export interface RosMessage {
    op: 'publish' | 'subscribe' | 'unsubscribe' | 'call_service';
    id?: string;
    topic?: string;
    type?: string;
    msg?: any;
    service?: string;
    args?: any;
}

export class Robot {
    private socket: WebSocket | null = null;
    private listeners = new Map<string, (msg: any) => void>();
    private isConnected = false;

    static async connect(url: string): Promise<Robot> {
        const bot = new Robot();
        await bot.connectSocket(url);
        return bot;
    }

    private connectSocket(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(url);
            this.socket.onopen = () => {
                this.isConnected = true;
                resolve();
            };
            this.socket.onerror = (e) => reject(e);
            this.socket.onmessage = (event) => this.handleMessage(event.data);
        });
    }

    private handleMessage(data: string) {
        try {
            const message = JSON.parse(data);
            if (message.op === 'publish' && message.topic) {
                const cb = this.listeners.get(message.topic);
                if (cb) cb(message.msg);
            }
        } catch (e) {
            console.error('ROS Parse Error', e);
        }
    }

    subscribe(topic: string, messageType: string, callback: (msg: any) => void) {
        if (!this.socket || !this.isConnected) throw new Error('Not connected');

        this.listeners.set(topic, callback);

        const payload: RosMessage = {
            op: 'subscribe',
            topic: topic,
            type: messageType
        };
        this.socket.send(JSON.stringify(payload));
    }

    publish(topic: string, messageType: string, msg: any) {
        if (!this.socket || !this.isConnected) throw new Error('Not connected');

        const payload: RosMessage = {
            op: 'publish',
            topic: topic,
            type: messageType,
            msg: msg
        };
        this.socket.send(JSON.stringify(payload));
    }

    // Standard Twist message for robot movement
    move(linearX: number, angularZ: number) {
        this.publish('/cmd_vel', 'geometry_msgs/Twist', {
            linear: { x: linearX, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: angularZ }
        });
    }

    moveArm(x: number, y: number, z: number) {
        // Inverse Kinematics target
        this.publish('/arm_controller/command', 'trajectory_msgs/JointTrajectory', {
            points: [{ positions: [x, y, z] }] // Simplified
        });
    }

    disconnect() {
        this.socket?.close();
    }
}
