/**
 * PhilJS Tailwind Preset
 *
 * Default design tokens and configurations for PhilJS applications.
 */
import type { Config } from 'tailwindcss';
export interface PhilJSPresetOptions {
    /** Base font family */
    fontFamily?: string;
    /** Primary color palette */
    primaryColor?: string;
    /** Enable dark mode colors */
    darkMode?: boolean;
    /** Custom color palette */
    colors?: Record<string, string | Record<string, string>>;
    /** Border radius scale */
    borderRadius?: 'sharp' | 'rounded' | 'pill';
    /** Spacing scale multiplier */
    spacingScale?: number;
}
export declare function philjsPreset(options?: PhilJSPresetOptions): Partial<Config>;
export declare function createPhilJSPreset(options?: PhilJSPresetOptions): Partial<Config>;
export default philjsPreset;
//# sourceMappingURL=preset.d.ts.map