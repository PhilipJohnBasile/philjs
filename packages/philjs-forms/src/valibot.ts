/**
 * PhilJS Valibot Integration
 */

import { signal } from '@philjs/core';
import type { BaseSchema, Output, ValiError } from 'valibot';

export function useValibotForm<T extends BaseSchema>(schema: T, initialValues: Partial<Output<T>> = {}) {
    const values = signal<Partial<Output<T>>>(initialValues);
    const errors = signal<Record<string, string>>({});
    const isValid = signal(false);

    const validate = async () => {
        const { safeParse } = await import('valibot');
        const result = safeParse(schema, values());

        if (result.success) {
            errors.set({});
            isValid.set(true);
            return result.output;
        } else {
            const newErrors: Record<string, string> = {};
            for (const issue of result.issues) {
                const path = issue.path?.map(p => p.key).join('.') || 'root';
                newErrors[path] = issue.message;
            }
            errors.set(newErrors);
            isValid.set(false);
            return null;
        }
    };

    const setField = <K extends keyof Output<T>>(field: K, value: Output<T>[K]) => {
        values.update(v => ({ ...v, [field]: value }));
    };

    return { values, errors, isValid, validate, setField };
}
