/**
 * Theme customization examples
 * Shows how to use the theme generator utilities
 */

import { defineConfig } from "@philjs/core";
import { createTailwindPlugin } from "philjs-plugin-tailwind";
import {
  generateBrandTheme,
  generateTypographyScale,
  generateSpacingScale,
  mergeThemes,
  presetThemes,
} from "philjs-plugin-tailwind/theme-generator";

// Example 1: Generate theme from brand colors
const brandTheme = generateBrandTheme({
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  accent: "#06b6d4",
  neutral: "#64748b",
});

// Example 2: Custom typography scale
const typographyTheme = {
  fontSize: generateTypographyScale(16, 1.25),
};

// Example 3: Custom spacing scale
const spacingTheme = {
  spacing: generateSpacingScale(4),
};

// Example 4: Merge multiple themes
const customTheme = mergeThemes(
  brandTheme,
  typographyTheme,
  spacingTheme,
  {
    extend: {
      animation: {
        "fade-in": "fadeIn 0.5s ease-in",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  }
);

// Use in PhilJS config
export default defineConfig({
  plugins: [
    createTailwindPlugin({
      theme: customTheme.extend,
    }),
  ],
});

// Example 5: Using preset themes
export const modernConfig = defineConfig({
  plugins: [
    createTailwindPlugin({
      theme: presetThemes.modern.extend,
    }),
  ],
});

export const minimalConfig = defineConfig({
  plugins: [
    createTailwindPlugin({
      theme: presetThemes.minimal.extend,
    }),
  ],
});

export const vibrantConfig = defineConfig({
  plugins: [
    createTailwindPlugin({
      theme: presetThemes.vibrant.extend,
    }),
  ],
});
