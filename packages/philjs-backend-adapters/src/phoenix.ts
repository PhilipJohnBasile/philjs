type ChannelState = 'closed' | 'errored' | 'joined' | 'joining';

export class PhoenixChannel {
    state: ChannelState = 'closed';
    bindings: Array<{ event: string, callback: Function }> = [];

    constructor(public topic: string, public params: any = {}) { }

    join() {
        this.state = 'joining';
        console.log(`Phoenix: Joining channel ${this.topic}`);
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                this.state = 'joined';
                console.log(`Phoenix: Joined ${this.topic}`);
                resolve({ status: 'ok' });
            }, 100);
        });
    }

    on(event: string, callback: Function) {
        this.bindings.push({ event, callback });
    }

    push(event: string, payload: any) {
        console.log(`Phoenix: Pushing ${event} to ${this.topic}`, payload);
        return new Promise((resolve) => {
            setTimeout(() => resolve({ status: 'ok', response: {} }), 50);
        });
    }

    leave() {
        this.state = 'closed';
        console.log(`Phoenix: Left ${this.topic}`);
    }
}

export class PhoenixAdapter {
    private channels: Map<string, PhoenixChannel> = new Map();
    public isConnected = false;

    connect(endpoint: string) {
        console.log(`Phoenix: Connecting socket to ${endpoint}`);
        this.isConnected = true;
    }

    channel(topic: string, params?: any): PhoenixChannel {
        const channel = new PhoenixChannel(topic, params);
        this.channels.set(topic, channel);
        return channel;
    }

    liveView(mountPoint: HTMLElement) {
        if (!mountPoint) return;
        console.log('Phoenix: LiveView mounted at', mountPoint.id);
        // Simulate initial mount data
        mountPoint.setAttribute('data-phx-session', 'mock-session-id');
    }
}
