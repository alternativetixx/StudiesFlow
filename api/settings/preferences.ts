import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';
import { insertAppPreferencesSchema } from '../../shared/schema';
import { fromZodError } from 'zod-validation-error';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  if (req.method === 'GET') {
    const prefs = await storage.getAppPreferences(user.id);
    return res.json(prefs || {
      userId: user.id,
      theme: "light",
      hasSeenTour: false,
      healthRemindersEnabled: true,
      focusMusicVolume: 50
    });
  }

  if (req.method === 'POST') {
    const parsed = insertAppPreferencesSchema.safeParse({ ...req.body, userId: user.id });
    if (!parsed.success) {
      return res.status(400).json({ error: fromZodError(parsed.error).message });
    }
    try {
      const prefs = await storage.saveAppPreferences(parsed.data);
      return res.json(prefs);
    } catch (error) {
      return res.status(500).json({ error: "Failed to save preferences" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
