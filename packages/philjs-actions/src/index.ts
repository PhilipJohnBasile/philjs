
export function createAction<T>(handler: (formData: FormData) => Promise<T>) {
    return async (event: Event) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const body = new FormData(form);

        try {
            const result = await handler(body);
            return { success: true, data: result };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };
}

import { createSignal } from 'philjs';

export function useFormState<T>(action: (formData: FormData) => Promise<{ success: boolean; data?: T; error?: string }>) {
    const [isSubmitting, setSubmitting] = createSignal(false);
    const [errors, setErrors] = createSignal<Record<string, string>>({});
    const [data, setData] = createSignal<T | null>(null);

    const submit = async (formData: FormData) => {
        setSubmitting(true);
        setErrors({});
        try {
            const result = await action(formData);
            if (!result.success) {
                setErrors({ form: result.error || 'Unknown error' });
            } else {
                setData(result.data || null);
            }
            return result;
        } catch (e: any) {
            setErrors({ form: e.message });
            return { success: false, error: e.message };
        } finally {
            setSubmitting(false);
        }
    };

    return {
        submit,
        submitting: isSubmitting, // Signal getter
        errors: errors,           // Signal getter
        data: data               // Signal getter
    };
}
