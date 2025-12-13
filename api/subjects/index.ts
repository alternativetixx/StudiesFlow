import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';
import { insertSubjectSchema } from '../../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  if (req.method === 'GET') {
    const subjects = await storage.getSubjects(user.id);
    return res.json(subjects);
  }

  if (req.method === 'POST') {
    try {
      const data = insertSubjectSchema.parse({ ...req.body, userId: user.id });
      const subject = await storage.createSubject(data);
      return res.json(subject);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create subject" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
