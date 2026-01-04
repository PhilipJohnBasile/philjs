/**
 * Property Panel components for the visual builder
 */
import type { ComponentNode, PropDefinition, NodeStyles } from '../types.js';
export interface PropertyPanelProps {
    node?: ComponentNode;
    propDefinitions?: PropDefinition[];
    onPropsChange?: (props: Record<string, unknown>) => void;
    onStylesChange?: (styles: Partial<NodeStyles>) => void;
    collapsed?: boolean;
    onCollapseToggle?: () => void;
}
export interface PropertyGroupProps {
    title: string;
    children?: unknown;
    isCollapsed?: boolean;
    onToggle?: () => void;
    icon?: string;
}
export declare function PropertyPanel(_props: PropertyPanelProps): unknown;
export declare function PropertyGroup(_props: PropertyGroupProps): unknown;
//# sourceMappingURL=PropertyPanel.d.ts.map