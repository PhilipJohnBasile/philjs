import type { ComponentNode } from '../state/EditorStore.js';
import type { StudioSchema } from './export.js';
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
export declare const validateSchema: (data: unknown) => data is StudioSchema;
export declare const importFromJSON: (jsonString: string, options?: ImportOptions) => ImportResult;
export declare const importFromFigma: (figmaData: unknown, options?: ImportOptions) => ImportResult;
export declare const importFromFigmaJSON: (jsonString: string, options?: ImportOptions) => ImportResult;
export declare const importFromClipboard: (options?: ImportOptions) => Promise<ImportResult>;
export declare const importFromFile: (file: File, options?: ImportOptions) => Promise<ImportResult>;
export type ImportFormat = 'json' | 'figma' | 'auto';
export declare const importDesign: (source: string | File, format?: ImportFormat, options?: ImportOptions) => Promise<ImportResult>;
//# sourceMappingURL=import.d.ts.map