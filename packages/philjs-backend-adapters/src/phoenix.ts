type ChannelState = 'closed' | 'errored' | 'joined' | 'joining';

export class PhoenixChannel {
    state: ChannelState = 'closed';
    bindings: Array<{ event: string, callback: Function }> = [];

    constructor(
        public topic: string,
        public params: any = {},
        private socket: PhoenixAdapter
    ) { }

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

    on(event: string, callback: Function) {
        this.bindings.push({ event, callback });
    }

    trigger(event: string, payload: any) {
        this.bindings
            .filter(b => b.event === event)
            .forEach(b => b.callback(payload));
    }

    push(event: string, payload: any) {
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
    private channels: Map<string, PhoenixChannel> = new Map();
    public isConnected = false;
    private ws: WebSocket | null = null;
    private ref = 0;

    constructor(private endpoint: string) { }

    connect() {
        if (typeof WebSocket === 'undefined') return;

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

    push(data: { topic: string, event: string, payload: any, ref: string }) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('Phoenix: Socket not connected');
        }
    }

    channel(topic: string, params?: any): PhoenixChannel {
        const channel = new PhoenixChannel(topic, params, this);
        this.channels.set(topic, channel);
        return channel;
    }

    liveView(mountPoint: HTMLElement) {
        if (!mountPoint) return;
        // This would typically involve loading the live_socket.js script
    }
}
