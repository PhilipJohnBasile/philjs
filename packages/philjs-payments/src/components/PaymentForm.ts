/**
 * PaymentForm Component
 * A secure, PCI-compliant payment form
 */

export interface PaymentFormProps {
  onSuccess?: ((result: unknown) => void) | undefined;
  onError?: ((error: Error) => void) | undefined;
  amount?: number | undefined;
  currency?: string | undefined;
  submitLabel?: string | undefined;
}

/**
 * PaymentForm component placeholder
 * In production, this would integrate with provider SDKs
 */
export const PaymentForm = {
  displayName: 'PaymentForm',
} as const;
