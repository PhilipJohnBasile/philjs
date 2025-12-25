/**
 * PaymentForm Component
 *
 * A secure, PCI-compliant payment form component.
 * Card details are collected via provider-specific elements (Stripe Elements, etc.)
 * to ensure sensitive data never touches your server.
 */

import React, { useState, useCallback, FormEvent } from 'react';
import type { Money, PaymentMethod, Customer } from '../index';

export interface PaymentFormProps {
  /** The provider to use for payment processing */
  provider: 'stripe' | 'paypal' | 'square' | 'paddle';
  /** Amount to charge */
  amount: Money;
  /** Customer information (optional, for pre-filling) */
  customer?: Partial<Customer>;
  /** Available payment methods for the customer */
  savedPaymentMethods?: PaymentMethod[];
  /** Whether to allow saving the payment method */
  allowSavePaymentMethod?: boolean;
  /** Whether this is for a subscription */
  isSubscription?: boolean;
  /** Callback when payment is successful */
  onSuccess?: (result: PaymentFormResult) => void;
  /** Callback when payment fails */
  onError?: (error: Error) => void;
  /** Callback when form is submitted (before processing) */
  onSubmit?: () => void;
  /** Custom submit button text */
  submitButtonText?: string;
  /** Whether to show billing address fields */
  collectBillingAddress?: boolean;
  /** Custom class names for styling */
  className?: string;
  /** Whether the form is disabled */
  disabled?: boolean;
}

export interface PaymentFormResult {
  paymentMethodId: string;
  paymentIntentId?: string;
  customerId?: string;
  savePaymentMethod: boolean;
}

interface FormState {
  email: string;
  name: string;
  selectedPaymentMethodId: string | null;
  savePaymentMethod: boolean;
  billingAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

/**
 * PCI-Compliant Payment Form
 *
 * This component handles the UI for collecting payment information.
 * Actual card details are collected through provider-specific secure elements.
 */
export function PaymentForm({
  provider,
  amount,
  customer,
  savedPaymentMethods = [],
  allowSavePaymentMethod = true,
  isSubscription = false,
  onSuccess,
  onError,
  onSubmit,
  submitButtonText,
  collectBillingAddress = false,
  className = '',
  disabled = false,
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>({
    email: customer?.email || '',
    name: customer?.name || '',
    selectedPaymentMethodId: savedPaymentMethods[0]?.id || null,
    savePaymentMethod: isSubscription, // Always save for subscriptions
    billingAddress: {
      line1: customer?.address?.line1 || '',
      line2: customer?.address?.line2 || '',
      city: customer?.address?.city || '',
      state: customer?.address?.state || '',
      postalCode: customer?.address?.postalCode || '',
      country: customer?.address?.country || 'US',
    },
  });

  const formatAmount = useCallback((money: Money) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: money.currency.toUpperCase(),
    }).format(money.amount / 100);
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (disabled || isProcessing) return;

      setIsProcessing(true);
      setError(null);

      try {
        onSubmit?.();

        // This is where you would integrate with the payment provider's SDK
        // For example, with Stripe Elements or PayPal Buttons
        // The actual implementation depends on the provider

        const result: PaymentFormResult = {
          paymentMethodId: formState.selectedPaymentMethodId || 'pm_new',
          savePaymentMethod: formState.savePaymentMethod,
        };

        onSuccess?.(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Payment failed';
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setIsProcessing(false);
      }
    },
    [formState, disabled, isProcessing, onSubmit, onSuccess, onError]
  );

  const updateFormState = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setFormState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const buttonText =
    submitButtonText ||
    (isSubscription ? `Subscribe ${formatAmount(amount)}/month` : `Pay ${formatAmount(amount)}`);

