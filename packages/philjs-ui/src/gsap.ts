import { createSignal, onCleanup } from 'philjs';

export interface ScrollTriggerOptions {
    threshold?: number;
    rootMargin?: string;
    once?: boolean;
}

export function useScrollTrigger(selector: string | HTMLElement, options: ScrollTriggerOptions = {}) {
    const [isVisible, setIsVisible] = createSignal(false);

    // We assume this hook is called inside a component setup
    // Effect will run when component mounts

    const initObserver = () => {
        if (typeof window === 'undefined') return;

        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!el) {
            console.warn('ScrollTrigger: Element not found', selector);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (options.once) {
                        observer.disconnect();
                    }
                } else {
                    if (!options.once) {
                        setIsVisible(false);
                    }
                }
            });
        }, {
            threshold: options.threshold || 0.1,
            rootMargin: options.rootMargin || '0px'
        });

        observer.observe(el);
        return observer;
    };

    let observer: IntersectionObserver | undefined;

    // Defer execution until DOM is likely ready (microtask)
    Promise.resolve().then(() => {
        observer = initObserver();
    });

    onCleanup(() => {
        if (observer) {
            observer.disconnect();
        }
    });

    return isVisible;
}
