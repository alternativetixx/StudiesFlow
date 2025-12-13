import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../_lib/storage';
import { requireAuth, handleCors } from '../../_lib/auth';
import { insertNoteCommentSchema } from '../../../shared/schema';
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
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    const shares = await storage.getNoteShares(note.id);
    const isOwner = note.userId === user.id;
    const canComment = shares.some(s => 
      s.sharedWithUserId === user.id && 
      s.status === "accepted" && 
      ["editor", "commenter"].includes(s.role)
    );
    
    if (!isOwner && !canComment) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const parsed = insertNoteCommentSchema.safeParse({
      noteId: note.id,
      userId: user.id,
      content: req.body.content
    });
    if (!parsed.success) {
      return res.status(400).json({ error: fromZodError(parsed.error).message });
    }
    
    const comment = await storage.createNoteComment(parsed.data);
    
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: "Failed to add comment" });
  }
}
