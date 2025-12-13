import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';
import { insertTaskSchema } from '../../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  if (req.method === 'GET') {
    const tasks = await storage.getTasks(user.id);
    return res.json(tasks);
  }

  if (req.method === 'POST') {
    try {
      const data = insertTaskSchema.parse({ ...req.body, userId: user.id });
      const task = await storage.createTask(data);
      return res.json(task);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create task" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
