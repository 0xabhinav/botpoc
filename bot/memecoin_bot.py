from typing import Dict, Any
import os
from knowledge_base.main import MemecoinsKnowledgeBase
from openai import AsyncOpenAI

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class MemecoinsBot:
    def __init__(self, knowledge_base: MemecoinsKnowledgeBase):
        self.kb = knowledge_base
        
    async def handle_query(self, user_query: str) -> Dict[str, Any]:
        # Get relevant information from knowledge base
        context = self.kb.query_relevant_info(user_query)
        
        # Here you would typically integrate with your preferred
        # language model or response generation system
        response = await self._generate_response(user_query, context)
        return response
        
    async def _generate_response(self, query: str, context: Dict[str, Any]) -> Dict[str, Any]:
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        
        prompt = f"""You are Naruto Uzumaki, helping people understand memecoin trading.
        Use Naruto's speech patterns and reference ninja techniques, the path to becoming Hokage (top memecoin trader), and believing in yourself.
        Keep your response under 280 characters.
        
        Context information: {context}
        
        User question: {query}
        
        Respond as Naruto in under 280 characters:"""
        
        response = await client.chat.completions.create(
            model="gpt-4-turbo-preview",  # or gpt-3.5-turbo if preferred
            messages=[
                {"role": "system", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return {
            'query': query,
            'context': context,
            'response': response.choices[0].message.content
        }
