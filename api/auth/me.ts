import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  if (req.method === 'GET') {
    return res.json({ user: { ...user, password: undefined } });
  }

  if (req.method === 'PATCH') {
    try {
      const updates = req.body;
      delete updates.password;
      delete updates.email;
      
      const updatedUser = await storage.updateUser(user.id, updates);
      return res.json({ user: { ...updatedUser, password: undefined } });
    } catch (error) {
      return res.status(500).json({ error: "Failed to update profile" });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { confirmEmail } = req.body;
      
      if (user.email !== confirmEmail) {
        return res.status(400).json({ error: "Email does not match" });
      }
      
      await storage.deleteUser(user.id);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete account" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
