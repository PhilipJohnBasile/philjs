export class PhoenixChannel {
    topic;
    params;
    socket;
    state = 'closed';
    bindings = [];
    constructor(topic, params = {}, socket) {
        this.topic = topic;
        this.params = params;
        this.socket = socket;
    }
    join() {
        this.state = 'joining';
        this.socket.push({
            topic: this.topic,
            event: 'phx_join',
            payload: this.params,
            ref: this.socket.makeRef()
        });
        // Optimistic join for now, real implementation listens for phx_reply
        this.state = 'joined';
        return Promise.resolve({ status: 'ok' });
    }
    on(event, callback) {
        this.bindings.push({ event, callback });
    }
    trigger(event, payload) {
        this.bindings
            .filter(b => b.event === event)
            .forEach(b => b.callback(payload));
    }
    push(event, payload) {
        const ref = this.socket.makeRef();
        this.socket.push({
            topic: this.topic,
            event,
            payload,
            ref
        });
        return new Promise((resolve) => {
            // Wait for reply via socket listener (simplified)
            resolve({ status: 'ok', ref });
        });
    }
    leave() {
        this.socket.push({
            topic: this.topic,
            event: 'phx_leave',
            payload: {},
            ref: this.socket.makeRef()
        });
        this.state = 'closed';
    }
}
export class PhoenixAdapter {
    endpoint;
    channels = new Map();
    isConnected = false;
    ws = null;
    ref = 0;
    constructor(endpoint) {
        this.endpoint = endpoint;
    }
    connect() {
        if (typeof WebSocket === 'undefined')
            return;
        this.ws = new WebSocket(this.endpoint);
        this.ws.onopen = () => {
            this.isConnected = true;
        };
        this.ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            const channel = this.channels.get(msg.topic);
            if (channel) {
                channel.trigger(msg.event, msg.payload);
            }
        };
        this.ws.onclose = () => {
            this.isConnected = false;
        };
    }
    makeRef() {
        return String(this.ref++);
    }
    push(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
        else {
            console.warn('Phoenix: Socket not connected');
        }
    }
    channel(topic, params) {
        const channel = new PhoenixChannel(topic, params, this);
        this.channels.set(topic, channel);
        return channel;
    }
    liveView(mountPoint) {
        if (!mountPoint)
            return;
        // This would typically involve loading the live_socket.js script
    }
}
//# sourceMappingURL=phoenix.js.map