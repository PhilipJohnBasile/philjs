/**
 * PhilJS DaisyUI Presets
 */

export const daisyPreset = {
    name: 'daisy',
    colors: {
        primary: 'oklch(65% 0.24 265)',
        secondary: 'oklch(70% 0.21 340)',
        accent: 'oklch(75% 0.18 190)',
        neutral: 'oklch(25% 0.02 250)',
        'base-100': 'oklch(100% 0 0)',
        info: 'oklch(70% 0.15 220)',
        success: 'oklch(65% 0.2 145)',
        warning: 'oklch(80% 0.18 85)',
        error: 'oklch(60% 0.22 25)',
    },
    components: {
        btn: 'btn',
        card: 'card',
        modal: 'modal',
        drawer: 'drawer',
        navbar: 'navbar',
        footer: 'footer',
        hero: 'hero',
    }
};

export function withDaisy(config: any) {
    return {
        ...config,
        theme: { ...config.theme, colors: { ...config.theme?.colors, ...daisyPreset.colors } },
    };
}

export const daisyComponents = {
    Button: (props: any) => <button class={`btn ${props.variant || ''}`} {...props} />,
    Card: (props: any) => <div class="card bg-base-100 shadow-xl" {...props} />,
    Modal: (props: any) => <dialog class="modal" {...props} />,
};
