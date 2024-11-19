from typing import Dict, Any, List
from .embeddings import EmbeddingEngine
from .preprocessor import TweetPreprocessor
from .storage import StorageEngine
import numpy as np

class MemecoinsKnowledgeBase:
    def __init__(self, db_path: str = 'memecoins.db'):
        self.embedding_engine = EmbeddingEngine()
        self.storage = StorageEngine(db_path)
        self.preprocessor = TweetPreprocessor()
        
    def add_tweet(self, tweet_data: Dict[str, Any]):
        # Process tweet
        tweet_info = self.preprocessor.extract_tweet_info(tweet_data)
        
        # Generate embedding
        embedding = self.embedding_engine.generate_embedding(tweet_info['text'])
        
        # Add to FAISS index
        embedding_id = self.embedding_engine.index.ntotal
        self.embedding_engine.add_to_index(embedding)
        
        # Store in database
        self.storage.store_tweet(tweet_info, embedding_id)
        
    def query_relevant_info(self, query: str, max_results: int = 5) -> Dict[str, Any]:
        # Generate query embedding
        query_embedding = self.embedding_engine.generate_embedding(query)
        
        # Find similar tweets
        distances, indices = self.embedding_engine.search(query_embedding, max_results)
        
        # Get tweets from database using embedding_ids
        similar_tweets = []
        with self.storage.conn as conn:
            for idx in indices[0]:  # indices is a 2D array
                if idx != -1:  # Skip invalid indices
                    cursor = conn.execute('''
                        SELECT id, text, timestamp, created_at, engagement_score, url 
                        FROM tweets 
                        WHERE embedding_id = ?
                    ''', (int(idx),))
                    tweet = cursor.fetchone()
                    if tweet:
                        similar_tweets.append(dict(zip(
                            ['id', 'text', 'timestamp', 'created_at', 'engagement_score', 'url'],
                            tweet
                        )))
        
        # Get recent high-engagement tweets
        recent_tweets = self.storage.get_recent_tweets()
        
        return {
            'similar_tweets': similar_tweets,  # Now contains actual tweet data
            'similarity_scores': distances[0].tolist(),  # Flatten the array
            'recent_activity': recent_tweets
        }
