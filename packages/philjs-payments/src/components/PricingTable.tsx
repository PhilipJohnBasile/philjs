/**
 * PricingTable Component
 *
 * Displays pricing plans with features comparison.
 * Supports monthly/yearly toggle and feature comparison.
 */

import React, { useState, useCallback } from 'react';
import type { Money } from '../index';

export interface PricingFeature {
  name: string;
  description?: string;
  /** Value for each plan (true/false for included, or string for specific limits) */
  values: Record<string, boolean | string | number>;
}

export interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: Money;
  yearlyPrice?: Money;
  /** Savings percentage when billed yearly */
  yearlySavings?: number;
  features: string[];
  /** Whether this plan should be highlighted as recommended */
  highlighted?: boolean;
  /** Call-to-action button text */
  ctaText?: string;
  /** Whether this is the current user's plan */
  isCurrent?: boolean;
  /** Whether this plan is available (false = coming soon) */
  available?: boolean;
}

export interface PricingTableProps {
  /** Plans to display */
  plans: PricingPlan[];
  /** Features for comparison table */
  comparisonFeatures?: PricingFeature[];
  /** Callback when a plan is selected */
  onSelectPlan?: (planId: string, interval: 'month' | 'year') => void;
  /** Whether to show the interval toggle */
  showIntervalToggle?: boolean;
  /** Default billing interval */
  defaultInterval?: 'month' | 'year';
  /** Custom class names */
  className?: string;
  /** Whether selection is disabled */
  disabled?: boolean;
  /** Custom header content */
  header?: React.ReactNode;
  /** Custom footer content */
  footer?: React.ReactNode;
}

/**
 * Pricing Table Component
 *
 * Displays pricing plans in a responsive grid with optional
 * monthly/yearly toggle and feature comparison.
 */
