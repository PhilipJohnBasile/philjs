/**
 * Tests for PhilJS Hooks - Form Hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signal } from '@philjs/core';
import { useInputState, useField, useForm } from './index';

describe('Form Hooks', () => {
  describe('useInputState', () => {
    it('should initialize with string value', () => {
      const [state] = useInputState('initial');
      expect(state.get()).toBe('initial');
    });

    it('should initialize with number value', () => {
      const [state] = useInputState(42);
      expect(state.get()).toBe(42);
    });

    it('should update from direct value', () => {
      const [state, setValue] = useInputState('');
      setValue('new value');
      expect(state.get()).toBe('new value');
    });

    it('should update from event', () => {
      const [state, setValue] = useInputState('');
      const mockEvent = {
        target: { value: 'event value' },
      } as unknown as Event;

      setValue(mockEvent);
      expect(state.get()).toBe('event value');
    });
  });

  describe('useField', () => {
    it('should initialize with provided value', () => {
      const field = useField({ initialValue: 'test' });
      expect(field.value.get()).toBe('test');
    });

    it('should start untouched', () => {
      const field = useField({ initialValue: '' });
      expect(field.touched.get()).toBe(false);
    });

    it('should start clean (not dirty)', () => {
      const field = useField({ initialValue: '' });
      expect(field.dirty.get()).toBe(false);
    });

    it('should start with no error', () => {
      const field = useField({ initialValue: '' });
      expect(field.error.get()).toBeNull();
    });

    it('should be valid initially', () => {
      const field = useField({ initialValue: '' });
      expect(field.valid.get()).toBe(true);
    });

    it('should validate required field', () => {
      const field = useField({
        initialValue: '',
        required: true,
      });

      const isValid = field.validate();
      expect(isValid).toBe(false);
      expect(field.error.get()).toBe('This field is required');
    });

    it('should use custom required message', () => {
      const field = useField({
        initialValue: '',
        required: true,
        requiredMessage: 'Please fill this in',
      });

      field.validate();
      expect(field.error.get()).toBe('Please fill this in');
    });

    it('should pass required validation when value exists', () => {
      const field = useField({
        initialValue: 'filled',
        required: true,
      });

      const isValid = field.validate();
      expect(isValid).toBe(true);
      expect(field.error.get()).toBeNull();
    });

    it('should run custom validator', () => {
      const field = useField({
        initialValue: 'test',
        validate: (value) => (value.length < 5 ? 'Too short' : null),
      });

      const isValid = field.validate();
      expect(isValid).toBe(false);
      expect(field.error.get()).toBe('Too short');
    });

    it('should pass custom validation', () => {
      const field = useField({
        initialValue: 'test value',
        validate: (value) => (value.length < 5 ? 'Too short' : null),
      });

      const isValid = field.validate();
      expect(isValid).toBe(true);
      expect(field.error.get()).toBeNull();
    });

    it('should set touched after validation', () => {
      const field = useField({ initialValue: '' });
      expect(field.touched.get()).toBe(false);

      field.validate();
      expect(field.touched.get()).toBe(true);
    });

    it('should allow manual error setting', () => {
      const field = useField({ initialValue: '' });
      field.setError('Custom error');
      expect(field.error.get()).toBe('Custom error');
      expect(field.valid.get()).toBe(false);
    });

    it('should reset field state', () => {
      const field = useField({
        initialValue: 'initial',
        required: true,
      });

      field.value.set('changed');
      field.validate();
      field.setError('error');

      field.reset();

      expect(field.value.get()).toBe('initial');
      expect(field.error.get()).toBeNull();
      expect(field.touched.get()).toBe(false);
      expect(field.dirty.get()).toBe(false);
    });
  });

  describe('useForm', () => {
    it('should initialize with provided values', () => {
      const form = useForm({
        initialValues: { name: 'John', email: 'john@example.com' },
      });

      expect(form.values.get()).toEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('should start with empty errors', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      expect(form.errors.get()).toEqual({});
    });

    it('should start clean', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      expect(form.dirty.get()).toBe(false);
    });

    it('should start with empty touched set', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      expect(form.touched.get().size).toBe(0);
    });

    it('should start not submitting', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      expect(form.submitting.get()).toBe(false);
    });

    it('should set field value', () => {
      const form = useForm({
        initialValues: { name: '', email: '' },
      });

      form.setFieldValue('name', 'Jane');
      expect(form.values.get().name).toBe('Jane');
    });

    it('should mark as dirty when field changes', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      form.setFieldValue('name', 'Changed');
      expect(form.dirty.get()).toBe(true);
    });

    it('should set field error', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      form.setFieldError('name', 'Name is required');
      expect(form.errors.get().name).toBe('Name is required');
    });

    it('should clear field error', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      form.setFieldError('name', 'Name is required');
      form.setFieldError('name', null);
      expect(form.errors.get().name).toBeUndefined();
    });

    it('should mark field as touched', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      form.setFieldTouched('name');
      expect(form.touched.get().has('name')).toBe(true);
    });

    it('should run validation', () => {
      const form = useForm({
        initialValues: { name: '', email: '' },
        validate: (values) => {
          const errors: Record<string, string> = {};
          if (!values.name) errors.name = 'Required';
          if (!values.email) errors.email = 'Required';
          return errors;
        },
      });

      const isValid = form.validate();
      expect(isValid).toBe(false);
      expect(form.errors.get()).toEqual({
        name: 'Required',
        email: 'Required',
      });
    });

    it('should pass validation when fields are valid', () => {
      const form = useForm({
        initialValues: { name: 'John', email: 'john@example.com' },
        validate: (values) => {
          const errors: Record<string, string> = {};
          if (!values.name) errors.name = 'Required';
          if (!values.email) errors.email = 'Required';
          return errors;
        },
      });

      const isValid = form.validate();
      expect(isValid).toBe(true);
      expect(form.errors.get()).toEqual({});
    });

    it('should handle form submission', async () => {
      const onSubmit = vi.fn();
      const form = useForm({
        initialValues: { name: 'John' },
        onSubmit,
      });

      await form.handleSubmit();
      expect(onSubmit).toHaveBeenCalledWith({ name: 'John' });
    });

    it('should not submit if validation fails', async () => {
      const onSubmit = vi.fn();
      const form = useForm({
        initialValues: { name: '' },
        validate: (values) => (values.name ? {} : { name: 'Required' }),
        onSubmit,
      });

      await form.handleSubmit();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should set submitting during async submission', async () => {
      const form = useForm({
        initialValues: { name: 'John' },
        onSubmit: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
        },
      });

      const submitPromise = form.handleSubmit();
      expect(form.submitting.get()).toBe(true);

      await submitPromise;
      expect(form.submitting.get()).toBe(false);
    });

    it('should reset form', () => {
      const form = useForm({
        initialValues: { name: '', email: '' },
      });

      form.setFieldValue('name', 'John');
      form.setFieldValue('email', 'john@example.com');
      form.setFieldError('name', 'Some error');
      form.setFieldTouched('name');

      form.reset();

      expect(form.values.get()).toEqual({ name: '', email: '' });
      expect(form.errors.get()).toEqual({});
      expect(form.touched.get().size).toBe(0);
      expect(form.dirty.get()).toBe(false);
    });

    it('should provide field props', () => {
      const form = useForm({
        initialValues: { name: 'Initial' },
      });

      const props = form.getFieldProps('name');
      expect(props.value.get()).toBe('Initial');
      expect(typeof props.onChange).toBe('function');
      expect(typeof props.onBlur).toBe('function');
    });

    it('should update value from field props onChange', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      const props = form.getFieldProps('name');
      const mockEvent = {
        target: { value: 'New Value' },
      } as unknown as Event;

      props.onChange(mockEvent);
      expect(form.values.get().name).toBe('New Value');
    });

    it('should mark touched from field props onBlur', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      const props = form.getFieldProps('name');
      props.onBlur();
      expect(form.touched.get().has('name')).toBe(true);
    });

    it('should compute valid based on errors', () => {
      const form = useForm({
        initialValues: { name: '' },
      });

      expect(form.valid.get()).toBe(true);

      form.setFieldError('name', 'Error');
      expect(form.valid.get()).toBe(false);

      form.setFieldError('name', null);
      expect(form.valid.get()).toBe(true);
    });
  });
});
