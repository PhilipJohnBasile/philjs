/**
 * PhilJS Storybook Integration
 *
 * Main exports for Storybook integration
 */

export { presetConfig } from './preset.js';
export { renderer } from './renderer.js';
export {
  createStory,
  createVariant,
  createArgs,
  createArgTypes,
  createParameters,
  type StoryConfig,
  type StoryMeta,
  type StoryVariant,
  type ArgTypeConfig,
  type ControlConfig,
} from './story-helpers.js';

// Re-export decorators
export * from './decorators/index.js';

// Re-export mocks
export * from './mocks/index.js';

// Re-export types
export type { StoryContext, RenderContext } from './renderer.js';
