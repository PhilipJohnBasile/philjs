/**
 * PhilJS Payments Hooks
 * React hooks for payment functionality
 */
/**
 * Hook for creating payment checkouts
 */
export function usePayment() {
    // Placeholder implementation
    return {
        createCheckout: async () => {
            throw new Error('usePayment must be used within a PaymentProvider');
        },
        loading: false,
        error: null,
    };
}
/**
 * Hook for managing subscriptions
 */
export function useSubscription() {
    // Placeholder implementation
    return {
        subscription: null,
        loading: false,
        error: null,
        cancel: async () => {
            throw new Error('useSubscription must be used within a PaymentProvider');
        },
    };
}
/**
 * Hook for listing invoices
 */
export function useInvoices() {
    // Placeholder implementation
    return {
        invoices: [],
        loading: false,
        error: null,
        refresh: async () => {
            throw new Error('useInvoices must be used within a PaymentProvider');
        },
    };
}
//# sourceMappingURL=hooks.js.map