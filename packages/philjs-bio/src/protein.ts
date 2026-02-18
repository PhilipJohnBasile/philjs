/**
 * Protein Analysis Toolkit
 *
 * Tools for protein sequence analysis, structure prediction hints,
 * and biochemical property calculations.
 */

// Amino acid single-letter codes
export type AminoAcid =
  | 'A' | 'R' | 'N' | 'D' | 'C' | 'E' | 'Q' | 'G' | 'H' | 'I'
  | 'L' | 'K' | 'M' | 'F' | 'P' | 'S' | 'T' | 'W' | 'Y' | 'V'
  | '*'; // Stop codon

export interface AminoAcidProperties {
  name: string;
  threeLetterCode: string;
  molecularWeight: number;
  hydropathy: number; // Kyte-Doolittle scale
  charge: number; // At pH 7
  polarity: 'polar' | 'nonpolar' | 'acidic' | 'basic';
  aromaticity: boolean;
}

export interface ProteinProperties {
  length: number;
  molecularWeight: number;
  isoelectricPoint: number;
  extinction280: number;
  absorbance01: number; // A280 for 1 mg/mL
  hydropathyGRAVY: number;
  aromaticity: number;
  instabilityIndex: number;
  aliphaticIndex: number;
  composition: Record<AminoAcid, number>;
  chargeAtpH7: number;
}

export interface SecondaryStructurePrediction {
  sequence: string;
  prediction: string; // H = helix, E = sheet, C = coil
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

// Amino acid property database
const AMINO_ACID_DATA: Record<string, AminoAcidProperties> = {
  A: { name: 'Alanine', threeLetterCode: 'Ala', molecularWeight: 89.09, hydropathy: 1.8, charge: 0, polarity: 'nonpolar', aromaticity: false },
  R: { name: 'Arginine', threeLetterCode: 'Arg', molecularWeight: 174.20, hydropathy: -4.5, charge: 1, polarity: 'basic', aromaticity: false },
  N: { name: 'Asparagine', threeLetterCode: 'Asn', molecularWeight: 132.12, hydropathy: -3.5, charge: 0, polarity: 'polar', aromaticity: false },
  D: { name: 'Aspartic acid', threeLetterCode: 'Asp', molecularWeight: 133.10, hydropathy: -3.5, charge: -1, polarity: 'acidic', aromaticity: false },
  C: { name: 'Cysteine', threeLetterCode: 'Cys', molecularWeight: 121.15, hydropathy: 2.5, charge: 0, polarity: 'polar', aromaticity: false },
  E: { name: 'Glutamic acid', threeLetterCode: 'Glu', molecularWeight: 147.13, hydropathy: -3.5, charge: -1, polarity: 'acidic', aromaticity: false },
  Q: { name: 'Glutamine', threeLetterCode: 'Gln', molecularWeight: 146.15, hydropathy: -3.5, charge: 0, polarity: 'polar', aromaticity: false },
  G: { name: 'Glycine', threeLetterCode: 'Gly', molecularWeight: 75.07, hydropathy: -0.4, charge: 0, polarity: 'nonpolar', aromaticity: false },
  H: { name: 'Histidine', threeLetterCode: 'His', molecularWeight: 155.16, hydropathy: -3.2, charge: 0.1, polarity: 'basic', aromaticity: true },
  I: { name: 'Isoleucine', threeLetterCode: 'Ile', molecularWeight: 131.17, hydropathy: 4.5, charge: 0, polarity: 'nonpolar', aromaticity: false },
  L: { name: 'Leucine', threeLetterCode: 'Leu', molecularWeight: 131.17, hydropathy: 3.8, charge: 0, polarity: 'nonpolar', aromaticity: false },
  K: { name: 'Lysine', threeLetterCode: 'Lys', molecularWeight: 146.19, hydropathy: -3.9, charge: 1, polarity: 'basic', aromaticity: false },
  M: { name: 'Methionine', threeLetterCode: 'Met', molecularWeight: 149.21, hydropathy: 1.9, charge: 0, polarity: 'nonpolar', aromaticity: false },
  F: { name: 'Phenylalanine', threeLetterCode: 'Phe', molecularWeight: 165.19, hydropathy: 2.8, charge: 0, polarity: 'nonpolar', aromaticity: true },
  P: { name: 'Proline', threeLetterCode: 'Pro', molecularWeight: 115.13, hydropathy: -1.6, charge: 0, polarity: 'nonpolar', aromaticity: false },
  S: { name: 'Serine', threeLetterCode: 'Ser', molecularWeight: 105.09, hydropathy: -0.8, charge: 0, polarity: 'polar', aromaticity: false },
  T: { name: 'Threonine', threeLetterCode: 'Thr', molecularWeight: 119.12, hydropathy: -0.7, charge: 0, polarity: 'polar', aromaticity: false },
  W: { name: 'Tryptophan', threeLetterCode: 'Trp', molecularWeight: 204.23, hydropathy: -0.9, charge: 0, polarity: 'nonpolar', aromaticity: true },
  Y: { name: 'Tyrosine', threeLetterCode: 'Tyr', molecularWeight: 181.19, hydropathy: -1.3, charge: 0, polarity: 'polar', aromaticity: true },
  V: { name: 'Valine', threeLetterCode: 'Val', molecularWeight: 117.15, hydropathy: 4.2, charge: 0, polarity: 'nonpolar', aromaticity: false },
};

// Common protein motifs
const PROTEIN_MOTIFS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'N-glycosylation', pattern: /N[^P][ST][^P]/g },
  { name: 'Protein kinase C phosphorylation', pattern: /[ST][RK]/g },
  { name: 'Casein kinase II phosphorylation', pattern: /[ST]..[DE]/g },
  { name: 'N-myristoylation', pattern: /G[^EDRKHPFYW]..[STAGCN][^P]/g },
  { name: 'cAMP phosphorylation', pattern: /[RK][RK].[ST]/g },
  { name: 'Tyrosine kinase phosphorylation', pattern: /[RK].{2,3}[DE].{2,3}Y/g },
  { name: 'RGD cell attachment', pattern: /RGD/g },
  { name: 'Nuclear localization signal', pattern: /[KR]{4,}/g },
  { name: 'ER retention signal', pattern: /[KH]DEL$/g },
  { name: 'Peroxisomal targeting signal', pattern: /[SAC]KL$/g },
];

