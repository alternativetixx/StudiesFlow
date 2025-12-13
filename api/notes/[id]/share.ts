import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../_lib/storage';
import { requireAuth, handleCors } from '../../_lib/auth';
import { insertNoteShareSchema } from '../../../shared/schema';
import { fromZodError } from 'zod-validation-error';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;
  const id = parseInt(req.query.id as string);

  try {
    const note = await storage.getNote(id);
    if (!note || note.userId !== user.id) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    const { email, role } = req.body;
    const sharedWithUser = await storage.getUserByEmail(email);
    
    const parsed = insertNoteShareSchema.safeParse({
      noteId: note.id,
      sharedWithEmail: email,
      sharedWithUserId: sharedWithUser?.id,
      role,
      status: "pending"
    });
    if (!parsed.success) {
      return res.status(400).json({ error: fromZodError(parsed.error).message });
    }
    
    const share = await storage.createNoteShare(parsed.data);
    
    if (sharedWithUser) {
      await storage.createNotification({
        userId: sharedWithUser.id,
        type: "share",
        title: "Note shared with you",
        message: `${user.name} shared a note "${note.title}" with you`,
        referenceId: note.id,
        referenceType: "note"
      });
    }
    
    res.json(share);
  } catch (error) {
    res.status(500).json({ error: "Failed to share note" });
  }
}
