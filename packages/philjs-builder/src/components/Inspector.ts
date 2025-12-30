/**
 * Inspector components for the visual builder
 */

import type { ComponentNode, PropDefinition, NodeStyles, EventHandler } from '../types.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Components
// ============================================================================

export function Inspector(_props: InspectorProps): unknown {
  // Implementation placeholder
  return null;
}

export function PropertyEditor(_props: PropertyEditorProps): unknown {
  // Implementation placeholder
  return null;
}

export function StyleEditor(_props: StyleEditorProps): unknown {
  // Implementation placeholder
  return null;
}

export function EventEditor(_props: EventEditorProps): unknown {
  // Implementation placeholder
  return null;
}
