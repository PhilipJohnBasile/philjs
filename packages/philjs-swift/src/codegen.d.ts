/**
 * Swift code generation for PhilJS
 */
import type { SwiftProjectConfig, SwiftUIComponent } from './types.js';
/**
 * Generate Swift project structure
 */
export declare function generateSwiftProject(dir: string, config: SwiftProjectConfig): Promise<void>;
/**
 * Generate SwiftUI component from PhilJS component
 */
export declare function generateSwiftUIComponent(component: SwiftUIComponent): string;
//# sourceMappingURL=codegen.d.ts.map