/**
 * Protein sequence class with analysis methods
 */
export class Protein {
  private sequence: string;

  constructor(sequence: string) {
    this.sequence = sequence.toUpperCase().replace(/[^ARNDCEQGHILKMFPSTWYV*]/g, '');
  }

  /**
   * Get the protein sequence
   */
  getSequence(): string {
    return this.sequence;
  }

  /**
   * Get sequence length
   */
  get length(): number {
    return this.sequence.length;
  }

  /**
   * Calculate molecular weight in Daltons
   */
  getMolecularWeight(): number {
    let weight = 18.015; // Water molecule
    for (const aa of this.sequence) {
      if (aa === '*') continue;
      const props = AMINO_ACID_DATA[aa];
      if (props) {
        weight += props.molecularWeight - 18.015; // Subtract water for peptide bond
      }
    }
    return weight;
  }

  /**
   * Calculate amino acid composition
   */
  getComposition(): Record<string, number> {
    const comp: Record<string, number> = {};
    for (const aa of this.sequence) {
      comp[aa] = (comp[aa] ?? 0) + 1;
    }
    return comp;
  }

  /**
   * Calculate amino acid composition as percentages
   */
  getCompositionPercent(): Record<string, number> {
    const comp = this.getComposition();
    const total = this.sequence.length;
    const result: Record<string, number> = {};
    for (const [aa, count] of Object.entries(comp)) {
      result[aa] = (count / total) * 100;
    }
    return result;
  }