  return (
    <form onSubmit={handleSubmit} className={`payment-form ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="payment-form__error" role="alert">
          <span className="payment-form__error-icon">!</span>
          <span className="payment-form__error-message">{error}</span>
        </div>
      )}

      {/* Customer Information */}
      <div className="payment-form__section">
        <label className="payment-form__label">
          Email
          <input
            type="email"
            className="payment-form__input"
            value={formState.email}
            onChange={(e) => updateFormState('email', e.target.value)}
            required
            disabled={disabled || isProcessing}
            autoComplete="email"
          />
        </label>

        <label className="payment-form__label">
          Name on card
          <input
            type="text"
            className="payment-form__input"
            value={formState.name}
            onChange={(e) => updateFormState('name', e.target.value)}
            required
            disabled={disabled || isProcessing}
            autoComplete="name"
          />
        </label>
      </div>

      {/* Saved Payment Methods */}
      {savedPaymentMethods.length > 0 && (
        <div className="payment-form__section payment-form__saved-methods">
          <h3 className="payment-form__section-title">Payment Method</h3>

          {savedPaymentMethods.map((method) => (
            <label key={method.id} className="payment-form__radio-label">
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={formState.selectedPaymentMethodId === method.id}
                onChange={() => updateFormState('selectedPaymentMethodId', method.id)}
                disabled={disabled || isProcessing}
              />
              <span className="payment-form__card-info">
                <span className="payment-form__card-brand">{method.card?.brand}</span>
                <span className="payment-form__card-last4">**** {method.card?.last4}</span>
                <span className="payment-form__card-expiry">
                  {method.card?.expMonth}/{method.card?.expYear}
                </span>
              </span>
            </label>
          ))}

          <label className="payment-form__radio-label">
            <input
              type="radio"
              name="paymentMethod"
              value="new"
              checked={formState.selectedPaymentMethodId === null}
              onChange={() => updateFormState('selectedPaymentMethodId', null)}
              disabled={disabled || isProcessing}
            />
            <span>Add new payment method</span>
          </label>
        </div>
      )}

      {/* New Card Input - Provider-specific secure element goes here */}
      {(formState.selectedPaymentMethodId === null || savedPaymentMethods.length === 0) && (
        <div className="payment-form__section payment-form__card-element">
          <h3 className="payment-form__section-title">Card Information</h3>
          {/*
            PCI COMPLIANCE NOTE:
            This is where the provider's secure element should be mounted.

            For Stripe: <CardElement />
            For Square: <PaymentForm />
            For PayPal: PayPal buttons
            For Paddle: Paddle Checkout overlay

            Raw card inputs should NEVER be used here.
          */}
          <div
            id={`${provider}-card-element`}
            className="payment-form__card-element-container"
            aria-label="Card input"
          >
            {/* Provider's secure element will be mounted here */}
            <p className="payment-form__placeholder-text">
              Secure card input ({provider}) will appear here
            </p>
          </div>
        </div>
      )}

      {/* Billing Address */}
      {collectBillingAddress && (
        <div className="payment-form__section payment-form__billing">
          <h3 className="payment-form__section-title">Billing Address</h3>

          <label className="payment-form__label">
            Address Line 1
            <input
              type="text"
              className="payment-form__input"
              value={formState.billingAddress.line1}
              onChange={(e) =>
                updateFormState('billingAddress', {
                  ...formState.billingAddress,
                  line1: e.target.value,
                })
              }
              required
              disabled={disabled || isProcessing}
              autoComplete="address-line1"
            />
          </label>

          <label className="payment-form__label">
            Address Line 2 (optional)
            <input
              type="text"
              className="payment-form__input"
              value={formState.billingAddress.line2}
              onChange={(e) =>
                updateFormState('billingAddress', {
                  ...formState.billingAddress,
                  line2: e.target.value,
                })
              }
              disabled={disabled || isProcessing}
              autoComplete="address-line2"
            />
          </label>

          <div className="payment-form__row">
            <label className="payment-form__label payment-form__label--half">
              City
              <input
                type="text"
                className="payment-form__input"
                value={formState.billingAddress.city}
                onChange={(e) =>
                  updateFormState('billingAddress', {
                    ...formState.billingAddress,
                    city: e.target.value,
                  })
                }
                required
                disabled={disabled || isProcessing}
                autoComplete="address-level2"
              />
            </label>

            <label className="payment-form__label payment-form__label--quarter">
              State
              <input
                type="text"
                className="payment-form__input"
                value={formState.billingAddress.state}
                onChange={(e) =>
                  updateFormState('billingAddress', {
                    ...formState.billingAddress,
                    state: e.target.value,
                  })
                }
                disabled={disabled || isProcessing}
                autoComplete="address-level1"
              />
            </label>

            <label className="payment-form__label payment-form__label--quarter">
              ZIP
              <input
                type="text"
                className="payment-form__input"
                value={formState.billingAddress.postalCode}
                onChange={(e) =>
                  updateFormState('billingAddress', {
                    ...formState.billingAddress,
                    postalCode: e.target.value,
                  })
                }
                required
                disabled={disabled || isProcessing}
                autoComplete="postal-code"
              />
            </label>
          </div>

          <label className="payment-form__label">
            Country
            <select
              className="payment-form__select"
              value={formState.billingAddress.country}
              onChange={(e) =>
                updateFormState('billingAddress', {
                  ...formState.billingAddress,
                  country: e.target.value,
                })
              }
              required
              disabled={disabled || isProcessing}
              autoComplete="country"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="AU">Australia</option>
              {/* Add more countries as needed */}
            </select>
          </label>
        </div>
      )}

      {/* Save Payment Method Checkbox */}
      {allowSavePaymentMethod &&
        !isSubscription &&
        formState.selectedPaymentMethodId === null && (
          <div className="payment-form__section">
            <label className="payment-form__checkbox-label">
              <input
                type="checkbox"
                checked={formState.savePaymentMethod}
                onChange={(e) => updateFormState('savePaymentMethod', e.target.checked)}
                disabled={disabled || isProcessing}
              />
              <span>Save this card for future payments</span>
            </label>
          </div>
        )}

      {/* Submit Button */}
      <button
        type="submit"
        className="payment-form__submit"
        disabled={disabled || isProcessing}
      >
        {isProcessing ? (
          <span className="payment-form__spinner">Processing...</span>
        ) : (
          buttonText
        )}
      </button>

      {/* Security Notice */}
      <p className="payment-form__security-notice">
        <span className="payment-form__lock-icon">🔒</span>
        Your payment is secured with {provider.charAt(0).toUpperCase() + provider.slice(1)}.
        Card details are never stored on our servers.
      </p>
    </form>
  );
}

export default PaymentForm;
