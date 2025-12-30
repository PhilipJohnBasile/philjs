/**
 * Selection components for canvas
 */

export interface SelectionBoxProps {
  bounds: { x: number; y: number; width: number; height: number };
  visible?: boolean;
}

export interface HoverHighlightProps {
  element: HTMLElement | null;
  color?: string;
}

export interface MarqueeSelectionProps {
  start: { x: number; y: number };
  end: { x: number; y: number };
  visible?: boolean;
}

export interface SelectionOverlayProps {
  selectedIds: string[];
  onSelect?: (id: string) => void;
  onDeselect?: (id: string) => void;
}

export interface SelectionManagerProps {
  multiSelect?: boolean;
  onSelectionChange?: (ids: string[]) => void;
}

export function SelectionBox(_props: SelectionBoxProps): HTMLElement {
  return document.createElement('div');
}

export function HoverHighlight(_props: HoverHighlightProps): HTMLElement {
  return document.createElement('div');
}

export function MarqueeSelection(_props: MarqueeSelectionProps): HTMLElement {
  return document.createElement('div');
}

export function SelectionOverlay(_props: SelectionOverlayProps): HTMLElement {
  return document.createElement('div');
}

export function SelectionManager(_props: SelectionManagerProps): HTMLElement {
  return document.createElement('div');
}
