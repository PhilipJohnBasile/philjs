/**
 * PhilJS Migrate - Vue Transform
 *
 * Converts Vue 3 Composition API code to PhilJS:
 * - ref() → signal()
 * - reactive() → signal() with object
 * - computed() → computed()
 * - watch() → effect()
 * - watchEffect() → effect()
 * - onMounted() → onMount()
 * - onUnmounted() → onCleanup()
 * - Template syntax → JSX
 */

import type { MigrationWarning, ManualReviewItem } from '../migrate';

export interface TransformResult {
  code: string;
  transformed: boolean;
  warnings: Omit<MigrationWarning, 'file'>[];
  manualReview: Omit<ManualReviewItem, 'file'>[];
}

export class VueTransform {
  async transform(code: string, filename: string): Promise<TransformResult> {
    const result: TransformResult = {
      code,
      transformed: false,
      warnings: [],
      manualReview: [],
    };

    // Handle .vue files
    if (filename.endsWith('.vue')) {
      return this.transformVueSFC(code, result);
    }

    // Handle composition API in .ts/.js files
    if (this.isVueFile(code)) {
      return this.transformCompositionAPI(code, result);
    }

    return result;
  }

  private isVueFile(code: string): boolean {
    return code.includes('vue') || code.includes('@vue');
  }

