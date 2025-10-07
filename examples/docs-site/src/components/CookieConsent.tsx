import { signal, effect } from 'philjs-core';

export interface CookieConsentProps {
  /** Position of the banner */
  position?: 'bottom' | 'top';
  /** Privacy policy URL */
  privacyPolicyUrl?: string;
  /** Custom message */
  message?: string;
  /** Button text */
  acceptButtonText?: string;
  /** Decline button text (optional) */
  declineButtonText?: string;
  /** Show decline button */
  showDecline?: boolean;
  /** Cookie preferences categories */
  showPreferences?: boolean;
  /** Storage key for consent */
  storageKey?: string;
  /** Callback when user accepts */
  onAccept?: (preferences: CookiePreferences) => void;
  /** Callback when user declines */
  onDecline?: () => void;
  className?: string;
}

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

/**
 * CookieConsent Component
 *
 * GDPR/CCPA compliant cookie consent banner with granular preferences.
 */
export function CookieConsent({
  position = 'bottom',
  privacyPolicyUrl = '/privacy',
  message = 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
  acceptButtonText = 'Accept All',
  declineButtonText = 'Decline',
  showDecline = true,
  showPreferences = true,
  storageKey = 'cookie-consent',
  onAccept,
  onDecline,
  className = '',
}: CookieConsentProps = {}) {
  const isVisible = signal(false);
  const showDetails = signal(false);
  const preferences = signal<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
  });

  // Check if consent was already given
  effect(() => {
    const consent = localStorage.getItem(storageKey);
    if (!consent) {
      isVisible.set(true);
    }
  });

  const handleAccept = (customPrefs?: Partial<CookiePreferences>) => {
    const finalPrefs = customPrefs ? { ...preferences(), ...customPrefs } : preferences();
    localStorage.setItem(storageKey, JSON.stringify(finalPrefs));
    isVisible.set(false);
    onAccept?.(finalPrefs);
  };

  const handleAcceptAll = () => {
    handleAccept({
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
    });
  };

  const handleDecline = () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        necessary: true,
        analytics: false,
        marketing: false,
        personalization: false,
      })
    );
    isVisible.set(false);
    onDecline?.();
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key !== 'necessary') {
      preferences.set({ ...preferences(), [key]: !preferences()[key] });
    }
  };

  if (!isVisible()) return null;

  return (
    <div
      className={`cookie-consent ${className}`}
      style={{
        position: 'fixed',
        [position]: 0,
        left: 0,
        right: 0,
        background: 'var(--color-bg)',
        border: position === 'bottom' ? '1px solid var(--color-border)' : undefined,
        borderTop: position === 'top' ? '1px solid var(--color-border)' : undefined,
        boxShadow: position === 'bottom' ? '0 -4px 12px rgba(0, 0, 0, 0.1)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
        zIndex: 10000,
        padding: '1.5rem',
        animation: position === 'bottom' ? 'slideInUp 0.3s ease-out' : 'slideInDown 0.3s ease-out',
      }}
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="true"
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Message */}
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-text)', margin: '0 0 0.5rem 0' }}>
            {message}
          </p>
          <a
            href={privacyPolicyUrl}
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-brand)',
              textDecoration: 'underline',
            }}
          >
            Learn more about our privacy policy
          </a>
        </div>

        {/* Preferences */}
        {showDetails() && showPreferences && (
          <div
            style={{
              padding: '1rem',
              background: 'var(--color-bg-alt)',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}
          >
            <h3
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                margin: '0 0 1rem 0',
              }}
            >
              Cookie Preferences
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                {
                  key: 'necessary' as const,
                  label: 'Necessary Cookies',
                  description: 'Required for the website to function properly. Cannot be disabled.',
                  disabled: true,
                },
                {
                  key: 'analytics' as const,
                  label: 'Analytics Cookies',
                  description: 'Help us understand how visitors interact with our website.',
                },
                {
                  key: 'marketing' as const,
                  label: 'Marketing Cookies',
                  description: 'Used to track visitors across websites for advertising purposes.',
                },
                {
                  key: 'personalization' as const,
                  label: 'Personalization Cookies',
                  description: 'Allow us to remember your preferences and customize your experience.',
                },
              ].map((pref) => (
                <label
                  key={pref.key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    cursor: pref.disabled ? 'not-allowed' : 'pointer',
                    opacity: pref.disabled ? 0.6 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={preferences()[pref.key]}
                    disabled={pref.disabled}
                    onChange={() => togglePreference(pref.key)}
                    style={{
                      marginTop: '0.25rem',
                      cursor: pref.disabled ? 'not-allowed' : 'pointer',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {pref.label}
                    </div>
                    <div
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {pref.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <button
            onClick={handleAcceptAll}
            style={{
              padding: '0.625rem 1.5rem',
              background: 'var(--color-brand)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.9375rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {acceptButtonText}
          </button>

          {showPreferences && (
            <button
              onClick={() => {
                if (showDetails()) {
                  handleAccept();
                } else {
                  showDetails.set(true);
                }
              }}
              style={{
                padding: '0.625rem 1.5rem',
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '0.9375rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {showDetails() ? 'Save Preferences' : 'Customize'}
            </button>
          )}

          {showDecline && (
            <button
              onClick={handleDecline}
              style={{
                padding: '0.625rem 1.5rem',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                border: 'none',
                fontSize: '0.9375rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {declineButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Get current cookie consent
 */
export function getCookieConsent(storageKey = 'cookie-consent'): CookiePreferences | null {
  if (typeof localStorage === 'undefined') return null;

  const consent = localStorage.getItem(storageKey);
  return consent ? JSON.parse(consent) : null;
}

/**
 * Check if a specific cookie type is allowed
 */
export function isCookieAllowed(
  type: keyof CookiePreferences,
  storageKey = 'cookie-consent'
): boolean {
  const consent = getCookieConsent(storageKey);
  return consent ? consent[type] : false;
}

/**
 * Reset cookie consent (for testing or user request)
 */
export function resetCookieConsent(storageKey = 'cookie-consent'): void {
  localStorage.removeItem(storageKey);
}

/**
 * Add slide animations
 */
if (typeof document !== 'undefined') {
  const styleId = 'cookie-consent-animations';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes slideInUp {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      @keyframes slideInDown {
        from {
          transform: translateY(-100%);
        }
        to {
          transform: translateY(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .cookie-consent {
          animation: none !important;
        }

        @keyframes slideInUp,
        @keyframes slideInDown {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Example usage:
 *
 * Add to your app root:
 * <CookieConsent
 *   position="bottom"
 *   showPreferences
 *   onAccept={(prefs) => {
 *     if (prefs.analytics) {
 *       // Initialize analytics
 *     }
 *   }}
 * />
 *
 * Check consent before loading services:
 * if (isCookieAllowed('analytics')) {
 *   // Load analytics script
 * }
 *
 * Get full consent:
 * const consent = getCookieConsent();
 * if (consent?.analytics) {
 *   // Do something
 * }
 */
