
// PhilJS Vector Store
// RAG Optimization

export interface VectorIndex {
  vectors: Float32Array[];
  metadata: any[];
}

export class VectorStore {
  private index: VectorIndex = { vectors: [], metadata: [] };

  add(vector: Float32Array, meta: any) {
    this.index.vectors.push(vector);
    this.index.metadata.push(meta);
  }

  async optimizeIndex() {
    console.log('[VectorStore] Quantizing vectors for faster retrieval...');

    // 1. Calculate global min/max for scalar quantization
    let globalMin = Infinity;
    let globalMax = -Infinity;

    for (const vec of this.index.vectors) {
      for (let i = 0; i < vec.length; i++) {
        const val = vec[i]!;
        if (val < globalMin) globalMin = val;
        if (val > globalMax) globalMax = val;
      }
    }

    const range = globalMax - globalMin;
    if (range === 0) return true; // No variation

    // 2. Quantize to 8-bit ints
    const quantizedVectors: Uint8Array[] = this.index.vectors.map(vec => {
      const qVec = new Uint8Array(vec.length);
      for (let i = 0; i < vec.length; i++) {
        // Map [min, max] -> [0, 255]
        const normalized = (vec[i]! - globalMin) / range;
        qVec[i] = Math.floor(normalized * 255);
      }
      return qVec;
    });

    // 3. Store the quantized version (simulated replacement)
    // In a real system we would replace this.index.vectors or save to disk
    console.log(`[VectorStore] Quantized ${this.index.vectors.length} vectors. compression_ratio=4x`);
    
    // @ts-ignore - Storing quantized data for demo
    this.index.quantized = { vectors: quantizedVectors, min: globalMin, range };
    
    return true;
  }
}
