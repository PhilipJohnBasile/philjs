import type {
  ComponentNode,
  ComponentStyle,
  SpacingValue,
  ResponsiveStyles,
  EventHandler,
} from '../state/EditorStore';

// ============================================================================
// Types
// ============================================================================

export interface ExportOptions {
  format: 'jsx' | 'tsx' | 'json' | 'figma';
  includeStyles?: boolean;
  includeEvents?: boolean;
  componentName?: string;
  prettify?: boolean;
  indentSize?: number;
}

export interface StudioSchema {
  version: string;
  name: string;
  description?: string;
  components: SerializedComponent[];
  rootIds: string[];
  canvas: {
    width: number;
    height: number;
    backgroundColor?: string;
  };
  metadata?: {
    createdAt: string;
    updatedAt: string;
    author?: string;
  };
}

export interface SerializedComponent {
  id: string;
  type: string;
  name: string;
  props: Record<string, unknown>;
  styles: ResponsiveStyles;
  events: EventHandler[];
  children: string[];
  parentId: string | null;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isLocked: boolean;
  isVisible: boolean;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  effects?: FigmaEffect[];
  cornerRadius?: number;
  children?: FigmaNode[];
  characters?: string;
  style?: Record<string, unknown>;
}

interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
  color?: { r: number; g: number; b: number; a: number };
  opacity?: number;
}

interface FigmaStroke {
  type: 'SOLID';
  color?: { r: number; g: number; b: number; a: number };
}

interface FigmaEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR';
  offset?: { x: number; y: number };
  radius?: number;
  color?: { r: number; g: number; b: number; a: number };
}

// ============================================================================
// Utility Functions
// ============================================================================

const indent = (text: string, spaces: number): string => {
  const indentation = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.trim() ? indentation + line : line))
    .join('\n');
};

const formatSpacing = (value: SpacingValue | number | string | undefined): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return `${value}px`;
  if (typeof value === 'string') return value;

  const { top, right, bottom, left } = value;
  if (top === right && right === bottom && bottom === left) {
    return `${top}px`;
  }
  if (top === bottom && left === right) {
    return `${top}px ${right}px`;
  }
  return `${top}px ${right}px ${bottom}px ${left}px`;
};

const styleToInlineObject = (styles: ComponentStyle): Record<string, string | number> => {
  const result: Record<string, string | number> = {};

  if (styles.display) result.display = styles.display;
  if (styles.flexDirection) result.flexDirection = styles.flexDirection;
  if (styles.justifyContent) result.justifyContent = styles.justifyContent;
  if (styles.alignItems) result.alignItems = styles.alignItems;
  if (styles.gap !== undefined) result.gap = styles.gap;

  if (styles.width !== undefined) result.width = styles.width;
  if (styles.height !== undefined) result.height = styles.height;
  if (styles.minWidth !== undefined) result.minWidth = styles.minWidth;
  if (styles.maxWidth !== undefined) result.maxWidth = styles.maxWidth;
  if (styles.minHeight !== undefined) result.minHeight = styles.minHeight;
  if (styles.maxHeight !== undefined) result.maxHeight = styles.maxHeight;

  const padding = formatSpacing(styles.padding);
  if (padding) result.padding = padding;

  const margin = formatSpacing(styles.margin);
  if (margin) result.margin = margin;

  if (styles.backgroundColor) result.backgroundColor = styles.backgroundColor;
  if (styles.color) result.color = styles.color;
  if (styles.borderColor) result.borderColor = styles.borderColor;

  if (styles.borderWidth !== undefined) result.borderWidth = styles.borderWidth;
  if (styles.borderRadius !== undefined) result.borderRadius = styles.borderRadius;
  if (styles.borderStyle) result.borderStyle = styles.borderStyle;

  if (styles.opacity !== undefined) result.opacity = styles.opacity;
  if (styles.boxShadow) result.boxShadow = styles.boxShadow;

  return result;
};

const formatPropValue = (key: string, value: unknown): string => {
  if (value === undefined || value === null) return '';
  if (key === 'children') return '';

  if (typeof value === 'string') {
    return `${key}="${value}"`;
  }
  if (typeof value === 'boolean') {
    return value ? key : '';
  }
  if (typeof value === 'number') {
    return `${key}={${value}}`;
  }
  if (typeof value === 'object') {
    return `${key}={${JSON.stringify(value)}}`;
  }
  return `${key}={${String(value)}}`;
};

// ============================================================================
// JSX/TSX Export
// ============================================================================

