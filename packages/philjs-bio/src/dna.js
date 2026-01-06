/**
 * PhilJS Bioinformatics Toolkit
 * Production-ready tools for DNA/RNA/Protein analysis
 */
// ============================================================================
// Constants
// ============================================================================
const DNA_COMPLEMENT = {
    'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
    'a': 't', 't': 'a', 'g': 'c', 'c': 'g',
    'N': 'N', 'n': 'n'
};
const DNA_TO_RNA = {
    'A': 'A', 'T': 'U', 'G': 'G', 'C': 'C',
    'a': 'a', 't': 'u', 'g': 'g', 'c': 'c'
};
// Standard genetic code
const CODON_TABLE = {
    'UUU': 'F', 'UUC': 'F', 'UUA': 'L', 'UUG': 'L',
    'UCU': 'S', 'UCC': 'S', 'UCA': 'S', 'UCG': 'S',
    'UAU': 'Y', 'UAC': 'Y', 'UAA': '*', 'UAG': '*',
    'UGU': 'C', 'UGC': 'C', 'UGA': '*', 'UGG': 'W',
    'CUU': 'L', 'CUC': 'L', 'CUA': 'L', 'CUG': 'L',
    'CCU': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
    'CAU': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
    'CGU': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
    'AUU': 'I', 'AUC': 'I', 'AUA': 'I', 'AUG': 'M',
    'ACU': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
    'AAU': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
    'AGU': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
    'GUU': 'V', 'GUC': 'V', 'GUA': 'V', 'GUG': 'V',
    'GCU': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
    'GAU': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
    'GGU': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
};
// BLOSUM62 scoring matrix for protein alignment
const BLOSUM62 = {
    'A': { 'A': 4, 'R': -1, 'N': -2, 'D': -2, 'C': 0, 'Q': -1, 'E': -1, 'G': 0, 'H': -2, 'I': -1, 'L': -1, 'K': -1, 'M': -1, 'F': -2, 'P': -1, 'S': 1, 'T': 0, 'W': -3, 'Y': -2, 'V': 0 },
    'R': { 'A': -1, 'R': 5, 'N': 0, 'D': -2, 'C': -3, 'Q': 1, 'E': 0, 'G': -2, 'H': 0, 'I': -3, 'L': -2, 'K': 2, 'M': -1, 'F': -3, 'P': -2, 'S': -1, 'T': -1, 'W': -3, 'Y': -2, 'V': -3 },
    'N': { 'A': -2, 'R': 0, 'N': 6, 'D': 1, 'C': -3, 'Q': 0, 'E': 0, 'G': 0, 'H': 1, 'I': -3, 'L': -3, 'K': 0, 'M': -2, 'F': -3, 'P': -2, 'S': 1, 'T': 0, 'W': -4, 'Y': -2, 'V': -3 },
    'D': { 'A': -2, 'R': -2, 'N': 1, 'D': 6, 'C': -3, 'Q': 0, 'E': 2, 'G': -1, 'H': -1, 'I': -3, 'L': -4, 'K': -1, 'M': -3, 'F': -3, 'P': -1, 'S': 0, 'T': -1, 'W': -4, 'Y': -3, 'V': -3 },
    'C': { 'A': 0, 'R': -3, 'N': -3, 'D': -3, 'C': 9, 'Q': -3, 'E': -4, 'G': -3, 'H': -3, 'I': -1, 'L': -1, 'K': -3, 'M': -1, 'F': -2, 'P': -3, 'S': -1, 'T': -1, 'W': -2, 'Y': -2, 'V': -1 },
    'Q': { 'A': -1, 'R': 1, 'N': 0, 'D': 0, 'C': -3, 'Q': 5, 'E': 2, 'G': -2, 'H': 0, 'I': -3, 'L': -2, 'K': 1, 'M': 0, 'F': -3, 'P': -1, 'S': 0, 'T': -1, 'W': -2, 'Y': -1, 'V': -2 },
    'E': { 'A': -1, 'R': 0, 'N': 0, 'D': 2, 'C': -4, 'Q': 2, 'E': 5, 'G': -2, 'H': 0, 'I': -3, 'L': -3, 'K': 1, 'M': -2, 'F': -3, 'P': -1, 'S': 0, 'T': -1, 'W': -3, 'Y': -2, 'V': -2 },
    'G': { 'A': 0, 'R': -2, 'N': 0, 'D': -1, 'C': -3, 'Q': -2, 'E': -2, 'G': 6, 'H': -2, 'I': -4, 'L': -4, 'K': -2, 'M': -3, 'F': -3, 'P': -2, 'S': 0, 'T': -2, 'W': -2, 'Y': -3, 'V': -3 },
    'H': { 'A': -2, 'R': 0, 'N': 1, 'D': -1, 'C': -3, 'Q': 0, 'E': 0, 'G': -2, 'H': 8, 'I': -3, 'L': -3, 'K': -1, 'M': -2, 'F': -1, 'P': -2, 'S': -1, 'T': -2, 'W': -2, 'Y': 2, 'V': -3 },
    'I': { 'A': -1, 'R': -3, 'N': -3, 'D': -3, 'C': -1, 'Q': -3, 'E': -3, 'G': -4, 'H': -3, 'I': 4, 'L': 2, 'K': -3, 'M': 1, 'F': 0, 'P': -3, 'S': -2, 'T': -1, 'W': -3, 'Y': -1, 'V': 3 },
    'L': { 'A': -1, 'R': -2, 'N': -3, 'D': -4, 'C': -1, 'Q': -2, 'E': -3, 'G': -4, 'H': -3, 'I': 2, 'L': 4, 'K': -2, 'M': 2, 'F': 0, 'P': -3, 'S': -2, 'T': -1, 'W': -2, 'Y': -1, 'V': 1 },
    'K': { 'A': -1, 'R': 2, 'N': 0, 'D': -1, 'C': -3, 'Q': 1, 'E': 1, 'G': -2, 'H': -1, 'I': -3, 'L': -2, 'K': 5, 'M': -1, 'F': -3, 'P': -1, 'S': 0, 'T': -1, 'W': -3, 'Y': -2, 'V': -2 },
    'M': { 'A': -1, 'R': -1, 'N': -2, 'D': -3, 'C': -1, 'Q': 0, 'E': -2, 'G': -3, 'H': -2, 'I': 1, 'L': 2, 'K': -1, 'M': 5, 'F': 0, 'P': -2, 'S': -1, 'T': -1, 'W': -1, 'Y': -1, 'V': 1 },
    'F': { 'A': -2, 'R': -3, 'N': -3, 'D': -3, 'C': -2, 'Q': -3, 'E': -3, 'G': -3, 'H': -1, 'I': 0, 'L': 0, 'K': -3, 'M': 0, 'F': 6, 'P': -4, 'S': -2, 'T': -2, 'W': 1, 'Y': 3, 'V': -1 },
    'P': { 'A': -1, 'R': -2, 'N': -2, 'D': -1, 'C': -3, 'Q': -1, 'E': -1, 'G': -2, 'H': -2, 'I': -3, 'L': -3, 'K': -1, 'M': -2, 'F': -4, 'P': 7, 'S': -1, 'T': -1, 'W': -4, 'Y': -3, 'V': -2 },
    'S': { 'A': 1, 'R': -1, 'N': 1, 'D': 0, 'C': -1, 'Q': 0, 'E': 0, 'G': 0, 'H': -1, 'I': -2, 'L': -2, 'K': 0, 'M': -1, 'F': -2, 'P': -1, 'S': 4, 'T': 1, 'W': -3, 'Y': -2, 'V': -2 },
    'T': { 'A': 0, 'R': -1, 'N': 0, 'D': -1, 'C': -1, 'Q': -1, 'E': -1, 'G': -2, 'H': -2, 'I': -1, 'L': -1, 'K': -1, 'M': -1, 'F': -2, 'P': -1, 'S': 1, 'T': 5, 'W': -2, 'Y': -2, 'V': 0 },
    'W': { 'A': -3, 'R': -3, 'N': -4, 'D': -4, 'C': -2, 'Q': -2, 'E': -3, 'G': -2, 'H': -2, 'I': -3, 'L': -2, 'K': -3, 'M': -1, 'F': 1, 'P': -4, 'S': -3, 'T': -2, 'W': 11, 'Y': 2, 'V': -3 },
    'Y': { 'A': -2, 'R': -2, 'N': -2, 'D': -3, 'C': -2, 'Q': -1, 'E': -2, 'G': -3, 'H': 2, 'I': -1, 'L': -1, 'K': -2, 'M': -1, 'F': 3, 'P': -3, 'S': -2, 'T': -2, 'W': 2, 'Y': 7, 'V': -1 },
    'V': { 'A': 0, 'R': -3, 'N': -3, 'D': -3, 'C': -1, 'Q': -2, 'E': -2, 'G': -3, 'H': -3, 'I': 3, 'L': 1, 'K': -2, 'M': 1, 'F': -1, 'P': -2, 'S': -2, 'T': 0, 'W': -3, 'Y': -1, 'V': 4 }
};
// ============================================================================
// RNA Class
// ============================================================================
export class RNA {
    sequence;
    constructor(sequence) {
        this.sequence = sequence.toUpperCase();
        this.validate();
    }
    validate() {
        for (const nucleotide of this.sequence) {
            if (!['A', 'U', 'G', 'C', 'N'].includes(nucleotide)) {
                throw new Error(`Invalid nucleotide: ${nucleotide}. RNA must contain only A, U, G, C, or N.`);
            }
        }
    }
    toString() {
        return this.sequence;
    }
    get length() {
        return this.sequence.length;
    }
    /**
     * Translate RNA to protein sequence
     */
    translate(startFromAUG = false) {
        let start = 0;
        if (startFromAUG) {
            start = this.sequence.indexOf('AUG');
            if (start === -1) {
                throw new Error('No start codon (AUG) found');
            }
        }
        const aminoAcids = [];
        for (let i = start; i + 2 < this.sequence.length; i += 3) {
            const codon = this.sequence.slice(i, i + 3);
            const aa = CODON_TABLE[codon];
            if (!aa)
                continue;
            if (aa === '*')
                break; // Stop codon
            aminoAcids.push(aa);
        }
        return new Protein(aminoAcids.join(''));
    }
    /**
     * Find all start codons
     */
    findStartCodons() {
        const positions = [];
        let pos = 0;
        while ((pos = this.sequence.indexOf('AUG', pos)) !== -1) {
            positions.push(pos);
            pos++;
        }
        return positions;
    }
    /**
     * Find all stop codons
     */
    findStopCodons() {
        const stops = [];
        const stopCodons = ['UAA', 'UAG', 'UGA'];
        for (let i = 0; i + 2 < this.sequence.length; i++) {
            const codon = this.sequence.slice(i, i + 3);
            if (stopCodons.includes(codon)) {
                stops.push({ position: i, codon });
            }
        }
        return stops;
    }
    /**
     * Reverse transcribe RNA back to DNA
     */
    reverseTranscribe() {
        const dnaSeq = this.sequence.replace(/U/g, 'T').replace(/u/g, 't');
        return new DNA(dnaSeq);
    }
}
// ============================================================================
// Protein Class
// ============================================================================
export class Protein {
    sequence;
    constructor(sequence) {
        this.sequence = sequence.toUpperCase();
        this.validate();
    }
    validate() {
        const validAA = 'ARNDCEQGHILKMFPSTWYV*';
        for (const aa of this.sequence) {
            if (!validAA.includes(aa)) {
                throw new Error(`Invalid amino acid: ${aa}`);
            }
        }
    }
    toString() {
        return this.sequence;
    }
    get length() {
        return this.sequence.length;
    }
    /**
     * Calculate molecular weight (approximate, in Daltons)
     */
    molecularWeight() {
        const weights = {
            'A': 89.09, 'R': 174.20, 'N': 132.12, 'D': 133.10, 'C': 121.16,
            'E': 147.13, 'Q': 146.15, 'G': 75.07, 'H': 155.16, 'I': 131.18,
            'L': 131.18, 'K': 146.19, 'M': 149.21, 'F': 165.19, 'P': 115.13,
            'S': 105.09, 'T': 119.12, 'W': 204.23, 'Y': 181.19, 'V': 117.15
        };
        let weight = 18.015; // Water molecule weight
        for (const aa of this.sequence) {
            weight += (weights[aa] || 0) - 18.015; // Subtract water for peptide bond
        }
        return weight;
    }
    /**
     * Calculate isoelectric point (pI)
     */
    isoelectricPoint() {
        const pKa = {
            'D': { acidic: 3.9, basic: 0 },
            'E': { acidic: 4.1, basic: 0 },
            'C': { acidic: 8.3, basic: 0 },
            'Y': { acidic: 10.1, basic: 0 },
            'H': { acidic: 0, basic: 6.0 },
            'K': { acidic: 0, basic: 10.5 },
            'R': { acidic: 0, basic: 12.5 }
        };
        // Binary search for pI
        let low = 0, high = 14;
        while (high - low > 0.01) {
            const mid = (low + high) / 2;
            const charge = this.calculateCharge(mid, pKa);
            if (charge > 0) {
                low = mid;
            }
            else {
                high = mid;
            }
        }
        return (low + high) / 2;
    }
    calculateCharge(pH, pKa) {
        let charge = 0;
        // N-terminus (pKa ~9.6)
        charge += 1 / (1 + Math.pow(10, pH - 9.6));
        // C-terminus (pKa ~2.3)
        charge -= 1 / (1 + Math.pow(10, 2.3 - pH));
        for (const aa of this.sequence) {
            if (pKa[aa]) {
                if (pKa[aa].acidic > 0) {
                    charge -= 1 / (1 + Math.pow(10, pKa[aa].acidic - pH));
                }
                if (pKa[aa].basic > 0) {
                    charge += 1 / (1 + Math.pow(10, pH - pKa[aa].basic));
                }
            }
        }
        return charge;
    }
    /**
     * Count amino acid composition
     */
    composition() {
        const counts = {};
        for (const aa of this.sequence) {
            counts[aa] = (counts[aa] || 0) + 1;
        }
        return counts;
    }
    /**
     * Calculate hydropathy index (Kyte-Doolittle)
     */
    hydropathy() {
        const scale = {
            'I': 4.5, 'V': 4.2, 'L': 3.8, 'F': 2.8, 'C': 2.5,
            'M': 1.9, 'A': 1.8, 'G': -0.4, 'T': -0.7, 'S': -0.8,
            'W': -0.9, 'Y': -1.3, 'P': -1.6, 'H': -3.2, 'E': -3.5,
            'Q': -3.5, 'D': -3.5, 'N': -3.5, 'K': -3.9, 'R': -4.5
        };
        return Array.from(this.sequence).map(aa => scale[aa] || 0);
    }
    /**
     * Predict secondary structure (simplified Chou-Fasman)
     */
    predictSecondaryStructure() {
        // Propensities for alpha helix
        const helixProp = {
            'A': 1.42, 'L': 1.21, 'E': 1.51, 'M': 1.45, 'Q': 1.11,
            'K': 1.16, 'R': 0.98, 'H': 1.00, 'V': 1.06, 'I': 1.08,
            'Y': 0.69, 'C': 0.70, 'W': 1.08, 'F': 1.13, 'T': 0.83,
            'G': 0.57, 'N': 0.67, 'P': 0.57, 'S': 0.77, 'D': 1.01
        };
        // Propensities for beta sheet
        const sheetProp = {
            'V': 1.70, 'I': 1.60, 'Y': 1.47, 'F': 1.38, 'W': 1.37,
            'L': 1.30, 'T': 1.19, 'C': 1.19, 'Q': 1.10, 'M': 1.05,
            'R': 0.93, 'N': 0.89, 'H': 0.87, 'A': 0.83, 'S': 0.75,
            'G': 0.75, 'K': 0.74, 'P': 0.55, 'D': 0.54, 'E': 0.37
        };
        const result = [];
        const windowSize = 6;
        for (let i = 0; i < this.sequence.length; i++) {
            let helixScore = 0, sheetScore = 0;
            let count = 0;
            for (let j = Math.max(0, i - windowSize); j <= Math.min(this.sequence.length - 1, i + windowSize); j++) {
                const aa = this.sequence[j];
                helixScore += helixProp[aa] || 1.0;
                sheetScore += sheetProp[aa] || 1.0;
                count++;
            }
            helixScore /= count;
            sheetScore /= count;
            if (helixScore > 1.03 && helixScore > sheetScore) {
                result.push('H'); // Helix
            }
            else if (sheetScore > 1.05) {
                result.push('E'); // Extended (sheet)
            }
            else {
                result.push('C'); // Coil
            }
        }
        return result.join('');
    }
}
// ============================================================================
// DNA Class
// ============================================================================
export class DNA {
    sequence;
    constructor(sequence) {
        this.sequence = sequence.toUpperCase();
        this.validate();
    }
    validate() {
        for (const nucleotide of this.sequence) {
            if (!['A', 'T', 'G', 'C', 'N'].includes(nucleotide)) {
                throw new Error(`Invalid nucleotide: ${nucleotide}. DNA must contain only A, T, G, C, or N.`);
            }
        }
    }
    toString() {
        return this.sequence;
    }
    get length() {
        return this.sequence.length;
    }
    /**
     * Get nucleotide at position
     */
    at(index) {
        if (index < 0)
            index = this.sequence.length + index;
        return this.sequence[index];
    }
    /**
     * Get subsequence
     */
    slice(start, end) {
        return new DNA(this.sequence.slice(start, end));
    }
    // ========================================================================
    // Basic Operations
    // ========================================================================
    /**
     * Get the complementary DNA strand
     */
    complement() {
        const comp = this.sequence.split('').map(b => DNA_COMPLEMENT[b] || b).join('');
        return new DNA(comp);
    }
    /**
     * Get the reverse complement (5' to 3' of complementary strand)
     */
    reverseComplement() {
        const comp = this.complement().toString();
        return new DNA(comp.split('').reverse().join(''));
    }
    /**
     * Transcribe DNA to RNA (T -> U)
     */
    transcribe() {
        const rnaSeq = this.sequence.split('').map(b => DNA_TO_RNA[b] || b).join('');
        return new RNA(rnaSeq);
    }
    /**
     * Calculate GC content (0-1)
     */
    gcContent() {
        if (this.sequence.length === 0)
            return 0;
        let gc = 0;
        for (const nucleotide of this.sequence) {
            if (nucleotide === 'G' || nucleotide === 'C')
                gc++;
        }
        return gc / this.sequence.length;
    }
    /**
     * Calculate melting temperature (simplified nearest-neighbor)
     */
    meltingTemperature() {
        const len = this.sequence.length;
        if (len === 0)
            return 0;
        // For short oligos (< 14 bp): Wallace rule
        if (len < 14) {
            let at = 0, gc = 0;
            for (const nt of this.sequence) {
                if (nt === 'A' || nt === 'T')
                    at++;
                else if (nt === 'G' || nt === 'C')
                    gc++;
            }
            return 2 * at + 4 * gc;
        }
        // For longer sequences: simplified formula
        const gcContent = this.gcContent();
        return 81.5 + 16.6 * Math.log10(0.05) + 41 * gcContent - 600 / len;
    }
    /**
     * Count nucleotide frequencies
     */
    nucleotideFrequencies() {
        const counts = { 'A': 0, 'T': 0, 'G': 0, 'C': 0 };
        for (const nt of this.sequence) {
            if (counts[nt] !== undefined)
                counts[nt]++;
        }
        return counts;
    }
    // ========================================================================
    // CRISPR Analysis
    // ========================================================================
    /**
     * Find CRISPR/Cas9 target sites with PAM sequences
     */
    findCrisprTargets(pam = 'NGG') {
        const targets = [];
        const pamRegex = this.pamToRegex(pam);
        // Search forward strand
        for (let i = 0; i <= this.sequence.length - 23; i++) {
            const guide = this.sequence.slice(i, i + 20);
            const pamSite = this.sequence.slice(i + 20, i + 23);
            if (pamRegex.test(pamSite)) {
                const gcContent = this.calculateGC(guide);
                targets.push({
                    start: i,
                    end: i + 23,
                    guideSequence: guide,
                    pamSequence: pamSite,
                    gcContent,
                    offTargetScore: this.calculateOffTargetScore(guide),
                    efficiency: this.predictCrisprEfficiency(guide, pamSite),
                    strand: '+'
                });
            }
        }
        // Search reverse strand
        const revComp = this.reverseComplement().toString();
        for (let i = 0; i <= revComp.length - 23; i++) {
            const guide = revComp.slice(i, i + 20);
            const pamSite = revComp.slice(i + 20, i + 23);
            if (pamRegex.test(pamSite)) {
                const gcContent = this.calculateGC(guide);
                const origStart = this.sequence.length - i - 23;
                targets.push({
                    start: origStart,
                    end: origStart + 23,
                    guideSequence: guide,
                    pamSequence: pamSite,
                    gcContent,
                    offTargetScore: this.calculateOffTargetScore(guide),
                    efficiency: this.predictCrisprEfficiency(guide, pamSite),
                    strand: '-'
                });
            }
        }
        return targets.sort((a, b) => b.efficiency - a.efficiency);
    }
    pamToRegex(pam) {
        const iupac = {
            'N': '[ATGC]', 'R': '[AG]', 'Y': '[CT]', 'S': '[GC]',
            'W': '[AT]', 'K': '[GT]', 'M': '[AC]', 'B': '[CGT]',
            'D': '[AGT]', 'H': '[ACT]', 'V': '[ACG]'
        };
        let pattern = '';
        for (const char of pam.toUpperCase()) {
            pattern += iupac[char] || char;
        }
        return new RegExp(`^${pattern}$`);
    }
    calculateGC(sequence) {
        let gc = 0;
        for (const nt of sequence) {
            if (nt === 'G' || nt === 'C')
                gc++;
        }
        return gc / sequence.length;
    }
    calculateOffTargetScore(guide) {
        // Rule Set 2 off-target scoring (simplified)
        // Lower score = fewer predicted off-targets
        const gc = this.calculateGC(guide);
        // Penalize extreme GC content
        let score = 100;
        if (gc < 0.3 || gc > 0.7)
            score -= 20;
        // Penalize polyT (4+ Ts in a row) - can terminate Pol III
        if (/TTTT/.test(guide))
            score -= 30;
        // Penalize GG in first 4 positions (seed region)
        if (/^.{0,3}GG/.test(guide))
            score -= 10;
        return Math.max(0, score);
    }
    predictCrisprEfficiency(guide, pam) {
        // Doench 2016 Rule Set 2 (simplified)
        let score = 50;
        // GC content (optimal: 40-70%)
        const gc = this.calculateGC(guide);
        if (gc >= 0.4 && gc <= 0.7)
            score += 20;
        else if (gc < 0.3 || gc > 0.8)
            score -= 20;
        // Position-specific nucleotide preferences
        // Position 20 (adjacent to PAM): G preferred
        if (guide[19] === 'G')
            score += 10;
        // Position 16: G preferred
        if (guide[15] === 'G')
            score += 5;
        // Position 3: C preferred
        if (guide[2] === 'C')
            score += 5;
        // PAM strength
        if (pam === 'AGG')
            score += 5;
        else if (pam === 'TGG')
            score -= 5;
        // Avoid polyT
        if (/TTTT/.test(guide))
            score -= 30;
        return Math.max(0, Math.min(100, score));
    }
    // ========================================================================
    // Sequence Alignment
    // ========================================================================
    /**
     * Local alignment using Smith-Waterman algorithm
     */
    alignLocal(other, scoring) {
        return smithWaterman(this.sequence, other.sequence, scoring);
    }
    /**
     * Global alignment using Needleman-Wunsch algorithm
     */
    alignGlobal(other, scoring) {
        return needlemanWunsch(this.sequence, other.sequence, scoring);
    }
    /**
     * Calculate Hamming distance (for equal-length sequences)
     */
    hammingDistance(other) {
        if (this.sequence.length !== other.sequence.length) {
            throw new Error('Sequences must be of equal length for Hamming distance');
        }
        let distance = 0;
        for (let i = 0; i < this.sequence.length; i++) {
            if (this.sequence[i] !== other.sequence[i])
                distance++;
        }
        return distance;
    }
    /**
     * Calculate Jukes-Cantor evolutionary distance
     */
    jukesCantor(other) {
        const p = this.hammingDistance(other) / this.sequence.length;
        if (p >= 0.75)
            return Infinity; // Saturation
        return -0.75 * Math.log(1 - 4 * p / 3);
    }
    // ========================================================================
    // Open Reading Frames
    // ========================================================================
    /**
     * Find all open reading frames
     */
    findORFs(minLength = 100) {
        const orfs = [];
        const rna = this.transcribe();
        const rnaSeq = rna.toString();
        // Check all 3 reading frames in both directions
        for (let frame = 0; frame < 3; frame++) {
            this.findORFsInFrame(rnaSeq, frame, '+', minLength, orfs);
        }
        const revCompRNA = this.reverseComplement().transcribe().toString();
        for (let frame = 0; frame < 3; frame++) {
            this.findORFsInFrame(revCompRNA, frame, '-', minLength, orfs);
        }
        return orfs.sort((a, b) => b.length - a.length);
    }
    findORFsInFrame(rnaSeq, frame, _strand, minLength, orfs) {
        let inORF = false;
        let orfStart = 0;
        let protein = '';
        for (let i = frame; i + 2 < rnaSeq.length; i += 3) {
            const codon = rnaSeq.slice(i, i + 3);
            const aa = CODON_TABLE[codon];
            if (!inORF && codon === 'AUG') {
                inORF = true;
                orfStart = i;
                protein = 'M';
            }
            else if (inORF) {
                if (aa === '*' || !aa) {
                    // End of ORF
                    if (protein.length * 3 >= minLength) {
                        orfs.push({
                            start: orfStart,
                            end: i + 3,
                            frame: frame + 1,
                            sequence: rnaSeq.slice(orfStart, i + 3),
                            protein,
                            length: protein.length * 3
                        });
                    }
                    inORF = false;
                    protein = '';
                }
                else {
                    protein += aa;
                }
            }
        }
        // Handle ORF extending to end of sequence
        if (inORF && protein.length * 3 >= minLength) {
            orfs.push({
                start: orfStart,
                end: rnaSeq.length,
                frame: frame + 1,
                sequence: rnaSeq.slice(orfStart),
                protein,
                length: protein.length * 3
            });
        }
    }
    /**
     * Translate DNA directly to protein (all 6 frames)
     */
    translate(frame = 0) {
        const rna = this.transcribe();
        return rna.translate(false);
    }
    // ========================================================================
    // Pattern Finding
    // ========================================================================
    /**
     * Find restriction enzyme cut sites
     */
    findRestrictionSites(enzyme) {
        const enzymes = {
            'EcoRI': 'GAATTC',
            'BamHI': 'GGATCC',
            'HindIII': 'AAGCTT',
            'NotI': 'GCGGCCGC',
            'XhoI': 'CTCGAG',
            'SalI': 'GTCGAC',
            'PstI': 'CTGCAG',
            'SmaI': 'CCCGGG',
            'KpnI': 'GGTACC',
            'SacI': 'GAGCTC',
            'XbaI': 'TCTAGA',
            'BglII': 'AGATCT',
            'NcoI': 'CCATGG',
            'NdeI': 'CATATG',
            'EcoRV': 'GATATC'
        };
        const sites = [];
        const targetEnzymes = enzyme ? { [enzyme]: enzymes[enzyme] } : enzymes;
        for (const [name, pattern] of Object.entries(targetEnzymes)) {
            if (!pattern)
                continue;
            let pos = 0;
            while ((pos = this.sequence.indexOf(pattern, pos)) !== -1) {
                sites.push({ enzyme: name, position: pos, sequence: pattern });
                pos++;
            }
        }
        return sites.sort((a, b) => a.position - b.position);
    }
    /**
     * Find tandem repeats
     */
    findTandemRepeats(minRepeatLength = 2, minRepeats = 3) {
        const repeats = [];
        for (let unitLen = minRepeatLength; unitLen <= this.sequence.length / minRepeats; unitLen++) {
            for (let start = 0; start <= this.sequence.length - unitLen * minRepeats; start++) {
                const unit = this.sequence.slice(start, start + unitLen);
                let count = 1;
                let pos = start + unitLen;
                while (pos + unitLen <= this.sequence.length &&
                    this.sequence.slice(pos, pos + unitLen) === unit) {
                    count++;
                    pos += unitLen;
                }
                if (count >= minRepeats) {
                    repeats.push({
                        start,
                        end: start + count * unitLen,
                        unit,
                        count
                    });
                    start = pos - 1; // Skip ahead
                }
            }
        }
        return repeats;
    }
    /**
     * Find palindromic sequences
     */
    findPalindromes(minLength = 4) {
        const palindromes = [];
        for (let len = minLength; len <= this.sequence.length; len += 2) {
            for (let start = 0; start <= this.sequence.length - len; start++) {
                const subseq = this.sequence.slice(start, start + len);
                const revComp = new DNA(subseq).reverseComplement().toString();
                if (subseq === revComp) {
                    palindromes.push({
                        start,
                        end: start + len,
                        sequence: subseq
                    });
                }
            }
        }
        return palindromes;
    }
    // ========================================================================
    // Static Methods for Phylogenetics
    // ========================================================================
    /**
     * Build phylogenetic tree using UPGMA
     */
    static buildTreeUPGMA(sequences, names) {
        return buildUPGMATree(sequences, names);
    }
    /**
     * Build phylogenetic tree using Neighbor-Joining
     */
    static buildTreeNJ(sequences, names) {
        return buildNJTree(sequences, names);
    }
    /**
     * Calculate distance matrix
     */
    static distanceMatrix(sequences, method = 'jukes-cantor') {
        const n = sequences.length;
        const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                let distance;
                if (method === 'hamming') {
                    distance = sequences[i].hammingDistance(sequences[j]) / sequences[i].length;
                }
                else {
                    distance = sequences[i].jukesCantor(sequences[j]);
                }
                matrix[i][j] = distance;
                matrix[j][i] = distance;
            }
        }
        return matrix;
    }
    // ========================================================================
    // Utility Methods
    // ========================================================================
    /**
     * Generate random DNA sequence
     */
    static random(length, gcContent = 0.5) {
        const nucleotides = ['A', 'T', 'G', 'C'];
        let sequence = '';
        for (let i = 0; i < length; i++) {
            if (Math.random() < gcContent) {
                sequence += Math.random() < 0.5 ? 'G' : 'C';
            }
            else {
                sequence += Math.random() < 0.5 ? 'A' : 'T';
            }
        }
        return new DNA(sequence);
    }
    /**
     * Parse FASTA format
     */
    static fromFasta(fasta) {
        const results = [];
        const lines = fasta.split('\n');
        let currentId = '';
        let currentDesc = '';
        let currentSeq = '';
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('>')) {
                if (currentSeq) {
                    results.push({
                        id: currentId,
                        description: currentDesc,
                        sequence: new DNA(currentSeq)
                    });
                }
                const header = trimmed.slice(1);
                const spaceIdx = header.indexOf(' ');
                if (spaceIdx > 0) {
                    currentId = header.slice(0, spaceIdx);
                    currentDesc = header.slice(spaceIdx + 1);
                }
                else {
                    currentId = header;
                    currentDesc = '';
                }
                currentSeq = '';
            }
            else if (trimmed) {
                currentSeq += trimmed.replace(/\s/g, '');
            }
        }
        if (currentSeq) {
            results.push({
                id: currentId,
                description: currentDesc,
                sequence: new DNA(currentSeq)
            });
        }
        return results;
    }
    /**
     * Export to FASTA format
     */
    toFasta(id, description = '', lineWidth = 70) {
        let fasta = `>${id}`;
        if (description)
            fasta += ` ${description}`;
        fasta += '\n';
        for (let i = 0; i < this.sequence.length; i += lineWidth) {
            fasta += this.sequence.slice(i, i + lineWidth) + '\n';
        }
        return fasta;
    }
    /**
     * Static complement method (backward compatibility)
     */
    static complement(sequence) {
        return sequence.split('').map(b => DNA_COMPLEMENT[b.toUpperCase()] || b).join('');
    }
    /**
     * Static CRISPR target finder (backward compatibility)
     */
    static findCrisprTarget(sequence) {
        return new DNA(sequence).findCrisprTargets();
    }
}
// ============================================================================
// Alignment Algorithms
// ============================================================================
/**
 * Smith-Waterman local alignment
 */
