/**
 * PhilJS Native Styling
 *
 * Type-safe styling system with flexbox layout.
 * Similar to React Native's StyleSheet.
 */
import { type Signal } from '@philjs/core';
/**
 * Flex alignment
 */
export type FlexAlignType = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
/**
 * Flex justify content
 */
export type FlexJustifyType = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
/**
 * Flex direction
 */
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
/**
 * Flex wrap
 */
export type FlexWrap = 'wrap' | 'nowrap' | 'wrap-reverse';
/**
 * Position type
 */
export type PositionType = 'absolute' | 'relative';
/**
 * Dimension value
 */
export type DimensionValue = number | string | 'auto';
/**
 * Color value
 */
export type ColorValue = string;
/**
 * Font weight
 */
export type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
/**
 * Text align
 */
export type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify';
/**
 * Text decoration
 */
export type TextDecorationLine = 'none' | 'underline' | 'line-through' | 'underline line-through';
/**
 * Border style
 */
export type BorderStyle = 'solid' | 'dotted' | 'dashed';
/**
 * Overflow
 */
export type Overflow = 'visible' | 'hidden' | 'scroll';
/**
 * Display
 */
export type Display = 'none' | 'flex';
/**
 * Native style (platform-specific)
 */
export type NativeStyle = Record<string, any>;
/**
 * View style properties
 */
export interface ViewStyle {
    flex?: number;
    flexGrow?: number;
    flexShrink?: number;
    flexBasis?: DimensionValue;
    flexDirection?: FlexDirection;
    flexWrap?: FlexWrap;
    alignItems?: FlexAlignType;
    alignSelf?: FlexAlignType | 'auto';
    alignContent?: FlexAlignType | 'space-between' | 'space-around';
    justifyContent?: FlexJustifyType;
    gap?: number;
    rowGap?: number;
    columnGap?: number;
    width?: DimensionValue;
    height?: DimensionValue;
    minWidth?: DimensionValue;
    maxWidth?: DimensionValue;
    minHeight?: DimensionValue;
    maxHeight?: DimensionValue;
    aspectRatio?: number;
    position?: PositionType;
    top?: DimensionValue;
    right?: DimensionValue;
    bottom?: DimensionValue;
    left?: DimensionValue;
    zIndex?: number;
    margin?: DimensionValue;
    marginTop?: DimensionValue;
    marginRight?: DimensionValue;
    marginBottom?: DimensionValue;
    marginLeft?: DimensionValue;
    marginHorizontal?: DimensionValue;
    marginVertical?: DimensionValue;
    padding?: DimensionValue;
    paddingTop?: DimensionValue;
    paddingRight?: DimensionValue;
    paddingBottom?: DimensionValue;
    paddingLeft?: DimensionValue;
    paddingHorizontal?: DimensionValue;
    paddingVertical?: DimensionValue;
    borderWidth?: number;
    borderTopWidth?: number;
    borderRightWidth?: number;
    borderBottomWidth?: number;
    borderLeftWidth?: number;
    borderColor?: ColorValue;
    borderTopColor?: ColorValue;
    borderRightColor?: ColorValue;
    borderBottomColor?: ColorValue;
    borderLeftColor?: ColorValue;
    borderStyle?: BorderStyle;
    borderRadius?: number;
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
    backgroundColor?: ColorValue;
    opacity?: number;
    shadowColor?: ColorValue;
    shadowOffset?: {
        width: number;
        height: number;
    };
    shadowOpacity?: number;
    shadowRadius?: number;
    elevation?: number;
    overflow?: Overflow;
    display?: Display;
    transform?: Transform[];
}
/**
 * Transform types
 */
export type Transform = {
    perspective: number;
} | {
    rotate: string;
} | {
    rotateX: string;
} | {
    rotateY: string;
} | {
    rotateZ: string;
} | {
    scale: number;
} | {
    scaleX: number;
} | {
    scaleY: number;
} | {
    translateX: number;
} | {
    translateY: number;
} | {
    skewX: string;
} | {
    skewY: string;
} | {
    matrix: number[];
};
/**
 * Text style properties
 */
export interface TextStyle extends ViewStyle {
    color?: ColorValue;
    fontFamily?: string;
    fontSize?: number;
    fontStyle?: 'normal' | 'italic';
    fontWeight?: FontWeight;
    fontVariant?: ('small-caps' | 'oldstyle-nums' | 'lining-nums' | 'tabular-nums' | 'proportional-nums')[];
    letterSpacing?: number;
    lineHeight?: number;
    textAlign?: TextAlign;
    textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
    textDecorationLine?: TextDecorationLine;
    textDecorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed';
    textDecorationColor?: ColorValue;
    textShadowColor?: ColorValue;
    textShadowOffset?: {
        width: number;
        height: number;
    };
    textShadowRadius?: number;
    textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
    writingDirection?: 'auto' | 'ltr' | 'rtl';
    includeFontPadding?: boolean;
}
/**
 * Image style properties
 */
