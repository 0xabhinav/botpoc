import re
from typing import Dict, Any
from datetime import datetime

class TweetPreprocessor:
    @staticmethod
    def clean_text(text: str) -> str:
        # Remove URLs
        text = re.sub(r'http\S+|www.\S+', '', text)
        # Remove mentions
        text = re.sub(r'@\w+', '', text)
        # Remove hashtags
        text = re.sub(r'#\w+', '', text)
        # Remove extra whitespace
        text = ' '.join(text.split())
        return text.strip()
    
    @staticmethod
    def extract_tweet_info(tweet_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': tweet_data['id'],
            'text': TweetPreprocessor.clean_text(tweet_data['text']),
            'timestamp': tweet_data['timestamp'],
            'created_at': datetime.fromisoformat(tweet_data['createdAt'].replace('Z', '+00:00')),
            'engagement_score': tweet_data['likes'] + tweet_data['retweetCount'] * 2 + tweet_data['replies'] * 3,
            'url': tweet_data['permanentUrl']
        }
