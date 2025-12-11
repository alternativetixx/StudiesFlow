import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!openai) {
      return res.status(503).json({ 
        error: 'AI service not configured',
        message: 'The AI assistant is currently unavailable. Please configure OPENAI_API_KEY.'
      });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are StudyFlow AI, a friendly and knowledgeable study assistant. You help students:
- Understand complex concepts in simple terms
- Create study plans and schedules
- Generate quiz questions and flashcards
- Provide motivation and study tips
- Answer questions about any academic subject

Be encouraging, concise, and helpful. Use clear explanations and examples when needed. Keep responses focused and practical for students.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 1024,
    });

    const aiMessage = response.choices[0]?.message?.content || "I'm here to help with your studies! Feel free to ask me anything.";
    
    res.json({ message: aiMessage });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      message: "I'm having trouble connecting right now. Please try again in a moment!"
    });
  }
}