export interface ImageStyle extends ViewStyle {
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
    tintColor?: ColorValue;
    overlayColor?: ColorValue;
}
/**
 * Named styles object
 */
export type NamedStyles<T> = {
    [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};
/**
 * Flatten style result
 */
export type StyleProp<T> = T | T[] | null | undefined | false;
/**
 * StyleSheet API
 */
export declare const StyleSheet: {
    /**
     * Create a StyleSheet
     */
    create<T extends NamedStyles<T>>(styles: T): T;
    /**
     * Flatten style array into single style object
     */
    flatten<T extends ViewStyle | TextStyle | ImageStyle>(style: StyleProp<T>): T | undefined;
    /**
     * Compose multiple styles
     */
    compose<T extends ViewStyle | TextStyle | ImageStyle>(style1: StyleProp<T>, style2: StyleProp<T>): StyleProp<T>;
    /**
     * Absolute fill shorthand
     */
    absoluteFill: {
        position: "absolute";
        top: number;
        left: number;
        right: number;
        bottom: number;
    };
    /**
     * Absolute fill object
     */
    absoluteFillObject: {
        position: "absolute";
        top: number;
        left: number;
        right: number;
        bottom: number;
    };
    /**
     * Hairline width (1 pixel on all devices)
     */
    hairlineWidth: number;
};
/**
 * Color scheme type
 */
export type ColorSchemeName = 'light' | 'dark';
/**
 * Current color scheme signal
 */
export declare const colorScheme: Signal<ColorSchemeName>;
/**
 * Hook to get color scheme
 */
export declare function useColorScheme(): ColorSchemeName;
/**
 * Platform-specific style selection
 */
export declare function platformStyles<T extends ViewStyle | TextStyle | ImageStyle>(options: {
    ios?: T;
    android?: T;
    web?: T;
    native?: T;
    default: T;
}): T;
/**
 * Theme colors
 */
export interface ThemeColors {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    error: string;
    onPrimary: string;
    onSecondary: string;
    onBackground: string;
    onSurface: string;
    onError: string;
    text: string;
    textSecondary: string;
    border: string;
    disabled: string;
}
/**
 * Theme spacing
 */
export interface ThemeSpacing {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
}
/**
 * Theme typography
 */
export interface ThemeTypography {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    h4: TextStyle;
    h5: TextStyle;
    h6: TextStyle;
    body1: TextStyle;
    body2: TextStyle;
    caption: TextStyle;
    button: TextStyle;
    overline: TextStyle;
}
/**
 * Full theme definition
 */
export interface Theme {
    colors: ThemeColors;
    spacing: ThemeSpacing;
    typography: ThemeTypography;
    borderRadius: {
        sm: number;
        md: number;
        lg: number;
        full: number;
    };
}
/**
 * Default light theme
 */
export declare const lightTheme: Theme;
/**
 * Default dark theme
 */
export declare const darkTheme: Theme;
/**
 * Current theme signal
 */
export declare const currentTheme: Signal<Theme>;
/**
 * Set theme
 */
export declare function setTheme(theme: Theme): void;
/**
 * Hook to get current theme
 */
export declare function useTheme(): Theme;
/**
 * Hook to get themed styles
 */
export declare function useThemedStyles<T extends NamedStyles<T>>(createStyles: (theme: Theme) => T): T;
/**
 * Breakpoints
 */
export declare const breakpoints: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
};
/**
 * Current breakpoint
 */
export declare const currentBreakpoint: Signal<keyof typeof breakpoints>;
/**
 * Responsive style based on breakpoint
 */
export declare function responsive<T>(options: Partial<Record<keyof typeof breakpoints, T>>): T | undefined;
/**
 * Common style patterns
 */
export declare const commonStyles: {
    row: {
        flexDirection: "row";
    };
    column: {
        flexDirection: "column";
    };
    center: {
        alignItems: "center";
        justifyContent: "center";
    };
    spaceBetween: {
        justifyContent: "space-between";
    };
    wrap: {
        flexWrap: "wrap";
    };
    fill: {
        flex: number;
    };
    fillAbsolute: {
        position: "absolute";
        top: number;
        left: number;
        right: number;
        bottom: number;
    };
    shadow: {
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation?: never;
    } | {
        elevation: number;
        shadowColor?: never;
        shadowOffset?: never;
        shadowOpacity?: never;
        shadowRadius?: never;
    } | {
        shadowColor?: never;
        shadowOffset?: never;
        shadowOpacity?: never;
        shadowRadius?: never;
        elevation?: never;
    };
    shadowLarge: {
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation?: never;
    } | {
        elevation: number;
        shadowColor?: never;
        shadowOffset?: never;
        shadowOpacity?: never;
        shadowRadius?: never;
    } | {
        shadowColor?: never;
        shadowOffset?: never;
        shadowOpacity?: never;
        shadowRadius?: never;
        elevation?: never;
    };
};
//# sourceMappingURL=styles.d.ts.map