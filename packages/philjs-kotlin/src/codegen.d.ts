/**
 * Kotlin code generation for PhilJS
 */
import type { KotlinProjectConfig, ComposeComponent } from './types.js';
/**
 * Generate Kotlin project structure
 */
export declare function generateKotlinProject(dir: string, config: KotlinProjectConfig): Promise<void>;
/**
 * Generate Compose component from PhilJS component
 */
export declare function generateComposeComponent(component: ComposeComponent): string;
//# sourceMappingURL=codegen.d.ts.map