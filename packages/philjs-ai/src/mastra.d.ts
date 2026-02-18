export interface WorkflowStep {
    id: string;
    action: (input: any) => Promise<any>;
    next?: string[];
}
export declare class WorkflowBuilder {
    private steps;
    private startStepId?;
    step(id: string, action: (input: any) => Promise<any>): this;
    transition(fromId: string, toId: string): this;
    execute(initialInput: any): Promise<Record<string, any>>;
}
export declare function createWorkflow(): WorkflowBuilder;
