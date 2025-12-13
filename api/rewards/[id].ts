import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';
import { insertRewardSchema } from '../../shared/schema';
import { fromZodError } from 'zod-validation-error';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;
  const id = parseInt(req.query.id as string);

  const reward = await storage.getReward(id);
  if (!reward || reward.userId !== user.id) {
    return res.status(404).json({ error: "Reward not found" });
  }

  const parsed = insertRewardSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: fromZodError(parsed.error).message });
  }

  try {
    const updated = await storage.updateReward(id, parsed.data);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update reward" });
  }
}
