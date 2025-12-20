/**
 * Custom Tailwind configuration example
 * Shows advanced configuration options
 */

import { defineConfig } from "philjs-core";
import { createTailwindPlugin } from "philjs-plugin-tailwind";

export default defineConfig({
  plugins: [
    createTailwindPlugin({
      // Custom content paths
      content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./pages/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
      ],

      // Dark mode configuration
      darkMode: "class",

      // Enable JIT mode
      jit: true,

      // Custom theme
      theme: {
        colors: {
          primary: {
            50: "#eff6ff",
            100: "#dbeafe",
            200: "#bfdbfe",
            300: "#93c5fd",
            400: "#60a5fa",
            500: "#3b82f6",
            600: "#2563eb",
            700: "#1d4ed8",
            800: "#1e40af",
            900: "#1e3a8a",
          },
          secondary: {
            500: "#8b5cf6",
            600: "#7c3aed",
            700: "#6d28d9",
          },
        },
        fontFamily: {
          sans: ["Inter", "sans-serif"],
          mono: ["JetBrains Mono", "monospace"],
        },
        borderRadius: {
          sm: "0.25rem",
          DEFAULT: "0.5rem",
          lg: "1rem",
          xl: "1.5rem",
        },
      },

      // Tailwind plugins
      plugins: [
        "@tailwindcss/forms",
        "@tailwindcss/typography",
        "@tailwindcss/aspect-ratio",
      ],

      // Optimization settings
      optimization: {
        purge: true,
        minify: true,
        removeComments: true,
      },
    }),
  ],
});