function smithWaterman(seq1, seq2, scoring) {
    const s = scoring || { match: 2, mismatch: -1, gap: -2 };
    const m = seq1.length;
    const n = seq2.length;
    // Initialize scoring matrix
    const H = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    let maxScore = 0;
    let maxI = 0, maxJ = 0;
    // Fill the scoring matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const matchScore = seq1[i - 1] === seq2[j - 1] ? s.match : s.mismatch;
            const diagonal = H[i - 1][j - 1] + matchScore;
            const up = H[i - 1][j] + s.gap;
            const left = H[i][j - 1] + s.gap;
            H[i][j] = Math.max(0, diagonal, up, left);
            if (H[i][j] > maxScore) {
                maxScore = H[i][j];
                maxI = i;
                maxJ = j;
            }
        }
    }
    // Traceback
    let aligned1 = '';
    let aligned2 = '';
    let i = maxI, j = maxJ;
    const endI = maxI, endJ = maxJ;
    while (i > 0 && j > 0 && H[i][j] > 0) {
        const current = H[i][j];
        const matchScore = seq1[i - 1] === seq2[j - 1] ? s.match : s.mismatch;
        const diagonal = H[i - 1][j - 1] + matchScore;
        if (current === diagonal) {
            aligned1 = seq1[i - 1] + aligned1;
            aligned2 = seq2[j - 1] + aligned2;
            i--;
            j--;
        }
        else if (current === H[i - 1][j] + s.gap) {
            aligned1 = seq1[i - 1] + aligned1;
            aligned2 = '-' + aligned2;
            i--;
        }
        else {
            aligned1 = '-' + aligned1;
            aligned2 = seq2[j - 1] + aligned2;
            j--;
        }
    }
    // Calculate identity and gaps
    let matches = 0, gaps = 0;
    for (let k = 0; k < aligned1.length; k++) {
        if (aligned1[k] === '-' || aligned2[k] === '-')
            gaps++;
        else if (aligned1[k] === aligned2[k])
            matches++;
    }
    return {
        alignedSeq1: aligned1,
        alignedSeq2: aligned2,
        score: maxScore,
        identity: aligned1.length > 0 ? matches / aligned1.length : 0,
        gaps,
        startPos1: i,
        endPos1: endI - 1,
        startPos2: j,
        endPos2: endJ - 1
    };
}
/**
 * Needleman-Wunsch global alignment
 */
