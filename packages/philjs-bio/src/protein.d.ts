/**
 * Protein Analysis Toolkit
 *
 * Tools for protein sequence analysis, structure prediction hints,
 * and biochemical property calculations.
 */
export type AminoAcid = 'A' | 'R' | 'N' | 'D' | 'C' | 'E' | 'Q' | 'G' | 'H' | 'I' | 'L' | 'K' | 'M' | 'F' | 'P' | 'S' | 'T' | 'W' | 'Y' | 'V' | '*';
export interface AminoAcidProperties {
    name: string;
    threeLetterCode: string;
    molecularWeight: number;
    hydropathy: number;
    charge: number;
    polarity: 'polar' | 'nonpolar' | 'acidic' | 'basic';
    aromaticity: boolean;
}
export interface ProteinProperties {
    length: number;
    molecularWeight: number;
    isoelectricPoint: number;
    extinction280: number;
    absorbance01: number;
    hydropathyGRAVY: number;
    aromaticity: number;
    instabilityIndex: number;
    aliphaticIndex: number;
    composition: Record<AminoAcid, number>;
    chargeAtpH7: number;
}
export interface SecondaryStructurePrediction {
    sequence: string;
    prediction: string;
    helixProbability: number[];
    sheetProbability: number[];
    coilProbability: number[];
}
export interface Motif {
    name: string;
    pattern: string;
    start: number;
    end: number;
    sequence: string;
}
/**
 * Protein sequence class with analysis methods
 */
export declare class Protein {
    private sequence;
    constructor(sequence: string);
    /**
     * Get the protein sequence
     */
    getSequence(): string;
    /**
     * Get sequence length
     */
    get length(): number;
    /**
     * Calculate molecular weight in Daltons
     */
    getMolecularWeight(): number;
    /**
     * Calculate amino acid composition
     */
    getComposition(): Record<string, number>;
    /**
     * Calculate amino acid composition as percentages
     */
    getCompositionPercent(): Record<string, number>;
    /**
     * Calculate GRAVY (Grand Average of Hydropathy)
     */
    getGRAVY(): number;
    /**
     * Calculate net charge at pH 7
     */
    getChargeAtpH7(): number;
    /**
     * Estimate isoelectric point (pI)
     */
    getIsoelectricPoint(): number;
    private chargeAtpH;
    /**
     * Calculate extinction coefficient at 280nm
     */
    getExtinction280(): {
        reduced: number;
        oxidized: number;
    };
    /**
     * Calculate instability index
     */
    getInstabilityIndex(): number;
    /**
     * Calculate aliphatic index
     */
    getAliphaticIndex(): number;
    /**
     * Calculate aromaticity
     */
    getAromaticity(): number;
    /**
     * Find protein motifs
     */
    findMotifs(): Motif[];
    /**
     * Get comprehensive protein properties
     */
    getProperties(): ProteinProperties;
    /**
     * Predict secondary structure (simplified Chou-Fasman)
     */
    predictSecondaryStructure(): SecondaryStructurePrediction;
    /**
     * Calculate hydropathy plot (Kyte-Doolittle)
     */
    getHydropathyPlot(windowSize?: number): number[];
    /**
     * Convert to three-letter code format
     */
    toThreeLetterCode(): string;
}
/**
 * Parse FASTA format protein sequence
 */
export declare function parseProteinFasta(fasta: string): Array<{
    id: string;
    description: string;
    sequence: string;
}>;
/**
 * Align two protein sequences using Smith-Waterman
 */
export declare function alignProteins(seq1: string, seq2: string, gapPenalty?: number, gapExtend?: number): {
    aligned1: string;
    aligned2: string;
    score: number;
    identity: number;
};
