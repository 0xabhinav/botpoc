import asyncio

from knowledge_base.main import MemecoinsKnowledgeBase
from bot.memecoin_bot import MemecoinsBot

# Initialize the system
kb = MemecoinsKnowledgeBase()
bot = MemecoinsBot(kb)
kb.storage.reset_database()

# Add some tweets
tweets = [
    {
        "id": "1",
        "text": "New memecoin $DOGE launching soon!",
        "timestamp": 1731839698000,
        "createdAt": "2024-02-17T10:34:58.000Z",
        "likes": 100,
        "retweetCount": 50,
        "replies": 25,
        "permanentUrl": "https://twitter.com/user/status/1"
    }
    # Add more tweets...
]

for tweet in tweets:
    kb.add_tweet(tweet)

# Query the bot
async def main():
    response = await bot.handle_query("What's the latest on DOGE?")
    print(response)
    kb.storage.reset_database()


asyncio.run(main())