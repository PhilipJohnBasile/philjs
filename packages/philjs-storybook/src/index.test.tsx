/**
 * PhilJS Storybook Tests
 *
 * Test suite for story helpers
 */

import { describe, it, expect } from 'vitest';
import { createStory, createArgs, createArgTypes, createParameters } from './story-helpers.js';

describe('createStory', () => {
  it('should create a story with default configuration', () => {
    const DummyComponent = (props: { text: string }) => <div>{props.text}</div>;

    const { meta, story } = createStory({
      component: DummyComponent,
      title: 'Test/DummyComponent',
    });

    expect(meta.title).toBe('Test/DummyComponent');
    expect(meta.component).toBe(DummyComponent);
    expect(meta.tags).toEqual(['autodocs']);
  });

  it('should create a story with custom tags', () => {
    const DummyComponent = (props: { text: string }) => <div>{props.text}</div>;

    const { meta } = createStory({
      component: DummyComponent,
      title: 'Test/DummyComponent',
      tags: ['custom', 'test'],
    });

    expect(meta.tags).toEqual(['custom', 'test']);
  });

  it('should create a story with args', () => {
    const DummyComponent = (props: { text: string }) => <div>{props.text}</div>;

    const { meta } = createStory({
      component: DummyComponent,
      title: 'Test/DummyComponent',
      args: { text: 'Hello' },
    });

    expect(meta.args).toEqual({ text: 'Hello' });
  });

  it('should create story variants', () => {
    const DummyComponent = (props: { text: string }) => <div>{props.text}</div>;

    const { story } = createStory({
      component: DummyComponent,
      title: 'Test/DummyComponent',
    });

    const variant = story({
      args: { text: 'Variant' },
    });

    expect(variant.args).toEqual({ text: 'Variant' });
  });
});

describe('createArgs', () => {
  it('should create args', () => {
    const args = createArgs({ name: 'John', age: 30 });

    expect(args).toEqual({ name: 'John', age: 30 });
  });
});

describe('createArgTypes', () => {
  it('should create argTypes', () => {
    const argTypes = createArgTypes({
      name: { control: 'text' },
      age: { control: 'number' },
    });

    expect(argTypes).toEqual({
      name: { control: 'text' },
      age: { control: 'number' },
    });
  });
});

describe('createParameters', () => {
  it('should create parameters', () => {
    const params = createParameters({
      layout: 'centered',
      backgrounds: { default: 'light' },
    });

    expect(params).toEqual({
      layout: 'centered',
      backgrounds: { default: 'light' },
    });
  });
});
