/**
 * SubscriptionManager Component
 *
 * Displays and manages user subscriptions including:
 * - Current subscription status
 * - Plan switching
 * - Cancellation
 * - Billing history
 */

import React, { useState, useCallback } from 'react';
import type { Subscription, PaymentMethod, Invoice, Money } from '../index';

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: Money;
  interval: 'month' | 'year';
  features: string[];
  highlighted?: boolean;
}

export interface SubscriptionManagerProps {
  /** Current subscription, if any */
  subscription?: Subscription | null;
  /** Available plans to switch to */
  availablePlans: Plan[];
  /** Customer's payment methods */
  paymentMethods?: PaymentMethod[];
  /** Recent invoices */
  invoices?: Invoice[];
  /** Callback when subscription is updated */
  onUpdateSubscription?: (planId: string) => Promise<void>;
  /** Callback when subscription is canceled */
  onCancelSubscription?: (immediately: boolean) => Promise<void>;
  /** Callback when subscription is resumed */
  onResumeSubscription?: () => Promise<void>;
  /** Callback when payment method is updated */
  onUpdatePaymentMethod?: (paymentMethodId: string) => Promise<void>;
  /** Custom class names */
  className?: string;
  /** Whether operations are in progress */
  isLoading?: boolean;
}

type DialogType = 'cancel' | 'change-plan' | 'change-payment' | null;

/**
 * Subscription Management UI
 *
 * Provides a complete interface for users to manage their subscriptions.
 */
