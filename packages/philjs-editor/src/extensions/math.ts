/**
 * Math Extension
 *
 * LaTeX math equation support with KaTeX rendering
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface MathOptions {
  /**
   * KaTeX options
   */
  katexOptions?: Record<string, any>;
  /**
   * Inline math delimiters (default: $...$)
   */
  inlineDelimiters?: [string, string];
  /**
   * Block math delimiters (default: $$...$$)
   */
  blockDelimiters?: [string, string];
  /**
   * Enable auto-render of delimited math
   */
  autoRender?: boolean;
}

/**
 * Inline Math Node
 */
export const InlineMath = Node.create({
  name: 'inlineMath',
  group: 'inline',
  inline: true,
  atom: true,

  addOptions() {
    return {
      katexOptions: {
        throwOnError: false,
        strict: false,
      },
    };
  },

  addAttributes() {
    return {
      latex: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-inline-math]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const latex = HTMLAttributes.latex || '';
    let rendered = '';

    try {
      // KaTeX will be imported dynamically
      if (typeof window !== 'undefined' && (window as any).katex) {
        rendered = (window as any).katex.renderToString(latex, {
          ...this.options.katexOptions,
          displayMode: false,
        });
      } else {
        rendered = `<code>${latex}</code>`;
      }
    } catch (error) {
      rendered = `<code class="philjs-math-error">${latex}</code>`;
    }

    return [
      'span',
      mergeAttributes({
        'data-inline-math': '',
        class: 'philjs-inline-math',
        'data-latex': latex,
      }),
      ['span', { innerHTML: rendered }],
    ];
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addCommands(): any {
    return {
      setInlineMath:
        (latex: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex },
          });
        },
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addInputRules(): any {
    return [
      {
        find: /\$([^$]+)\$$/,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: ({ state, range, match }: any) => {
          const latex = match[1];
          const { tr } = state;

          tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ latex })
          );
        },
      },
    ];
  },
});

/**
 * Block Math Node
 */
export const BlockMath = Node.create({
  name: 'blockMath',
  group: 'block',
  atom: true,

  addOptions() {
    return {
      katexOptions: {
        throwOnError: false,
        strict: false,
      },
    };
  },

  addAttributes() {
    return {
      latex: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-block-math]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const latex = HTMLAttributes.latex || '';
    let rendered = '';

    try {
      if (typeof window !== 'undefined' && (window as any).katex) {
        rendered = (window as any).katex.renderToString(latex, {
          ...this.options.katexOptions,
          displayMode: true,
        });
      } else {
        rendered = `<pre>${latex}</pre>`;
      }
    } catch (error) {
      rendered = `<pre class="philjs-math-error">${latex}</pre>`;
    }

    return [
      'div',
      mergeAttributes({
        'data-block-math': '',
        class: 'philjs-block-math',
        'data-latex': latex,
      }),
      ['div', { innerHTML: rendered }],
    ];
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addCommands(): any {
    return {
      setBlockMath:
        (latex: string) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex },
          });
        },
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addInputRules(): any {
    return [
      {
        find: /\$\$([^$]+)\$\$$/,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: ({ state, range, match }: any) => {
          const latex = match[1];
          const { tr } = state;

          tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ latex })
          );
        },
      },
    ];
  },
});

/**
 * Create configured math extensions
 */
export function createMathExtensions(options: MathOptions = {}) {
  const { katexOptions = {} } = options;

  return [
    InlineMath.configure({ katexOptions }),
    BlockMath.configure({ katexOptions }),
  ];
}

/**
 * Render LaTeX to HTML using KaTeX
 */
export async function renderLatex(
  latex: string,
  displayMode = false,
  options: Record<string, any> = {}
): Promise<string> {
  // Dynamically import KaTeX
  const katex = await import('katex');

  return katex.default.renderToString(latex, {
    throwOnError: false,
    strict: false,
    displayMode,
    ...options,
  });
}

/**
 * Validate LaTeX syntax
 */
export async function validateLatex(latex: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    const katex = await import('katex');
    katex.default.renderToString(latex, {
      throwOnError: true,
    });
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid LaTeX',
    };
  }
}

/**
 * Common math symbols for quick insert
 */
export const mathSymbols = {
  // Greek letters
  alpha: '\\alpha',
  beta: '\\beta',
  gamma: '\\gamma',
  delta: '\\delta',
  epsilon: '\\epsilon',
  theta: '\\theta',
  lambda: '\\lambda',
  mu: '\\mu',
  pi: '\\pi',
  sigma: '\\sigma',
  omega: '\\omega',
  // Operators
  sum: '\\sum',
  prod: '\\prod',
  int: '\\int',
  oint: '\\oint',
  partial: '\\partial',
  nabla: '\\nabla',
  sqrt: '\\sqrt{}',
  frac: '\\frac{}{}',
  // Relations
  leq: '\\leq',
  geq: '\\geq',
  neq: '\\neq',
  approx: '\\approx',
  equiv: '\\equiv',
  subset: '\\subset',
  supset: '\\supset',
  in: '\\in',
  notin: '\\notin',
  // Arrows
  rightarrow: '\\rightarrow',
  leftarrow: '\\leftarrow',
  Rightarrow: '\\Rightarrow',
  Leftarrow: '\\Leftarrow',
  // Misc
  infty: '\\infty',
  forall: '\\forall',
  exists: '\\exists',
  times: '\\times',
  div: '\\div',
  pm: '\\pm',
  cdot: '\\cdot',
};

/**
 * Math templates for quick insert
 */
export const mathTemplates = {
  fraction: '\\frac{numerator}{denominator}',
  power: 'x^{n}',
  subscript: 'x_{n}',
  squareRoot: '\\sqrt{x}',
  nthRoot: '\\sqrt[n]{x}',
  sum: '\\sum_{i=1}^{n} x_i',
  product: '\\prod_{i=1}^{n} x_i',
  integral: '\\int_{a}^{b} f(x) \\, dx',
  limit: '\\lim_{x \\to \\infty} f(x)',
  matrix: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
  cases: '\\begin{cases} x & \\text{if } x > 0 \\\\ -x & \\text{otherwise} \\end{cases}',
  binomial: '\\binom{n}{k}',
};

/**
 * Math extension keyboard shortcuts
 */
export const mathShortcuts = {
  insertInlineMath: 'Mod-m',
  insertBlockMath: 'Mod-Shift-m',
};

/**
 * Default math styles
 */
export const mathStyles = `
.philjs-inline-math {
  display: inline-block;
  vertical-align: middle;
}

.philjs-block-math {
  display: block;
  margin: 1rem 0;
  overflow-x: auto;
  text-align: center;
}

.philjs-math-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.25rem;
  color: #dc2626;
  padding: 0.25rem 0.5rem;
}

/* KaTeX specific styles */
.katex-display {
  margin: 0 !important;
}

.katex {
  font-size: 1.1em;
}
`;

export default createMathExtensions;
