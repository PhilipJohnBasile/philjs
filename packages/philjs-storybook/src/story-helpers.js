/**
 * PhilJS Storybook Story Helpers
 *
 * Utilities for creating and configuring stories
 */
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
export function createStory(config) {
    const { component, title, args, argTypes, parameters, decorators, tags, } = config;
    const meta = {
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
        story: (variant = {}) => createVariant(variant),
    };
}
/**
 * Extract component name from a component function
 */
function getComponentName(component) {
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
export function createVariant(config = {}) {
    return {
        ...(config.args !== undefined && { args: config.args }),
        ...(config.argTypes !== undefined && { argTypes: config.argTypes }),
        ...(config.parameters !== undefined && { parameters: config.parameters }),
        ...(config.decorators !== undefined && { decorators: config.decorators }),
    };
}
/**
 * Create args helper (identity with shallow copy).
 */
export function createArgs(args) {
    return { ...args };
}
/**
 * Create argTypes helper (identity with shallow copy).
 */
export function createArgTypes(argTypes) {
    return { ...argTypes };
}
/**
 * Create parameters helper (identity with shallow copy).
 */
export function createParameters(parameters) {
    return { ...parameters };
}
export default createStory;
//# sourceMappingURL=story-helpers.js.map