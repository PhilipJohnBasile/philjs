/**
 * Palette components for the visual builder
 */
import type { ComponentDefinition, ComponentCategory } from '../types.js';
export interface PaletteProps {
    components?: ComponentDefinition[];
    categories?: ComponentCategory[];
    onDragStart?: (component: ComponentDefinition) => void;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    collapsedCategories?: Set<string>;
    onCategoryToggle?: (categoryId: string) => void;
}
export interface PaletteItemProps {
    component: ComponentDefinition;
    onDragStart?: (component: ComponentDefinition) => void;
    isDragging?: boolean;
}
export interface PaletteCategoryProps {
    category: ComponentCategory;
    components: ComponentDefinition[];
    isCollapsed?: boolean;
    onToggle?: () => void;
    onDragStart?: (component: ComponentDefinition) => void;
}
export declare const builtInCategories: ComponentCategory[];
export declare const builtInComponents: ComponentDefinition[];
export declare function Palette(_props: PaletteProps): unknown;
export declare function PaletteItem(_props: PaletteItemProps): unknown;
export declare function PaletteCategory(_props: PaletteCategoryProps): unknown;
//# sourceMappingURL=Palette.d.ts.map