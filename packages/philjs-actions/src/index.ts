
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

export function useFormState() {
    // Hook to track action state
    return {
        submitting: false,
        errors: {}
    };
}
