/**
 * Inspector components for the visual builder
 */
import type { ComponentNode, PropDefinition, NodeStyles, EventHandler } from '../types.js';
export interface InspectorProps {
    node?: ComponentNode;
    propDefinitions?: PropDefinition[];
    onPropsChange?: (props: Record<string, unknown>) => void;
    onStylesChange?: (styles: Partial<NodeStyles>) => void;
    onEventsChange?: (events: EventHandler[]) => void;
    activeTab?: 'props' | 'styles' | 'events' | 'advanced';
    onTabChange?: (tab: 'props' | 'styles' | 'events' | 'advanced') => void;
}
export interface PropertyEditorProps {
    node?: ComponentNode;
    propDefinitions?: PropDefinition[];
    onPropsChange?: (props: Record<string, unknown>) => void;
}
export interface StyleEditorProps {
    node?: ComponentNode;
    onStylesChange?: (styles: Partial<NodeStyles>) => void;
    showAdvanced?: boolean;
}
export interface EventEditorProps {
    node?: ComponentNode;
    events?: EventHandler[];
    onEventsChange?: (events: EventHandler[]) => void;
    availableEvents?: string[];
}
export declare function Inspector(_props: InspectorProps): unknown;
export declare function PropertyEditor(_props: PropertyEditorProps): unknown;
export declare function StyleEditor(_props: StyleEditorProps): unknown;
export declare function EventEditor(_props: EventEditorProps): unknown;
//# sourceMappingURL=Inspector.d.ts.map