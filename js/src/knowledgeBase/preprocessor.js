export class TweetPreprocessor {
    cleanText(text) {
        // Remove URLs
        text = text.replace(/http\S+|www.\S+/g, '');
        // Remove mentions
        text = text.replace(/@\w+/g, '');
        // Remove hashtags
        text = text.replace(/#\w+/g, '');
        // Remove extra whitespace
        text = text.trim().replace(/\s+/g, ' ');
        return text;
    }

    extractTweetInfo(tweetData) {
        return {
            id: tweetData.id,
            text: this.cleanText(tweetData.text),
            timestamp: tweetData.timestamp,
            createdAt: new Date(tweetData.createdAt),
            engagementScore: tweetData.likes + (tweetData.retweetCount * 2) + (tweetData.replies * 3),
            url: tweetData.permanentUrl
        };
    }
}
