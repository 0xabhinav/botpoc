import { EmbeddingEngine } from "./embeddings.js";
import { TweetPreprocessor } from "./preprocessor.js";
import { StorageEngine } from "./storage.js";

export class MemecoinsKnowledgeBase {
    static async build(dbPath = 'memecoins.db') {
        const result = new MemecoinsKnowledgeBase();
        result.embeddingEngine = await EmbeddingEngine.build();
        result.storage = new StorageEngine(dbPath);
        await result.storage.initializeDb();
        result.preprocessor = new TweetPreprocessor();
        return result;
    }

    async addTweet(tweetData) {
        // Process tweet
        const tweetInfo = this.preprocessor.extractTweetInfo(tweetData);
        
        // Generate embedding
        const embedding = await this.embeddingEngine.generateEmbedding(tweetInfo.text);
        
        // Store in database
        return await this.storage.storeTweet(tweetInfo, embedding);
    }

    async queryRelevantInfo(query, maxResults = 5) {
        // Generate query embedding
        const queryEmbedding = await this.embeddingEngine.generateEmbedding(query);
        
        // Find similar tweets
        const similarTweets = await this.storage.findSimilarTweets(queryEmbedding, maxResults);
        
        // Get recent high-engagement tweets
        const recentTweets = await this.storage.getRecentTweets();
        
        return {
            similarTweets,
            recentActivity: recentTweets
        };
    }
}