import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';
import { insertCalendarEventSchema } from '../../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;

  if (req.method === 'GET') {
    const startDate = req.query.start ? new Date(req.query.start as string) : undefined;
    const endDate = req.query.end ? new Date(req.query.end as string) : undefined;
    
    const [ownEvents, sharedEvents] = await Promise.all([
      storage.getCalendarEvents(user.id, startDate, endDate),
      storage.getSharedCalendarEvents(user.id)
    ]);
    
    return res.json({ ownEvents, sharedEvents });
  }

  if (req.method === 'POST') {
    try {
      const data = insertCalendarEventSchema.parse({ ...req.body, userId: user.id });
      const event = await storage.createCalendarEvent(data);
      
      if (req.body.reminderMinutes) {
        const reminderTime = new Date(new Date(data.startTime).getTime() - req.body.reminderMinutes * 60000);
        await storage.createReminder({
          userId: user.id,
          title: `Reminder: ${data.title}`,
          description: data.description,
          reminderTime,
          eventId: event.id
        });
      }
      
      return res.json(event);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create event" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
