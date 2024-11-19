import { MemecoinsKnowledgeBase } from './knowledgeBase/main.js';
import { MemecoinsBot } from './bot/memecoinBot.js';

async function main() {
  const kb = await MemecoinsKnowledgeBase.build();
  const bot = new MemecoinsBot(kb);
  
  await kb.storage.resetDatabase();

  const tweets = [{
    id: "1",
    text: "New memecoin $DOGE launching soon!",
    timestamp: 1731839698000,
    createdAt: "2024-02-17T10:34:58.000Z",
    likes: 100,
    retweetCount: 50,
    replies: 25,
    permanentUrl: "https://twitter.com/user/status/1"
  }];

  for (const tweet of tweets) {
    console.log("Adding tweet to knowledge base", {tweet});
    await kb.addTweet(tweet);
    console.log("Tweet added to knowledge base", {tweet});
  }

  console.log("Adding tweets to knowledge base");
  const response = await bot.handleQuery("What's the latest on DOGE?");
  console.log(response);
  await kb.storage.resetDatabase();
}

main().catch(console.error);
