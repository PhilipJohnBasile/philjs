import { describe, it, expect } from 'vitest';
import { DNA } from '../dna.js';

describe('PhilJS Bio: DNA', () => {
    it('should create a valid DNA sequence', () => {
        const dna = new DNA('GATTACA');
        expect(dna.toString()).toBe('GATTACA');
    });

    it('should validate nucleotides', () => {
        expect(() => new DNA('XYZ')).toThrow('Invalid nucleotide');
    });

    it('should transcribe DNA to RNA', () => {
        // DNA: T -> RNA: U
        const dna = new DNA('GATTACA');
        const rna = dna.transcribe();
        expect(rna.toString()).toBe('GAUUACA');
    });

    it('should compute reverse complement', () => {
        // A <-> T, C <-> G
        // GATTACA -> CTAATGT -> Reversed: TGTAATC
        const dna = new DNA('GATTACA');
        expect(dna.complement().toString()).toBe('CTAATGT');
        expect(dna.reverseComplement().toString()).toBe('TGTAATC');
    });

    it('should calculate GC content', () => {
        // GC content = (G + C) / Length
        const dna = new DNA('GCGC');
        expect(dna.gcContent()).toBe(1.0);

        const dna2 = new DNA('ATAT');
        expect(dna2.gcContent()).toBe(0.0);

        const dna3 = new DNA('GATC');
        expect(dna3.gcContent()).toBe(0.5);
    });
});
