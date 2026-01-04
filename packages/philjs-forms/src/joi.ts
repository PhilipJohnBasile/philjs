/**
 * PhilJS Joi Adapter
 */

import { signal } from '@philjs/core';
import type { Schema, ValidationResult } from 'joi';

export function useJoiForm<T>(schema: Schema<T>, initialValues: Partial<T> = {}) {
    const values = signal<Partial<T>>(initialValues);
    const errors = signal<Record<string, string>>({});
    const isValid = signal(false);

    const validate = async () => {
        const Joi = await import('joi');
        const result = schema.validate(values(), { abortEarly: false });

        if (!result.error) {
            errors.set({});
            isValid.set(true);
            return result.value;
        }

        const newErrors: Record<string, string> = {};
        for (const detail of result.error.details) {
            newErrors[detail.path.join('.')] = detail.message;
        }
        errors.set(newErrors);
        isValid.set(false);
        return null;
    };

    const setField = <K extends keyof T>(field: K, value: T[K]) => {
        values.update(v => ({ ...v, [field]: value }));
    };

    return { values, errors, isValid, validate, setField };
}
