/**
 * Basic Tailwind CSS setup example
 * Shows how to configure the plugin with minimal options
 */

import { defineConfig } from "philjs-core";
import tailwind from "philjs-plugin-tailwind";

export default defineConfig({
  plugins: [
    // Basic setup with defaults
    tailwind(),
  ],
});

/**
 * This will:
 * 1. Generate tailwind.config.js with default content paths
 * 2. Generate postcss.config.js
 * 3. Create src/styles/tailwind.css with base styles
 * 4. Install required dependencies (tailwindcss, autoprefixer, postcss)
 * 5. Enable JIT mode and dark mode (class strategy)
 */
