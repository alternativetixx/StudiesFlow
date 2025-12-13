import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const id = parseInt(req.query.id as string);

  try {
    await storage.deleteReminder(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete reminder" });
  }
}