export function SubscriptionManager({
  subscription,
  availablePlans,
  paymentMethods = [],
  invoices = [],
  onUpdateSubscription,
  onCancelSubscription,
  onResumeSubscription,
  onUpdatePaymentMethod,
  className = '',
  isLoading = false,
}: SubscriptionManagerProps) {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPlan = availablePlans.find((p) => p.id === subscription?.priceId);

  const formatMoney = useCallback((money: Money) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: money.currency.toUpperCase(),
    }).format(money.amount / 100);
  }, []);

  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }, []);

  const handleChangePlan = useCallback(async () => {
    if (!selectedPlanId || !onUpdateSubscription) return;

    setIsProcessing(true);
    setError(null);

    try {
      await onUpdateSubscription(selectedPlanId);
      setActiveDialog(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedPlanId, onUpdateSubscription]);

  const handleCancelSubscription = useCallback(
    async (immediately: boolean) => {
      if (!onCancelSubscription) return;

      setIsProcessing(true);
      setError(null);

      try {
        await onCancelSubscription(immediately);
        setActiveDialog(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      } finally {
        setIsProcessing(false);
      }
    },
    [onCancelSubscription]
  );

  const handleResumeSubscription = useCallback(async () => {
    if (!onResumeSubscription) return;

    setIsProcessing(true);
    setError(null);

    try {
      await onResumeSubscription();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume subscription');
    } finally {
      setIsProcessing(false);
    }
  }, [onResumeSubscription]);

  const getStatusBadge = (status: Subscription['status']) => {
    const badges: Record<Subscription['status'], { label: string; color: string }> = {
      active: { label: 'Active', color: 'green' },
      trialing: { label: 'Trial', color: 'blue' },
      past_due: { label: 'Past Due', color: 'orange' },
      canceled: { label: 'Canceled', color: 'gray' },
      unpaid: { label: 'Unpaid', color: 'red' },
      paused: { label: 'Paused', color: 'yellow' },
    };
    return badges[status] || { label: status, color: 'gray' };
  };

  if (isLoading) {
    return (
      <div className={`subscription-manager subscription-manager--loading ${className}`}>
        <div className="subscription-manager__skeleton">
          <div className="subscription-manager__skeleton-line" />
          <div className="subscription-manager__skeleton-line" />
          <div className="subscription-manager__skeleton-line" />
        </div>
      </div>
    );
  }

  return (
    <div className={`subscription-manager ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="subscription-manager__error" role="alert">
          {error}
        </div>
      )}

      {/* No Subscription State */}
      {!subscription && (
        <div className="subscription-manager__empty">
          <h2 className="subscription-manager__title">No Active Subscription</h2>
          <p className="subscription-manager__description">
            Choose a plan to get started with your subscription.
          </p>

          <div className="subscription-manager__plans">
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                className={`subscription-manager__plan ${
                  plan.highlighted ? 'subscription-manager__plan--highlighted' : ''
                }`}
              >
                <h3 className="subscription-manager__plan-name">{plan.name}</h3>
                <p className="subscription-manager__plan-price">
                  {formatMoney(plan.price)}
                  <span className="subscription-manager__plan-interval">/{plan.interval}</span>
                </p>
                {plan.description && (
                  <p className="subscription-manager__plan-description">{plan.description}</p>
                )}
                <ul className="subscription-manager__plan-features">
                  {plan.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
                <button
                  className="subscription-manager__plan-button"
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    onUpdateSubscription?.(plan.id);
                  }}
                  disabled={isProcessing}
                >
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Subscription */}
      {subscription && (
        <>
          {/* Current Plan Section */}
          <div className="subscription-manager__current">
            <div className="subscription-manager__header">
              <h2 className="subscription-manager__title">Your Subscription</h2>
              <span
                className={`subscription-manager__status subscription-manager__status--${
                  getStatusBadge(subscription.status).color
                }`}
              >
                {getStatusBadge(subscription.status).label}
              </span>
            </div>

            {currentPlan && (
              <div className="subscription-manager__plan-info">
                <h3 className="subscription-manager__plan-name">{currentPlan.name}</h3>
                <p className="subscription-manager__plan-price">
                  {formatMoney(currentPlan.price)}
                  <span className="subscription-manager__plan-interval">
                    /{currentPlan.interval}
                  </span>
                </p>
              </div>
            )}

            {/* Billing Cycle */}
            <div className="subscription-manager__billing-cycle">
              <p>
                <strong>Current period:</strong> {formatDate(subscription.currentPeriodStart)} -{' '}
                {formatDate(subscription.currentPeriodEnd)}
              </p>
              {subscription.trialEnd && subscription.status === 'trialing' && (
                <p className="subscription-manager__trial-notice">
                  Trial ends: {formatDate(subscription.trialEnd)}
                </p>
              )}
              {subscription.cancelAtPeriodEnd && (
                <p className="subscription-manager__cancel-notice">
                  Your subscription will be canceled on{' '}
                  {formatDate(subscription.currentPeriodEnd)}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="subscription-manager__actions">
              {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                <>
                  <button
                    className="subscription-manager__button subscription-manager__button--secondary"
                    onClick={() => setActiveDialog('change-plan')}
                    disabled={isProcessing}
                  >
                    Change Plan
                  </button>
                  <button
                    className="subscription-manager__button subscription-manager__button--secondary"
                    onClick={() => setActiveDialog('change-payment')}
                    disabled={isProcessing}
                  >
                    Update Payment Method
                  </button>
                  <button
                    className="subscription-manager__button subscription-manager__button--danger"
                    onClick={() => setActiveDialog('cancel')}
                    disabled={isProcessing}
                  >
                    Cancel Subscription
                  </button>
                </>
              )}

              {subscription.cancelAtPeriodEnd && (
                <button
                  className="subscription-manager__button subscription-manager__button--primary"
                  onClick={handleResumeSubscription}
                  disabled={isProcessing}
                >
                  Resume Subscription
                </button>
              )}
            </div>
          </div>

          {/* Billing History */}
          {invoices.length > 0 && (
            <div className="subscription-manager__history">
              <h3 className="subscription-manager__section-title">Billing History</h3>
              <table className="subscription-manager__table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 5).map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{formatDate(invoice.createdAt)}</td>
                      <td>{formatMoney(invoice.amount)}</td>
                      <td>
                        <span
                          className={`subscription-manager__invoice-status subscription-manager__invoice-status--${invoice.status}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td>
                        {invoice.invoicePdf && (
                          <a
                            href={invoice.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="subscription-manager__invoice-link"
                          >
                            Download
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Change Plan Dialog */}
      {activeDialog === 'change-plan' && (
        <div className="subscription-manager__dialog-overlay" onClick={() => setActiveDialog(null)}>
          <div
            className="subscription-manager__dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="change-plan-title"
          >
            <h3 id="change-plan-title" className="subscription-manager__dialog-title">
              Change Your Plan
            </h3>

            <div className="subscription-manager__plan-options">
              {availablePlans.map((plan) => (
                <label
                  key={plan.id}
                  className={`subscription-manager__plan-option ${
                    selectedPlanId === plan.id ? 'subscription-manager__plan-option--selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={selectedPlanId === plan.id}
                    onChange={() => setSelectedPlanId(plan.id)}
                    disabled={plan.id === subscription?.priceId}
                  />
                  <span className="subscription-manager__plan-option-content">
                    <strong>{plan.name}</strong>
                    <span>
                      {formatMoney(plan.price)}/{plan.interval}
                    </span>
                    {plan.id === subscription?.priceId && (
                      <span className="subscription-manager__current-badge">Current</span>
                    )}
                  </span>
                </label>
              ))}
            </div>

            <div className="subscription-manager__dialog-actions">
              <button
                className="subscription-manager__button subscription-manager__button--secondary"
                onClick={() => setActiveDialog(null)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="subscription-manager__button subscription-manager__button--primary"
                onClick={handleChangePlan}
                disabled={isProcessing || !selectedPlanId || selectedPlanId === subscription?.priceId}
              >
                {isProcessing ? 'Updating...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {activeDialog === 'cancel' && (
        <div className="subscription-manager__dialog-overlay" onClick={() => setActiveDialog(null)}>
          <div
            className="subscription-manager__dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="cancel-title"
          >
            <h3 id="cancel-title" className="subscription-manager__dialog-title">
              Cancel Your Subscription
            </h3>

            <p className="subscription-manager__dialog-text">
              Are you sure you want to cancel your subscription? You have two options:
            </p>

            <div className="subscription-manager__cancel-options">
              <button
                className="subscription-manager__button subscription-manager__button--secondary"
                onClick={() => handleCancelSubscription(false)}
                disabled={isProcessing}
              >
                Cancel at Period End
                <span className="subscription-manager__button-subtext">
                  Keep access until {subscription && formatDate(subscription.currentPeriodEnd)}
                </span>
              </button>

              <button
                className="subscription-manager__button subscription-manager__button--danger"
                onClick={() => handleCancelSubscription(true)}
                disabled={isProcessing}
              >
                Cancel Immediately
                <span className="subscription-manager__button-subtext">
                  Lose access right away
                </span>
              </button>
            </div>

            <button
              className="subscription-manager__dialog-close"
              onClick={() => setActiveDialog(null)}
              disabled={isProcessing}
            >
              Keep My Subscription
            </button>
          </div>
        </div>
      )}

      {/* Change Payment Method Dialog */}
      {activeDialog === 'change-payment' && (
        <div className="subscription-manager__dialog-overlay" onClick={() => setActiveDialog(null)}>
          <div
            className="subscription-manager__dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="payment-title"
          >
            <h3 id="payment-title" className="subscription-manager__dialog-title">
              Update Payment Method
            </h3>

            {paymentMethods.length > 0 ? (
              <div className="subscription-manager__payment-options">
                {paymentMethods.map((method) => (
                  <label key={method.id} className="subscription-manager__payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      defaultChecked={method.isDefault}
                    />
                    <span className="subscription-manager__card-info">
                      <span className="subscription-manager__card-brand">{method.card?.brand}</span>
                      <span className="subscription-manager__card-last4">
                        **** {method.card?.last4}
                      </span>
                      <span className="subscription-manager__card-expiry">
                        {method.card?.expMonth}/{method.card?.expYear}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <p>No saved payment methods. Add a new card below.</p>
            )}

            <div className="subscription-manager__dialog-actions">
              <button
                className="subscription-manager__button subscription-manager__button--secondary"
                onClick={() => setActiveDialog(null)}
              >
                Cancel
              </button>
              <button
                className="subscription-manager__button subscription-manager__button--primary"
                onClick={() => {
                  // Would trigger payment method update
                  setActiveDialog(null);
                }}
              >
                Update Payment Method
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionManager;
