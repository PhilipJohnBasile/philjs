export interface ClerkAppearance {
    baseTheme?: any;
    layout?: {
        socialButtonsPlacement?: 'top' | 'bottom';
        logoPlacement?: 'inside' | 'none';
    };
    variables?: {
        colorPrimary?: string;
        borderRadius?: string;
        fontFamily?: string;
        [key: string]: any;
    };
}
export declare function SignIn(props: {
    appearance?: ClerkAppearance;
    redirectUrl?: string;
}): string;
