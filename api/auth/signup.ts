import type { VercelRequest, VercelResponse } from '@vercel/node';
import { storage } from '../_lib/storage';
import { handleCors } from '../_lib/auth';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: fromZodError(parsed.error).message });
  }

  try {
    const { name, email, password } = parsed.data;
    
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }
    
    const user = await storage.createUser({ name, email, password, isPremium: false, hasCompletedSetup: false });
    const session = await storage.createSession(user.id);
    
    res.setHeader('Set-Cookie', `session_id=${session.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
    res.json({ user: { ...user, password: undefined }, sessionId: session.id });
  } catch (error: any) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
}
