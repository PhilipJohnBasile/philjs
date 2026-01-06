export class Robot {
    socket = null;
    listeners = new Map();
    isConnected = false;
    static async connect(url) {
        const bot = new Robot();
        await bot.connectSocket(url);
        return bot;
    }
    connectSocket(url) {
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
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            if (message.op === 'publish' && message.topic) {
                const cb = this.listeners.get(message.topic);
                if (cb)
                    cb(message.msg);
            }
        }
        catch (e) {
            console.error('ROS Parse Error', e);
        }
    }
    subscribe(topic, messageType, callback) {
        if (!this.socket || !this.isConnected)
            throw new Error('Not connected');
        this.listeners.set(topic, callback);
        const payload = {
            op: 'subscribe',
            topic: topic,
            type: messageType
        };
        this.socket.send(JSON.stringify(payload));
    }
    publish(topic, messageType, msg) {
        if (!this.socket || !this.isConnected)
            throw new Error('Not connected');
        const payload = {
            op: 'publish',
            topic: topic,
            type: messageType,
            msg: msg
        };
        this.socket.send(JSON.stringify(payload));
    }
    // Standard Twist message for robot movement
    move(linearX, angularZ) {
        this.publish('/cmd_vel', 'geometry_msgs/Twist', {
            linear: { x: linearX, y: 0, z: 0 },
            angular: { x: 0, y: 0, z: angularZ }
        });
    }
    moveArm(x, y, z) {
        // Inverse Kinematics target
        this.publish('/arm_controller/command', 'trajectory_msgs/JointTrajectory', {
            points: [{ positions: [x, y, z] }] // Simplified
        });
    }
    disconnect() {
        this.socket?.close();
    }
}
//# sourceMappingURL=ros-bridge.js.map