/**
 * Optical Character Recognition (OCR) utilities
 */

import type { VLMProvider, VLMOptions } from './providers.js';

export interface OCRResult {
  text: string;
  confidence?: number;
  blocks: TextBlock[];
  language?: string;
}

export interface TextBlock {
  text: string;
  boundingBox?: BoundingBox;
  confidence?: number;
  lines?: TextLine[];
}

export interface TextLine {
  text: string;
  boundingBox?: BoundingBox;
  words?: Word[];
}

export interface Word {
  text: string;
  boundingBox?: BoundingBox;
  confidence?: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCROptions extends VLMOptions {
  language?: string;
  detectLayout?: boolean;
  preserveFormatting?: boolean;
}

/**
 * VLM-based OCR engine
 */
export class VisionOCR {
  private provider: VLMProvider;

  constructor(provider: VLMProvider) {
    this.provider = provider;
  }

  /**
   * Extract text from an image
   */
  async extractText(image: string, options: OCROptions = {}): Promise<OCRResult> {
    const systemPrompt = `You are an expert OCR system. Extract all text from the image accurately.
${options.preserveFormatting ? 'Preserve the original formatting, layout, and line breaks.' : 'Return the text in a clean, readable format.'}
${options.language ? `The text is primarily in ${options.language}.` : ''}
${options.detectLayout ? 'Also identify the document structure (headings, paragraphs, lists, tables).' : ''}`;

    const prompt = options.detectLayout
      ? `Extract all text from this image. Identify the document structure and return the text organized by sections.`
      : `Extract all text from this image. Return only the extracted text.`;

    const response = await this.provider.analyze(image, prompt, {
      ...options,
      systemPrompt,
    });

    // Parse the response into structured format
    const blocks = this.parseTextBlocks(response.content);

    return {
      text: response.content,
      blocks,
      language: options.language,
    };
  }

  /**
   * Extract structured data from documents
   */
  async extractStructuredData<T>(
    image: string,
    schema: Record<string, string>,
    options: OCROptions = {}
  ): Promise<T> {
    const schemaDescription = Object.entries(schema)
      .map(([key, desc]) => `- ${key}: ${desc}`)
      .join('\n');

    const systemPrompt = `You are an expert document parser. Extract structured data from documents accurately.
Return the data as a valid JSON object matching the requested schema.`;

    const prompt = `Extract the following fields from this document image:
${schemaDescription}

Return ONLY a valid JSON object with these fields. If a field is not found, use null.`;

    const response = await this.provider.analyze(image, prompt, {
      ...options,
      systemPrompt,
    });

    // Extract JSON from response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract structured data: No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]) as T;
  }

  /**
   * Extract table data from an image
   */
  async extractTable(image: string, options: OCROptions = {}): Promise<string[][]> {
    const systemPrompt = `You are an expert at extracting tabular data from images.
Identify tables in the image and extract their contents.
Return the data as a 2D array where each inner array represents a row.`;

    const prompt = `Extract the table data from this image.
Return ONLY a JSON array of arrays representing the table rows and columns.
Example: [["Header1", "Header2"], ["Value1", "Value2"]]`;

    const response = await this.provider.analyze(image, prompt, {
      ...options,
      systemPrompt,
    });

    // Extract JSON array from response
    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    return JSON.parse(jsonMatch[0]) as string[][];
  }

  /**
   * Extract handwritten text
   */
  async extractHandwriting(image: string, options: OCROptions = {}): Promise<OCRResult> {
    const systemPrompt = `You are an expert at reading handwritten text.
Carefully analyze the handwriting and transcribe it accurately.
Note any parts that are unclear or illegible.`;

    const prompt = `Transcribe all handwritten text from this image.
If any text is unclear, indicate it with [unclear] or provide your best guess in brackets.`;

    const response = await this.provider.analyze(image, prompt, {
      ...options,
      systemPrompt,
    });

    return {
      text: response.content,
      blocks: this.parseTextBlocks(response.content),
    };
  }

  /**
   * Extract text from receipts
   */
  async extractReceipt(image: string): Promise<ReceiptData> {
    return this.extractStructuredData<ReceiptData>(image, {
      merchantName: 'The name of the store or merchant',
      date: 'The date of the transaction (ISO format)',
      time: 'The time of the transaction',
      items: 'Array of items with name, quantity, and price',
      subtotal: 'Subtotal amount',
      tax: 'Tax amount',
      total: 'Total amount',
      paymentMethod: 'Payment method used',
    });
  }

  /**
   * Extract text from business cards
   */
  async extractBusinessCard(image: string): Promise<BusinessCardData> {
    return this.extractStructuredData<BusinessCardData>(image, {
      name: 'Full name of the person',
      title: 'Job title',
      company: 'Company name',
      email: 'Email address',
      phone: 'Phone number(s)',
      address: 'Physical address',
      website: 'Website URL',
    });
  }

  private parseTextBlocks(text: string): TextBlock[] {
    // Split by double newlines to identify paragraphs/blocks
    const paragraphs = text.split(/\n\n+/);

    return paragraphs.map((para) => ({
      text: para.trim(),
      lines: para.split('\n').map((line) => ({
        text: line.trim(),
        words: line.split(/\s+/).map((word) => ({
          text: word,
        })),
      })),
    }));
  }
}

export interface ReceiptData {
  merchantName: string | null;
  date: string | null;
  time: string | null;
  items: Array<{ name: string; quantity?: number; price: number }>;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  paymentMethod: string | null;
}

export interface BusinessCardData {
  name: string | null;
  title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
}
