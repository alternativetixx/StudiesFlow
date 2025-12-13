import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  if (req.method === 'GET') {
    const messages = await storage.getAIMessages(user.id);
    return res.json(messages);
  }

  if (req.method === 'DELETE') {
    try {
      await storage.clearAIMessages(user.id);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to clear messages" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
