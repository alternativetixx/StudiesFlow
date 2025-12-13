import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';
import { insertStickyNoteSchema } from '../../shared/schema';
import { fromZodError } from 'zod-validation-error';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  if (req.method === 'GET') {
    const notes = await storage.getStickyNotes(user.id);
    return res.json(notes);
  }

  if (req.method === 'POST') {
    const parsed = insertStickyNoteSchema.safeParse({ ...req.body, userId: user.id });
    if (!parsed.success) {
      return res.status(400).json({ error: fromZodError(parsed.error).message });
    }
    try {
      const note = await storage.createStickyNote(parsed.data);
      return res.json(note);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create sticky note" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