function needlemanWunsch(seq1, seq2, scoring) {
    const s = scoring || { match: 2, mismatch: -1, gap: -2 };
    const m = seq1.length;
    const n = seq2.length;
    // Initialize scoring matrix
    const F = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    // Initialize first row and column
    for (let i = 0; i <= m; i++)
        F[i][0] = i * s.gap;
    for (let j = 0; j <= n; j++)
        F[0][j] = j * s.gap;
    // Fill the scoring matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const matchScore = seq1[i - 1] === seq2[j - 1] ? s.match : s.mismatch;
            F[i][j] = Math.max(F[i - 1][j - 1] + matchScore, F[i - 1][j] + s.gap, F[i][j - 1] + s.gap);
        }
    }
    // Traceback
    let aligned1 = '';
    let aligned2 = '';
    let i = m, j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0) {
            const matchScore = seq1[i - 1] === seq2[j - 1] ? s.match : s.mismatch;
            if (F[i][j] === F[i - 1][j - 1] + matchScore) {
                aligned1 = seq1[i - 1] + aligned1;
                aligned2 = seq2[j - 1] + aligned2;
                i--;
                j--;
                continue;
            }
        }
        if (i > 0 && F[i][j] === F[i - 1][j] + s.gap) {
            aligned1 = seq1[i - 1] + aligned1;
            aligned2 = '-' + aligned2;
            i--;
        }
        else {
            aligned1 = '-' + aligned1;
            aligned2 = seq2[j - 1] + aligned2;
            j--;
        }
    }
    // Calculate identity and gaps
    let matches = 0, gaps = 0;
    for (let k = 0; k < aligned1.length; k++) {
        if (aligned1[k] === '-' || aligned2[k] === '-')
            gaps++;
        else if (aligned1[k] === aligned2[k])
            matches++;
    }
    return {
        alignedSeq1: aligned1,
        alignedSeq2: aligned2,
        score: F[m][n],
        identity: aligned1.length > 0 ? matches / aligned1.length : 0,
        gaps,
        startPos1: 0,
        endPos1: m - 1,
        startPos2: 0,
        endPos2: n - 1
    };
}
// ============================================================================
// Phylogenetic Tree Algorithms
// ============================================================================
/**
 * UPGMA tree building algorithm
 */
