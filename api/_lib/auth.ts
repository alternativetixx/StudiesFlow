import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './db';
import { sessions, users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedRequest extends VercelRequest {
  user?: typeof users.$inferSelect;
  session?: typeof sessions.$inferSelect;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map(cookie => {
      const [key, ...val] = cookie.trim().split('=');
      return [key, val.join('=')];
    })
  );
}

export async function getAuthUser(req: VercelRequest) {
  let sessionId = req.headers.authorization?.replace("Bearer ", "");
  
  if (!sessionId) {
    const cookies = parseCookies(req.headers.cookie);
    sessionId = cookies['session_id'];
  }
  
  if (!sessionId) {
    return null;
  }
  
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    }
    return null;
  }
  
  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!user) {
    return null;
  }
  
  return { user, session };
}

export async function requireAuth(req: VercelRequest, res: VercelResponse) {
  const auth = await getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return auth;
}

export function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}

export function handleCors(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
