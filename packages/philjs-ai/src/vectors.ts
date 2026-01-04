
export interface VectorDocument {
    id: string;
    content: string;
    metadata?: Record<string, any>;
    embedding?: number[];
}

export class VectorStore {
    private documents: Map<string, VectorDocument> = new Map();

    constructor(private embeddingModel: string = 'text-embedding-3-small') { }

    async add(content: string, metadata?: Record<string, any>) {
        const id = Math.random().toString(36).substr(2, 9);
        console.log(`VectorStore: Embedding content "${content.substring(0, 20)}..."`);

        // Simulate embedding generation
        const embedding = new Array(1536).fill(0).map(() => Math.random());

        this.documents.set(id, { id, content, metadata, embedding });
        return id;
    }

    async search(query: string, limit: number = 3): Promise<VectorDocument[]> {
        console.log(`VectorStore: Semantically searching for "${query}"`);
        // Return random documents as mock hits
        return Array.from(this.documents.values()).slice(0, limit);
    }
}
