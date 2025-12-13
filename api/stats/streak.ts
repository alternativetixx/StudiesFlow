import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  try {
    const now = new Date();
    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    
    let newStreak = user.dailyStreak || 0;
    
    if (lastActive) {
      const daysDiff = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        newStreak += 1;
      } else if (daysDiff > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }
    
    const updated = await storage.updateUser(user.id, {
      dailyStreak: newStreak,
      lastActiveDate: now,
      todayFocusMinutes: 0
    });
    
    res.json({ success: true, dailyStreak: updated?.dailyStreak });
  } catch (error) {
    res.status(500).json({ error: "Failed to update streak" });
  }
}