const generateJSXComponent = (
  component: ComponentNode,
  components: Record<string, ComponentNode>,
  options: ExportOptions,
  depth: number = 0
): string => {
  const { type, props, styles, events, children: childIds } = component;
  const indentSize = options.indentSize || 2;
  const baseIndent = ' '.repeat(depth * indentSize);
  const propIndent = ' '.repeat((depth + 1) * indentSize);

  const lines: string[] = [];

  // Collect props
  const propLines: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue;
    const formatted = formatPropValue(key, value);
    if (formatted) {
      propLines.push(formatted);
    }
  }

  // Add styles
  if (options.includeStyles !== false) {
    const styleObj = styleToInlineObject(styles.base || {});
    if (Object.keys(styleObj).length > 0) {
      const styleStr = Object.entries(styleObj)
        .map(([k, v]) => `${k}: ${typeof v === 'string' ? `"${v}"` : v}`)
        .join(', ');
      propLines.push(`style={{ ${styleStr} }}`);
    }
  }

  // Add event handlers
  if (options.includeEvents !== false && events.length > 0) {
    for (const event of events) {
      if (event.action === 'navigate' && event.config.url) {
        propLines.push(`${event.event}={() => navigate("${event.config.url}")}`);
      } else if (event.action === 'custom' && event.config.code) {
        propLines.push(`${event.event}={() => { ${event.config.code} }}`);
      } else {
        propLines.push(`${event.event}={() => {}}`);
      }
    }
  }

  // Get text content
  const textContent = props.children as string | undefined;
  const hasChildren = childIds.length > 0 || !!textContent;

  // Build the component
  if (propLines.length === 0) {
    if (hasChildren) {
      lines.push(`${baseIndent}<${type}>`);
    } else {
      lines.push(`${baseIndent}<${type} />`);
    }
  } else if (propLines.length <= 2) {
    // Short props on same line
    const propsStr = propLines.join(' ');
    if (hasChildren) {
      lines.push(`${baseIndent}<${type} ${propsStr}>`);
    } else {
      lines.push(`${baseIndent}<${type} ${propsStr} />`);
    }
  } else {
    // Multi-line props
    lines.push(`${baseIndent}<${type}`);
    for (const prop of propLines) {
      lines.push(`${propIndent}${prop}`);
    }
    if (hasChildren) {
      lines.push(`${baseIndent}>`);
    } else {
      lines.push(`${baseIndent}/>`);
    }
  }

  // Add children
  if (hasChildren) {
    if (textContent) {
      lines.push(`${' '.repeat((depth + 1) * indentSize)}${textContent}`);
    }

    for (const childId of childIds) {
      const child = components[childId];
      if (child) {
        lines.push(generateJSXComponent(child, components, options, depth + 1));
      }
    }

    lines.push(`${baseIndent}</${type}>`);
  }

  return lines.join('\n');
};

export const exportToJSX = (
  components: Record<string, ComponentNode>,
  rootIds: string[],
  options: Partial<ExportOptions> = {}
): string => {
  const opts: ExportOptions = {
    format: options.format || 'tsx',
    includeStyles: options.includeStyles ?? true,
    includeEvents: options.includeEvents ?? true,
    componentName: options.componentName || 'GeneratedComponent',
    prettify: options.prettify ?? true,
    indentSize: options.indentSize || 2,
  };

  const isTypeScript = opts.format === 'tsx';
  const lines: string[] = [];

  // Imports
  lines.push("import React from 'react';");

  // Collect used component types
  const usedTypes = new Set<string>();
  for (const comp of Object.values(components)) {
    usedTypes.add(comp.type);
  }

  // Check for navigation in events
  const hasNavigate = Object.values(components).some((comp) =>
    comp.events.some((e) => e.action === 'navigate')
  );

  if (hasNavigate) {
    lines.push("import { useNavigate } from 'react-router-dom';");
  }

  lines.push('');

  // Component definition
  if (isTypeScript) {
    lines.push(`export const ${opts.componentName}: React.FC = () => {`);
  } else {
    lines.push(`export const ${opts.componentName} = () => {`);
  }

  if (hasNavigate) {
    lines.push('  const navigate = useNavigate();');
    lines.push('');
  }

  lines.push('  return (');

  if (rootIds.length === 0) {
    lines.push('    <></>');
  } else if (rootIds.length === 1) {
    const root = components[rootIds[0]];
    if (root) {
      lines.push(generateJSXComponent(root, components, opts, 2));
    }
  } else {
    lines.push('    <>');
    for (const rootId of rootIds) {
      const root = components[rootId];
      if (root) {
        lines.push(generateJSXComponent(root, components, opts, 3));
      }
    }
    lines.push('    </>');
  }

  lines.push('  );');
  lines.push('};');
  lines.push('');
  lines.push(`export default ${opts.componentName};`);

  return lines.join('\n');
};

// ============================================================================
// JSON Schema Export
// ============================================================================

export const exportToJSON = (
  components: Record<string, ComponentNode>,
  rootIds: string[],
  options: {
    name?: string;
    description?: string;
    canvasWidth?: number;
    canvasHeight?: number;
  } = {}
): StudioSchema => {
  const now = new Date().toISOString();

  const serializedComponents: SerializedComponent[] = Object.values(components).map((comp) => ({
    id: comp.id,
    type: comp.type,
    name: comp.name,
    props: comp.props,
    styles: comp.styles,
    events: comp.events,
    children: comp.children,
    parentId: comp.parentId,
    bounds: comp.bounds,
    isLocked: comp.isLocked,
    isVisible: comp.isVisible,
  }));

  return {
    version: '1.0.0',
    name: options.name || 'Untitled Design',
    description: options.description,
    components: serializedComponents,
    rootIds,
    canvas: {
      width: options.canvasWidth || 1200,
      height: options.canvasHeight || 800,
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
    },
  };
};

