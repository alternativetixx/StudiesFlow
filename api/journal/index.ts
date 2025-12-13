import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';
import { insertJournalEntrySchema } from '../../shared/schema';
import { fromZodError } from 'zod-validation-error';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  if (req.method === 'GET') {
    const entries = await storage.getJournalEntries(user.id);
    return res.json(entries);
  }

  if (req.method === 'POST') {
    const parsed = insertJournalEntrySchema.safeParse({ ...req.body, userId: user.id });
    if (!parsed.success) {
      return res.status(400).json({ error: fromZodError(parsed.error).message });
    }
    try {
      const entry = await storage.createJournalEntry(parsed.data);
      return res.json(entry);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create journal entry" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
