// @philjs/hooks - Mantine Hook Patterns
// Ticket: #74

import { signal } from '@philjs/core';

export function useDisclosure(initialState = false, callbacks?: { onOpen?: () => void; onClose?: () => void }) {
    const opened = signal(initialState);

    const open = () => {
        if (!opened.get()) {
            opened.set(true);
            callbacks?.onOpen?.();
        }
    };

    const close = () => {
        if (opened.get()) {
            opened.set(false);
            callbacks?.onClose?.();
        }
    };

    const toggle = () => {
        opened.get() ? close() : open();
    };

    return [opened, { open, close, toggle }] as const;
}
