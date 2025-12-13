import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;
  const id = parseInt(req.query.id as string);

  const note = await storage.getNote(id);
  if (!note) {
    return res.status(404).json({ error: "Note not found" });
  }

  const shares = await storage.getNoteShares(note.id);
  const isOwner = note.userId === user.id;
  const hasAccess = isOwner || shares.some(s => s.sharedWithUserId === user.id && s.status === "accepted");

  if (!hasAccess) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (req.method === 'GET') {
    const comments = await storage.getNoteComments(note.id);
    return res.json({ note, shares, comments });
  }

  if (req.method === 'PATCH') {
    const isEditor = shares.some(s => s.sharedWithUserId === user.id && s.role === "editor" && s.status === "accepted");
    if (!isOwner && !isEditor) {
      return res.status(403).json({ error: "Access denied" });
    }
    try {
      const updated = await storage.updateNote(id, req.body);
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update note" });
    }
  }

  if (req.method === 'DELETE') {
    if (!isOwner) {
      return res.status(404).json({ error: "Note not found" });
    }
    try {
      await storage.deleteNote(id);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete note" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
