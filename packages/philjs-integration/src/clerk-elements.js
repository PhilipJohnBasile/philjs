import { signal, effect } from '@philjs/core';
const CLERK_JS = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
function loadClerk(pubKey) {
    if (typeof window === 'undefined')
        return Promise.resolve(null);
    if (window.Clerk)
        return Promise.resolve(window.Clerk);
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = CLERK_JS;
        script.async = true;
        script.onload = async () => {
            const clerk = window.Clerk;
            await clerk.load({ publishableKey: pubKey });
            resolve(clerk);
        };
        document.body.appendChild(script);
    });
}
export function SignIn(props) {
    const containerId = 'clerk-signin-' + Math.random().toString(36).substr(2, 5);
    effect(() => {
        // Normally obtained from ENV
        const key = window.__CLERK_PUBLISHABLE_KEY__;
        if (key) {
            loadClerk(key).then(clerk => {
                if (clerk) {
                    const el = document.getElementById(containerId);
                    if (el)
                        clerk.mountSignIn(el, props);
                }
            });
        }
    });
    const styles = props.appearance?.variables || {};
    const styleStr = Object.entries(styles)
        .map(([k, v]) => `--cl-${k}: ${v}`)
        .join('; ');
    return `<div id="${containerId}" class="clerk-container" style="${styleStr}"></div>`;
}
//# sourceMappingURL=clerk-elements.js.map