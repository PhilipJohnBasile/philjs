// ============================================================================
// Types for serialization/export
// ============================================================================

export interface SerializedComponent {
  id: string;
  type: string;
  name: string;
  props: Record<string, unknown>;
  styles: { base: Record<string, unknown>; [key: string]: Record<string, unknown> };
  events: Array<{ event: string; action: string; config: Record<string, unknown> }>;
  children: string[];
  parentId: string | null;
  bounds: { x: number; y: number; width: number; height: number };
  isLocked: boolean;
  isVisible: boolean;
}

export interface StudioSchema {
  version: string;
  name: string;
  description?: string;
  components: SerializedComponent[];
  rootIds: string[];
  canvas?: { width: number; height: number };
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox: { x: number; y: number; width: number; height: number };
  fills?: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a?: number };
  }>;
  strokes?: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a?: number };
  }>;
  cornerRadius?: number;
  effects?: Array<{
    type: string;
    offset?: { x: number; y: number };
    radius?: number;
    color?: { r: number; g: number; b: number; a?: number };
  }>;
  style?: Record<string, unknown>;
  characters?: string;
  children?: FigmaNode[];
}
