/**
 * Web Component Adapter
 *
 * Converts Universal Components to Custom Elements (Web Components)
 */

export interface WebComponentOptions {
  /** Custom element tag name */
  tagName?: string;
  /** Shadow DOM mode */
  shadowMode?: 'open' | 'closed' | 'none';
  /** Custom styles to inject */
  styles?: string | string[];
  /** Observed attributes */
  observedAttributes?: string[];
}

/**
 * Convert a Universal Component to a Custom Element class
 */
export function toWebComponent<Props extends Record<string, unknown>>(
  componentDef: any,
  options: WebComponentOptions = {}
): typeof HTMLElement {
  const { shadowMode = 'open' } = options;

  return class extends HTMLElement {
    private root: ShadowRoot | HTMLElement;
    private props: Props = {} as Props;

    static get observedAttributes(): string[] {
      return options.observedAttributes || [];
    }

    constructor() {
      super();
      this.root = shadowMode !== 'none'
        ? this.attachShadow({ mode: shadowMode })
        : this;
    }

    connectedCallback(): void {
      this.render();
    }

    disconnectedCallback(): void {
      // Cleanup
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string): void {
      (this.props as Record<string, unknown>)[name] = newValue;
      this.render();
    }

    private render(): void {
      const vnode = componentDef.render(this.props, {
        h: createVNode,
        Fragment: Symbol.for('Fragment'),
        slots: {},
        emit: () => {},
      });
      this.root.innerHTML = renderToString(vnode);
    }
  };
}

// Helper functions
function createVNode(
  type: any,
  props: Record<string, unknown> | null,
  ...children: any[]
): any {
  return {
    type,
    props: {
      ...(props || {}),
      children: children.flat().filter((c: any) => c != null),
    },
  };
}

function renderToString(vnode: any): string {
  if (vnode == null) return '';
  if (typeof vnode === 'string') return escapeHtml(vnode);
  if (typeof vnode === 'number') return String(vnode);

  const { type, props = {} } = vnode;
  const children = props.children || [];

  if (typeof type === 'function') {
    const result = type(props);
    return renderToString(result);
  }

  if (typeof type === 'symbol') {
    return (Array.isArray(children) ? children : [children])
      .map((c: any) => renderToString(c))
      .join('');
  }

  const attrs = Object.entries(props)
    .filter(([k]) => k !== 'children')
    .map(([k, v]) => ` ${k}="${escapeHtml(String(v))}"`)
    .join('');

  const childHtml = (Array.isArray(children) ? children : [children])
    .map((c: any) => renderToString(c))
    .join('');

  return `<${type}${attrs}>${childHtml}</${type}>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
