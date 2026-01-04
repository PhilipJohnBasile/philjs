
import { effect, signal } from '@philjs/core';

// Bridge Ionic lifecycle events to PhilJS effects
export function useIonicLifecycle() {
    const visible = signal(false);

    effect(() => {
        const handleEnter = () => visible.value = true;
        const handleLeave = () => visible.value = false;

        document.addEventListener('ionViewWillEnter', handleEnter);
        document.addEventListener('ionViewWillLeave', handleLeave);

        return () => {
            document.removeEventListener('ionViewWillEnter', handleEnter);
            document.removeEventListener('ionViewWillLeave', handleLeave);
        };
    });

    return visible;
}

export function IonApp({ children }: { children: any }) {
    // @ts-ignore
    return <ion-app > { children } </ion-app>;
}
