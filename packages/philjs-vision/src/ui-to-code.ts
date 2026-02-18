/**
 * Vision-to-Code: Convert UI screenshots to framework code
 */

import { createProvider, type VLMProvider, type VLMOptions } from './providers.js';

/**
 * Vision-to-Code Configuration
 */
export interface VisionCodeConfig {
  provider?: 'openai' | 'anthropic' | 'gemini';
  apiKey?: string;
  model?: string;
  framework?: 'react' | 'vue' | 'svelte' | 'solid' | 'html' | 'philjs';
  styling?: 'tailwind' | 'css' | 'styled-components' | 'css-modules' | 'scss';
  typescript?: boolean;
  responsive?: boolean;
  accessibility?: boolean;
}

export interface GeneratedCode {
  code: string;
  framework: string;
  styling: string;
  components?: string[];
  dependencies?: string[];
}

/**
 * Vision-to-Code Generator
 *
 * Converts UI screenshots to framework code using Vision Language Models
 */
export class VisionCode {
  private provider: VLMProvider | null = null;
  private config: VisionCodeConfig;

  constructor(config: VisionCodeConfig = {}) {
    this.config = {
      framework: 'react',
      styling: 'tailwind',
      typescript: true,
      responsive: true,
      accessibility: true,
      ...config,
    };

    if (config.apiKey && config.provider) {
      this.provider = createProvider(config.provider, config.apiKey, config.model);
    }
  }

  /**
   * Generate code from a UI screenshot
   */
  async generate(image: string, options: Partial<VisionCodeConfig> = {}): Promise<GeneratedCode> {
    const config = { ...this.config, ...options };

    if (!this.provider) {
      console.warn('VisionCode: No API provider configured. Returning mock.');
      return this.generateMock(config);
    }

    const systemPrompt = this.buildSystemPrompt(config);
    const userPrompt = this.buildUserPrompt(config);

    const response = await this.provider.analyze(image, userPrompt, {
      systemPrompt,
      maxTokens: 8192,
      temperature: 0.3,
    });

    return this.parseResponse(response.content, config);
  }

  /**
   * Generate multiple component variants
   */
  async generateVariants(
    image: string,
    frameworks: VisionCodeConfig['framework'][],
    options: Partial<VisionCodeConfig> = {}
  ): Promise<GeneratedCode[]> {
    const results: GeneratedCode[] = [];

    for (const framework of frameworks) {
      const result = await this.generate(image, { ...options, framework });
      results.push(result);
    }

    return results;
  }

  /**
   * Analyze UI structure without generating code
   */
  async analyzeUI(image: string): Promise<UIAnalysis> {
    if (!this.provider) {
      return {
        components: ['header', 'main', 'footer'],
        layout: 'single-column',
        colorScheme: ['#ffffff', '#000000', '#3b82f6'],
        interactions: ['click', 'hover'],
      };
    }

    const response = await this.provider.analyze(
      image,
      `Analyze this UI screenshot and provide:
1. List of UI components (buttons, inputs, cards, etc.)
2. Layout structure (grid, flexbox, single-column, etc.)
3. Color scheme (list of hex colors)
4. Potential user interactions

Return as JSON with keys: components, layout, colorScheme, interactions`,
      {
        systemPrompt: 'You are a UI/UX expert analyzing interface designs.',
      }
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { components: [], layout: 'unknown', colorScheme: [], interactions: [] };
    }

    return JSON.parse(jsonMatch[0]) as UIAnalysis;
  }

  private buildSystemPrompt(config: VisionCodeConfig): string {
    const framework = config.framework ?? 'react';
    const styling = config.styling ?? 'tailwind';
    const typescript = config.typescript ?? true;
    const responsive = config.responsive ?? true;
    const accessibility = config.accessibility ?? true;

    return `You are an expert frontend engineer specializing in ${framework}.
Your task is to convert UI screenshots into production-ready code.

Requirements:
- Framework: ${framework}
- Styling: ${styling}
- Language: ${typescript ? 'TypeScript' : 'JavaScript'}
- Responsive: ${responsive ? 'Yes, use responsive design patterns' : 'No'}
- Accessibility: ${accessibility ? 'Yes, include ARIA labels and semantic HTML' : 'Basic'}

Guidelines:
1. Analyze the UI structure carefully
2. Identify reusable components
3. Use semantic HTML elements
4. Match colors, spacing, and typography as closely as possible
5. Include proper event handlers for interactive elements
6. Add appropriate comments for complex logic`;
  }

  private buildUserPrompt(config: VisionCodeConfig): string {
    const framework = config.framework ?? 'react';
    const styling = config.styling ?? 'tailwind';

    return `Convert this UI screenshot into ${framework} code using ${styling} for styling.

Instructions:
1. Replicate the visual design as accurately as possible
2. Create a functional component with proper state management
3. Include all visible UI elements
4. Use appropriate ${styling} classes/styles
5. Return ONLY the code, no explanations

Start with the main component file.`;
  }