  private async transformVueSFC(code: string, result: TransformResult): Promise<TransformResult> {
    // Extract script, template, and style sections
    const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/);
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/);

    if (!scriptMatch || !templateMatch) {
      result.manualReview.push({
        line: 1,
        type: 'vue-sfc',
        description: 'Vue SFC structure not detected. Manual conversion needed.',
        originalCode: code.substring(0, 200) + '...',
      });
      return result;
    }

    const script = scriptMatch[1];
    const template = templateMatch[1];
    const style = styleMatch?.[1];

    // Transform script section
    let transformedScript = this.transformVueScript(script, result);

    // Transform template to JSX
    const jsx = this.templateToJSX(template, result);

    // Generate PhilJS component
    const componentName = this.extractComponentName(script) || 'Component';

    result.code = `/**
 * Converted from Vue SFC
 */

import { JSX, signal, computed, effect, onMount, onCleanup } from 'philjs-core';

${transformedScript}

export function ${componentName}() {
  ${this.extractSetupBody(script, result)}

  return (
    ${jsx}
  );
}

${style ? `/* Styles - consider using CSS modules or Tailwind */\n/*\n${style}\n*/` : ''}
`;

    result.transformed = true;

    result.warnings.push({
      message: 'Vue SFC converted. Review JSX output and signal usage.',
    });

    return result;
  }

  private transformCompositionAPI(code: string, result: TransformResult): Promise<TransformResult> {
    let transformed = code;

    // Transform imports
    transformed = this.transformImports(transformed, result);

    // Transform ref
    transformed = transformed.replace(
      /const\s+(\w+)\s*=\s*ref(?:<[^>]+>)?\(([^)]*)\)/g,
      (match, name, initialValue) => {
        result.warnings.push({
          message: `ref '${name}' converted to signal. Use .get() and .set() instead of .value`,
        });
        return `const ${name} = signal(${initialValue})`;
      }
    );

    // Transform reactive
    transformed = transformed.replace(
      /const\s+(\w+)\s*=\s*reactive(?:<[^>]+>)?\(([^)]*)\)/g,
      (match, name, initialValue) => {
        result.warnings.push({
          message: `reactive '${name}' converted to signal. Access with .get()`,
        });
        return `const ${name} = signal(${initialValue})`;
      }
    );

    // Transform computed
    transformed = transformed.replace(
      /const\s+(\w+)\s*=\s*computed\(\s*\(\)\s*=>\s*([^)]+)\)/g,
      'const $1 = computed(() => $2)'
    );

    // Transform watch to effect
    transformed = transformed.replace(
      /watch\(\s*(\w+),\s*\(([^)]*)\)\s*=>\s*\{([\s\S]*?)\}\s*\)/g,
      (match, watched, params, body) => {
        result.warnings.push({
          message: 'watch converted to effect. PhilJS auto-tracks dependencies.',
        });
        return `effect(() => {\n  const ${params.split(',')[0]?.trim() || '_'} = ${watched}.get();\n${body}\n})`;
      }
    );

    // Transform watchEffect
    transformed = transformed.replace(/watchEffect/g, 'effect');

    // Transform lifecycle hooks
    transformed = transformed.replace(/onMounted/g, 'onMount');
    transformed = transformed.replace(/onUnmounted/g, 'onCleanup');
    transformed = transformed.replace(/onBeforeMount/g, '/* onBeforeMount - use onMount */\n// ');
    transformed = transformed.replace(/onBeforeUnmount/g, 'onCleanup');

    result.code = transformed;
    result.transformed = transformed !== code;

    return Promise.resolve(result);
  }

  private transformImports(code: string, result: TransformResult): string {
    return code.replace(
      /import\s+\{([^}]+)\}\s+from\s+['"]vue['"]/g,
      (match, imports) => {
        const philjsImports = new Set<string>(['JSX']);

        const mapping: Record<string, string> = {
          ref: 'signal',
          reactive: 'signal',
          computed: 'computed',
          watch: 'effect',
          watchEffect: 'effect',
          onMounted: 'onMount',
          onUnmounted: 'onCleanup',
          onBeforeMount: '',
          onBeforeUnmount: 'onCleanup',
          defineComponent: '',
          defineProps: '',
          defineEmits: '',
        };

        const importList = imports.split(',').map((s: string) => s.trim());
        for (const imp of importList) {
          const mapped = mapping[imp];
          if (mapped) {
            philjsImports.add(mapped);
          }
        }

        return `import { ${[...philjsImports].join(', ')} } from 'philjs-core'`;
      }
    );
  }

  private transformVueScript(script: string, result: TransformResult): string {
    // Remove setup() wrapper, keep content
    let transformed = script.replace(
      /export\s+default\s+defineComponent\(\{[\s\S]*?setup\(\)\s*\{([\s\S]*?)\s*return\s*\{[\s\S]*?\}[\s\S]*?\}\s*\}\)/,
      '$1'
    );

    // Transform Vue composition API
    transformed = this.transformImports(transformed, result);

    return transformed;
  }

  private extractSetupBody(script: string, result: TransformResult): string {
    const match = script.match(/setup\(\)\s*\{([\s\S]*?)return\s*\{/);
    if (match) {
      return match[1].trim();
    }
    return '';
  }

  private extractComponentName(script: string): string | null {
    const match = script.match(/name:\s*['"](\w+)['"]/);
    return match ? match[1] : null;
  }

  private templateToJSX(template: string, result: TransformResult): string {
    let jsx = template.trim();

    // Vue directives to JSX
    jsx = jsx.replace(/v-if="([^"]+)"/g, '{$1 && (');
    jsx = jsx.replace(/v-else/g, ')}'); // Simplified

    jsx = jsx.replace(/v-for="(\w+)\s+in\s+(\w+)"/g, '{$2.map(($1) => (');
    jsx = jsx.replace(/:key="(\w+)"/g, 'key={$1}');

    jsx = jsx.replace(/v-model="(\w+)"/g, 'value={$1.get()} onInput={(e) => $1.set(e.target.value)}');

    jsx = jsx.replace(/v-on:(\w+)="([^"]+)"/g, 'on$1={$2}');
    jsx = jsx.replace(/@(\w+)="([^"]+)"/g, 'on$1={$2}');

    jsx = jsx.replace(/:(\w+)="([^"]+)"/g, '$1={$2}');
    jsx = jsx.replace(/v-bind:(\w+)="([^"]+)"/g, '$1={$2}');

    // {{ }} interpolation to {}
    jsx = jsx.replace(/\{\{\s*([^}]+)\s*\}\}/g, '{$1}');

    // class → className
    jsx = jsx.replace(/\bclass=/g, 'className=');

    result.manualReview.push({
      line: 1,
      type: 'template-conversion',
      description: 'Vue template converted to JSX. Review for correctness.',
      originalCode: template.substring(0, 200) + '...',
      suggestedCode: jsx.substring(0, 200) + '...',
    });

    return jsx;
  }
}
