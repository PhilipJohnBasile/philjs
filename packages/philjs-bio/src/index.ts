/**
 * @philjs/bio
 *
 * Bioinformatics toolkit for PhilJS - DNA, RNA, and protein analysis
 */

// DNA/RNA sequence analysis - primary exports
export {
  type Nucleotide,
  type RNANucleotide,
  type AminoAcid,
  type CrisprTarget,
  type Alignment,
  type OpenReadingFrame,
  type BlastHit,
  type PhyloNode,
  type ScoringMatrix,
  RNA,
  Protein,
  DNA,
  alignProteins,
  type DNADatabase,
  blast,
  findMotifs,
} from './dna.js';

// Protein sequence analysis - additional exports only
export {
  type AminoAcidProperties,
  type ProteinProperties,
  type SecondaryStructurePrediction,
  type Motif,
  parseProteinFasta,
} from './protein.js';