  /**
   * Calculate GRAVY (Grand Average of Hydropathy)
   */
  getGRAVY(): number {
    let sum = 0;
    let count = 0;
    for (const aa of this.sequence) {
      if (aa === '*') continue;
      const props = AMINO_ACID_DATA[aa];
      if (props) {
        sum += props.hydropathy;
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  }

  /**
   * Calculate net charge at pH 7
   */
  getChargeAtpH7(): number {
    let charge = 0;
    for (const aa of this.sequence) {
      if (aa === '*') continue;
      const props = AMINO_ACID_DATA[aa];
      if (props) {
        charge += props.charge;
      }
    }
    // Add N-terminus (+1) and C-terminus (-1) contributions
    return charge + 0.1; // Approximate at pH 7
  }

  /**
   * Estimate isoelectric point (pI)
   */
  getIsoelectricPoint(): number {
    // Simplified Henderson-Hasselbalch calculation
    const comp = this.getComposition();

    // Count charged residues
    const nK = comp['K'] ?? 0;
    const nR = comp['R'] ?? 0;
    const nH = comp['H'] ?? 0;
    const nD = comp['D'] ?? 0;
    const nE = comp['E'] ?? 0;
    const nC = comp['C'] ?? 0;
    const nY = comp['Y'] ?? 0;

    // Binary search for pI
    let low = 0;
    let high = 14;

    while (high - low > 0.01) {
      const pH = (low + high) / 2;
      const charge =
        this.chargeAtpH('N', pH) +
        this.chargeAtpH('C', pH) +
        nK * this.chargeAtpH('K', pH) +
        nR * this.chargeAtpH('R', pH) +
        nH * this.chargeAtpH('H', pH) +
        nD * this.chargeAtpH('D', pH) +
        nE * this.chargeAtpH('E', pH) +
        nC * this.chargeAtpH('C_side', pH) +
        nY * this.chargeAtpH('Y', pH);

      if (charge > 0) {
        low = pH;
      } else {
        high = pH;
      }
    }

    return (low + high) / 2;
  }

  private chargeAtpH(group: string, pH: number): number {
    const pKa: Record<string, number> = {
      N: 9.69,
      C: 2.34,
      K: 10.54,
      R: 12.48,
      H: 6.04,
      D: 3.86,
      E: 4.25,
      C_side: 8.33,
      Y: 10.46,
    };

    const pK = pKa[group];
    if (!pK) return 0;

    // Positive groups (N-term, K, R, H)
    if (['N', 'K', 'R', 'H'].includes(group)) {
      return 1 / (1 + Math.pow(10, pH - pK));
    }
    // Negative groups (C-term, D, E, C, Y)
    return -1 / (1 + Math.pow(10, pK - pH));
  }

  /**
   * Calculate extinction coefficient at 280nm
   */
  getExtinction280(): { reduced: number; oxidized: number } {
    const comp = this.getComposition();
    const nY = comp['Y'] ?? 0;
    const nW = comp['W'] ?? 0;
    const nC = comp['C'] ?? 0;

    // Extinction coefficients from Pace et al.
    const reduced = nY * 1490 + nW * 5500;
    const oxidized = reduced + (nC / 2) * 125; // Disulfide contribution

    return { reduced, oxidized };
  }

  /**
   * Calculate instability index
   */
  getInstabilityIndex(): number {
    // Simplified Guruprasad's instability index
    const instabilityWeights: Record<string, Record<string, number>> = {
      W: { C: 1, F: 1, G: -9, A: -14 },
      C: { M: 33, A: -14 },
      M: { A: 13, S: 44, K: -1 },
      // Simplified - full table has 400 entries
    };

    let sum = 0;
    for (let i = 0; i < this.sequence.length - 1; i++) {
      const aa1 = this.sequence[i];
      const aa2 = this.sequence[i + 1];
      if (aa1 && aa2 && instabilityWeights[aa1]?.[aa2]) {
        sum += instabilityWeights[aa1][aa2];
      }
    }

    return (10 / this.sequence.length) * sum;
  }

  /**
   * Calculate aliphatic index
   */
  getAliphaticIndex(): number {
    const comp = this.getCompositionPercent();
    const a = comp['A'] ?? 0;
    const v = comp['V'] ?? 0;
    const i = comp['I'] ?? 0;
    const l = comp['L'] ?? 0;

    return a + 2.9 * v + 3.9 * (i + l);
  }

  /**
   * Calculate aromaticity
   */
  getAromaticity(): number {
    const comp = this.getComposition();
    const aromatic = (comp['F'] ?? 0) + (comp['W'] ?? 0) + (comp['Y'] ?? 0);
    return aromatic / this.sequence.length;
  }

  /**
   * Find protein motifs
   */
  findMotifs(): Motif[] {
    const motifs: Motif[] = [];

    for (const { name, pattern } of PROTEIN_MOTIFS) {
      let match;
      while ((match = pattern.exec(this.sequence)) !== null) {
        motifs.push({
          name,
          pattern: pattern.source,
          start: match.index,
          end: match.index + match[0].length,
          sequence: match[0],
        });
      }
    }

    return motifs;
  }

  /**
   * Get comprehensive protein properties
   */
  getProperties(): ProteinProperties {
    const extinction = this.getExtinction280();

    return {
      length: this.length,
      molecularWeight: this.getMolecularWeight(),
      isoelectricPoint: this.getIsoelectricPoint(),
      extinction280: extinction.reduced,
      absorbance01: extinction.reduced / this.getMolecularWeight(),
      hydropathyGRAVY: this.getGRAVY(),
      aromaticity: this.getAromaticity(),
      instabilityIndex: this.getInstabilityIndex(),
      aliphaticIndex: this.getAliphaticIndex(),
      composition: this.getComposition() as Record<AminoAcid, number>,
      chargeAtpH7: this.getChargeAtpH7(),
    };
  }

  /**
   * Predict secondary structure (simplified Chou-Fasman)
   */
  predictSecondaryStructure(): SecondaryStructurePrediction {
    // Simplified Chou-Fasman propensities
    const helixPropensity: Record<string, number> = {
      A: 1.42, L: 1.21, E: 1.51, M: 1.45, Q: 1.11, K: 1.16, R: 0.98, H: 1.0,
      V: 1.06, I: 1.08, Y: 0.69, C: 0.70, W: 1.08, F: 1.13, T: 0.83,
      G: 0.57, N: 0.67, P: 0.57, S: 0.77, D: 1.01,
    };

    const sheetPropensity: Record<string, number> = {
      V: 1.70, I: 1.60, Y: 1.47, F: 1.38, W: 1.37, L: 1.30, T: 1.19, C: 1.19,
      M: 1.05, A: 0.83, R: 0.93, G: 0.75, D: 0.54, K: 0.74, S: 0.75,
      H: 0.87, N: 0.89, P: 0.55, E: 0.37, Q: 1.10,
    };

    const helixProb: number[] = [];
    const sheetProb: number[] = [];
    const coilProb: number[] = [];
    let prediction = '';

    for (const aa of this.sequence) {
      const hP = helixPropensity[aa] ?? 1.0;
      const sP = sheetPropensity[aa] ?? 1.0;

      // Normalize to probabilities
      const total = hP + sP + 1;
      helixProb.push(hP / total);
      sheetProb.push(sP / total);
      coilProb.push(1 / total);

      // Simple prediction
      if (hP > sP && hP > 1.0) {
        prediction += 'H';
      } else if (sP > hP && sP > 1.0) {
        prediction += 'E';
      } else {
        prediction += 'C';
      }
    }

    return {
      sequence: this.sequence,
      prediction,
      helixProbability: helixProb,
      sheetProbability: sheetProb,
      coilProbability: coilProb,
    };
  }

  /**
   * Calculate hydropathy plot (Kyte-Doolittle)
   */
  getHydropathyPlot(windowSize = 9): number[] {
    const halfWindow = Math.floor(windowSize / 2);
    const plot: number[] = [];

    for (let i = 0; i < this.sequence.length; i++) {
      let sum = 0;
      let count = 0;

      for (let j = i - halfWindow; j <= i + halfWindow; j++) {
        if (j >= 0 && j < this.sequence.length) {
          const aa = this.sequence[j];
          const props = aa ? AMINO_ACID_DATA[aa] : undefined;
          if (props) {
            sum += props.hydropathy;
            count++;
          }
        }
      }

      plot.push(count > 0 ? sum / count : 0);
    }

    return plot;
  }

  /**
   * Convert to three-letter code format
   */
  toThreeLetterCode(): string {
    return this.sequence
      .split('')
      .map((aa) => {
        if (aa === '*') return 'STOP';
        return AMINO_ACID_DATA[aa]?.threeLetterCode ?? 'Xxx';
      })
      .join('-');
  }
}

/**
 * Parse FASTA format protein sequence
 */
export function parseProteinFasta(fasta: string): Array<{ id: string; description: string; sequence: string }> {
  const results: Array<{ id: string; description: string; sequence: string }> = [];
  const lines = fasta.split('\n');
  let currentId = '';
  let currentDesc = '';
  let currentSeq = '';

  for (const line of lines) {
    if (line.startsWith('>')) {
      if (currentId) {
        results.push({ id: currentId, description: currentDesc, sequence: currentSeq });
      }
      const header = line.slice(1).trim();
      const parts = header.split(/\s+/);
      currentId = parts[0] ?? '';
      currentDesc = parts.slice(1).join(' ');
      currentSeq = '';
    } else {
      currentSeq += line.trim();
    }
  }

  if (currentId) {
    results.push({ id: currentId, description: currentDesc, sequence: currentSeq });
  }

  return results;
}

/**
 * Align two protein sequences using Smith-Waterman
 */
export function alignProteins(
  seq1: string,
  seq2: string,
  gapPenalty = -10,
  gapExtend = -1
): { aligned1: string; aligned2: string; score: number; identity: number } {
  const n = seq1.length;
  const m = seq2.length;

  // BLOSUM62-like simple scoring
  const match = (a: string, b: string): number => (a === b ? 4 : -1);

  // Initialize matrices
  const score: number[][] = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
  const trace: number[][] = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));

