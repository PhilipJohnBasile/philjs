/**
 * PhilJS HTMX Attributes
 */

import { effect } from '@philjs/core';

/** Process HTMX-style attributes on elements */
export function processHtmxAttributes(root: HTMLElement) {
    // hx-get
    root.querySelectorAll('[hx-get]').forEach((el: any) => {
        el.addEventListener('click', async () => {
            const url = el.getAttribute('hx-get');
            const target = el.getAttribute('hx-target') || el;
            const swap = el.getAttribute('hx-swap') || 'innerHTML';
            const html = await fetch(url!).then(r => r.text());
            swapContent(target, html, swap);
        });
    });

    // hx-post
    root.querySelectorAll('[hx-post]').forEach((el: any) => {
        el.addEventListener('submit', async (e: Event) => {
            e.preventDefault();
            const url = el.getAttribute('hx-post');
            const target = el.getAttribute('hx-target') || el;
            const swap = el.getAttribute('hx-swap') || 'innerHTML';
            const formData = new FormData(el);
            const html = await fetch(url!, { method: 'POST', body: formData }).then(r => r.text());
            swapContent(target, html, swap);
        });
    });

    // hx-trigger
    root.querySelectorAll('[hx-trigger]').forEach((el: any) => {
        const trigger = el.getAttribute('hx-trigger');
        if (trigger?.includes('load')) {
            const url = el.getAttribute('hx-get');
            if (url) fetch(url).then(r => r.text()).then(html => {
                swapContent(el.getAttribute('hx-target') || el, html, el.getAttribute('hx-swap') || 'innerHTML');
            });
        }
    });
}

function swapContent(target: Element | string, html: string, swap: string) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;

    switch (swap) {
        case 'innerHTML': el.innerHTML = html; break;
        case 'outerHTML': el.outerHTML = html; break;
        case 'beforebegin': el.insertAdjacentHTML('beforebegin', html); break;
        case 'afterbegin': el.insertAdjacentHTML('afterbegin', html); break;
        case 'beforeend': el.insertAdjacentHTML('beforeend', html); break;
        case 'afterend': el.insertAdjacentHTML('afterend', html); break;
        case 'delete': el.remove(); break;
    }
}

/** Create HTMX-compatible props */
export function hx(config: { get?: string; post?: string; target?: string; swap?: string; trigger?: string }) {
    return {
        'hx-get': config.get,
        'hx-post': config.post,
        'hx-target': config.target,
        'hx-swap': config.swap,
        'hx-trigger': config.trigger,
    };
}
