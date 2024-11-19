from typing import Dict, Any, List
import sqlite3
import json
from datetime import datetime, timedelta

class StorageEngine:
    def __init__(self, db_path: str = 'memecoins.db'):
        self.conn = sqlite3.connect(db_path)
        self.create_tables()
        
    def create_tables(self):
        with self.conn:
            self.conn.execute('''
                CREATE TABLE IF NOT EXISTS tweets (
                    id TEXT PRIMARY KEY,
                    text TEXT,
                    timestamp INTEGER,
                    created_at TEXT,
                    engagement_score REAL,
                    url TEXT,
                    embedding_id INTEGER
                )
            ''')

    def reset_database(self):
        """Drops and recreates all tables, effectively resetting the database."""
        with self.conn:
            # Drop existing tables
            self.conn.execute('DROP TABLE IF EXISTS tweets')
            # Recreate tables
            self.create_tables()

    def store_tweet(self, tweet_info: Dict[str, Any], embedding_id: int):
        with self.conn:
            self.conn.execute('''
                INSERT OR REPLACE INTO tweets 
                (id, text, timestamp, created_at, engagement_score, url, embedding_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                tweet_info['id'],
                tweet_info['text'],
                tweet_info['timestamp'],
                tweet_info['created_at'].isoformat(),
                tweet_info['engagement_score'],
                tweet_info['url'],
                embedding_id
            ))
            
    def get_recent_tweets(self, hours: int = 24) -> List[Dict[str, Any]]:
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        with self.conn:
            cursor = self.conn.execute('''
                SELECT * FROM tweets 
                WHERE created_at > ? 
                ORDER BY engagement_score DESC 
                LIMIT 10
            ''', (cutoff.isoformat(),))
            return [dict(zip([col[0] for col in cursor.description], row))
                   for row in cursor.fetchall()]