function buildUPGMATree(sequences, names) {
    const n = sequences.length;
    if (n === 0)
        throw new Error('No sequences provided');
    if (n === 1) {
        return { id: '0', name: names?.[0], distance: 0, children: [], sequence: sequences[0] };
    }
    // Calculate initial distance matrix
    const distances = DNA.distanceMatrix(sequences, 'jukes-cantor');
    const clusters = new Map();
    for (let i = 0; i < n; i++) {
        clusters.set(i, {
            id: String(i),
            name: names?.[i],
            size: 1,
            height: 0,
            children: []
        });
    }
    let nextId = n;
    const active = new Set(Array.from({ length: n }, (_, i) => i));
    while (active.size > 1) {
        // Find minimum distance
        let minDist = Infinity;
        let minI = -1, minJ = -1;
        const activeArr = Array.from(active);
        for (let ai = 0; ai < activeArr.length; ai++) {
            for (let aj = ai + 1; aj < activeArr.length; aj++) {
                const i = activeArr[ai];
                const j = activeArr[aj];
                if (distances[i][j] < minDist) {
                    minDist = distances[i][j];
                    minI = i;
                    minJ = j;
                }
            }
        }
        // Merge clusters
        const ci = clusters.get(minI);
        const cj = clusters.get(minJ);
        const newHeight = minDist / 2;
        const newCluster = {
            id: String(nextId),
            size: ci.size + cj.size,
            height: newHeight,
            children: [
                { id: ci.id, name: ci.name, distance: newHeight - ci.height, children: ci.children },
                { id: cj.id, name: cj.name, distance: newHeight - cj.height, children: cj.children }
            ]
        };
        // Update distance matrix
        for (const k of active) {
            if (k !== minI && k !== minJ) {
                const newDist = (distances[minI][k] * ci.size + distances[minJ][k] * cj.size) /
                    (ci.size + cj.size);
                distances[minI][k] = newDist;
                distances[k][minI] = newDist;
            }
        }
        // Remove old, add new
        active.delete(minJ);
        clusters.delete(minJ);
        clusters.set(minI, newCluster);
        nextId++;
    }
    const root = clusters.get(Array.from(active)[0]);
    return {
        id: root.id,
        name: root.name,
        distance: 0,
        children: root.children
    };
}
/**
 * Neighbor-Joining tree building algorithm
 */
