
// PhilJS AI Graph
// Visual Graph Editor support

export interface GraphNode {
    id: string;
    type: string;
    data: any;
}

export interface GraphEdge {
    source: string;
    target: string;
}

export function exportGraphJSON(nodes: GraphNode[], edges: GraphEdge[]) {
    return JSON.stringify({ nodes, edges, version: '1.0' }, null, 2);
}

export class AgentGraph {
    nodes: GraphNode[] = [];
    edges: GraphEdge[] = [];

    addNode(node: GraphNode) {
        this.nodes.push(node);
    }

    connect(source: string, target: string) {
        this.edges.push({ source, target });
    }

    toJSON() {
        return exportGraphJSON(this.nodes, this.edges);
    }
}
