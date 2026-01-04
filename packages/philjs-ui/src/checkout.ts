export interface StripeCheckoutProps {
    sessionId: string;
    publishableKey: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function Checkout(props: StripeCheckoutProps) {
    // Logic to load Stripe.js
    const loadStripe = async () => {
        if (typeof window === 'undefined') return;

        // Check if script exists
        if (!document.querySelector('#stripe-js')) {
            const script = document.createElement('script');
            script.id = 'stripe-js';
            script.src = 'https://js.stripe.com/v3/';
            document.head.appendChild(script);
            await new Promise(resolve => script.onload = resolve);
        }

        console.log('Stripe: Initializing Checkout with key', props.publishableKey);
        // @ts-ignore
        const stripe = window.Stripe(props.publishableKey);

        stripe.redirectToCheckout({
            sessionId: props.sessionId
        }).then((result: any) => {
            if (result.error && props.onCancel) props.onCancel();
        });
    };

    // Auto-init on mount
    setTimeout(loadStripe, 0);

    return `<div id="phil-checkout-container" data-session="${props.sessionId}">
    Redirecting to secure payment...
  </div>`;
}