function buildNJTree(sequences, names) {
    const n = sequences.length;
    if (n === 0)
        throw new Error('No sequences provided');
    if (n === 1) {
        return { id: '0', name: names?.[0], distance: 0, children: [], sequence: sequences[0] };
    }
    // Calculate initial distance matrix
    const D = DNA.distanceMatrix(sequences, 'jukes-cantor');
    const nodes = new Map();
    for (let i = 0; i < n; i++) {
        nodes.set(i, { id: String(i), name: names?.[i], children: [] });
    }
    let nextId = n;
    const active = new Set(Array.from({ length: n }, (_, i) => i));
    while (active.size > 2) {
        const r = active.size;
        const activeArr = Array.from(active);
        // Calculate row sums
        const rowSums = new Map();
        for (const i of active) {
            let sum = 0;
            for (const j of active) {
                if (i !== j)
                    sum += D[i][j];
            }
            rowSums.set(i, sum);
        }
        // Find minimum Q value
        let minQ = Infinity;
        let minI = -1, minJ = -1;
        for (let ai = 0; ai < activeArr.length; ai++) {
            for (let aj = ai + 1; aj < activeArr.length; aj++) {
                const i = activeArr[ai];
                const j = activeArr[aj];
                const Q = (r - 2) * D[i][j] - rowSums.get(i) - rowSums.get(j);
                if (Q < minQ) {
                    minQ = Q;
                    minI = i;
                    minJ = j;
                }
            }
        }
        // Calculate branch lengths
        const sumI = rowSums.get(minI);
        const sumJ = rowSums.get(minJ);
        const distI = D[minI][minJ] / 2 + (sumI - sumJ) / (2 * (r - 2));
        const distJ = D[minI][minJ] - distI;
        // Create new node
        const nodeI = nodes.get(minI);
        const nodeJ = nodes.get(minJ);
        const newNode = {
            id: String(nextId),
            children: [
                { id: nodeI.id, name: nodeI.name, distance: Math.max(0, distI), children: nodeI.children },
                { id: nodeJ.id, name: nodeJ.name, distance: Math.max(0, distJ), children: nodeJ.children }
            ]
        };
        // Update distance matrix
        for (const k of active) {
            if (k !== minI && k !== minJ) {
                const newDist = (D[minI][k] + D[minJ][k] - D[minI][minJ]) / 2;
                D[minI][k] = newDist;
                D[k][minI] = newDist;
            }
        }
        // Remove old, add new
        active.delete(minJ);
        nodes.delete(minJ);
        nodes.set(minI, newNode);
        nextId++;
    }
    // Connect final two nodes
    const [i, j] = Array.from(active);
    const nodeI = nodes.get(i);
    const nodeJ = nodes.get(j);
    const finalDist = D[i][j] / 2;
    return {
        id: String(nextId),
        distance: 0,
        children: [
            { id: nodeI.id, name: nodeI.name, distance: finalDist, children: nodeI.children },
            { id: nodeJ.id, name: nodeJ.name, distance: finalDist, children: nodeJ.children }
        ]
    };
}
// ============================================================================
// Protein Alignment
// ============================================================================
/**
 * Align two protein sequences using BLOSUM62
 */
