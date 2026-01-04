/**
 * PhilJS Storybook Story Helpers
 *
 * Utilities for creating and configuring stories
 */

// Component type - generic function component type
type ComponentType<P = unknown> = (props: P) => unknown;

/**
 * Story configuration options
 */
export interface StoryConfig<P = Record<string, unknown>> {
  /**
   * The component to render
   */
  component: ComponentType<P>;

  /**
   * Story title (optional - defaults to component name)
   */
  title?: string;

  /**
   * Default args for the story
   */
  args?: Partial<P>;

  /**
   * Arg types configuration for Storybook controls
   */
  argTypes?: Record<string, ArgTypeConfig>;

  /**
   * Story parameters
   */
  parameters?: Record<string, unknown>;

  /**
   * Decorators to wrap the story
   */
  decorators?: Array<(story: () => unknown) => unknown>;

  /**
   * Tags for the story (e.g., 'autodocs')
   */
  tags?: string[];
}

/**
 * Arg type configuration for Storybook controls
 */
export interface ArgTypeConfig {
  control?: ControlConfig | string | false;
  description?: string;
  defaultValue?: unknown;
  name?: string;
  table?: {
    type?: { summary: string; detail?: string };
    defaultValue?: { summary: string; detail?: string };
    category?: string;
    subcategory?: string;
  };
  options?: unknown[];
  mapping?: Record<string, unknown>;
  if?: { arg?: string; exists?: boolean };
}

/**
 * Control configuration
 */
export interface ControlConfig {
  type: 'text' | 'number' | 'boolean' | 'object' | 'select' | 'radio' | 'inline-radio' | 'check' | 'inline-check' | 'range' | 'color' | 'date' | 'file';
  min?: number;
  max?: number;
  step?: number;
  presetColors?: string[];
  labels?: Record<string, string>;
  accept?: string;
}

/**
 * Create a story configuration
 *
 * @example
 * ```ts
 * const meta = createStory({
 *   component: Button,
 *   title: 'Components/Button',
 *   args: {
 *     label: 'Click me',
 *     variant: 'primary',
 *   },
 *   argTypes: {
 *     variant: {
 *       control: 'select',
 *       options: ['primary', 'secondary', 'danger'],
 *     },
 *   },
 * });
 *
 * export default meta;
 * export const Primary = {};
 * export const Secondary = { args: { variant: 'secondary' } };
 * ```
 */
export function createStory<P = Record<string, unknown>>(
  config: StoryConfig<P>
): { meta: StoryMeta<P>; story: (variant?: Partial<StoryConfig<P>>) => StoryVariant<P> } {
  const {
    component,
    title,
    args,
    argTypes,
    parameters,
    decorators,
    tags,
  } = config;

  const meta: StoryMeta<P> = {
    component,
    title: title || getComponentName(component),
    ...(args !== undefined && { args }),
    ...(argTypes !== undefined && { argTypes }),
    parameters: {
      layout: 'centered',
      ...parameters,
    },
    ...(decorators !== undefined && { decorators }),
    tags: tags ?? ['autodocs'],
  };

  return {
    meta,
    story: (variant = {}) => createVariant<P>(variant),
  };
}

/**
 * Story meta configuration (Storybook format)
 */
export interface StoryMeta<P = Record<string, unknown>> {
  component: ComponentType<P>;
  title?: string;
  args?: Partial<P>;
  argTypes?: Record<string, ArgTypeConfig>;
  parameters?: Record<string, unknown>;
  decorators?: Array<(story: () => unknown) => unknown>;
  tags?: string[];
}

/**
 * Extract component name from a component function
 */
function getComponentName<P>(component: ComponentType<P>): string {
  return component.name || 'Component';
}

/**
 * Create a story variant
 *
 * @example
 * ```ts
 * export const Large = createVariant({
 *   args: { size: 'large' },
 *   parameters: { backgrounds: { default: 'dark' } },
 * });
 * ```
 */
export function createVariant<P = Record<string, unknown>>(
  config: Partial<StoryConfig<P>> = {}
): StoryVariant<P> {
  return {
    ...(config.args !== undefined && { args: config.args }),
    ...(config.argTypes !== undefined && { argTypes: config.argTypes }),
    ...(config.parameters !== undefined && { parameters: config.parameters }),
    ...(config.decorators !== undefined && { decorators: config.decorators }),
  };
}

/**
 * Story variant configuration
 */
export interface StoryVariant<P = Record<string, unknown>> {
  args?: Partial<P>;
  argTypes?: Record<string, ArgTypeConfig>;
  parameters?: Record<string, unknown>;
  decorators?: Array<(story: () => unknown) => unknown>;
}

/**
 * Create args helper (identity with shallow copy).
 */
export function createArgs<P extends Record<string, unknown>>(args: P): P {
  return { ...args };
}

/**
 * Create argTypes helper (identity with shallow copy).
 */
export function createArgTypes(
  argTypes: Record<string, ArgTypeConfig>
): Record<string, ArgTypeConfig> {
  return { ...argTypes };
}

/**
 * Create parameters helper (identity with shallow copy).
 */
export function createParameters<T extends Record<string, unknown>>(parameters: T): T {
  return { ...parameters };
}

export default createStory;
