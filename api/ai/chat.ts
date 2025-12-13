import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { storage } from '../_lib/storage';
import { getAuthUser, handleCors } from '../_lib/auth';

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!genAI) {
      return res.status(503).json({ 
        error: 'AI service not configured',
        message: 'The AI assistant is currently unavailable. Please configure GEMINI_API_KEY.'
      });
    }

    const auth = await getAuthUser(req);
    let userContext = "";
    
    if (auth) {
      const { user } = auth;
      const [tasks, subjects, exams] = await Promise.all([
        storage.getTasks(user.id),
        storage.getSubjects(user.id),
        storage.getExams(user.id)
      ]);
      
      await storage.createAIMessage({ userId: user.id, role: "user", content: message });
      
      const pendingTasks = tasks.filter(t => t.status !== "completed").slice(0, 5);
      const upcomingExams = exams.filter(e => new Date(e.date) > new Date()).slice(0, 3);
      
      userContext = `
User Context:
- Name: ${user.name}
- Daily Streak: ${user.dailyStreak} days
- Total Focus Time: ${user.totalFocusMinutes} minutes
- Tasks Completed: ${user.totalTasksCompleted}
- Current Subjects: ${subjects.map(s => s.name).join(", ") || "None"}
- Pending Tasks: ${pendingTasks.map(t => t.title).join(", ") || "None"}
- Upcoming Exams: ${upcomingExams.map(e => `${e.name} on ${new Date(e.date).toLocaleDateString()}`).join(", ") || "None"}
`;
    }

    const systemPrompt = `You are StudyFlow AI, a friendly and knowledgeable study assistant. You help students:
- Understand complex concepts in simple terms
- Create study plans and schedules
- Generate quiz questions and flashcards
- Provide motivation and study tips
- Answer questions about any academic subject

Be encouraging, concise, and helpful. Use clear explanations and examples when needed. Keep responses focused and practical for students.
${userContext}`;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser message: ${message}` }]
        }
      ],
    });

    const aiMessage = response.text || "I'm here to help with your studies! Feel free to ask me anything.";
    
    if (auth) {
      await storage.createAIMessage({ userId: auth.user.id, role: "assistant", content: aiMessage });
    }
    
    res.json({ message: aiMessage });
  } catch (error: any) {
    console.error('AI chat error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      message: "I'm having trouble connecting right now. Please try again in a moment!"
    });
  }
}
