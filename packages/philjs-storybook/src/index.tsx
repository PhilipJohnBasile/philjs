/**
 * PhilJS Storybook Integration
 * 
 * Write stories for PhilJS components.
 */

import type { Signal } from '@philjs/core';

// ============ TYPES ============

export interface StoryMeta<T = any> {
    title: string;
    component: (props: T) => any;
    tags?: string[];
    parameters?: StoryParameters;
    argTypes?: Record<string, ArgType>;
    args?: Partial<T>;
    decorators?: Decorator[];
}

export interface Story<T = any> {
    name?: string;
    args?: Partial<T>;
    argTypes?: Record<string, ArgType>;
    parameters?: StoryParameters;
    decorators?: Decorator[];
    render?: (args: T) => any;
    play?: (context: PlayContext<T>) => Promise<void>;
}

export interface StoryParameters {
    layout?: 'centered' | 'fullscreen' | 'padded';
    backgrounds?: {
        default?: string;
        values?: Array<{ name: string; value: string }>;
    };
    viewport?: {
        defaultViewport?: string;
    };
    docs?: {
        description?: { story?: string; component?: string };
    };
    actions?: { argTypesRegex?: string };
}

export interface ArgType {
    control?:
    | 'text'
    | 'boolean'
    | 'number'
    | 'select'
    | 'radio'
    | 'color'
    | { type: string; options?: any[] };
    description?: string;
    defaultValue?: any;
    table?: {
        category?: string;
        type?: { summary: string };
        defaultValue?: { summary: string };
    };
}

export interface PlayContext<T> {
    args: T;
    canvasElement: HTMLElement;
    step: (label: string, fn: () => Promise<void>) => Promise<void>;
}

export type Decorator = (Story: () => any, context: any) => any;

// ============ STORY HELPERS ============

/**
 * Define a component story meta
 * 
 * @example
 * ```tsx
 * import { defineMeta, defineStory } from '@philjs/storybook';
 * import { Button } from '@philjs/shadcn';
 * 
 * export default defineMeta({
 *   title: 'Components/Button',
 *   component: Button,
 *   argTypes: {
 *     variant: {
 *       control: 'select',
 *       options: ['default', 'primary', 'secondary'],
 *     },
 *   },
 * });
 * 
 * export const Primary = defineStory({
 *   args: { variant: 'primary', children: 'Click me' },
 * });
 * ```
 */
export function defineMeta<T>(meta: StoryMeta<T>): StoryMeta<T> {
    return {
        ...meta,
        tags: meta.tags || ['autodocs'],
    };
}

/**
 * Define a story
 */
export function defineStory<T>(story: Story<T>): Story<T> & { render: (args: T) => any } {
    return story as any;
}

// ============ DECORATORS ============

/**
 * Add padding around stories
 */
export function withPadding(padding = '1rem'): Decorator {
    return (Story) => (
        <div style={{ padding }}>
            <Story />
        </div>
    );
}

/**
 * Add a theme provider
 */
export function withTheme(theme: 'light' | 'dark'): Decorator {
    return (Story) => (
        <div data-theme={theme} class={theme}>
            <Story />
        </div>
    );
}

/**
 * Add a container with max width
 */
export function withContainer(maxWidth = '800px'): Decorator {
    return (Story) => (
        <div style={{ maxWidth, margin: '0 auto' }}>
            <Story />
        </div>
    );
}

/**
 * Add a signal context for testing
 */
export function withSignals<T>(signals: Record<string, () => Signal<any>>): Decorator {
    return (Story, context) => {
        // Create signals for this story
        const signalInstances: Record<string, Signal<any>> = {};
        for (const [key, createSignal] of Object.entries(signals)) {
            signalInstances[key] = createSignal();
        }

        return (
            <div data-testid="signal-context">
                <Story {...context} signals={signalInstances} />
            </div>
        );
    };
}

// ============ TESTING UTILITIES ============

/**
 * Create a test harness for PhilJS components
 */
export function createTestHarness<T>(
    Component: (props: T) => any,
    defaultProps: T
) {
    return {
        render(props: Partial<T> = {}) {
            const mergedProps = { ...defaultProps, ...props };
            return <Component {...mergedProps} />;
        },

        withArgs(args: Partial<T>) {
            return this.render(args);
        },
    };
}

/**
 * Wait for element to appear
 */
export async function waitForElement(
    container: HTMLElement,
    selector: string,
    timeout = 5000
): Promise<Element> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const element = container.querySelector(selector);
        if (element) return element;
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    throw new Error(`Element ${selector} not found within ${timeout}ms`);
}

/**
 * Simulate user interaction
 */
export const userEvent = {
    async click(element: Element): Promise<void> {
        element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 0));
    },

    async type(element: Element, text: string): Promise<void> {
        const input = element as HTMLInputElement;
        input.focus();

        for (const char of text) {
            input.value += char;
            input.dispatchEvent(new InputEvent('input', { bubbles: true, data: char }));
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    },

    async clear(element: Element): Promise<void> {
        const input = element as HTMLInputElement;
        input.value = '';
        input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    },

    async selectOption(element: Element, value: string): Promise<void> {
        const select = element as HTMLSelectElement;
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
    },
};

// ============ ADDON: SIGNALS PANEL ============

/**
 * Storybook addon for viewing PhilJS signals
 */
export const signalsAddon = {
    name: 'philjs-signals',
    register: (api: any) => {
        // This would register a panel in Storybook
        // to visualize signal state changes in real-time
    },
};

export {
    defineMeta,
    defineStory,
    withPadding,
    withTheme,
    withContainer,
    withSignals,
    createTestHarness,
    waitForElement,
    userEvent,
};
