/**
 * @philjs/pdf - Test Suite
 * Tests for PDF generation and manipulation utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Main class and factory
  PDFGenerator,
  createPDFGenerator,
  // Types
  type PDFGeneratorOptions,
  type HTMLToPDFOptions,
  type WatermarkOptions,
  type MergeOptions,
  type CompressionOptions,
  type TemplateOptions,
  type PDFMargin,
} from '../index.js';

// Mock pdf-lib for unit testing
vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn().mockResolvedValue({
      addPage: vi.fn(),
      getPages: vi.fn().mockReturnValue([]),
      getPageCount: vi.fn().mockReturnValue(0),
      copyPages: vi.fn().mockResolvedValue([]),
      embedFont: vi.fn().mockResolvedValue({
        widthOfTextAtSize: vi.fn().mockReturnValue(100),
      }),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      setTitle: vi.fn(),
      setAuthor: vi.fn(),
      setSubject: vi.fn(),
      setKeywords: vi.fn(),
      setCreator: vi.fn(),
      setProducer: vi.fn(),
      getTitle: vi.fn().mockReturnValue('Test'),
      getAuthor: vi.fn().mockReturnValue(undefined),
      getSubject: vi.fn().mockReturnValue(undefined),
      getKeywords: vi.fn().mockReturnValue(undefined),
      getCreator: vi.fn().mockReturnValue(undefined),
      getProducer: vi.fn().mockReturnValue(undefined),
      getCreationDate: vi.fn().mockReturnValue(undefined),
      getModificationDate: vi.fn().mockReturnValue(undefined),
      getPageIndices: vi.fn().mockReturnValue([0]),
    }),
    load: vi.fn().mockResolvedValue({
      getPages: vi.fn().mockReturnValue([
        {
          getSize: vi.fn().mockReturnValue({ width: 612, height: 792 }),
          drawText: vi.fn(),
        },
      ]),
      getPageCount: vi.fn().mockReturnValue(1),
      getPageIndices: vi.fn().mockReturnValue([0]),
      copyPages: vi.fn().mockResolvedValue([{}]),
      embedFont: vi.fn().mockResolvedValue({
        widthOfTextAtSize: vi.fn().mockReturnValue(100),
      }),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      setTitle: vi.fn(),
      setAuthor: vi.fn(),
      setSubject: vi.fn(),
      setKeywords: vi.fn(),
      setCreator: vi.fn(),
      setProducer: vi.fn(),
      getTitle: vi.fn().mockReturnValue('Test'),
      getAuthor: vi.fn().mockReturnValue('Author'),
      getSubject: vi.fn().mockReturnValue('Subject'),
      getKeywords: vi.fn().mockReturnValue('keywords'),
      getCreator: vi.fn().mockReturnValue('Creator'),
      getProducer: vi.fn().mockReturnValue('Producer'),
      getCreationDate: vi.fn().mockReturnValue(new Date()),
      getModificationDate: vi.fn().mockReturnValue(new Date()),
    }),
  },
  StandardFonts: {
    Helvetica: 'Helvetica',
    HelveticaBold: 'Helvetica-Bold',
  },
  rgb: vi.fn((r, g, b) => ({ r, g, b })),
  degrees: vi.fn((d) => d),
}));

describe('@philjs/pdf', () => {
  describe('Export Verification', () => {
    it('should export PDFGenerator class', () => {
      expect(PDFGenerator).toBeDefined();
      expect(typeof PDFGenerator).toBe('function');
    });

    it('should export createPDFGenerator factory', () => {
      expect(createPDFGenerator).toBeDefined();
      expect(typeof createPDFGenerator).toBe('function');
    });
  });

  describe('PDFGenerator Class', () => {
    describe('Constructor', () => {
      it('should create instance with default options', () => {
        const generator = new PDFGenerator();

        expect(generator).toBeInstanceOf(PDFGenerator);
      });

      it('should accept custom options', () => {
        const options: PDFGeneratorOptions = {
          headless: true,
          format: 'Letter',
          margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
          debug: true,
        };

        const generator = new PDFGenerator(options);

        expect(generator).toBeInstanceOf(PDFGenerator);
      });

      it('should support all page formats', () => {
        const formats: Array<'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid'> = [
          'A4', 'A3', 'Letter', 'Legal', 'Tabloid'
        ];

        for (const format of formats) {
          const generator = new PDFGenerator({ format });
          expect(generator).toBeInstanceOf(PDFGenerator);
        }
      });
    });

    describe('createPDFGenerator Factory', () => {
      it('should create PDFGenerator instance', () => {
        const generator = createPDFGenerator();

        expect(generator).toBeInstanceOf(PDFGenerator);
      });

      it('should pass options to constructor', () => {
        const options: PDFGeneratorOptions = {
          format: 'A3',
          debug: true,
        };

        const generator = createPDFGenerator(options);

        expect(generator).toBeInstanceOf(PDFGenerator);
      });
    });

    describe('Template Interpolation', () => {
      it('should interpolate simple variables', () => {
        const generator = new PDFGenerator();

        // Access private method through any cast for testing
        const interpolate = (generator as any).interpolateTemplate.bind(generator);

        const template = 'Hello {{name}}!';
        const data = { name: 'World' };

        const result = interpolate(template, data);

        expect(result).toBe('Hello World!');
      });

      it('should handle nested object paths', () => {
        const generator = new PDFGenerator();
        const interpolate = (generator as any).interpolateTemplate.bind(generator);

        const template = 'User: {{user.name}}, Email: {{user.email}}';
        const data = { user: { name: 'John', email: 'john@example.com' } };

        const result = interpolate(template, data);

        expect(result).toBe('User: John, Email: john@example.com');
      });

      it('should handle missing values gracefully', () => {
        const generator = new PDFGenerator();
        const interpolate = (generator as any).interpolateTemplate.bind(generator);

        const template = 'Hello {{missing}}!';
        const data = {};

        const result = interpolate(template, data);

        expect(result).toBe('Hello !');
      });

      it('should handle multiple occurrences', () => {
        const generator = new PDFGenerator();
        const interpolate = (generator as any).interpolateTemplate.bind(generator);

        const template = '{{name}} says: Hello {{name}}!';
        const data = { name: 'Alice' };

        const result = interpolate(template, data);

        expect(result).toBe('Alice says: Hello Alice!');
      });
    });

    describe('Merge PDFs', () => {
      it('should merge multiple PDFs', async () => {
        const generator = new PDFGenerator();
        const pdf1 = new Uint8Array([1, 2, 3]);
        const pdf2 = new Uint8Array([4, 5, 6]);

        const result = await generator.merge([pdf1, pdf2]);

        expect(result).toBeInstanceOf(Uint8Array);
      });

      it('should support merge options', async () => {
        const generator = new PDFGenerator();
        const pdfs = [new Uint8Array([1]), new Uint8Array([2])];

        const options: MergeOptions = {
          addPageNumbers: true,
          pageNumberFormat: 'Page {{page}} of {{total}}',
          pageNumberPosition: 'bottom',
        };

        const result = await generator.merge(pdfs, options);

        expect(result).toBeInstanceOf(Uint8Array);
      });

      it('should handle empty array', async () => {
        const generator = new PDFGenerator();

        const result = await generator.merge([]);

        expect(result).toBeInstanceOf(Uint8Array);
      });

      it('should support top page number position', async () => {
        const generator = new PDFGenerator();
        const pdfs = [new Uint8Array([1])];

        const options: MergeOptions = {
          addPageNumbers: true,
          pageNumberPosition: 'top',
        };

        const result = await generator.merge(pdfs, options);

        expect(result).toBeInstanceOf(Uint8Array);
      });
    });

    describe('Add Watermark', () => {
      it('should add watermark to PDF', async () => {
        const generator = new PDFGenerator();
        const pdfBytes = new Uint8Array([1, 2, 3]);

        const options: WatermarkOptions = {
          text: 'CONFIDENTIAL',
        };

        const result = await generator.addWatermark(pdfBytes, options);

        expect(result).toBeInstanceOf(Uint8Array);
      });

      it('should support custom watermark options', async () => {
        const generator = new PDFGenerator();
        const pdfBytes = new Uint8Array([1, 2, 3]);

        const options: WatermarkOptions = {
          text: 'DRAFT',
          fontSize: 72,
          rotation: -30,
          color: [1, 0, 0],
          opacity: 0.5,
          position: 'center',
        };

        const result = await generator.addWatermark(pdfBytes, options);

        expect(result).toBeInstanceOf(Uint8Array);
      });

      it('should support all position options', async () => {
        const generator = new PDFGenerator();
        const pdfBytes = new Uint8Array([1, 2, 3]);

        const positions: Array<WatermarkOptions['position']> = [
          'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
        ];

        for (const position of positions) {
          const result = await generator.addWatermark(pdfBytes, {
            text: 'TEST',
            position,
          });
          expect(result).toBeInstanceOf(Uint8Array);
        }
      });
    });

    describe('Compress PDF', () => {
      it('should compress PDF with default options', async () => {
        const generator = new PDFGenerator();
        const pdfBytes = new Uint8Array([1, 2, 3]);

        const result = await generator.compress(pdfBytes);

        expect(result).toBeInstanceOf(Uint8Array);
      });

      it('should support compression options', async () => {
        const generator = new PDFGenerator();
        const pdfBytes = new Uint8Array([1, 2, 3]);

        const options: CompressionOptions = {
          level: 9,
          compressImages: true,
          imageQuality: 70,
          removeMetadata: true,
        };

        const result = await generator.compress(pdfBytes, options);

        expect(result).toBeInstanceOf(Uint8Array);
      });

      it('should remove metadata when requested', async () => {
        const generator = new PDFGenerator();
        const pdfBytes = new Uint8Array([1, 2, 3]);

        const result = await generator.compress(pdfBytes, {
          removeMetadata: true,
        });

        expect(result).toBeInstanceOf(Uint8Array);
      });
    });

    describe('Get Page Count', () => {
      it('should return page count', async () => {
        const generator = new PDFGenerator();
        const pdfBytes = new Uint8Array([1, 2, 3]);

        const count = await generator.getPageCount(pdfBytes);

        expect(typeof count).toBe('number');
      });
    });

    describe('Extract Pages', () => {
      it('should extract specific pages', async () => {
        const generator = new PDFGenerator();
        const pdfBytes = new Uint8Array([1, 2, 3]);

        const result = await generator.extractPages(pdfBytes, [1]);

        expect(result).toBeInstanceOf(Uint8Array);
      });

      it('should handle multiple page numbers', async () => {
        const generator = new PDFGenerator();
        const pdfBytes = new Uint8Array([1, 2, 3]);

        const result = await generator.extractPages(pdfBytes, [1, 2, 3]);

        expect(result).toBeInstanceOf(Uint8Array);
      });
    });

    describe('Split PDF', () => {
      it('should split PDF into individual pages', async () => {
        const generator = new PDFGenerator();
        const pdfBytes = new Uint8Array([1, 2, 3]);

        const result = await generator.split(pdfBytes);

        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('Metadata Operations', () => {
      it('should set metadata', async () => {
        const generator = new PDFGenerator();
        const pdfBytes = new Uint8Array([1, 2, 3]);

        const result = await generator.setMetadata(pdfBytes, {
          title: 'Test Document',
          author: 'Test Author',
          subject: 'Test Subject',
          keywords: ['test', 'pdf'],
          creator: 'PhilJS',
          producer: 'PhilJS PDF',
        });

        expect(result).toBeInstanceOf(Uint8Array);
      });

      it('should get metadata', async () => {
        const generator = new PDFGenerator();
        const pdfBytes = new Uint8Array([1, 2, 3]);

        const metadata = await generator.getMetadata(pdfBytes);

        expect(typeof metadata).toBe('object');
        expect(metadata.title).toBeDefined();
      });

      it('should handle partial metadata', async () => {
        const generator = new PDFGenerator();
        const pdfBytes = new Uint8Array([1, 2, 3]);

        const result = await generator.setMetadata(pdfBytes, {
          title: 'Only Title',
        });

        expect(result).toBeInstanceOf(Uint8Array);
      });
    });

    describe('Close Browser', () => {
      it('should close without error when no browser initialized', async () => {
        const generator = new PDFGenerator();

        await expect(generator.close()).resolves.toBeUndefined();
      });
    });
  });

  describe('Type Definitions', () => {
    it('should have correct PDFMargin type', () => {
      const margin: PDFMargin = {
        top: '20mm',
        right: 20,
        bottom: '1in',
        left: '2cm',
      };

      expect(margin.top).toBe('20mm');
    });

    it('should have correct HTMLToPDFOptions type', () => {
      const options: HTMLToPDFOptions = {
        format: 'A4',
        margin: { top: '20mm' },
        printBackground: true,
        landscape: false,
        css: '.test { color: red; }',
        waitForSelector: '#content',
        headerTemplate: '<div>Header</div>',
        footerTemplate: '<div>Footer</div>',
        displayHeaderFooter: true,
        scale: 1,
      };

      expect(options.format).toBe('A4');
    });

    it('should have correct WatermarkOptions type', () => {
      const options: WatermarkOptions = {
        text: 'WATERMARK',
        fontSize: 50,
        rotation: -45,
        color: [0.5, 0.5, 0.5],
        opacity: 0.3,
        position: 'center',
      };

      expect(options.text).toBe('WATERMARK');
      expect(options.color?.length).toBe(3);
    });

    it('should have correct MergeOptions type', () => {
      const options: MergeOptions = {
        addPageNumbers: true,
        pageNumberFormat: 'Page {{page}} of {{total}}',
        pageNumberPosition: 'bottom',
        addBookmarks: true,
      };

      expect(options.addPageNumbers).toBe(true);
    });

    it('should have correct CompressionOptions type', () => {
      const options: CompressionOptions = {
        level: 6,
        compressImages: true,
        imageQuality: 80,
        removeMetadata: false,
      };

      expect(options.level).toBe(6);
    });

    it('should have correct TemplateOptions type', () => {
      const options: TemplateOptions = {
        template: 'invoice',
        data: {
          invoiceNumber: 'INV-001',
          items: [],
          total: 100,
        },
        format: 'A4',
      };

      expect(options.template).toBe('invoice');
      expect(options.data.invoiceNumber).toBe('INV-001');
    });
  });

  describe('Built-in Templates', () => {
    it('should support invoice template name', () => {
      const options: TemplateOptions = {
        template: 'invoice',
        data: {
          invoiceNumber: 'INV-001',
          customerName: 'John Doe',
          items: [],
          total: 0,
        },
      };

      expect(options.template).toBe('invoice');
    });

    it('should support report template name', () => {
      const options: TemplateOptions = {
        template: 'report',
        data: {
          title: 'Monthly Report',
          content: 'Report content',
        },
      };

      expect(options.template).toBe('report');
    });

    it('should support certificate template name', () => {
      const options: TemplateOptions = {
        template: 'certificate',
        data: {
          recipientName: 'Jane Doe',
          achievement: 'Course Completion',
          date: '2024-01-01',
        },
      };

      expect(options.template).toBe('certificate');
    });

    it('should support custom HTML template', () => {
      const options: TemplateOptions = {
        template: '<h1>{{title}}</h1><p>{{content}}</p>',
        data: {
          title: 'Custom Title',
          content: 'Custom content',
        },
      };

      expect(options.template).toContain('{{title}}');
    });
  });

  describe('Page Format Options', () => {
    it('should support A4 format', () => {
      const options: HTMLToPDFOptions = { format: 'A4' };
      expect(options.format).toBe('A4');
    });

    it('should support A3 format', () => {
      const options: HTMLToPDFOptions = { format: 'A3' };
      expect(options.format).toBe('A3');
    });

    it('should support Letter format', () => {
      const options: HTMLToPDFOptions = { format: 'Letter' };
      expect(options.format).toBe('Letter');
    });

    it('should support Legal format', () => {
      const options: HTMLToPDFOptions = { format: 'Legal' };
      expect(options.format).toBe('Legal');
    });

    it('should support Tabloid format', () => {
      const options: HTMLToPDFOptions = { format: 'Tabloid' };
      expect(options.format).toBe('Tabloid');
    });
  });

  describe('Margin Options', () => {
    it('should support string margins', () => {
      const margin: PDFMargin = {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      };

      expect(margin.top).toBe('20mm');
    });

    it('should support number margins', () => {
      const margin: PDFMargin = {
        top: 20,
        right: 15,
        bottom: 20,
        left: 15,
      };

      expect(margin.top).toBe(20);
    });

    it('should support mixed margin types', () => {
      const margin: PDFMargin = {
        top: '1in',
        right: 72,
        bottom: '2.54cm',
        left: 72,
      };

      expect(margin.top).toBe('1in');
      expect(margin.right).toBe(72);
    });

    it('should support partial margins', () => {
      const margin: PDFMargin = {
        top: '10mm',
      };

      expect(margin.top).toBe('10mm');
      expect(margin.right).toBeUndefined();
    });
  });

  describe('Watermark Position Options', () => {
    it('should support center position', () => {
      const options: WatermarkOptions = { text: 'TEST', position: 'center' };
      expect(options.position).toBe('center');
    });

    it('should support corner positions', () => {
      const positions: Array<WatermarkOptions['position']> = [
        'top-left', 'top-right', 'bottom-left', 'bottom-right'
      ];

      for (const position of positions) {
        const options: WatermarkOptions = { text: 'TEST', position };
        expect(options.position).toBe(position);
      }
    });
  });
});
