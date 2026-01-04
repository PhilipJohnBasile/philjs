
export interface Agent {
    name: string;
    role: string;
    execute: (task: string) => Promise<string>;
}

export class HierarchicalTeam implements Agent {
    name: string;
    role: string = 'Manager';
    workers: Agent[];

    constructor(name: string, workers: Agent[]) {
        this.name = name;
        this.workers = workers;
    }

    async execute(task: string): Promise<string> {
        console.log(`[Manager ${this.name}] Received task: ${task}`);
        // Simple round-robin delegation for now
        // In real implementation, uses an LLM to decide which worker to call
        const worker = this.workers[0];
        console.log(`[Manager ${this.name}] Delegating to ${worker.name}...`);
        const result = await worker.execute(task);
        return `[Manager] Overseen result: ${result}`;
    }
}
