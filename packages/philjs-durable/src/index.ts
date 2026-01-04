
// PhilJS Durable Objects
// Stateful serverless patterns

export abstract class PhilDurable {
    state: any;

    constructor(state: any, env: any) {
        this.state = state;
    }

    abstract fetch(request: Request): Promise<Response>;

    async save() {
        // Stub storage save
        await this.state.storage.put('data', JSON.stringify(this));
    }
}

export function defineDurable(cls: any) {
    return cls;
}
