/**
 * PhilJS Story Helpers
 *
 * Utilities for creating and configuring stories
 */

import type { ComponentType } from 'philjs-core';
import type { StoryContext } from './renderer.js';

export interface StoryConfig<T = any> {
  component: ComponentType<T>;
  title: string;
  tags?: string[];
  argTypes?: Record<string, any>;
  args?: Partial<T>;
  parameters?: Record<string, any>;
  decorators?: ((story: () => any, context: StoryContext) => any)[];
}

export interface Story<T = any> {
  (args: T, context: StoryContext): any;
  args?: Partial<T>;
  argTypes?: Record<string, any>;
  parameters?: Record<string, any>;
  decorators?: ((story: () => any, context: StoryContext) => any)[];
  play?: (context: StoryContext) => Promise<void>;
}

/**
 * Create a story with type safety and defaults
 */
export function createStory<T = any>(config: StoryConfig<T>) {
  const meta = {
    title: config.title,
    component: config.component,
    tags: config.tags || ['autodocs'],
    argTypes: config.argTypes || {},
    args: config.args || {},
    parameters: config.parameters || {},
    decorators: config.decorators || [],
  };

  return {
    meta,
    /**
     * Create individual story variants
     */
    story: (storyConfig: Partial<Story<T>> = {}) => {
      const story: Story<T> = (args: T) => {
        const Component = config.component;
        return <Component {...args} />;
      };

      if (storyConfig.args) story.args = storyConfig.args;
      if (storyConfig.argTypes) story.argTypes = storyConfig.argTypes;
      if (storyConfig.parameters) story.parameters = storyConfig.parameters;
      if (storyConfig.decorators) story.decorators = storyConfig.decorators;
      if (storyConfig.play) story.play = storyConfig.play;

      return story;
    },
  };
}

/**
 * Create args for a story
 */
export function createArgs<T>(args: T): T {
  return args;
}

/**
 * Create argTypes for a story
 */
export function createArgTypes<T>(argTypes: Record<keyof T, any>) {
  return argTypes;
}

/**
 * Helper to create story parameters
 */
export function createParameters(params: Record<string, any>) {
  return params;
}