export function alignProteins(seq1, seq2, local = true) {
    const s1 = seq1.toString();
    const s2 = seq2.toString();
    const m = s1.length;
    const n = s2.length;
    const gapPenalty = -8;
    // Initialize scoring matrix
    const F = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    if (!local) {
        for (let i = 0; i <= m; i++)
            F[i][0] = i * gapPenalty;
        for (let j = 0; j <= n; j++)
            F[0][j] = j * gapPenalty;
    }
    let maxScore = 0;
    let maxI = 0, maxJ = 0;
    // Fill the scoring matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const aa1 = s1[i - 1];
            const aa2 = s2[j - 1];
            const matchScore = (BLOSUM62[aa1]?.[aa2]) ?? -4;
            const diagonal = F[i - 1][j - 1] + matchScore;
            const up = F[i - 1][j] + gapPenalty;
            const left = F[i][j - 1] + gapPenalty;
            if (local) {
                F[i][j] = Math.max(0, diagonal, up, left);
                if (F[i][j] > maxScore) {
                    maxScore = F[i][j];
                    maxI = i;
                    maxJ = j;
                }
            }
            else {
                F[i][j] = Math.max(diagonal, up, left);
            }
        }
    }
    // Traceback
    let aligned1 = '';
    let aligned2 = '';
    let i = local ? maxI : m;
    let j = local ? maxJ : n;
    const endI = i, endJ = j;
    while (i > 0 || j > 0) {
        if (local && F[i][j] === 0)
            break;
        if (i > 0 && j > 0) {
            const aa1 = s1[i - 1];
            const aa2 = s2[j - 1];
            const matchScore = (BLOSUM62[aa1]?.[aa2]) ?? -4;
            if (F[i][j] === F[i - 1][j - 1] + matchScore) {
                aligned1 = s1[i - 1] + aligned1;
                aligned2 = s2[j - 1] + aligned2;
                i--;
                j--;
                continue;
            }
        }
        if (i > 0 && F[i][j] === F[i - 1][j] + gapPenalty) {
            aligned1 = s1[i - 1] + aligned1;
            aligned2 = '-' + aligned2;
            i--;
        }
        else if (j > 0) {
            aligned1 = '-' + aligned1;
            aligned2 = s2[j - 1] + aligned2;
            j--;
        }
        else {
            break;
        }
    }
    // Calculate identity and gaps
    let matches = 0, gaps = 0;
    for (let k = 0; k < aligned1.length; k++) {
        if (aligned1[k] === '-' || aligned2[k] === '-')
            gaps++;
        else if (aligned1[k] === aligned2[k])
            matches++;
    }
    return {
        alignedSeq1: aligned1,
        alignedSeq2: aligned2,
        score: local ? maxScore : F[m][n],
        identity: aligned1.length > 0 ? matches / aligned1.length : 0,
        gaps,
        startPos1: i,
        endPos1: endI - 1,
        startPos2: j,
        endPos2: endJ - 1
    };
}
/**
 * Simple BLAST-like search (k-mer based)
 */
