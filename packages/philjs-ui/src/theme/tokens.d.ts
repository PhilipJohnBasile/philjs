/**
 * PhilJS UI - Design Tokens
 *
 * Core design system values for colors, spacing, typography, etc.
 */
export declare const colors: {
    primary: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
        950: string;
    };
    gray: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
        950: string;
    };
    success: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
    };
    warning: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
    };
    error: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
    };
    info: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
    };
    white: string;
    black: string;
    transparent: string;
};
export declare const spacing: {
    0: string;
    px: string;
    0.5: string;
    1: string;
    1.5: string;
    2: string;
    2.5: string;
    3: string;
    3.5: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
    9: string;
    10: string;
    11: string;
    12: string;
    14: string;
    16: string;
    20: string;
    24: string;
    28: string;
    32: string;
    36: string;
    40: string;
    44: string;
    48: string;
    52: string;
    56: string;
    60: string;
    64: string;
    72: string;
    80: string;
    96: string;
};
export declare const fontSize: {
    xs: (string | {
        lineHeight: string;
    })[];
    sm: (string | {
        lineHeight: string;
    })[];
    base: (string | {
        lineHeight: string;
    })[];
    lg: (string | {
        lineHeight: string;
    })[];
    xl: (string | {
        lineHeight: string;
    })[];
    '2xl': (string | {
        lineHeight: string;
    })[];
    '3xl': (string | {
        lineHeight: string;
    })[];
    '4xl': (string | {
        lineHeight: string;
    })[];
    '5xl': (string | {
        lineHeight: string;
    })[];
    '6xl': (string | {
        lineHeight: string;
    })[];
    '7xl': (string | {
        lineHeight: string;
    })[];
    '8xl': (string | {
        lineHeight: string;
    })[];
    '9xl': (string | {
        lineHeight: string;
    })[];
};
export declare const fontWeight: {
    thin: string;
    extralight: string;
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
    extrabold: string;
    black: string;
};
export declare const fontFamily: {
    sans: string;
    serif: string;
    mono: string;
};
export declare const borderRadius: {
    none: string;
    sm: string;
    DEFAULT: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
};
export declare const boxShadow: {
    sm: string;
    DEFAULT: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
    none: string;
};
export declare const transition: {
    none: string;
    all: string;
    DEFAULT: string;
    colors: string;
    opacity: string;
    shadow: string;
    transform: string;
};
export declare const zIndex: {
    auto: string;
    0: string;
    10: string;
    20: string;
    30: string;
    40: string;
    50: string;
    dropdown: string;
    sticky: string;
    fixed: string;
    modalBackdrop: string;
    modal: string;
    popover: string;
    tooltip: string;
};
export declare const breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
};
export declare const defaultTheme: {
    colors: {
        primary: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
            950: string;
        };
        gray: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
            950: string;
        };
        success: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
        };
        warning: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
        };
        error: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
        };
        info: {
            50: string;
            100: string;
            200: string;
            300: string;
            400: string;
            500: string;
            600: string;
            700: string;
            800: string;
            900: string;
        };
        white: string;
        black: string;
        transparent: string;
    };
    spacing: {
        0: string;
        px: string;
        0.5: string;
        1: string;
        1.5: string;
        2: string;
        2.5: string;
        3: string;
        3.5: string;
        4: string;
        5: string;
        6: string;
        7: string;
        8: string;
        9: string;
        10: string;
        11: string;
        12: string;
        14: string;
        16: string;
        20: string;
        24: string;
        28: string;
        32: string;
        36: string;
        40: string;
        44: string;
        48: string;
        52: string;
        56: string;
        60: string;
        64: string;
        72: string;
        80: string;
        96: string;
    };
    fontSize: {
        xs: (string | {
            lineHeight: string;
        })[];
        sm: (string | {
            lineHeight: string;
        })[];
        base: (string | {
            lineHeight: string;
        })[];
        lg: (string | {
            lineHeight: string;
        })[];
        xl: (string | {
            lineHeight: string;
        })[];
        '2xl': (string | {
            lineHeight: string;
        })[];
        '3xl': (string | {
            lineHeight: string;
        })[];
        '4xl': (string | {
            lineHeight: string;
        })[];
        '5xl': (string | {
            lineHeight: string;
        })[];
        '6xl': (string | {
            lineHeight: string;
        })[];
        '7xl': (string | {
            lineHeight: string;
        })[];
        '8xl': (string | {
            lineHeight: string;
        })[];
        '9xl': (string | {
            lineHeight: string;
        })[];
    };
    fontWeight: {
        thin: string;
        extralight: string;
        light: string;
        normal: string;
        medium: string;
        semibold: string;
        bold: string;
        extrabold: string;
        black: string;
    };
    fontFamily: {
        sans: string;
        serif: string;
        mono: string;
    };
    borderRadius: {
        none: string;
        sm: string;
        DEFAULT: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        full: string;
    };
    boxShadow: {
        sm: string;
        DEFAULT: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
        inner: string;
        none: string;
    };
    transition: {
        none: string;
        all: string;
        DEFAULT: string;
        colors: string;
        opacity: string;
        shadow: string;
        transform: string;
    };
    zIndex: {
        auto: string;
        0: string;
        10: string;
        20: string;
        30: string;
        40: string;
        50: string;
        dropdown: string;
        sticky: string;
        fixed: string;
        modalBackdrop: string;
        modal: string;
        popover: string;
        tooltip: string;
    };
    breakpoints: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
        '2xl': string;
    };
};
export type Theme = typeof defaultTheme;
//# sourceMappingURL=tokens.d.ts.map