import { createSignal, onCleanup, createEffect } from 'philjs';

export interface StripeConfig {
    publicKey: string;
    options?: any;
}

const STRIPE_URL = 'https://js.stripe.com/v3/';
let stripePromise: Promise<any> | null = null;

function loadStripe(key: string) {
    if (!stripePromise) {
        stripePromise = new Promise((resolve, reject) => {
            if (typeof window === 'undefined') return resolve(null);

            if ((window as any).Stripe) {
                return resolve((window as any).Stripe(key));
            }

            const script = document.createElement('script');
            script.src = STRIPE_URL;
            script.async = true;
            script.onload = () => {
                const stripe = (window as any).Stripe(key);
                resolve(stripe);
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }
    return stripePromise;
}

export interface CheckoutProps {
    sessionId?: string;
    publishableKey: string;
    successUrl?: string;
    cancelUrl?: string;
    mode?: 'payment' | 'subscription';
    lineItems?: Array<{ price: string, quantity: number }>;
}

export function Checkout(props: CheckoutProps) {
    const [error, setError] = createSignal<string | null>(null);
    const [loading, setLoading] = createSignal(false);

    const handleCheckout = async () => {
        setLoading(true);
        setError(null);

        try {
            const stripe = await loadStripe(props.publishableKey);
            if (!stripe) {
                throw new Error('Stripe failed to load');
            }

            const result = await stripe.redirectToCheckout({
                sessionId: props.sessionId,
                successUrl: props.successUrl,
                cancelUrl: props.cancelUrl,
                mode: props.mode,
                lineItems: props.lineItems
            });

            if (result.error) {
                setError(result.error.message);
            }
        } catch (err: any) {
            setError(err.message || 'Payment initialization failed');
        } finally {
            setLoading(false);
        }
    };

    // Auto-redirect if sessionId is provided directly (Headless mode)
    createEffect(() => {
        if (props.sessionId && !loading()) {
            handleCheckout();
        }
    });

    return {
        // Expose primitives for custom UI
        loading,
        error,
        submit: handleCheckout,
        // Simple default UI
        render: () => \`
            <div class="phil-checkout">
                \${loading() ? '<span class="spinner">Processing...</span>' : ''}
                \${error() ? \`<div class="error">\${error()}</div>\` : ''}
                <button onclick="\${handleCheckout}" \${loading() ? 'disabled' : ''}>
                    Checkout
                </button>
            </div>
        \`
    };
}
