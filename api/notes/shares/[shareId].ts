import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../_lib/storage';
import { requireAuth, handleCors } from '../../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;
  const shareId = parseInt(req.query.shareId as string);

  if (req.method === 'PATCH') {
    try {
      const shares = await storage.getNoteShares(shareId);
      const share = shares.find(s => s.id === shareId);
      
      if (!share) {
        return res.status(404).json({ error: "Share not found" });
      }
      
      const note = await storage.getNote(share.noteId);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      const isOwner = note.userId === user.id;
      const isRecipient = share.sharedWithUserId === user.id;
      
      if (!isOwner && !isRecipient) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updates: any = {};
      if (isRecipient && req.body.status) {
        updates.status = req.body.status;
      }
      if (isOwner && req.body.role) {
        updates.role = req.body.role;
      }
      
      const updated = await storage.updateNoteShare(shareId, updates);
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update share" });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await storage.deleteNoteShare(shareId);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete share" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
