import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  res.json({
    dailyStreak: user.dailyStreak,
    totalFocusMinutes: user.totalFocusMinutes,
    todayFocusMinutes: user.todayFocusMinutes,
    totalTasksCompleted: user.totalTasksCompleted,
    badges: user.badges || []
  });
}
