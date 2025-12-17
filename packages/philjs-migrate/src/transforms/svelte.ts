/**
 * PhilJS Migrate - Svelte Transform
 *
 * Converts Svelte code to PhilJS:
 * - let reactive = signal()
 * - $: computed = computed()
 * - $: effect statements = effect()
 * - onMount() = onMount()
 * - onDestroy() = onCleanup()
 * - Svelte template → JSX
 */

import type { MigrationWarning, ManualReviewItem } from '../migrate';

export interface TransformResult {
  code: string;
  transformed: boolean;
  warnings: Omit<MigrationWarning, 'file'>[];
  manualReview: Omit<ManualReviewItem, 'file'>[];
}

export class SvelteTransform {
  async transform(code: string, filename: string): Promise<TransformResult> {
    const result: TransformResult = {
      code,
      transformed: false,
      warnings: [],
      manualReview: [],
    };

    if (!filename.endsWith('.svelte')) {
      return result;
    }

    return this.transformSvelteComponent(code, result);
  }

  private async transformSvelteComponent(code: string, result: TransformResult): Promise<TransformResult> {
    // Extract script and template
    const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/);

    // Everything not in script or style is template
    let template = code
      .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
      .trim();

    const script = scriptMatch?.[1] || '';
    const style = styleMatch?.[1];

    // Extract component name from filename or use default
    const componentName = 'Component';

    // Transform script
    const transformedScript = this.transformScript(script, result);

    // Transform template to JSX
    const jsx = this.templateToJSX(template, result);

    // Extract props
    const props = this.extractProps(script);

    // Generate PhilJS component
    result.code = `/**
 * Converted from Svelte
 */

import { JSX, signal, computed, effect, onMount, onCleanup } from 'philjs-core';

${props.propsInterface}

export function ${componentName}(${props.propsParam}) {
${transformedScript}

  return (
    ${jsx}
  );
}

${style ? `/* Styles - consider using CSS modules or Tailwind */\n/*\n${style}\n*/` : ''}
`;

    result.transformed = true;

    result.warnings.push({
      message: 'Svelte component converted. Review JSX and signal usage.',
    });

