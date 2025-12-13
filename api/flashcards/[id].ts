import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;
  const id = parseInt(req.query.id as string);

  const card = await storage.getFlashcard(id);
  if (!card || card.userId !== user.id) {
    return res.status(404).json({ error: "Flashcard not found" });
  }

  if (req.method === 'GET') {
    return res.json(card);
  }

  if (req.method === 'PATCH') {
    try {
      const updated = await storage.updateFlashcard(id, req.body);
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update flashcard" });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await storage.deleteFlashcard(id);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete flashcard" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
