
export interface WorkflowStep {
    id: string;
    action: (input: any) => Promise<any>;
    next?: string[]; // IDs of next steps
}

export class WorkflowBuilder {
    private steps: Map<string, WorkflowStep> = new Map();
    private startStepId?: string;

    step(id: string, action: (input: any) => Promise<any>): this {
        this.steps.set(id, { id, action });
        if (!this.startStepId) this.startStepId = id;
        return this;
    }

    transition(fromId: string, toId: string): this {
        const step = this.steps.get(fromId);
        if (step) {
            step.next = step.next || [];
            step.next.push(toId);
        }
        return this;
    }

    async execute(initialInput: any): Promise<Record<string, any>> {
        const results: Record<string, any> = {};
        const queue: { id: string, input: any }[] = [];

        if (this.startStepId) {
            queue.push({ id: this.startStepId, input: initialInput });
        }

        while (queue.length > 0) {
            const { id, input } = queue.shift()!;
            const step = this.steps.get(id);
            if (!step) continue;

            const output = await step.action(input);
            results[id] = output;

            if (step.next) {
                for (const nextId of step.next) {
                    queue.push({ id: nextId, input: output });
                }
            }
        }

        return results;
    }
}

export function createWorkflow() {
    return new WorkflowBuilder();
}