    return result;
  }

  private transformScript(script: string, result: TransformResult): string {
    let transformed = script;

    // Remove Svelte imports
    transformed = transformed.replace(
      /import\s+\{[^}]*\}\s+from\s+['"]svelte['"]\s*;?\n?/g,
      ''
    );

    // Transform reactive declarations (let x = value)
    // In Svelte, top-level let declarations are reactive
    transformed = transformed.replace(
      /let\s+(\w+)\s*=\s*([^;]+);/g,
      (match, name, value) => {
        // Skip if it's a destructuring or complex pattern
        if (value.includes('{') || value.includes('[')) {
          result.manualReview.push({
            line: 0,
            type: 'complex-reactive',
            description: 'Complex reactive declaration needs manual review',
            originalCode: match,
          });
          return match;
        }
        return `const ${name} = signal(${value.trim()});`;
      }
    );

    // Transform $: computed values
    transformed = transformed.replace(
      /\$:\s*(\w+)\s*=\s*([^;]+);/g,
      (match, name, expression) => {
        // Check if it's a computed (has dependencies) or effect (side effect)
        if (this.isComputed(expression)) {
          return `const ${name} = computed(() => ${expression.trim()});`;
        }
        return `effect(() => {\n    ${expression.trim()};\n  });`;
      }
    );

    // Transform $: statements (reactive statements / effects)
    transformed = transformed.replace(
      /\$:\s*([^;]+);/g,
      (match, statement) => {
        return `effect(() => {\n    ${statement.trim()};\n  });`;
      }
    );

    // Transform $: blocks
    transformed = transformed.replace(
      /\$:\s*\{([\s\S]*?)\}/g,
      (match, body) => {
        return `effect(() => {\n${body}\n  });`;
      }
    );

    // Transform lifecycle
    transformed = transformed.replace(/onMount/g, 'onMount');
    transformed = transformed.replace(/onDestroy/g, 'onCleanup');
    transformed = transformed.replace(/beforeUpdate/g, '/* beforeUpdate - use effect */');
    transformed = transformed.replace(/afterUpdate/g, '/* afterUpdate - use effect */');

    // Indent the script content
    transformed = transformed
      .split('\n')
      .map(line => line ? `  ${line}` : '')
      .join('\n');

    return transformed;
  }

  private isComputed(expression: string): boolean {
    // Simple heuristic: if it's an assignment or has side effects, it's an effect
    // If it's just reading values and computing, it's computed
    const sideEffectPatterns = [
      /console\./,
      /fetch\(/,
      /\.push\(/,
      /\.pop\(/,
      /\.splice\(/,
      /\.set\(/,
    ];

    return !sideEffectPatterns.some(pattern => pattern.test(expression));
  }

  private extractProps(script: string): { propsInterface: string; propsParam: string } {
    // Look for export let declarations (Svelte props)
    const propMatches = script.matchAll(/export\s+let\s+(\w+)(?:\s*:\s*([^=;]+))?(?:\s*=\s*([^;]+))?/g);

    const props: { name: string; type?: string; defaultValue?: string }[] = [];

    for (const match of propMatches) {
      props.push({
        name: match[1],
        type: match[2]?.trim(),
        defaultValue: match[3]?.trim(),
      });
    }

    if (props.length === 0) {
      return { propsInterface: '', propsParam: '' };
    }

    const propsInterface = `interface Props {
${props.map(p => `  ${p.name}${p.defaultValue ? '?' : ''}: ${p.type || 'any'};`).join('\n')}
}`;

    const propsParam = `props: Props`;

    return { propsInterface, propsParam };
  }

  private templateToJSX(template: string, result: TransformResult): string {
    let jsx = template.trim();

    // Svelte {#if} {/if} → {condition && ()}
    jsx = jsx.replace(/\{#if\s+([^}]+)\}/g, '{$1 && (');
    jsx = jsx.replace(/\{:else\s+if\s+([^}]+)\}/g, ') || ($1 && (');
    jsx = jsx.replace(/\{:else\}/g, ') || (');
    jsx = jsx.replace(/\{\/if\}/g, ')}');

    // Svelte {#each} {/each} → {array.map()}
    jsx = jsx.replace(
      /\{#each\s+(\w+)\s+as\s+(\w+)(?:,\s*(\w+))?\s*(?:\(([^)]+)\))?\}/g,
      (match, array, item, index, key) => {
        const keyProp = key ? ` key={${key}}` : '';
        return `{${array}.map((${item}${index ? `, ${index}` : ''}) => (`;
      }
    );
    jsx = jsx.replace(/\{\/each\}/g, '))}');

    // Svelte {#await} - add manual review
    if (jsx.includes('{#await')) {
      result.manualReview.push({
        line: 0,
        type: 'await-block',
        description: 'Svelte {#await} block needs manual conversion to Suspense or signal-based async',
        originalCode: jsx.match(/\{#await[\s\S]*?\{\/await\}/)?.[0] || '',
      });
    }

    // Svelte bind:value → value + onChange
    jsx = jsx.replace(
      /bind:value=\{(\w+)\}/g,
      'value={$1.get()} onInput={(e) => $1.set(e.target.value)}'
    );

    // Svelte bind:checked → checked + onChange
    jsx = jsx.replace(
      /bind:checked=\{(\w+)\}/g,
      'checked={$1.get()} onChange={(e) => $1.set(e.target.checked)}'
    );

    // Svelte on:event → onEvent
    jsx = jsx.replace(/on:(\w+)=/g, (match, event) => {
      return `on${event.charAt(0).toUpperCase() + event.slice(1)}=`;
    });

    // Svelte class:name → conditional className
    jsx = jsx.replace(
      /class:(\w+)=\{([^}]+)\}/g,
      (match, className, condition) => {
        result.warnings.push({
          message: `class:${className} converted. Review className logic.`,
        });
        return `className={${condition} ? '${className}' : ''}`;
      }
    );

    // {} interpolation - needs .get() for signals
    // This is tricky - we can't know which variables are signals
    result.warnings.push({
      message: 'Remember to add .get() when reading signal values in JSX.',
    });

    // class → className
    jsx = jsx.replace(/\bclass=/g, 'className=');

    result.manualReview.push({
      line: 1,
      type: 'template-conversion',
      description: 'Svelte template converted to JSX. Review for correctness.',
      originalCode: template.substring(0, 200) + '...',
      suggestedCode: jsx.substring(0, 200) + '...',
    });

    return jsx;
  }
}