export function blast(query, database, options) {
    const wordSize = options?.wordSize ?? 11;
    const threshold = options?.threshold ?? 50;
    const maxHits = options?.maxHits ?? 100;
    const querySeq = query.toString();
    const hits = [];
    // Build k-mer index for query
    const queryKmers = new Set();
    for (let i = 0; i <= querySeq.length - wordSize; i++) {
        queryKmers.add(querySeq.slice(i, i + wordSize));
    }
    // Search database
    for (const entry of database.sequences) {
        const targetSeq = entry.sequence.toString();
        let matchCount = 0;
        // Count k-mer matches
        for (let i = 0; i <= targetSeq.length - wordSize; i++) {
            if (queryKmers.has(targetSeq.slice(i, i + wordSize))) {
                matchCount++;
            }
        }
        // If enough k-mer hits, do full alignment
        if (matchCount >= 3) {
            const alignment = query.alignLocal(entry.sequence);
            if (alignment.score >= threshold) {
                // Calculate E-value (simplified)
                const k = 0.13; // Karlin-Altschul parameter
                const lambda = 0.318;
                const m = querySeq.length;
                const n = targetSeq.length;
                const eValue = k * m * n * Math.exp(-lambda * alignment.score);
                hits.push({
                    sequenceId: entry.id,
                    score: alignment.score,
                    eValue,
                    identity: alignment.identity,
                    alignment
                });
            }
        }
    }
    // Sort by E-value and limit results
    return hits
        .sort((a, b) => a.eValue - b.eValue)
        .slice(0, maxHits);
}
// ============================================================================
// Motif Finding
// ============================================================================
/**
 * Find motifs using position weight matrix
 */