export function PricingTable({
  plans,
  comparisonFeatures,
  onSelectPlan,
  showIntervalToggle = true,
  defaultInterval = 'month',
  className = '',
  disabled = false,
  header,
  footer,
}: PricingTableProps) {
  const [interval, setInterval] = useState<'month' | 'year'>(defaultInterval);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const formatMoney = useCallback((money: Money) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: money.currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(money.amount / 100);
  }, []);

  const handleSelectPlan = useCallback(
    async (planId: string) => {
      if (disabled || isProcessing) return;

      setIsProcessing(planId);
      try {
        await onSelectPlan?.(planId, interval);
      } finally {
        setIsProcessing(null);
      }
    },
    [disabled, interval, isProcessing, onSelectPlan]
  );

  const getPrice = (plan: PricingPlan) => {
    if (interval === 'year' && plan.yearlyPrice) {
      return plan.yearlyPrice;
    }
    return plan.monthlyPrice;
  };

  const hasYearlyPricing = plans.some((p) => p.yearlyPrice);

  return (
    <div className={`pricing-table ${className}`}>
      {/* Custom Header */}
      {header}

      {/* Interval Toggle */}
      {showIntervalToggle && hasYearlyPricing && (
        <div className="pricing-table__toggle">
          <button
            className={`pricing-table__toggle-button ${
              interval === 'month' ? 'pricing-table__toggle-button--active' : ''
            }`}
            onClick={() => setInterval('month')}
            disabled={disabled}
            aria-pressed={interval === 'month'}
          >
            Monthly
          </button>
          <button
            className={`pricing-table__toggle-button ${
              interval === 'year' ? 'pricing-table__toggle-button--active' : ''
            }`}
            onClick={() => setInterval('year')}
            disabled={disabled}
            aria-pressed={interval === 'year'}
          >
            Yearly
            {plans.some((p) => p.yearlySavings) && (
              <span className="pricing-table__savings-badge">
                Save up to {Math.max(...plans.map((p) => p.yearlySavings || 0))}%
              </span>
            )}
          </button>
        </div>
      )}

      {/* Plans Grid */}
      <div className="pricing-table__grid" role="list">
        {plans.map((plan) => {
          const price = getPrice(plan);
          const isAvailable = plan.available !== false;

          return (
            <div
              key={plan.id}
              className={`pricing-table__plan ${
                plan.highlighted ? 'pricing-table__plan--highlighted' : ''
              } ${plan.isCurrent ? 'pricing-table__plan--current' : ''} ${
                !isAvailable ? 'pricing-table__plan--unavailable' : ''
              }`}
              role="listitem"
            >
              {/* Highlighted Badge */}
              {plan.highlighted && (
                <div className="pricing-table__badge">Most Popular</div>
              )}

              {/* Current Plan Badge */}
              {plan.isCurrent && (
                <div className="pricing-table__badge pricing-table__badge--current">
                  Current Plan
                </div>
              )}

              {/* Plan Header */}
              <div className="pricing-table__plan-header">
                <h3 className="pricing-table__plan-name">{plan.name}</h3>
                {plan.description && (
                  <p className="pricing-table__plan-description">{plan.description}</p>
                )}
              </div>

              {/* Pricing */}
              <div className="pricing-table__pricing">
                <span className="pricing-table__price">{formatMoney(price)}</span>
                <span className="pricing-table__interval">
                  /{interval === 'year' ? 'year' : 'month'}
                </span>
                {interval === 'year' && plan.yearlySavings && (
                  <span className="pricing-table__savings">
                    Save {plan.yearlySavings}%
                  </span>
                )}
                {interval === 'year' && plan.yearlyPrice && (
                  <span className="pricing-table__monthly-equivalent">
                    {formatMoney({
                      amount: Math.round(plan.yearlyPrice.amount / 12),
                      currency: plan.yearlyPrice.currency,
                    })}
                    /month billed yearly
                  </span>
                )}
              </div>

              {/* Features List */}
              <ul className="pricing-table__features">
                {plan.features.map((feature, index) => (
                  <li key={index} className="pricing-table__feature">
                    <span className="pricing-table__feature-check">&#10003;</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                className={`pricing-table__cta ${
                  plan.highlighted ? 'pricing-table__cta--primary' : ''
                }`}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={disabled || !isAvailable || plan.isCurrent || isProcessing !== null}
              >
                {isProcessing === plan.id
                  ? 'Processing...'
                  : !isAvailable
                  ? 'Coming Soon'
                  : plan.isCurrent
                  ? 'Current Plan'
                  : plan.ctaText || 'Get Started'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      {comparisonFeatures && comparisonFeatures.length > 0 && (
        <div className="pricing-table__comparison">
          <h3 className="pricing-table__comparison-title">Feature Comparison</h3>
          <table className="pricing-table__comparison-table">
            <thead>
              <tr>
                <th className="pricing-table__feature-header">Feature</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="pricing-table__plan-header-cell">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((feature, index) => (
                <tr key={index} className="pricing-table__comparison-row">
                  <td className="pricing-table__feature-name">
                    {feature.name}
                    {feature.description && (
                      <span
                        className="pricing-table__feature-info"
                        title={feature.description}
                      >
                        ?
                      </span>
                    )}
                  </td>
                  {plans.map((plan) => {
                    const value = feature.values[plan.id];
                    return (
                      <td key={plan.id} className="pricing-table__feature-value">
                        {typeof value === 'boolean' ? (
                          value ? (
                            <span className="pricing-table__check">&#10003;</span>
                          ) : (
                            <span className="pricing-table__cross">&#10005;</span>
                          )
                        ) : (
                          <span>{value}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Custom Footer */}
      {footer}

      {/* FAQ or Additional Info */}
      <div className="pricing-table__info">
        <p className="pricing-table__guarantee">
          All plans include a 30-day money-back guarantee.
        </p>
        <p className="pricing-table__support">
          Questions? <a href="/contact">Contact our sales team</a>
        </p>
      </div>
    </div>
  );
}

export default PricingTable;
