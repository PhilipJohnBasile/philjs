/**
 * Codemod for transforming React code to PhilJS.
 * Uses jscodeshift to automatically migrate React patterns to PhilJS equivalents.
 */

import type {
  API,
  FileInfo,
  Options,
  Transform,
  Collection,
  JSCodeshift,
  ASTPath,
} from 'jscodeshift';

/**
 * Main transform function for converting React code to PhilJS.
 *
 * Usage:
 * ```bash
 * npx jscodeshift -t node_modules/philjs-react-compat/dist/codemod/transform.js src/**\/*.tsx
 * ```
 */
const transform: Transform = (fileInfo: FileInfo, api: API, options: Options) => {
  const j: JSCodeshift = api.jscodeshift;
  const root: Collection = j(fileInfo.source);

  let hasChanges = false;

  // 1. Transform imports from 'react' to 'philjs-react-compat' or 'philjs-core'
  root
    .find(j.ImportDeclaration)
    .filter((path: any) => path.node.source.value === 'react')
    .forEach((path: any) => {
      hasChanges = true;

      const specifiers = path.node.specifiers || [];
      const philjsSpecifiers: any[] = [];
      const reactCompatSpecifiers: any[] = [];

      specifiers.forEach((spec: any) => {
        if (spec.type === 'ImportSpecifier') {
          const name = spec.imported.name;

          // Map to philjs-core
          if (['useState', 'useEffect', 'useMemo', 'useCallback', 'useRef', 'useContext', 'useReducer'].includes(name)) {
            reactCompatSpecifiers.push(spec);
          }
          // Map to philjs-react-compat for components
          else if (['Fragment', 'Suspense', 'lazy'].includes(name)) {
            reactCompatSpecifiers.push(spec);
          }
          // Default export
          else if (spec.type === 'ImportDefaultSpecifier') {
            // Remove default React import
          }
          else {
            reactCompatSpecifiers.push(spec);
          }
        }
      });

      // Replace with PhilJS imports
      const imports = [];

      if (reactCompatSpecifiers.length > 0) {
        imports.push(
          j.importDeclaration(
            reactCompatSpecifiers,
            j.literal('philjs-react-compat')
          )
        );
      }

      if (imports.length > 0) {
        j(path).replaceWith(imports);
      } else {
        j(path).remove();
      }
    });

  // 2. Transform useState to signal pattern
  root
    .find(j.CallExpression)
    .filter((path: any) => {
      return (
        path.node.callee.type === 'Identifier' &&
        path.node.callee.name === 'useState'
      );
    })
    .forEach((path: any) => {
      hasChanges = true;

      // Find the variable declaration
      const declaration = j(path).closest(j.VariableDeclaration);

      if (declaration.length > 0) {
        const declarator = declaration.get().node.declarations[0];

        if (declarator.id.type === 'ArrayPattern' && declarator.id.elements.length === 2) {
          const [valueId, setterIdElement] = declarator.id.elements;

          if (valueId && valueId.type === 'Identifier' && setterIdElement && setterIdElement.type === 'Identifier') {
            const valueName = valueId.name;
            const setterName = setterIdElement.name;

            // Add comment about migration
            declaration
              .get()
              .node.comments = [
                j.commentLine(' TODO: Consider migrating to PhilJS signal pattern:'),
                j.commentLine(` const ${valueName} = signal(initialValue);`),
                j.commentLine(` // Read: ${valueName}()`),
                j.commentLine(` // Write: ${valueName}.set(newValue)`),
              ];
          }
        }
      }
    });

  // 3. Remove dependency arrays from useEffect and useMemo
  root
    .find(j.CallExpression)
    .filter((path: any) => {
      return (
        path.node.callee.type === 'Identifier' &&
        (path.node.callee.name === 'useEffect' || path.node.callee.name === 'useMemo')
      );
    })
    .forEach((path: any) => {
      if (path.node.arguments.length > 1) {
        hasChanges = true;

        // Remove the dependency array argument
        path.node.arguments = [path.node.arguments[0]];

        // Add comment
        if (!path.node.comments) {
          path.node.comments = [];
        }
        path.node.comments.push(
          j.commentLine(' Dependency array removed - PhilJS tracks dependencies automatically')
        );
      }
    });

  // 4. Transform useCallback to regular functions (with warning comment)
  root
    .find(j.CallExpression)
    .filter((path: any) => {
      return (
        path.node.callee.type === 'Identifier' &&
        path.node.callee.name === 'useCallback'
      );
    })
    .forEach((path: any) => {
      hasChanges = true;

      // Find the variable declaration
      const declaration = j(path).closest(j.VariableDeclaration);

      if (declaration.length > 0) {
        const declarator = declaration.get().node.declarations[0];

        if (declarator.id.type === 'Identifier') {
          const functionName = declarator.id.name;

          // Add comment about removing useCallback
          declaration
            .get()
            .node.comments = [
              j.commentLine(' TODO: useCallback is unnecessary in PhilJS.'),
              j.commentLine(` Consider using a regular function: const ${functionName} = () => {...}`),
            ];
        }
      }
    });

  // 5. Transform React.memo to regular components (with comment)
  root
    .find(j.CallExpression)
    .filter((path: any) => {
      return (
        path.node.callee.type === 'MemberExpression' &&
        path.node.callee.object.type === 'Identifier' &&
        path.node.callee.object.name === 'React' &&
        path.node.callee.property.type === 'Identifier' &&
        path.node.callee.property.name === 'memo'
      );
    })
    .forEach((path: any) => {
      hasChanges = true;

      // Add comment about React.memo
      if (!path.node.comments) {
        path.node.comments = [];
      }
      path.node.comments.push(
        j.commentLine(' TODO: React.memo is unnecessary in PhilJS due to fine-grained reactivity.')
      );
    });

  // 6. Transform class components to functional components (add TODO comment)
  root
    .find(j.ClassDeclaration)
    .filter((path: any) => {
      const superClass = path.node.superClass;
      return (
        superClass &&
        ((superClass.type === 'Identifier' && superClass.name === 'Component') ||
          (superClass.type === 'MemberExpression' &&
            superClass.object.type === 'Identifier' &&
            superClass.object.name === 'React'))
      );
    })
    .forEach((path: any) => {
      hasChanges = true;

      // Add comment about converting to functional component
      if (!path.node.comments) {
        path.node.comments = [];
      }
      path.node.comments.push(
        j.commentBlock(` TODO: Convert this class component to a functional component for PhilJS.
   - Replace this.state with useState or signal
   - Replace lifecycle methods with useEffect
   - Replace this.props with function parameters
`)
      );
    });

  return hasChanges ? root.toSource() : null;
};

