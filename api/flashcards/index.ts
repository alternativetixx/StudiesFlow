import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';
import { insertFlashcardSchema } from '../../shared/schema';
import { fromZodError } from 'zod-validation-error';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  if (req.method === 'GET') {
    const cards = await storage.getFlashcards(user.id);
    return res.json(cards);
  }

  if (req.method === 'POST') {
    const parsed = insertFlashcardSchema.safeParse({ ...req.body, userId: user.id });
    if (!parsed.success) {
      return res.status(400).json({ error: fromZodError(parsed.error).message });
    }
    try {
      const card = await storage.createFlashcard(parsed.data);
      return res.json(card);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create flashcard" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
