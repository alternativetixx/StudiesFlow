import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

const focusSchema = z.object({
  minutes: z.number().min(0, "Minutes must be non-negative"),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;
  
  const parsed = focusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: fromZodError(parsed.error).message });
  }
  
  const { minutes } = parsed.data;

  try {
    const updated = await storage.updateUser(user.id, {
      totalFocusMinutes: (user.totalFocusMinutes || 0) + minutes,
      todayFocusMinutes: (user.todayFocusMinutes || 0) + minutes
    });
    res.json({ success: true, totalFocusMinutes: updated?.totalFocusMinutes });
  } catch (error) {
    res.status(500).json({ error: "Failed to update focus time" });
  }
}
