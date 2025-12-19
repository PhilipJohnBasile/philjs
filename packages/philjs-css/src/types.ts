import type * as CSS from 'csstype';

/**
 * Base CSS properties with type safety from csstype
 */
export type CSSProperties = CSS.Properties<string | number>;

/**
 * Pseudo selectors and nested selectors
 */
export type CSSPseudos = {
  [K in CSS.Pseudos]?: CSSStyleObject;
};

/**
 * Media query object
 */
export interface MediaQuery {
  [key: string]: CSSStyleObject;
}

/**
 * Complete CSS style object with nesting support
 */
export interface CSSStyleObject extends CSSProperties {
  // Pseudo selectors
  '&:hover'?: CSSStyleObject;
  '&:focus'?: CSSStyleObject;
  '&:active'?: CSSStyleObject;
  '&:disabled'?: CSSStyleObject;
  '&:visited'?: CSSStyleObject;
  '&:first-child'?: CSSStyleObject;
  '&:last-child'?: CSSStyleObject;
  '&:nth-child(odd)'?: CSSStyleObject;
  '&:nth-child(even)'?: CSSStyleObject;
  '&::before'?: CSSStyleObject;
  '&::after'?: CSSStyleObject;
  '&::placeholder'?: CSSStyleObject;

  // Combinators
  '& > *'?: CSSStyleObject;
  '& + *'?: CSSStyleObject;
  '& ~ *'?: CSSStyleObject;

  // Nested selectors (any string starting with &)
  [key: `&${string}`]: CSSStyleObject | undefined;

  // Media queries
  '@media'?: {
    [query: string]: CSSStyleObject;
  };

  // Container queries
  '@container'?: {
    [query: string]: CSSStyleObject;
  };

  // Supports queries
  '@supports'?: {
    [query: string]: CSSStyleObject;
  };
}

/**
 * Theme token types
 */
export interface ThemeTokens {
  colors?: Record<string, string>;
  spacing?: Record<string, string | number>;
  fontSize?: Record<string, string | number>;
  fontFamily?: Record<string, string>;
  fontWeight?: Record<string, string | number>;
  lineHeight?: Record<string, string | number>;
  letterSpacing?: Record<string, string>;
  borderRadius?: Record<string, string | number>;
  borderWidth?: Record<string, string | number>;
  shadows?: Record<string, string>;
  zIndex?: Record<string, number>;
  breakpoints?: Record<string, string>;
  transitions?: Record<string, string>;
  [key: string]: Record<string, string | number> | undefined;
}

/**
 * Theme configuration
 */
export interface Theme {
  tokens: ThemeTokens;
  cssVars: Record<string, string>;
  getToken: <K extends keyof ThemeTokens>(
    category: K,
    key: string
  ) => ThemeTokens[K] extends Record<string, infer V> ? V : never;
}

/**
 * Variant configuration
 */
export interface VariantConfig<V extends Record<string, Record<string, CSSStyleObject>>> {
  base?: CSSStyleObject;
  variants?: V;
  compoundVariants?: Array<{
    [K in keyof V]?: keyof V[K];
  } & {
    css: CSSStyleObject;
  }>;
  defaultVariants?: {
    [K in keyof V]?: keyof V[K];
  };
}

/**
 * Variant props type helper
 */
export type VariantProps<V extends Record<string, Record<string, CSSStyleObject>>> = {
  [K in keyof V]?: keyof V[K];
};

/**
 * CSS class name result
 */
export interface CSSResult {
  className: string;
  css: string;
  toString(): string;
}

/**
 * Atomic CSS utilities
 */
export type AtomicProperty =
  | 'margin'
  | 'marginTop'
  | 'marginRight'
  | 'marginBottom'
  | 'marginLeft'
  | 'padding'
  | 'paddingTop'
  | 'paddingRight'
  | 'paddingBottom'
  | 'paddingLeft'
  | 'width'
  | 'height'
  | 'display'
  | 'flexDirection'
  | 'justifyContent'
  | 'alignItems'
  | 'gap'
  | 'color'
  | 'backgroundColor'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'textAlign'
  | 'borderRadius'
  | 'border'
  | 'borderWidth'
  | 'position'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'zIndex'
  | 'opacity'
  | 'transform'
  | 'transition';

export interface AtomicConfig {
  properties: AtomicProperty[];
  values: Record<string, string | number>;
  breakpoints?: Record<string, string>;
}

/**
 * CSS extraction configuration
 */
export interface ExtractConfig {
  outputPath: string;
  minify?: boolean;
  sourceMap?: boolean;
  atomicClasses?: boolean;
}

/**
 * CSS rule representation
 */
export interface CSSRule {
  selector: string;
  properties: CSSProperties;
  media?: string;
  supports?: string;
  container?: string;
}

/**
 * Stylesheet manager
 */
export interface StyleSheet {
  rules: Map<string, CSSRule>;
  addRule(rule: CSSRule): void;
  generate(): string;
  reset(): void;
}

/**
 * Responsive utilities
 */
export type ResponsiveValue<T> = T | {
  [breakpoint: string]: T;
};

/**
 * Type helpers
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
