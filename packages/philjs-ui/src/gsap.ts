
export interface ScrollTriggerConfig {
    trigger: string | Element;
    start?: string;
    end?: string;
    scrub?: boolean | number;
    markers?: boolean;
}

export interface AnimationConfig {
    x?: number | string;
    y?: number | string;
    opacity?: number;
    duration?: number;
    stagger?: number;
    [key: string]: any;
}

export function useScrollTrigger(trigger: string, config: {
    onEnter?: () => void;
    onLeave?: () => void;
    animation?: AnimationConfig;
}) {
    console.log('GSAP: Registering ScrollTrigger for', trigger);

    // Mock GSAP Timeline
    const tl = {
        to: (target: string, vars: AnimationConfig) => {
            console.log(`GSAP: Animate "${target}" to`, vars);
            return tl;
        },
        from: (target: string, vars: AnimationConfig) => {
            console.log(`GSAP: Animate "${target}" from`, vars);
            return tl;
        }
    };

    if (config.animation) {
        tl.to(trigger, config.animation);
    }

    // Simulate scroll event
    const mockScroll = () => {
        if (Math.random() > 0.5 && config.onEnter) {
            console.log('GSAP: Trigger Enter');
            config.onEnter();
        }
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('scroll', mockScroll);
    }

    return tl;
}
