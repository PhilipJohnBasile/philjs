import { describe, it, expect } from 'vitest';
import { createForm } from './form.js';

describe('Form', () => {
  it('should initialize with values', () => {
    const form = createForm({
      initialValues: {
        name: 'John',
        email: 'john@example.com'
      }
    });

    expect(form.values().name).toBe('John');
    expect(form.values().email).toBe('john@example.com');
  });

  it('should set field value', () => {
    const form = createForm({
      initialValues: { name: '' }
    });

    form.setFieldValue('name', 'Jane');

    expect(form.values().name).toBe('Jane');
  });

  it('should track dirty state', () => {
    const form = createForm({
      initialValues: { name: 'John' }
    });

    expect(form.isDirty()()).toBe(false);

    form.setFieldValue('name', 'Jane');

    expect(form.isDirty()()).toBe(true);
  });

  it('should mark fields as touched', () => {
    const form = createForm({
      initialValues: { name: '' }
    });

    expect(form.touched().name).toBeUndefined();

    form.setFieldTouched('name', true);

    expect(form.touched().name).toBe(true);
  });

  it('should reset form', () => {
    const form = createForm({
      initialValues: { name: 'John' }
    });

    form.setFieldValue('name', 'Jane');
    form.setFieldTouched('name', true);

    expect(form.isDirty()()).toBe(true);

    form.reset();

    expect(form.values().name).toBe('John');
    expect(form.touched().name).toBeUndefined();
    expect(form.isDirty()()).toBe(false);
  });

  it('should track submitting state', async () => {
    let submitted = false;

    const form = createForm({
      initialValues: { name: 'John' },
      onSubmit: async (values) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        submitted = true;
      }
    });

    expect(form.isSubmitting()()).toBe(false);

    const promise = form.handleSubmit();
    expect(form.isSubmitting()()).toBe(true);

    await promise;
    expect(form.isSubmitting()()).toBe(false);
    expect(submitted).toBe(true);
  });

  it('should track submit count', async () => {
    const form = createForm({
      initialValues: { name: 'John' },
      onSubmit: async () => {}
    });

    expect(form.submitCount()()).toBe(0);

    await form.handleSubmit();
    expect(form.submitCount()()).toBe(1);

    await form.handleSubmit();
    expect(form.submitCount()()).toBe(2);
  });

  it('should provide field props', () => {
    const form = createForm({
      initialValues: { name: 'John' }
    });

    const fieldProps = form.getFieldProps('name');

    expect(fieldProps.name).toBe('name');
    expect(fieldProps.value()).toBe('John');
    expect(typeof fieldProps.onChange).toBe('function');
    expect(typeof fieldProps.onBlur).toBe('function');
  });
});
