import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { requireAuth, handleCors } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  const auth = await requireAuth(req, res);
  if (!auth) return;
  
  const { user } = auth;
  const id = parseInt(req.query.id as string);

  const task = await storage.getTask(id);
  if (!task || task.userId !== user.id) {
    return res.status(404).json({ error: "Task not found" });
  }

  if (req.method === 'GET') {
    return res.json(task);
  }

  if (req.method === 'PATCH') {
    try {
      const updates = req.body;
      if (updates.status === "completed" && task.status !== "completed") {
        updates.completedAt = new Date();
        await storage.updateUser(user.id, {
          totalTasksCompleted: (user.totalTasksCompleted || 0) + 1
        });
      }
      const updated = await storage.updateTask(id, updates);
      return res.json(updated);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update task" });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await storage.deleteTask(id);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete task" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
