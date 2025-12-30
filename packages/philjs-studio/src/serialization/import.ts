import type {
  ComponentNode,
  ComponentStyle,
  ResponsiveStyles,
  EventHandler,
  Bounds,
  TypographyStyle,
} from '../state/EditorStore.js';
import type { StudioSchema, SerializedComponent, FigmaNode } from './export.js';

// ============================================================================
// Types
// ============================================================================

export interface ImportOptions {
  preserveIds?: boolean;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
}

export interface ImportResult {
  components: Record<string, ComponentNode>;
  rootIds: string[];
  errors?: string[];
}

// ============================================================================
// Utility Functions
// ============================================================================

const generateId = (): string => {
  return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const remapIds = (
  components: SerializedComponent[],
  preserveIds: boolean
): { mapped: SerializedComponent[]; idMap: Map<string, string> } => {
  const idMap = new Map<string, string>();

  if (preserveIds) {
    for (const comp of components) {
      idMap.set(comp.id, comp.id);
    }
    return { mapped: components, idMap };
  }

  // Generate new IDs
  for (const comp of components) {
    idMap.set(comp.id, generateId());
  }

  // Remap component references
  const mapped = components.map((comp) => ({
    ...comp,
    id: idMap.get(comp.id) || comp.id,
    parentId: comp.parentId ? idMap.get(comp.parentId) || comp.parentId : null,
    children: comp.children.map((childId: string) => idMap.get(childId) || childId),
  }));

  return { mapped, idMap };
};

const applyTransform = (
  bounds: Bounds,
  options: ImportOptions
): Bounds => {
  const scale = options.scale || 1;
  const offsetX = options.offsetX || 0;
  const offsetY = options.offsetY || 0;

  return {
    x: bounds.x * scale + offsetX,
    y: bounds.y * scale + offsetY,
    width: bounds.width * scale,
    height: bounds.height * scale,
  };
};

// ============================================================================
// JSON Import
// ============================================================================

export const validateSchema = (data: unknown): data is StudioSchema => {
  if (!data || typeof data !== 'object') return false;

  const schema = data as Record<string, unknown>;

  if (typeof schema['version'] !== 'string') return false;
  if (!Array.isArray(schema['components'])) return false;
  if (!Array.isArray(schema['rootIds'])) return false;

  // Validate each component
  for (const comp of schema['components']) {
    if (!comp || typeof comp !== 'object') return false;
    const c = comp as Record<string, unknown>;
    if (typeof c['id'] !== 'string') return false;
    if (typeof c['type'] !== 'string') return false;
    if (typeof c['name'] !== 'string') return false;
    if (!Array.isArray(c['children'])) return false;
    if (!c['bounds'] || typeof c['bounds'] !== 'object') return false;
  }

  return true;
};

export const importFromJSON = (
  jsonString: string,
  options: ImportOptions = {}
): ImportResult => {
  const errors: string[] = [];

  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch (e) {
    return {
      components: {},
      rootIds: [],
      errors: ['Invalid JSON format'],
    };
  }

  if (!validateSchema(data)) {
    return {
      components: {},
      rootIds: [],
      errors: ['Invalid schema format'],
    };
  }

  const { mapped, idMap } = remapIds(data.components, options.preserveIds || false);

  const components: Record<string, ComponentNode> = {};

  for (const comp of mapped) {
    const transformedBounds = applyTransform(comp.bounds, options);

    components[comp.id] = {
      id: comp.id,
      type: comp.type,
      name: comp.name,
      props: comp.props || {},
      styles: comp.styles || { base: {} },
      events: (comp.events || []) as EventHandler[],
      children: comp.children,
      parentId: comp.parentId,
      isLocked: comp.isLocked || false,
      isVisible: comp.isVisible !== false,
      bounds: transformedBounds,
    };
  }

  const rootIds = data.rootIds.map((id: string) => idMap.get(id) || id);

  return {
    components,
    rootIds,
    ...(errors.length > 0 && { errors }),
  };
};

// ============================================================================
// Figma Import
// ============================================================================

interface FigmaImportContext {
  components: Record<string, ComponentNode>;
  errors: string[];
  idMap: Map<string, string>;
}

const figmaColorToHex = (color: { r: number; g: number; b: number; a?: number }): string => {
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');

  if (color.a !== undefined && color.a < 1) {
    const a = Math.round(color.a * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}${a}`;
  }

  return `#${r}${g}${b}`;
};

const inferComponentType = (node: FigmaNode): string => {
  // Map Figma node types to component types
  switch (node.type) {
    case 'TEXT':
      return 'Text';
    case 'RECTANGLE':
      return 'Container';
    case 'ELLIPSE':
      return 'Container';
    case 'FRAME':
    case 'GROUP':
    case 'COMPONENT':
    case 'INSTANCE':
      // Try to infer from name
      const nameLower = node.name.toLowerCase();
      if (nameLower.includes('button')) return 'Button';
      if (nameLower.includes('input') || nameLower.includes('text field')) return 'Input';
      if (nameLower.includes('card')) return 'Card';
      if (nameLower.includes('image') || nameLower.includes('photo')) return 'Image';
      if (nameLower.includes('heading') || nameLower.includes('title')) return 'Heading';
      return 'Container';
    default:
      return 'Container';
  }
};

const extractStyles = (node: FigmaNode): ComponentStyle => {
  const styles: ComponentStyle = {};

  // Extract fills (background)
  if (node.fills && node.fills.length > 0) {
    const fill = node.fills[0]!;
    if (fill.type === 'SOLID' && fill.color) {
      styles.backgroundColor = figmaColorToHex(fill.color);
    }
  }

  // Extract strokes (border)
  if (node.strokes && node.strokes.length > 0) {
    const stroke = node.strokes[0]!;
    if (stroke.type === 'SOLID' && stroke.color) {
      styles.borderColor = figmaColorToHex(stroke.color);
      styles.borderWidth = 1;
      styles.borderStyle = 'solid';
    }
  }

  // Extract corner radius
  if (node.cornerRadius !== undefined) {
    styles.borderRadius = node.cornerRadius;
  }

  // Extract effects (shadows)
  if (node.effects && node.effects.length > 0) {
    const shadowEffects = node.effects.filter(
      (e: { type: string; offset?: { x: number; y: number }; radius?: number; color?: { r: number; g: number; b: number; a?: number } }) => e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW'
    );
    if (shadowEffects.length > 0) {
      const shadow = shadowEffects[0]!;
      if (shadow.offset && shadow.radius !== undefined && shadow.color) {
        const color = figmaColorToHex(shadow.color);
        const isInner = shadow.type === 'INNER_SHADOW' ? 'inset ' : '';
        styles.boxShadow = `${isInner}${shadow.offset.x}px ${shadow.offset.y}px ${shadow.radius}px ${color}`;
      }
    }
  }

  // Extract typography for text nodes
  if (node.type === 'TEXT' && node.style) {
    const typography: TypographyStyle = {};
    const fontFamily = node.style['fontFamily'];
    const fontSize = node.style['fontSize'];
    const fontWeight = node.style['fontWeight'];
    if (typeof fontFamily === 'string') typography.fontFamily = fontFamily;
    if (typeof fontSize === 'number') typography.fontSize = fontSize;
    if (typeof fontWeight === 'number') typography.fontWeight = fontWeight;
    styles.typography = typography;
  }

  return styles;
};

const processFigmaNode = (
  node: FigmaNode,
  parentId: string | null,
  context: FigmaImportContext,
  options: ImportOptions
): string => {
  const id = generateId();
  context.idMap.set(node.id, id);

  const type = inferComponentType(node);
  const styles = extractStyles(node);

  const bounds: Bounds = applyTransform(
    {
      x: node.absoluteBoundingBox.x,
      y: node.absoluteBoundingBox.y,
      width: node.absoluteBoundingBox.width,
      height: node.absoluteBoundingBox.height,
    },
    options
  );

  const props: Record<string, unknown> = {};

  // Extract text content
  if (node.type === 'TEXT' && node.characters) {
    props['children'] = node.characters;
  }

  // Process children
  const childIds: string[] = [];
  if (node.children) {
    for (const child of node.children) {
      const childId = processFigmaNode(child, id, context, options);
      childIds.push(childId);
    }
  }

  const component: ComponentNode = {
    id,
    type,
    name: node.name || type,
    props,
    styles: { base: styles },
    events: [],
    children: childIds,
    parentId,
    isLocked: false,
    isVisible: true,
    bounds,
  };

  context.components[id] = component;
  return id;
};

export const importFromFigma = (
  figmaData: unknown,
  options: ImportOptions = {}
): ImportResult => {
  const context: FigmaImportContext = {
    components: {},
    errors: [],
    idMap: new Map(),
  };

  if (!figmaData || typeof figmaData !== 'object') {
    return {
      components: {},
      rootIds: [],
      errors: ['Invalid Figma data format'],
    };
  }

  const data = figmaData as { document?: { children?: FigmaNode[] } };

  if (!data.document?.children) {
    return {
      components: {},
      rootIds: [],
      errors: ['No Figma document found'],
    };
  }

  const rootIds: string[] = [];

  for (const node of data.document.children) {
    try {
      const id = processFigmaNode(node, null, context, options);
      rootIds.push(id);
    } catch (e) {
      context.errors.push(`Failed to import node: ${node.name || 'unknown'}`);
    }
  }

  return {
    components: context.components,
    rootIds,
    ...(context.errors.length > 0 && { errors: context.errors }),
  };
};

export const importFromFigmaJSON = (
  jsonString: string,
  options: ImportOptions = {}
): ImportResult => {
  try {
    const data = JSON.parse(jsonString);
    return importFromFigma(data, options);
  } catch (e) {
    return {
      components: {},
      rootIds: [],
      errors: ['Invalid JSON format'],
    };
  }
};

// ============================================================================
// Clipboard Import
// ============================================================================

export const importFromClipboard = async (
  options: ImportOptions = {}
): Promise<ImportResult> => {
  try {
    const text = await navigator.clipboard.readText();

    // Try JSON first
    if (text.trim().startsWith('{')) {
      try {
        const data = JSON.parse(text);

        // Check if it's our schema
        if (data.version && data.components) {
          return importFromJSON(text, options);
        }

        // Check if it's Figma format
        if (data.document?.children) {
          return importFromFigma(data, options);
        }
      } catch {
        // Not valid JSON
      }
    }

    return {
      components: {},
      rootIds: [],
      errors: ['Clipboard does not contain valid design data'],
    };
  } catch (e) {
    return {
      components: {},
      rootIds: [],
      errors: ['Failed to read from clipboard'],
    };
  }
};

// ============================================================================
// File Import
// ============================================================================

export const importFromFile = (
  file: File,
  options: ImportOptions = {}
): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;

      if (!content) {
        resolve({
          components: {},
          rootIds: [],
          errors: ['Failed to read file'],
        });
        return;
      }

      // Determine format from file extension or content
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'json' || content.trim().startsWith('{')) {
        try {
          const data = JSON.parse(content);

          // Check if it's our schema
          if (data.version && data.components) {
            resolve(importFromJSON(content, options));
            return;
          }

          // Check if it's Figma format
          if (data.document?.children) {
            resolve(importFromFigma(data, options));
            return;
          }

          resolve({
            components: {},
            rootIds: [],
            errors: ['Unknown JSON format'],
          });
        } catch {
          resolve({
            components: {},
            rootIds: [],
            errors: ['Invalid JSON format'],
          });
        }
      } else {
        resolve({
          components: {},
          rootIds: [],
          errors: ['Unsupported file format'],
        });
      }
    };

    reader.onerror = () => {
      resolve({
        components: {},
        rootIds: [],
        errors: ['Failed to read file'],
      });
    };

    reader.readAsText(file);
  });
};

// ============================================================================
// Main Import Function
// ============================================================================

export type ImportFormat = 'json' | 'figma' | 'auto';

export const importDesign = async (
  source: string | File,
  format: ImportFormat = 'auto',
  options: ImportOptions = {}
): Promise<ImportResult> => {
  if (source instanceof File) {
    return importFromFile(source, options);
  }

  // String content
  if (format === 'auto') {
    try {
      const data = JSON.parse(source);

      if (data.version && data.components) {
        return importFromJSON(source, options);
      }

      if (data.document?.children) {
        return importFromFigma(data, options);
      }
    } catch {
      // Not valid JSON
    }

    return {
      components: {},
      rootIds: [],
      errors: ['Could not determine import format'],
    };
  }

  if (format === 'json') {
    return importFromJSON(source, options);
  }

  if (format === 'figma') {
    return importFromFigmaJSON(source, options);
  }

  return {
    components: {},
    rootIds: [],
    errors: [`Unsupported format: ${format}`],
  };
};
