/**
 * PhilJS Payments Hooks
 * React hooks for payment functionality
 */
import type { Subscription, Invoice, CheckoutSession } from './index.js';
export interface UsePaymentResult {
    createCheckout: (items: unknown[]) => Promise<CheckoutSession>;
    loading: boolean;
    error: Error | null;
}
export interface UseSubscriptionResult {
    subscription: Subscription | null;
    loading: boolean;
    error: Error | null;
    cancel: () => Promise<void>;
}
export interface UseInvoicesResult {
    invoices: Invoice[];
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}
/**
 * Hook for creating payment checkouts
 */
export declare function usePayment(): UsePaymentResult;
/**
 * Hook for managing subscriptions
 */
export declare function useSubscription(): UseSubscriptionResult;
/**
 * Hook for listing invoices
 */
export declare function useInvoices(): UseInvoicesResult;
//# sourceMappingURL=hooks.d.ts.map