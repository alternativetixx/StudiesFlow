import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';
import { insertPomodoroSettingsSchema } from '../../shared/schema';
import { fromZodError } from 'zod-validation-error';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  if (req.method === 'GET') {
    const settings = await storage.getPomodoroSettings(user.id);
    return res.json(settings || {
      userId: user.id,
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
      autoStartNext: true,
      soundEnabled: true,
      notificationsEnabled: true
    });
  }

  if (req.method === 'POST') {
    const parsed = insertPomodoroSettingsSchema.safeParse({ ...req.body, userId: user.id });
    if (!parsed.success) {
      return res.status(400).json({ error: fromZodError(parsed.error).message });
    }
    try {
      const settings = await storage.savePomodoroSettings(parsed.data);
      return res.json(settings);
    } catch (error) {
      return res.status(500).json({ error: "Failed to save pomodoro settings" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
