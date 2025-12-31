/**
 * FlameGraph - Visualization for performance profiling and tracing
 */
import type { Span } from '../index.js';
export interface FlameGraphNode {
    name: string;
    value: number;
    children: FlameGraphNode[];
    color?: string;
    depth?: number;
}
export interface FlameGraphProps {
    root: FlameGraphNode;
    width?: number;
    height?: number;
    cellHeight?: number;
    colorScheme?: 'warm' | 'cool' | 'gradient';
    showLabels?: boolean;
    minWidth?: number;
    className?: string;
    onClick?: (node: FlameGraphNode) => void;
}
/**
 * Convert spans to a flame graph structure
 */
export declare function spansToFlameGraph(spans: Span[]): FlameGraphNode;
export declare function FlameGraph(props: FlameGraphProps): string;
//# sourceMappingURL=FlameGraph.d.ts.map