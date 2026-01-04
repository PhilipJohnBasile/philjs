/**
 * PhilJS Turbo/Hotwire Integration
 */

import { signal, effect } from '@philjs/core';

/** Stream HTML fragments like Turbo Streams */
export function createTurboStream() {
    return {
        append: (target: string, html: string) => {
            const el = document.getElementById(target);
            if (el) el.insertAdjacentHTML('beforeend', html);
        },
        prepend: (target: string, html: string) => {
            const el = document.getElementById(target);
            if (el) el.insertAdjacentHTML('afterbegin', html);
        },
        replace: (target: string, html: string) => {
            const el = document.getElementById(target);
            if (el) el.outerHTML = html;
        },
        update: (target: string, html: string) => {
            const el = document.getElementById(target);
            if (el) el.innerHTML = html;
        },
        remove: (target: string) => {
            document.getElementById(target)?.remove();
        }
    };
}

/** SSE-based streaming like Turbo */
export function useStreamSource(url: string) {
    const connected = signal(false);

    effect(() => {
        const source = new EventSource(url);
        source.onopen = () => connected.set(true);
        source.onmessage = (e) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(e.data, 'text/html');
            const streams = doc.querySelectorAll('turbo-stream');
            const ts = createTurboStream();
            streams.forEach(stream => {
                const action = stream.getAttribute('action') as 'append' | 'prepend' | 'replace' | 'update' | 'remove';
                const target = stream.getAttribute('target') || '';
                ts[action](target, stream.innerHTML);
            });
        };
        return () => source.close();
    });

    return { connected };
}
