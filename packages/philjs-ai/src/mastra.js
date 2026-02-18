export class WorkflowBuilder {
    steps = new Map();
    startStepId;
    step(id, action) {
        this.steps.set(id, { id, action });
        if (!this.startStepId)
            this.startStepId = id;
        return this;
    }
    transition(fromId, toId) {
        const step = this.steps.get(fromId);
        if (step) {
            step.next = step.next || [];
            step.next.push(toId);
        }
        return this;
    }
    async execute(initialInput) {
        const results = {};
        const queue = [];
        if (this.startStepId) {
            queue.push({ id: this.startStepId, input: initialInput });
        }
        while (queue.length > 0) {
            const { id, input } = queue.shift();
            const step = this.steps.get(id);
            if (!step)
                continue;
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
//# sourceMappingURL=mastra.js.map