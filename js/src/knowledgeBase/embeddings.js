import * as tf from '@tensorflow/tfjs-node';
import embeddings from "@themaximalist/embeddings.js";


export class EmbeddingEngine {
    static async build() {
        const result = new EmbeddingEngine();
        return result;
    }

    constructor() {
        this.dimension = 512;  // USE model dimension
        this.embeddings = [];  // Store embeddings in memory (alternative to FAISS)
        // this.initialize();
    }

    async generateEmbedding(text) {
        const embeds = await embeddings(text, {
            service: "openai",
        });
        return embeds;
    }

    addToIndex(embedding) {
        this.embeddings.push(embedding); // Store the flattened embedding
        return this.embeddings.length - 1;  // Return the index as embedding_id
    }

    async search(queryEmbedding, k = 5) {
        if (this.embeddings.length === 0) {
            return [[], []];
        }

        // Convert embeddings to tensor
        const searchEmbedding = tf.tensor2d(queryEmbedding, [1, queryEmbedding.length]);
        const allEmbeddings = tf.tensor2d(this.embeddings, [this.embeddings.length, this.embeddings[0].length]);

        // Calculate cosine similarity
        const similarities = tf.matMul(
            searchEmbedding, 
            allEmbeddings.transpose()
        );

        // Get top k results
        const values = await similarities.array();
        const distances = values[0].map(v => 1 - v); // Convert similarity to distance
        
        // Get indices of top k results
        const indices = Array.from(Array(distances.length).keys())
            .sort((a, b) => distances[a] - distances[b])
            .slice(0, k);
        
        const topDistances = indices.map(i => distances[i]);

        // Cleanup
        tf.dispose([searchEmbedding, allEmbeddings, similarities]);

        return [topDistances, [indices]];
    }
}