  let maxScore = 0;
  let maxI = 0;
  let maxJ = 0;

  // Fill matrices
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const matchScore = (score[i - 1]?.[j - 1] ?? 0) + match(seq1[i - 1] ?? '', seq2[j - 1] ?? '');
      const deleteScore = (score[i - 1]?.[j] ?? 0) + gapPenalty;
      const insertScore = (score[i]?.[j - 1] ?? 0) + gapPenalty;

      const cellScore = Math.max(0, matchScore, deleteScore, insertScore);
      if (score[i]) score[i][j] = cellScore;

      if (cellScore === matchScore && score[i - 1]?.[j - 1] !== undefined) {
        if (trace[i]) trace[i][j] = 1; // diagonal
      } else if (cellScore === deleteScore) {
        if (trace[i]) trace[i][j] = 2; // up
      } else if (cellScore === insertScore) {
        if (trace[i]) trace[i][j] = 3; // left
      }

      if (cellScore > maxScore) {
        maxScore = cellScore;
        maxI = i;
        maxJ = j;
      }
    }
  }

  // Traceback
  let aligned1 = '';
  let aligned2 = '';
  let i = maxI;
  let j = maxJ;
  let identities = 0;

  while (i > 0 && j > 0 && (score[i]?.[j] ?? 0) > 0) {
    const t = trace[i]?.[j] ?? 0;
    if (t === 1) {
      aligned1 = (seq1[i - 1] ?? '') + aligned1;
      aligned2 = (seq2[j - 1] ?? '') + aligned2;
      if (seq1[i - 1] === seq2[j - 1]) identities++;
      i--;
      j--;
    } else if (t === 2) {
      aligned1 = (seq1[i - 1] ?? '') + aligned1;
      aligned2 = '-' + aligned2;
      i--;
    } else {
      aligned1 = '-' + aligned1;
      aligned2 = (seq2[j - 1] ?? '') + aligned2;
      j--;
    }
  }

  const alignLength = Math.max(aligned1.length, 1);
  return {
    aligned1,
    aligned2,
    score: maxScore,
    identity: (identities / alignLength) * 100,
  };
}
