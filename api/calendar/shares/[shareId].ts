import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../_lib/storage';
import { requireAuth, handleCors } from '../../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const shareId = parseInt(req.query.shareId as string);

  try {
    const updated = await storage.updateEventShare(shareId, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update event share" });
  }
}
