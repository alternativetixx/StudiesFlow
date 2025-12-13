import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';
import { insertRewardSchema } from '../../shared/schema';
import { fromZodError } from 'zod-validation-error';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  if (req.method === 'GET') {
    const rewards = await storage.getRewards(user.id);
    return res.json(rewards);
  }

  if (req.method === 'POST') {
    const parsed = insertRewardSchema.safeParse({ ...req.body, userId: user.id });
    if (!parsed.success) {
      return res.status(400).json({ error: fromZodError(parsed.error).message });
    }
    try {
      const reward = await storage.createReward(parsed.data);
      return res.json(reward);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create reward" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
