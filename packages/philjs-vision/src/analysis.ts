/**
 * Image Analysis utilities
 */

import type { VLMProvider, VLMOptions } from './providers.js';
import type { BoundingBox } from './ocr.js';

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox?: BoundingBox;
  attributes?: Record<string, string>;
}

export interface SceneAnalysis {
  description: string;
  objects: DetectedObject[];
  colors: ColorInfo[];
  mood?: string;
  setting?: string;
  lighting?: string;
}

export interface ColorInfo {
  name: string;
  hex: string;
  percentage: number;
}

export interface FaceAnalysis {
  count: number;
  faces: FaceInfo[];
}

export interface FaceInfo {
  boundingBox?: BoundingBox;
  age?: string;
  gender?: string;
  expression?: string;
  attributes?: Record<string, string>;
}

export interface ImageComparison {
  similarity: number;
  differences: string[];
  commonElements: string[];
}

export interface ImageQuality {
  overall: 'excellent' | 'good' | 'fair' | 'poor';
  sharpness: number;
  exposure: 'underexposed' | 'normal' | 'overexposed';
  noise: 'low' | 'medium' | 'high';
  composition?: string;
  issues?: string[];
}

export interface ContentModeration {
  safe: boolean;
  categories: ModerationCategory[];
}

export interface ModerationCategory {
  name: string;
  detected: boolean;
  confidence: number;
}

/**
 * VLM-based Image Analyzer
 */
export class ImageAnalyzer {
  private provider: VLMProvider;

  constructor(provider: VLMProvider) {
    this.provider = provider;
  }

  /**
   * Describe an image in natural language
   */
  async describe(image: string, options: VLMOptions = {}): Promise<string> {
    const response = await this.provider.analyze(
      image,
      'Describe this image in detail. Include what you see, the setting, any notable objects, people, or activities.',
      {
        ...options,
        systemPrompt: 'You are an expert image analyst. Provide detailed, accurate descriptions.',
      }
    );

    return response.content;
  }

  /**
   * Detect objects in an image
   */
  async detectObjects(image: string, options: VLMOptions = {}): Promise<DetectedObject[]> {
    const response = await this.provider.analyze(
      image,
      `List all objects you can identify in this image.
For each object, provide:
- label: the object name
- confidence: how confident you are (0-1)
- attributes: any notable characteristics

Return as a JSON array.`,
      {
        ...options,
        systemPrompt: 'You are an expert object detection system. Identify all visible objects accurately.',
      }
    );

    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    return JSON.parse(jsonMatch[0]) as DetectedObject[];
  }

  /**
   * Analyze the scene in an image
   */
  async analyzeScene(image: string, options: VLMOptions = {}): Promise<SceneAnalysis> {
    const response = await this.provider.analyze(
      image,
      `Analyze this image comprehensively. Provide:
1. A brief description
2. List of objects with labels
3. Dominant colors with names, hex codes, and approximate percentages
4. The mood/atmosphere
5. The setting (indoor/outdoor, location type)
6. Lighting conditions

Return as JSON with keys: description, objects, colors, mood, setting, lighting`,
      {
        ...options,
        systemPrompt: 'You are an expert image analyst specializing in scene understanding.',
      }
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        description: response.content,
        objects: [],
        colors: [],
      };
    }

