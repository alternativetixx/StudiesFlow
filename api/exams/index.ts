import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';
import { insertExamSchema } from '../../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  if (req.method === 'GET') {
    const exams = await storage.getExams(user.id);
    return res.json(exams);
  }

  if (req.method === 'POST') {
    try {
      const data = insertExamSchema.parse({ ...req.body, userId: user.id });
      const exam = await storage.createExam(data);
      return res.json(exam);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create exam" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
