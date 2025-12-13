import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';
import { insertNoteSchema } from '../../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  if (req.method === 'GET') {
    const [ownNotes, sharedNotes] = await Promise.all([
      storage.getNotes(user.id),
      storage.getSharedNotes(user.id)
    ]);
    return res.json({ ownNotes, sharedNotes });
  }

  if (req.method === 'POST') {
    try {
      const data = insertNoteSchema.parse({ ...req.body, userId: user.id });
      const note = await storage.createNote(data);
      return res.json(note);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create note" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
