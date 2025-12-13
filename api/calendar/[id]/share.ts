import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../../_lib/storage';
import { requireAuth, handleCors } from '../../_lib/auth';
import { insertEventShareSchema } from '../../../shared/schema';
import { fromZodError } from 'zod-validation-error';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;
  const id = parseInt(req.query.id as string);

  try {
    const event = await storage.getCalendarEvent(id);
    if (!event || event.userId !== user.id) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    const { email } = req.body;
    const sharedWithUser = await storage.getUserByEmail(email);
    
    const parsed = insertEventShareSchema.safeParse({
      eventId: event.id,
      sharedWithEmail: email,
      sharedWithUserId: sharedWithUser?.id,
      status: "pending"
    });
    if (!parsed.success) {
      return res.status(400).json({ error: fromZodError(parsed.error).message });
    }
    
    const share = await storage.createEventShare(parsed.data);
    
    if (sharedWithUser) {
      await storage.createNotification({
        userId: sharedWithUser.id,
        type: "event",
        title: "Event invitation",
        message: `${user.name} invited you to "${event.title}"`,
        referenceId: event.id,
        referenceType: "event"
      });
    }
    
    res.json(share);
  } catch (error) {
    res.status(500).json({ error: "Failed to share event" });
  }
}
