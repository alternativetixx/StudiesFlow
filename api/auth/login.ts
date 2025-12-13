import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { handleCors } from '../_lib/auth';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: fromZodError(parsed.error).message });
  }

  try {
    const { email, password } = parsed.data;
    
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "No account found with this email" });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Incorrect password" });
    }
    
    const session = await storage.createSession(user.id);
    
    res.setHeader('Set-Cookie', `session_id=${session.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
    res.json({ user: { ...user, password: undefined }, sessionId: session.id });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to log in" });
  }
}