export function findMotifs(sequences, motifLength, options) {
    const iterations = options?.iterations ?? 100;
    const threshold = options?.threshold ?? 0.5;
    const n = sequences.length;
    // Random initialization
    let positions = sequences.map(seq => Math.floor(Math.random() * (seq.length - motifLength + 1)));
    for (let iter = 0; iter < iterations; iter++) {
        // Build PWM from current positions
        const pwm = buildPWM(sequences, positions, motifLength);
        // Update positions based on PWM scores
        for (let i = 0; i < n; i++) {
            let bestPos = 0;
            let bestScore = -Infinity;
            const seq = sequences[i].toString();
            for (let j = 0; j <= seq.length - motifLength; j++) {
                const kmer = seq.slice(j, j + motifLength);
                const score = scorePWM(kmer, pwm);
                if (score > bestScore) {
                    bestScore = score;
                    bestPos = j;
                }
            }
            positions[i] = bestPos;
        }
    }
    // Build final PWM
    const pwm = buildPWM(sequences, positions, motifLength);
    // Generate consensus
    const consensus = pwmToConsensus(pwm, threshold);
    return { consensus, pwm, positions };
}
function buildPWM(sequences, positions, motifLength) {
    const pwm = Array(motifLength).fill(null).map(() => [0.25, 0.25, 0.25, 0.25]);
    const ntToIdx = { 'A': 0, 'T': 1, 'G': 2, 'C': 3 };
    for (let i = 0; i < sequences.length; i++) {
        const seq = sequences[i].toString();
        const start = positions[i];
        for (let j = 0; j < motifLength; j++) {
            const nt = seq[start + j];
            const idx = ntToIdx[nt];
            if (idx !== undefined) {
                pwm[j][idx] += 1;
            }
        }
    }
    // Normalize with pseudocounts
    for (let j = 0; j < motifLength; j++) {
        const total = pwm[j].reduce((a, b) => a + b, 0);
        for (let k = 0; k < 4; k++) {
            pwm[j][k] = (pwm[j][k] + 0.25) / (total + 1);
        }
    }
    return pwm;
}
function scorePWM(kmer, pwm) {
    const ntToIdx = { 'A': 0, 'T': 1, 'G': 2, 'C': 3 };
    let score = 0;
    for (let i = 0; i < kmer.length; i++) {
        const idx = ntToIdx[kmer[i]];
        if (idx !== undefined) {
            score += Math.log2(pwm[i][idx] / 0.25);
        }
    }
    return score;
}
function pwmToConsensus(pwm, threshold) {
    const idxToNt = ['A', 'T', 'G', 'C'];
    const iupac = {
        'AT': 'W', 'AG': 'R', 'AC': 'M', 'TG': 'K', 'TC': 'Y', 'GC': 'S',
        'ATG': 'D', 'ATC': 'H', 'AGC': 'V', 'TGC': 'B', 'ATGC': 'N'
    };
    let consensus = '';
    for (const col of pwm) {
        const maxProb = Math.max(...col);
        if (maxProb >= threshold) {
            const maxIdx = col.indexOf(maxProb);
            consensus += idxToNt[maxIdx];
        }
        else {
            const significant = col
                .map((p, i) => p >= threshold / 2 ? idxToNt[i] : '')
                .filter(Boolean)
                .sort()
                .join('');
            consensus += iupac[significant] || 'N';
        }
    }
    return consensus;
}
//# sourceMappingURL=dna.js.map