/**
 * PhilJS Migrate - Angular Transform
 *
 * Converts Angular code to PhilJS, handling:
 * - Angular signals → PhilJS signals
 * - @Component → function component
 * - Services → Context
 * - NgRx → signals
 * - Angular Router → philjs-router
 * - RxJS patterns → signals/effects
 */

import type { MigrationWarning, ManualReviewItem } from '../migrate.js';

export interface TransformResult {
  code: string;
  transformed: boolean;
  warnings: Omit<MigrationWarning, 'file'>[];
  manualReview: Omit<ManualReviewItem, 'file'>[];
}

export class AngularTransform {
  async transform(code: string, filename: string): Promise<TransformResult> {
    const result: TransformResult = {
      code,
      transformed: false,
      warnings: [],
      manualReview: [],
    };

    if (!this.isAngularFile(code)) {
      return result;
    }

    let transformedCode = code;

    // Transform imports
    transformedCode = this.transformImports(transformedCode, result);

    // Transform Angular signals (v17+)
    transformedCode = this.transformAngularSignals(transformedCode, result);

    // Transform component decorator
    transformedCode = this.transformComponent(transformedCode, result);

    // Transform dependency injection
    transformedCode = this.transformDependencyInjection(transformedCode, result);

    // Transform RxJS patterns
    transformedCode = this.transformRxJS(transformedCode, result);

    // Transform lifecycle hooks
    transformedCode = this.transformLifecycle(transformedCode, result);

    // Transform template syntax markers
    transformedCode = this.transformTemplateSyntax(transformedCode, result);

    result.code = transformedCode;
    result.transformed = transformedCode !== code;

    return result;
  }

  private isAngularFile(code: string): boolean {
    return code.includes('@angular') || code.includes('@Component') || code.includes('@Injectable');
  }

  private transformImports(code: string, result: TransformResult): string {
    let transformed = code;

    // Transform @angular/core imports
    transformed = transformed.replace(
      /import\s+\{([^}]+)\}\s+from\s+['"]@angular\/core['"]/g,
      (match, imports) => {
        const philjsImports = new Set<string>(['JSX']);

        const mapping: Record<string, string> = {
          signal: 'signal',
          computed: 'memo',
          effect: 'effect',
          Injectable: '',
          Component: '',
          Input: '',
          Output: '',
          EventEmitter: '',
          OnInit: '',
          OnDestroy: '',
          AfterViewInit: '',
          inject: 'useContext',
          ViewChild: '',
          ElementRef: '',
          ChangeDetectionStrategy: '',
        };

        const importList = imports.split(',').map((s: string) => s.trim());
        for (const imp of importList) {
          const cleanImp = imp.split(' as ')[0].trim();
          const mapped = mapping[cleanImp];
          if (mapped) {
            philjsImports.add(mapped);
          }
        }

        if (philjsImports.size === 1 && philjsImports.has('JSX')) {
          return `import { signal, memo, effect, onMount, onCleanup, createContext, useContext, JSX } from '@philjs/core'`;
        }

        return `import { ${[...philjsImports].join(', ')} } from '@philjs/core'`;
      }
    );

    // Transform @angular/router imports
    transformed = transformed.replace(
      /import\s+\{([^}]+)\}\s+from\s+['"]@angular\/router['"]/g,
      (match, imports) => {
        result.warnings.push({
          message: 'Angular Router imports converted to philjs-router',
        });
        return `import { useRouter, useRoute, Link, navigate } from 'philjs-router'`;
      }
    );

    // Transform @ngrx imports
    transformed = transformed.replace(
      /import\s+\{([^}]+)\}\s+from\s+['"]@ngrx\/store['"]/g,
      (match, imports) => {
        result.manualReview.push({
          line: this.getLineNumber(code, match),
          type: 'ngrx-store',
          description: 'NgRx store should be migrated to PhilJS signals. See migration guide.',
          originalCode: match,
          suggestedCode: `import { signal, memo, createContext } from '@philjs/core'`,
        });
        return `// NgRx replaced with signals - see migration guide\nimport { signal, memo, createContext } from '@philjs/core'`;
      }
    );

    // Transform RxJS imports
    if (code.includes('from \'rxjs\'') || code.includes('from "rxjs"')) {
      result.manualReview.push({
        line: 1,
        type: 'rxjs',
        description: 'RxJS patterns should be replaced with signals and effects. Complex streams may need manual migration.',
        originalCode: 'RxJS imports',
      });
    }

    return transformed;
  }

