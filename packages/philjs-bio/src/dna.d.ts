/**
 * PhilJS Bioinformatics Toolkit
 * Production-ready tools for DNA/RNA/Protein analysis
 */
export type Nucleotide = 'A' | 'T' | 'G' | 'C';
export type RNANucleotide = 'A' | 'U' | 'G' | 'C';
export type AminoAcid = 'A' | 'R' | 'N' | 'D' | 'C' | 'E' | 'Q' | 'G' | 'H' | 'I' | 'L' | 'K' | 'M' | 'F' | 'P' | 'S' | 'T' | 'W' | 'Y' | 'V' | '*';
export interface CrisprTarget {
    start: number;
    end: number;
    guideSequence: string;
    pamSequence: string;
    gcContent: number;
    offTargetScore: number;
    efficiency: number;
    strand: '+' | '-';
}
export interface Alignment {
    alignedSeq1: string;
    alignedSeq2: string;
    score: number;
    identity: number;
    gaps: number;
    startPos1: number;
    endPos1: number;
    startPos2: number;
    endPos2: number;
}
export interface OpenReadingFrame {
    start: number;
    end: number;
    frame: number;
    sequence: string;
    protein: string;
    length: number;
}
export interface BlastHit {
    sequenceId: string;
    score: number;
    eValue: number;
    identity: number;
    alignment: Alignment;
}
export interface PhyloNode {
    id: string;
    name?: string;
    distance: number;
    children: PhyloNode[];
    sequence?: DNA;
}
export interface ScoringMatrix {
    match: number;
    mismatch: number;
    gap: number;
    gapExtend?: number;
}
export declare class RNA {
    private sequence;
    constructor(sequence: string);
    private validate;
    toString(): string;
    get length(): number;
    /**
     * Translate RNA to protein sequence
     */
    translate(startFromAUG?: boolean): Protein;
    /**
     * Find all start codons
     */
    findStartCodons(): number[];
    /**
     * Find all stop codons
     */
    findStopCodons(): Array<{
        position: number;
        codon: string;
    }>;
    /**
     * Reverse transcribe RNA back to DNA
     */
    reverseTranscribe(): DNA;
}
export declare class Protein {
    private sequence;
    constructor(sequence: string);
    private validate;
    toString(): string;
    get length(): number;
    /**
     * Calculate molecular weight (approximate, in Daltons)
     */
    molecularWeight(): number;
    /**
     * Calculate isoelectric point (pI)
     */
    isoelectricPoint(): number;
    private calculateCharge;
    /**
     * Count amino acid composition
     */
    composition(): Record<string, number>;
    /**
     * Calculate hydropathy index (Kyte-Doolittle)
     */
    hydropathy(): number[];
    /**
     * Predict secondary structure (simplified Chou-Fasman)
     */
    predictSecondaryStructure(): string;
}
export declare class DNA {
    private sequence;
    constructor(sequence: string);
    private validate;
    toString(): string;
    get length(): number;
    /**
     * Get nucleotide at position
     */
    at(index: number): string;
    /**
     * Get subsequence
     */
    slice(start: number, end?: number): DNA;
    /**
     * Get the complementary DNA strand
     */
    complement(): DNA;
    /**
     * Get the reverse complement (5' to 3' of complementary strand)
     */
    reverseComplement(): DNA;
    /**
     * Transcribe DNA to RNA (T -> U)
     */
    transcribe(): RNA;
    /**
     * Calculate GC content (0-1)
     */
    gcContent(): number;
    /**
     * Calculate melting temperature (simplified nearest-neighbor)
     */
    meltingTemperature(): number;
    /**
     * Count nucleotide frequencies
     */
    nucleotideFrequencies(): Record<string, number>;
    /**
     * Find CRISPR/Cas9 target sites with PAM sequences
     */
    findCrisprTargets(pam?: string): CrisprTarget[];
    private pamToRegex;
    private calculateGC;
    private calculateOffTargetScore;
    private predictCrisprEfficiency;
    /**
     * Local alignment using Smith-Waterman algorithm
     */
    alignLocal(other: DNA, scoring?: ScoringMatrix): Alignment;
    /**
     * Global alignment using Needleman-Wunsch algorithm
     */
    alignGlobal(other: DNA, scoring?: ScoringMatrix): Alignment;
    /**
     * Calculate Hamming distance (for equal-length sequences)
     */
    hammingDistance(other: DNA): number;
    /**
     * Calculate Jukes-Cantor evolutionary distance
     */
    jukesCantor(other: DNA): number;
    /**
     * Find all open reading frames
     */
    findORFs(minLength?: number): OpenReadingFrame[];
    private findORFsInFrame;
    /**
     * Translate DNA directly to protein (all 6 frames)
     */
    translate(frame?: number): Protein;
    /**
     * Find restriction enzyme cut sites
     */
    findRestrictionSites(enzyme?: string): Array<{
        enzyme: string;
        position: number;
        sequence: string;
    }>;
    /**
     * Find tandem repeats
     */
    findTandemRepeats(minRepeatLength?: number, minRepeats?: number): Array<{
        start: number;
        end: number;
        unit: string;
        count: number;
    }>;
    /**
     * Find palindromic sequences
     */
    findPalindromes(minLength?: number): Array<{
        start: number;
        end: number;
        sequence: string;
    }>;
    /**
     * Build phylogenetic tree using UPGMA
     */
    static buildTreeUPGMA(sequences: DNA[], names?: string[]): PhyloNode;
    /**
     * Build phylogenetic tree using Neighbor-Joining
     */
    static buildTreeNJ(sequences: DNA[], names?: string[]): PhyloNode;
    /**
     * Calculate distance matrix
     */
    static distanceMatrix(sequences: DNA[], method?: 'hamming' | 'jukes-cantor'): number[][];
    /**
     * Generate random DNA sequence
     */
    static random(length: number, gcContent?: number): DNA;
    /**
     * Parse FASTA format
     */
    static fromFasta(fasta: string): Array<{
        id: string;
        description: string;
        sequence: DNA;
    }>;
    /**
     * Export to FASTA format
     */
    toFasta(id: string, description?: string, lineWidth?: number): string;
    /**
     * Static complement method (backward compatibility)
     */
    static complement(sequence: string): string;
    /**
     * Static CRISPR target finder (backward compatibility)
     */
    static findCrisprTarget(sequence: string): CrisprTarget[];
}
/**
 * Align two protein sequences using BLOSUM62
 */
export declare function alignProteins(seq1: Protein, seq2: Protein, local?: boolean): Alignment;
export interface DNADatabase {
    sequences: Array<{
        id: string;
        sequence: DNA;
    }>;
}
/**
 * Simple BLAST-like search (k-mer based)
 */
export declare function blast(query: DNA, database: DNADatabase, options?: {
    wordSize?: number;
    threshold?: number;
    maxHits?: number;
}): BlastHit[];
/**
 * Find motifs using position weight matrix
 */
export declare function findMotifs(sequences: DNA[], motifLength: number, options?: {
    iterations?: number;
    threshold?: number;
}): {
    consensus: string;
    pwm: number[][];
    positions: number[];
};
//# sourceMappingURL=dna.d.ts.map