  private parseResponse(content: string, config: VisionCodeConfig): GeneratedCode {
    // Extract code blocks from markdown
    const codeMatch = content.match(/```(?:tsx?|jsx?|vue|svelte|html)?\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1]?.trim() ?? content : content;

    // Detect dependencies from imports
    const dependencies: string[] = [];
    const importMatches = code.matchAll(/import .+ from ['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      const pkg = match[1];
      if (pkg && !pkg.startsWith('.') && !pkg.startsWith('@/')) {
        dependencies.push(pkg);
      }
    }

    // Detect components
    const components: string[] = [];
    const componentMatches = code.matchAll(/(?:function|const)\s+([A-Z][a-zA-Z]*)/g);
    for (const match of componentMatches) {
      if (match[1]) {
        components.push(match[1]);
      }
    }

    return {
      code,
      framework: config.framework ?? 'react',
      styling: config.styling ?? 'tailwind',
      components,
      dependencies,
    };
  }

  private generateMock(config: VisionCodeConfig): GeneratedCode {
    const framework = config.framework ?? 'react';
    const styling = config.styling ?? 'tailwind';
    const typescript = config.typescript ?? true;
    const isReact = framework === 'react' || framework === 'philjs';
    const className = isReact ? 'className' : 'class';
    const ext = typescript ? 'tsx' : 'jsx';

    let code: string;

    switch (framework) {
      case 'vue':
        code = `<script setup${typescript ? ' lang="ts"' : ''}>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <header class="bg-white shadow p-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">Vision Generated</h1>
      <nav class="space-x-4">
        <a href="#" class="text-blue-600">Home</a>
        <a href="#" class="text-gray-600">Features</a>
      </nav>
    </header>

    <main class="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h2 class="text-2xl font-semibold mb-4">Generated UI</h2>
      <p class="text-gray-600">This component was generated by PhilJS Vision.</p>
      <div class="grid grid-cols-3 gap-4 mt-6">
        <div class="p-4 border rounded bg-gray-100">Feature A</div>
        <div class="p-4 border rounded bg-gray-100">Feature B</div>
        <div class="p-4 border rounded bg-gray-100">Feature C</div>
      </div>
    </main>
  </div>
</template>`;
        break;

      case 'svelte':
        code = `<script${typescript ? ' lang="ts"' : ''}>
  let count = 0;
</script>

<div class="min-h-screen bg-gray-50 font-sans">
  <header class="bg-white shadow p-4 flex justify-between items-center">
    <h1 class="text-xl font-bold text-gray-800">Vision Generated</h1>
    <nav class="space-x-4">
      <a href="#" class="text-blue-600">Home</a>
      <a href="#" class="text-gray-600">Features</a>
    </nav>
  </header>

  <main class="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
    <h2 class="text-2xl font-semibold mb-4">Generated UI</h2>
    <p class="text-gray-600">This component was generated by PhilJS Vision.</p>
    <div class="grid grid-cols-3 gap-4 mt-6">
      <div class="p-4 border rounded bg-gray-100">Feature A</div>
      <div class="p-4 border rounded bg-gray-100">Feature B</div>
      <div class="p-4 border rounded bg-gray-100">Feature C</div>
    </div>
  </main>
</div>`;
        break;

      case 'html':
        code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vision Generated</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gray-50 font-sans">
  <header class="bg-white shadow p-4 flex justify-between items-center">
    <h1 class="text-xl font-bold text-gray-800">Vision Generated</h1>
    <nav class="space-x-4">
      <a href="#" class="text-blue-600">Home</a>
      <a href="#" class="text-gray-600">Features</a>
    </nav>
  </header>

  <main class="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
    <h2 class="text-2xl font-semibold mb-4">Generated UI</h2>
    <p class="text-gray-600">This component was generated by PhilJS Vision.</p>
    <div class="grid grid-cols-3 gap-4 mt-6">
      <div class="p-4 border rounded bg-gray-100">Feature A</div>
      <div class="p-4 border rounded bg-gray-100">Feature B</div>
      <div class="p-4 border rounded bg-gray-100">Feature C</div>
    </div>
  </main>
</body>
</html>`;
        break;

      default: // react, solid, philjs
        code = `${typescript ? "import type { FC } from 'react';\n" : ''}
export ${typescript ? 'const GeneratedComponent: FC = ' : 'default function GeneratedComponent'}() ${typescript ? '=>' : ''} {
  return (
    <div ${className}="min-h-screen bg-gray-50 font-sans">
      <header ${className}="bg-white shadow p-4 flex justify-between items-center">
        <h1 ${className}="text-xl font-bold text-gray-800">Vision Generated</h1>
        <nav ${className}="space-x-4">
          <a href="#" ${className}="text-blue-600">Home</a>
          <a href="#" ${className}="text-gray-600">Features</a>
        </nav>
      </header>

      <main ${className}="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
        <h2 ${className}="text-2xl font-semibold mb-4">Generated UI</h2>
        <p ${className}="text-gray-600">This component was generated by PhilJS Vision.</p>
        <div ${className}="grid grid-cols-3 gap-4 mt-6">
          <div ${className}="p-4 border rounded bg-gray-100">Feature A</div>
          <div ${className}="p-4 border rounded bg-gray-100">Feature B</div>
          <div ${className}="p-4 border rounded bg-gray-100">Feature C</div>
        </div>
      </main>
    </div>
  );
}${typescript ? '\n\nexport default GeneratedComponent;' : ''}`;
    }

    return {
      code,
      framework,
      styling,
      components: ['GeneratedComponent'],
      dependencies: framework === 'vue' ? ['vue'] : framework === 'svelte' ? ['svelte'] : ['react'],
    };
  }
}

export interface UIAnalysis {
  components: string[];
  layout: string;
  colorScheme: string[];
  interactions: string[];
}

/**
 * Convenience function for quick UI-to-code conversion
 */
export async function uiFromImage(
  image: string,
  config: VisionCodeConfig = {}
): Promise<GeneratedCode> {
  const generator = new VisionCode(config);
  return generator.generate(image);
}