  private transformAngularSignals(code: string, result: TransformResult): string {
    let transformed = code;

    // Angular 17+ signal() → PhilJS signal()
    // The API is similar, but Angular uses .set() and .update() while PhilJS uses .set() with callback support
    transformed = transformed.replace(
      /(\w+)\s*=\s*signal\(([^)]+)\)/g,
      (match, name, initialValue) => {
        result.warnings.push({
          message: `Angular signal '${name}' converted. API is similar - use .get() to read, .set() to write.`,
        });
        return `${name} = signal(${initialValue})`;
      }
    );

    // Angular computed() → PhilJS memo()
    transformed = transformed.replace(
      /(\w+)\s*=\s*computed\(\s*\(\)\s*=>\s*([^)]+)\)/g,
      (match, name, expression) => {
        result.warnings.push({
          message: `Angular computed '${name}' converted to memo(). Use () to call instead of just the name.`,
        });
        return `${name} = memo(() => ${expression})`;
      }
    );

    // Angular effect() → PhilJS effect()
    // Note: Angular effects have different cleanup patterns
    transformed = transformed.replace(
      /effect\(\s*\(\)\s*=>\s*\{/g,
      (match) => {
        result.warnings.push({
          message: 'Angular effect converted. Return a cleanup function if needed.',
        });
        return 'effect(() => {';
      }
    );

    return transformed;
  }

  private transformComponent(code: string, result: TransformResult): string {
    let transformed = code;

    // Extract component metadata
    const componentMatch = code.match(/@Component\(\{([\s\S]*?)\}\)\s*export\s+class\s+(\w+)/);

    if (componentMatch) {
      const metadata = componentMatch[1] ?? '';
      const className = componentMatch[2] ?? 'Component';

      // Extract selector, template, styles
      const selectorMatch = metadata.match(/selector:\s*['"]([^'"]+)['"]/);
      const templateMatch = metadata.match(/template:\s*`([\s\S]*?)`/);
      const templateUrlMatch = metadata.match(/templateUrl:\s*['"]([^'"]+)['"]/);

      result.manualReview.push({
        line: this.getLineNumber(code, componentMatch[0]),
        type: 'component',
        description: `Angular component '${className}' needs to be converted to a function component. Template needs JSX conversion.`,
        originalCode: componentMatch[0].substring(0, 200),
        suggestedCode: `export function ${className}(props) {\n  // Move class properties here as signals\n  // Convert template to JSX return\n}`,
      });

      // Convert class to function component
      transformed = transformed.replace(
        /@Component\(\{[\s\S]*?\}\)\s*export\s+class\s+(\w+)[^{]*\{/,
        (match, name) => {
          return `// Converted from Angular @Component\nexport function ${name}(props: { [key: string]: any }) {`;
        }
      );

      if (templateUrlMatch) {
        result.warnings.push({
          message: `External template '${templateUrlMatch[1]}' needs to be inlined as JSX.`,
        });
      }
    }

    return transformed;
  }

  private transformDependencyInjection(code: string, result: TransformResult): string {
    let transformed = code;

    // inject() → useContext()
    transformed = transformed.replace(
      /private\s+readonly\s+(\w+)\s*=\s*inject\((\w+)\)/g,
      (match, varName, serviceName) => {
        result.manualReview.push({
          line: this.getLineNumber(code, match),
          type: 'inject',
          description: `Dependency injection of '${serviceName}' converted to useContext. Create a context for the service.`,
          originalCode: match,
          suggestedCode: `const ${varName} = useContext(${serviceName}Context)`,
        });
        return `const ${varName} = useContext(${serviceName}Context)`;
      }
    );

    // Constructor injection
    transformed = transformed.replace(
      /constructor\s*\(\s*private\s+(\w+):\s*(\w+)\s*\)/g,
      (match, varName, typeName) => {
        result.manualReview.push({
          line: this.getLineNumber(code, match),
          type: 'constructor-injection',
          description: 'Constructor injection should be replaced with useContext.',
          originalCode: match,
        });
        return `// Replace with: const ${varName} = useContext(${typeName}Context)`;
      }
    );

    // @Injectable service → Context provider
    transformed = transformed.replace(
      /@Injectable\(\{[\s\S]*?\}\)\s*export\s+class\s+(\w+)/g,
      (match, serviceName) => {
        result.manualReview.push({
          line: this.getLineNumber(code, match),
          type: 'injectable',
          description: `Service '${serviceName}' should be converted to a Context with signals.`,
          originalCode: match,
          suggestedCode: `// Create a context for the service\nconst ${serviceName}Context = createContext<${serviceName}Type>(defaultValue);\n\n// Create the service as a function or object with signals`,
        });
        return `// Converted from @Injectable - use createContext and signals\nexport const ${serviceName}Context = createContext`;
      }
    );

    return transformed;
  }

  private transformRxJS(code: string, result: TransformResult): string {
    let transformed = code;

    // BehaviorSubject → signal
    transformed = transformed.replace(
      /new\s+BehaviorSubject(?:<[^>]+>)?\(([^)]+)\)/g,
      (match, initialValue) => {
        result.warnings.push({
          message: 'BehaviorSubject converted to signal.',
        });
        return `signal(${initialValue})`;
      }
    );

    // Subject → signal with callback pattern
    transformed = transformed.replace(
      /new\s+Subject(?:<[^>]+>)?\(\)/g,
      (match) => {
        result.manualReview.push({
          line: this.getLineNumber(code, match),
          type: 'subject',
          description: 'Subject converted to signal. Subscribers should use effect() instead of .subscribe().',
          originalCode: match,
        });
        return `signal(null)`;
      }
    );

    // .subscribe() → effect()
    transformed = transformed.replace(
      /\.subscribe\(\s*\(([^)]*)\)\s*=>\s*\{/g,
      (match, params) => {
        result.manualReview.push({
          line: this.getLineNumber(code, match),
          type: 'subscribe',
          description: 'Observable.subscribe() should be replaced with effect(). Read signals directly inside the effect.',
          originalCode: match,
        });
        return '/* Replace with effect(() => { */\n// Using: ';
      }
    );

    // pipe() operators → signal compositions
    if (code.includes('.pipe(')) {
      result.manualReview.push({
        line: 1,
        type: 'rxjs-pipe',
        description: 'RxJS pipe operators should be replaced with memo() for derived values or effect() for side effects.',
        originalCode: 'Observable.pipe(...)',
      });
    }

    return transformed;
  }

  private transformLifecycle(code: string, result: TransformResult): string {
    let transformed = code;

    // ngOnInit → onMount
    transformed = transformed.replace(
      /ngOnInit\s*\(\)\s*\{/g,
      (match) => {
        result.warnings.push({
          message: 'ngOnInit converted to onMount. Call onMount() inside your component function.',
        });
        return '// Move to: onMount(() => {\n// ';
      }
    );

    // ngOnDestroy → onCleanup
    transformed = transformed.replace(
      /ngOnDestroy\s*\(\)\s*\{/g,
      (match) => {
        result.warnings.push({
          message: 'ngOnDestroy converted to onCleanup. Use inside an effect or directly.',
        });
        return '// Move to: onCleanup(() => {\n// ';
      }
    );

    // ngAfterViewInit → onMount
    transformed = transformed.replace(
      /ngAfterViewInit\s*\(\)\s*\{/g,
      (match) => {
        result.warnings.push({
          message: 'ngAfterViewInit converted to onMount.',
        });
        return '// Move to: onMount(() => {\n// ';
      }
    );

    return transformed;
  }

  private transformTemplateSyntax(code: string, result: TransformResult): string {
    let transformed = code;

    // Add note about template transformation
    if (code.includes('template:') || code.includes('templateUrl:')) {
      result.manualReview.push({
        line: 1,
        type: 'template',
        description: 'Angular template syntax needs manual conversion to JSX. Key differences:\n' +
          '- *ngIf → {condition && <Element />}\n' +
          '- *ngFor → {items.map(item => <Element key={item.id} />)}\n' +
          '- [property]="value" → property={value}\n' +
          '- (event)="handler()" → onEvent={handler}\n' +
          '- [(ngModel)] → value={signal()} onChange={...}\n' +
          '- {{ interpolation }} → {value}',
        originalCode: 'template syntax',
      });
    }

    return transformed;
  }

  private getLineNumber(code: string, match: string): number {
    const index = code.indexOf(match);
    if (index === -1) return 0;
    return code.substring(0, index).split('\n').length;
  }
}
