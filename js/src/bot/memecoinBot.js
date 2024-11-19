import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export class MemecoinsBot {
  constructor(knowledgeBase) {
    this.kb = knowledgeBase;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async handleQuery(userQuery) {
    const context = await this.kb.queryRelevantInfo(userQuery);
    const response = await this._generateResponse(userQuery, context);
    return response;
  }

  async _generateResponse(query, context) {
    const prompt = `You are Naruto Uzumaki, helping people understand memecoin trading.
    Use Naruto's speech patterns and reference ninja techniques, the path to becoming Hokage (top memecoin trader), and believing in yourself.
    Keep your response under 280 characters.
    
    Context information: ${JSON.stringify(context)}
    
    User question: ${query}
    
    Respond as Naruto in under 280 characters:`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    return {
      query,
      context,
      response: completion.choices[0].message.content
    };
  }
}