    return JSON.parse(jsonMatch[0]) as SceneAnalysis;
  }

  /**
   * Analyze faces in an image
   */
  async analyzeFaces(image: string, options: VLMOptions = {}): Promise<FaceAnalysis> {
    const response = await this.provider.analyze(
      image,
      `Analyze any faces visible in this image.
For each face, estimate:
- Approximate age range
- Apparent gender
- Expression/emotion
- Any notable attributes (glasses, beard, etc.)

Return as JSON with keys: count, faces (array)
Note: These are visual estimations only.`,
      {
        ...options,
        systemPrompt: 'You are an image analyst. Provide objective visual observations without making identity claims.',
      }
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { count: 0, faces: [] };
    }

    return JSON.parse(jsonMatch[0]) as FaceAnalysis;
  }

  /**
   * Compare two images
   */
  async compare(image1: string, image2: string, options: VLMOptions = {}): Promise<ImageComparison> {
    const response = await this.provider.analyzeMultiple(
      [image1, image2],
      `Compare these two images:
1. Rate their overall visual similarity (0-1)
2. List key differences
3. List common elements

Return as JSON with keys: similarity, differences, commonElements`,
      {
        ...options,
        systemPrompt: 'You are an expert at comparing and analyzing images.',
      }
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { similarity: 0, differences: [], commonElements: [] };
    }

    return JSON.parse(jsonMatch[0]) as ImageComparison;
  }

  /**
   * Assess image quality
   */
  async assessQuality(image: string, options: VLMOptions = {}): Promise<ImageQuality> {
    const response = await this.provider.analyze(
      image,
      `Assess the technical quality of this image:
1. Overall quality (excellent/good/fair/poor)
2. Sharpness (0-1)
3. Exposure (underexposed/normal/overexposed)
4. Noise level (low/medium/high)
5. Composition notes
6. Any issues (blur, artifacts, etc.)

Return as JSON with keys: overall, sharpness, exposure, noise, composition, issues`,
      {
        ...options,
        systemPrompt: 'You are a professional photographer and image quality expert.',
      }
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        overall: 'fair',
        sharpness: 0.5,
        exposure: 'normal',
        noise: 'medium',
      };
    }

    return JSON.parse(jsonMatch[0]) as ImageQuality;
  }

  /**
   * Perform content moderation
   */
  async moderate(image: string, options: VLMOptions = {}): Promise<ContentModeration> {
    const response = await this.provider.analyze(
      image,
      `Analyze this image for content moderation.
Check for:
- Violence or gore
- Adult/NSFW content
- Hate symbols or content
- Dangerous activities
- Drug-related content

Return as JSON with keys:
- safe: boolean indicating if image is safe for general audiences
- categories: array of {name, detected, confidence}`,
      {
        ...options,
        systemPrompt: 'You are a content moderation system. Analyze images objectively for policy violations.',
      }
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { safe: true, categories: [] };
    }

    return JSON.parse(jsonMatch[0]) as ContentModeration;
  }

  /**
   * Generate alt text for accessibility
   */
  async generateAltText(image: string, options: VLMOptions = {}): Promise<string> {
    const response = await this.provider.analyze(
      image,
      `Generate concise, descriptive alt text for this image suitable for screen readers.
The alt text should:
- Be 1-2 sentences
- Describe the main subject and action
- Not start with "Image of" or "Picture of"
- Be useful for visually impaired users`,
      {
        ...options,
        systemPrompt: 'You are an accessibility expert. Generate helpful, concise alt text.',
      }
    );

    return response.content.trim();
  }

  /**
   * Identify landmarks or locations
   */
  async identifyLocation(image: string, options: VLMOptions = {}): Promise<LocationInfo> {
    const response = await this.provider.analyze(
      image,
      `Identify any recognizable landmarks, buildings, or locations in this image.
If you can identify the location, provide:
- name: Name of the landmark/location
- type: Type (landmark, city, natural feature, etc.)
- location: City/country if known
- confidence: How confident you are

Return as JSON. If no location can be identified, return null.`,
      {
        ...options,
        systemPrompt: 'You are a geography and landmark recognition expert.',
      }
    );

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch || response.content.includes('null')) {
      return { identified: false };
    }

    const data = JSON.parse(jsonMatch[0]) as Omit<LocationInfo, 'identified'>;
    return { ...data, identified: true };
  }

  /**
   * Extract colors from an image
   */
  async extractColors(image: string, count = 5): Promise<ColorInfo[]> {
    const response = await this.provider.analyze(
      image,
      `Extract the ${count} most dominant colors from this image.
For each color, provide:
- name: A descriptive color name
- hex: The hex color code
- percentage: Approximate percentage of the image

Return as a JSON array sorted by percentage (highest first).`,
      {
        systemPrompt: 'You are a color analysis expert.',
      }
    );

    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    return JSON.parse(jsonMatch[0]) as ColorInfo[];
  }
}

export interface LocationInfo {
  identified: boolean;
  name?: string;
  type?: string;
  location?: string;
  confidence?: number;
}
