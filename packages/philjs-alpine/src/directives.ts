/**
 * PhilJS Alpine.js Directives
 */

import { signal, effect } from '@philjs/core';

/** Alpine.js x-data equivalent */
export function xData<T extends Record<string, any>>(initial: T) {
    const state: Record<string, any> = {};
    for (const [key, value] of Object.entries(initial)) {
        state[key] = signal(value);
    }
    return state;
}

/** Alpine.js x-show equivalent */
export function xShow(condition: () => boolean) {
    return { style: { display: condition() ? '' : 'none' } };
}

/** Alpine.js x-if equivalent */
export function xIf<T>(condition: () => boolean, render: () => T): T | null {
    return condition() ? render() : null;
}

/** Alpine.js x-for equivalent */
export function xFor<T, R>(items: () => T[], render: (item: T, index: number) => R): R[] {
    return items().map((item, i) => render(item, i));
}

/** Alpine.js x-bind equivalent */
export function xBind(bindings: Record<string, () => any>) {
    const result: Record<string, any> = {};
    for (const [key, fn] of Object.entries(bindings)) {
        result[key] = fn();
    }
    return result;
}

/** Alpine.js x-on equivalent */
export function xOn(events: Record<string, (e: Event) => void>) {
    const result: Record<string, any> = {};
    for (const [event, handler] of Object.entries(events)) {
        result[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = handler;
    }
    return result;
}

/** Alpine.js x-model equivalent */
export function xModel(sig: ReturnType<typeof signal<string>>) {
    return {
        value: sig(),
        onInput: (e: any) => sig.set(e.target.value),
    };
}

/** Alpine.js x-transition equivalent */
export const xTransition = {
    enter: 'transition ease-out duration-200',
    enterFrom: 'opacity-0 scale-95',
    enterTo: 'opacity-100 scale-100',
    leave: 'transition ease-in duration-75',
    leaveFrom: 'opacity-100 scale-100',
    leaveTo: 'opacity-0 scale-95',
};