export default transform;

/**
 * Helper function to run the transform programmatically.
 *
 * @example
 * ```ts
 * import { transformReactToPhilJS } from 'philjs-react-compat/codemod';
 *
 * const transformed = transformReactToPhilJS(sourceCode);
 * ```
 */
export function transformReactToPhilJS(source: string): string {
  const jscodeshift = require('jscodeshift');

  const fileInfo = {
    path: 'input.tsx',
    source,
  };

  const api = {
    jscodeshift,
    j: jscodeshift,
    stats: () => {},
    report: () => {},
  };

  const result = transform(fileInfo, api as any, {});

  return result || source;
}

/**
 * Specific transforms for common patterns.
 */
export const transforms = {
  /**
   * Convert useState to signal pattern.
   */
  useStateToSignal: (source: string): string => {
    return source.replace(
      /const\s+\[(\w+),\s*set(\w+)\]\s*=\s*useState\((.*?)\);/g,
      'const $1 = signal($3); // Read: $1(), Write: $1.set(value)'
    );
  },

  /**
   * Remove dependency arrays from useEffect.
   */
  removeEffectDeps: (source: string): string => {
    return source.replace(
      /useEffect\((.*?),\s*\[.*?\]\)/g,
      'useEffect($1) // PhilJS auto-tracks dependencies'
    );
  },

  /**
   * Remove dependency arrays from useMemo.
   */
  removeMemoDeps: (source: string): string => {
    return source.replace(
      /useMemo\((.*?),\s*\[.*?\]\)/g,
      'useMemo($1) // PhilJS auto-tracks dependencies'
    );
  },

  /**
   * Remove useCallback wrappers.
   */
  removeUseCallback: (source: string): string => {
    return source.replace(
      /const\s+(\w+)\s*=\s*useCallback\((.*?),\s*\[.*?\]\);/g,
      'const $1 = $2; // useCallback unnecessary in PhilJS'
    );
  },

  /**
   * Replace React imports with PhilJS imports.
   */
  replaceImports: (source: string): string => {
    return source
      .replace(/from\s+['"]react['"]/g, "from 'philjs-react-compat'")
      .replace(/import\s+React\s+from\s+['"]react['"];?/g, '');
  },
};

/**
 * Apply all transforms to source code.
 */
export function transformAll(source: string): string {
  let result = source;

  Object.values(transforms).forEach((transform) => {
    result = transform(result);
  });

  return result;
}

/**
 * Generate a migration report.
 */
export function analyzeMigration(source: string): {
  hasStateHooks: boolean;
  hasEffectHooks: boolean;
  hasMemoHooks: boolean;
  hasCallbackHooks: boolean;
  hasClassComponents: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];

  const hasStateHooks = /useState/.test(source);
  const hasEffectHooks = /useEffect/.test(source);
  const hasMemoHooks = /useMemo/.test(source);
  const hasCallbackHooks = /useCallback/.test(source);
  const hasClassComponents = /class\s+\w+\s+extends\s+(React\.)?Component/.test(source);

  if (hasStateHooks) {
    suggestions.push('Replace useState with signal() for reactive state management');
  }

  if (hasEffectHooks) {
    suggestions.push('Remove dependency arrays from useEffect - PhilJS auto-tracks dependencies');
  }

  if (hasMemoHooks) {
    suggestions.push('Remove dependency arrays from useMemo - PhilJS auto-tracks dependencies');
  }

  if (hasCallbackHooks) {
    suggestions.push('Remove useCallback - unnecessary in PhilJS due to stable function references');
  }

  if (hasClassComponents) {
    suggestions.push('Convert class components to functional components with hooks');
  }

  return {
    hasStateHooks,
    hasEffectHooks,
    hasMemoHooks,
    hasCallbackHooks,
    hasClassComponents,
    suggestions,
  };
}