export const exportToJSONString = (
  components: Record<string, ComponentNode>,
  rootIds: string[],
  options: Parameters<typeof exportToJSON>[2] = {}
): string => {
  const schema = exportToJSON(components, rootIds, options);
  return JSON.stringify(schema, null, 2);
};

// ============================================================================
// Figma Export
// ============================================================================

const rgbaToFigmaColor = (color: string): { r: number; g: number; b: number; a: number } | null => {
  // Handle hex colors
  const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16) / 255,
      g: parseInt(hexMatch[2], 16) / 255,
      b: parseInt(hexMatch[3], 16) / 255,
      a: hexMatch[4] ? parseInt(hexMatch[4], 16) / 255 : 1,
    };
  }

  // Handle rgb/rgba
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]) / 255,
      g: parseInt(rgbaMatch[2]) / 255,
      b: parseInt(rgbaMatch[3]) / 255,
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }

  return null;
};

const componentToFigmaNode = (
  component: ComponentNode,
  components: Record<string, ComponentNode>
): FigmaNode => {
  const { type, name, bounds, styles, props, children: childIds } = component;
  const baseStyles = styles.base || {};

  const figmaNode: FigmaNode = {
    id: component.id,
    name,
    type: 'FRAME',
    absoluteBoundingBox: {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    },
    children: [],
  };

  // Map component types to Figma node types
  if (type === 'Text' || type === 'Heading') {
    figmaNode.type = 'TEXT';
    figmaNode.characters = (props.children as string) || '';
    figmaNode.style = {
      fontFamily: baseStyles.typography?.fontFamily || 'Inter',
      fontSize: baseStyles.typography?.fontSize || (type === 'Heading' ? 24 : 16),
      fontWeight: baseStyles.typography?.fontWeight || (type === 'Heading' ? 700 : 400),
    };
  } else if (type === 'Image') {
    figmaNode.type = 'RECTANGLE';
    // Would include image fill in real implementation
  }

  // Add fills
  if (baseStyles.backgroundColor) {
    const color = rgbaToFigmaColor(baseStyles.backgroundColor);
    if (color) {
      figmaNode.fills = [{ type: 'SOLID', color }];
    }
  }

  // Add strokes
  if (baseStyles.borderColor && baseStyles.borderWidth) {
    const color = rgbaToFigmaColor(baseStyles.borderColor);
    if (color) {
      figmaNode.strokes = [{ type: 'SOLID', color }];
    }
  }

  // Add corner radius
  if (baseStyles.borderRadius) {
    const radius = typeof baseStyles.borderRadius === 'number'
      ? baseStyles.borderRadius
      : parseInt(String(baseStyles.borderRadius));
    if (!isNaN(radius)) {
      figmaNode.cornerRadius = radius;
    }
  }

  // Add children
  for (const childId of childIds) {
    const child = components[childId];
    if (child) {
      figmaNode.children?.push(componentToFigmaNode(child, components));
    }
  }

  return figmaNode;
};

export const exportToFigma = (
  components: Record<string, ComponentNode>,
  rootIds: string[],
  options: {
    name?: string;
    canvasWidth?: number;
    canvasHeight?: number;
  } = {}
): { document: { children: FigmaNode[] } } => {
  const rootFrame: FigmaNode = {
    id: 'canvas',
    name: options.name || 'Studio Export',
    type: 'FRAME',
    absoluteBoundingBox: {
      x: 0,
      y: 0,
      width: options.canvasWidth || 1200,
      height: options.canvasHeight || 800,
    },
    fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 1 } }],
    children: [],
  };

  for (const rootId of rootIds) {
    const root = components[rootId];
    if (root) {
      rootFrame.children?.push(componentToFigmaNode(root, components));
    }
  }

  return {
    document: {
      children: [rootFrame],
    },
  };
};

export const exportToFigmaJSON = (
  components: Record<string, ComponentNode>,
  rootIds: string[],
  options: Parameters<typeof exportToFigma>[2] = {}
): string => {
  const figmaDoc = exportToFigma(components, rootIds, options);
  return JSON.stringify(figmaDoc, null, 2);
};

// ============================================================================
// Main Export Function
// ============================================================================

export const exportDesign = (
  components: Record<string, ComponentNode>,
  rootIds: string[],
  options: ExportOptions
): string => {
  switch (options.format) {
    case 'jsx':
    case 'tsx':
      return exportToJSX(components, rootIds, options);
    case 'json':
      return exportToJSONString(components, rootIds);
    case 'figma':
      return exportToFigmaJSON(components, rootIds);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
};
