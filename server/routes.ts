import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GoogleGenAI } from "@google/genai";
import bcrypt from "bcrypt";
import {
  insertUserSchema, insertSubjectSchema, insertExamSchema, insertTaskSchema,
  insertNoteSchema, insertNoteShareSchema, insertNoteCommentSchema,
  insertCalendarEventSchema, insertEventShareSchema, insertReminderSchema,
  insertStickyNoteSchema, insertFlashcardSchema, insertJournalEntrySchema,
  insertRewardSchema, insertQuizSchema, insertAIMessageSchema,
  insertPomodoroSettingsSchema, insertAppPreferencesSchema
} from "@shared/schema";

// Initialize Gemini AI
const genai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// Auth middleware
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.headers.authorization?.replace("Bearer ", "");
  if (!sessionId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  const session = await storage.getSession(sessionId);
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
  
  const user = await storage.getUser(session.userId);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  
  (req as any).user = user;
  (req as any).session = session;
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ===== AUTH ROUTES =====
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email and password are required" });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }
      
      const user = await storage.createUser({ name, email, password, isPremium: false, hasCompletedSetup: false });
      const session = await storage.createSession(user.id);
      
      res.json({ user: { ...user, password: undefined }, sessionId: session.id });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: "No account found with this email" });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: "Incorrect password" });
      }
      
      const session = await storage.createSession(user.id);
      
      res.json({ user: { ...user, password: undefined }, sessionId: session.id });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    try {
      await storage.deleteSession((req as any).session.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to log out" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = (req as any).user;
    res.json({ user: { ...user, password: undefined } });
  });

  app.patch("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const updates = req.body;
      delete updates.password; // Don't allow password updates via this endpoint
      delete updates.email; // Don't allow email updates via this endpoint
      
      const updatedUser = await storage.updateUser(user.id, updates);
      res.json({ user: { ...updatedUser, password: undefined } });
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.delete("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { confirmEmail } = req.body;
      
      if (user.email !== confirmEmail) {
        return res.status(400).json({ error: "Email does not match" });
      }
      
      await storage.deleteUser(user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // ===== SUBJECT ROUTES =====
  app.get("/api/subjects", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const subjects = await storage.getSubjects(user.id);
    res.json(subjects);
  });

  app.post("/api/subjects", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertSubjectSchema.parse({ ...req.body, userId: user.id });
      const subject = await storage.createSubject(data);
      res.json(subject);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create subject" });
    }
  });

  app.patch("/api/subjects/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const subject = await storage.getSubject(parseInt(req.params.id));
      if (!subject || subject.userId !== user.id) {
        return res.status(404).json({ error: "Subject not found" });
      }
      const updated = await storage.updateSubject(subject.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update subject" });
    }
  });

  app.delete("/api/subjects/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const subject = await storage.getSubject(parseInt(req.params.id));
      if (!subject || subject.userId !== user.id) {
        return res.status(404).json({ error: "Subject not found" });
      }
      await storage.deleteSubject(subject.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete subject" });
    }
  });

  // ===== EXAM ROUTES =====
  app.get("/api/exams", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const exams = await storage.getExams(user.id);
    res.json(exams);
  });

  app.post("/api/exams", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertExamSchema.parse({ ...req.body, userId: user.id });
      const exam = await storage.createExam(data);
      res.json(exam);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create exam" });
    }
  });

  app.patch("/api/exams/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const exam = await storage.getExam(parseInt(req.params.id));
      if (!exam || exam.userId !== user.id) {
        return res.status(404).json({ error: "Exam not found" });
      }
      const updated = await storage.updateExam(exam.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update exam" });
    }
  });

  app.delete("/api/exams/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const exam = await storage.getExam(parseInt(req.params.id));
      if (!exam || exam.userId !== user.id) {
        return res.status(404).json({ error: "Exam not found" });
      }
      await storage.deleteExam(exam.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete exam" });
    }
  });

  // ===== TASK ROUTES =====
  app.get("/api/tasks", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const tasks = await storage.getTasks(user.id);
    res.json(tasks);
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertTaskSchema.parse({ ...req.body, userId: user.id });
      const task = await storage.createTask(data);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const task = await storage.getTask(parseInt(req.params.id));
      if (!task || task.userId !== user.id) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      // Handle task completion stats
      if (req.body.status === "completed" && task.status !== "completed") {
        req.body.completedAt = new Date();
        await storage.updateUser(user.id, {
          totalTasksCompleted: (user.totalTasksCompleted || 0) + 1
        });
      }
      
      const updated = await storage.updateTask(task.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const task = await storage.getTask(parseInt(req.params.id));
      if (!task || task.userId !== user.id) {
        return res.status(404).json({ error: "Task not found" });
      }
      await storage.deleteTask(task.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // ===== NOTES ROUTES =====
  app.get("/api/notes", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const [ownNotes, sharedNotes] = await Promise.all([
      storage.getNotes(user.id),
      storage.getSharedNotes(user.id)
    ]);
    res.json({ ownNotes, sharedNotes });
  });

  app.get("/api/notes/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const note = await storage.getNote(parseInt(req.params.id));
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      // Check if user owns the note or has access
      const shares = await storage.getNoteShares(note.id);
      const hasAccess = note.userId === user.id || 
        shares.some(s => s.sharedWithUserId === user.id && s.status === "accepted");
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const comments = await storage.getNoteComments(note.id);
      res.json({ note, shares, comments });
    } catch (error) {
      res.status(500).json({ error: "Failed to get note" });
    }
  });

  app.post("/api/notes", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertNoteSchema.parse({ ...req.body, userId: user.id });
      const note = await storage.createNote(data);
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create note" });
    }
  });

  app.patch("/api/notes/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const note = await storage.getNote(parseInt(req.params.id));
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      // Check if user is owner or editor
      const shares = await storage.getNoteShares(note.id);
      const isOwner = note.userId === user.id;
      const isEditor = shares.some(s => s.sharedWithUserId === user.id && s.role === "editor" && s.status === "accepted");
      
      if (!isOwner && !isEditor) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updated = await storage.updateNote(note.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const note = await storage.getNote(parseInt(req.params.id));
      if (!note || note.userId !== user.id) {
        return res.status(404).json({ error: "Note not found" });
      }
      await storage.deleteNote(note.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // Note sharing
  app.post("/api/notes/:id/share", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const note = await storage.getNote(parseInt(req.params.id));
      if (!note || note.userId !== user.id) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      const { email, role } = req.body;
      if (!email || !role) {
        return res.status(400).json({ error: "Email and role are required" });
      }
      
      // Check if user exists
      const sharedWithUser = await storage.getUserByEmail(email);
      
      const share = await storage.createNoteShare({
        noteId: note.id,
        sharedWithEmail: email,
        sharedWithUserId: sharedWithUser?.id,
        role,
        status: "pending"
      });
      
      // Create notification for the recipient
      if (sharedWithUser) {
        await storage.createNotification({
          userId: sharedWithUser.id,
          type: "share",
          title: "Note shared with you",
          message: `${user.name} shared a note "${note.title}" with you`,
          referenceId: note.id,
          referenceType: "note"
        });
      }
      
      res.json(share);
    } catch (error) {
      res.status(500).json({ error: "Failed to share note" });
    }
  });

  app.patch("/api/notes/shares/:shareId", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const shareId = parseInt(req.params.shareId);
      const shares = await storage.getNoteShares(shareId);
      // This is a simplified approach - in production, we'd need a more robust lookup
      const share = shares.find(s => s.id === shareId);
      
      if (!share) {
        return res.status(404).json({ error: "Share not found" });
      }
      
      // User can only update if they're the recipient or the note owner
      const note = await storage.getNote(share.noteId);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      const isOwner = note.userId === user.id;
      const isRecipient = share.sharedWithUserId === user.id;
      
      if (!isOwner && !isRecipient) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Recipient can only update status, owner can update role
      const updates: any = {};
      if (isRecipient && req.body.status) {
        updates.status = req.body.status;
      }
      if (isOwner && req.body.role) {
        updates.role = req.body.role;
      }
      
      const updated = await storage.updateNoteShare(shareId, updates);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update share" });
    }
  });

  app.delete("/api/notes/shares/:shareId", requireAuth, async (req, res) => {
    try {
      const shareId = parseInt(req.params.shareId);
      await storage.deleteNoteShare(shareId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete share" });
    }
  });

  // Note comments
  app.post("/api/notes/:id/comments", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const note = await storage.getNote(parseInt(req.params.id));
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      
      // Check access - owner, editor, or commenter
      const shares = await storage.getNoteShares(note.id);
      const isOwner = note.userId === user.id;
      const canComment = shares.some(s => 
        s.sharedWithUserId === user.id && 
        s.status === "accepted" && 
        ["editor", "commenter"].includes(s.role)
      );
      
      if (!isOwner && !canComment) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const comment = await storage.createNoteComment({
        noteId: note.id,
        userId: user.id,
        content: req.body.content
      });
      
      res.json(comment);
    } catch (error) {
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // ===== CALENDAR EVENT ROUTES =====
  app.get("/api/calendar", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const startDate = req.query.start ? new Date(req.query.start as string) : undefined;
    const endDate = req.query.end ? new Date(req.query.end as string) : undefined;
    
    const [ownEvents, sharedEvents] = await Promise.all([
      storage.getCalendarEvents(user.id, startDate, endDate),
      storage.getSharedCalendarEvents(user.id)
    ]);
    
    res.json({ ownEvents, sharedEvents });
  });

  app.post("/api/calendar", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertCalendarEventSchema.parse({ ...req.body, userId: user.id });
      const event = await storage.createCalendarEvent(data);
      
      // Create reminder if specified
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
      
      res.json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create event" });
    }
  });

  app.patch("/api/calendar/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const event = await storage.getCalendarEvent(parseInt(req.params.id));
      if (!event || event.userId !== user.id) {
        return res.status(404).json({ error: "Event not found" });
      }
      const updated = await storage.updateCalendarEvent(event.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/calendar/:id", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const event = await storage.getCalendarEvent(parseInt(req.params.id));
      if (!event || event.userId !== user.id) {
        return res.status(404).json({ error: "Event not found" });
      }
      await storage.deleteCalendarEvent(event.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Event sharing
  app.post("/api/calendar/:id/share", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const event = await storage.getCalendarEvent(parseInt(req.params.id));
      if (!event || event.userId !== user.id) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const sharedWithUser = await storage.getUserByEmail(email);
      
      const share = await storage.createEventShare({
        eventId: event.id,
        sharedWithEmail: email,
        sharedWithUserId: sharedWithUser?.id,
        status: "pending"
      });
      
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
  });

  app.patch("/api/calendar/shares/:shareId", requireAuth, async (req, res) => {
    try {
      const shareId = parseInt(req.params.shareId);
      const updated = await storage.updateEventShare(shareId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update event share" });
    }
  });

  // ===== NOTIFICATIONS ROUTES =====
  app.get("/api/notifications", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const notifications = await storage.getNotifications(user.id);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    res.json({ notifications, unreadCount });
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationRead(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      await storage.markAllNotificationsRead(user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // ===== STICKY NOTES ROUTES =====
  app.get("/api/sticky-notes", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const notes = await storage.getStickyNotes(user.id);
    res.json(notes);
  });

  app.post("/api/sticky-notes", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertStickyNoteSchema.parse({ ...req.body, userId: user.id });
      const note = await storage.createStickyNote(data);
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create sticky note" });
    }
  });

  app.patch("/api/sticky-notes/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateStickyNote(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update sticky note" });
    }
  });

  app.delete("/api/sticky-notes/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteStickyNote(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sticky note" });
    }
  });

  // ===== FLASHCARD ROUTES =====
  app.get("/api/flashcards", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const cards = await storage.getFlashcards(user.id);
    res.json(cards);
  });

  app.post("/api/flashcards", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertFlashcardSchema.parse({ ...req.body, userId: user.id });
      const card = await storage.createFlashcard(data);
      res.json(card);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create flashcard" });
    }
  });

  app.patch("/api/flashcards/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateFlashcard(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update flashcard" });
    }
  });

  app.delete("/api/flashcards/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteFlashcard(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete flashcard" });
    }
  });

  // ===== JOURNAL ROUTES =====
  app.get("/api/journal", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const entries = await storage.getJournalEntries(user.id);
    res.json(entries);
  });

  app.post("/api/journal", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertJournalEntrySchema.parse({ ...req.body, userId: user.id });
      const entry = await storage.createJournalEntry(data);
      res.json(entry);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create journal entry" });
    }
  });

  // ===== REWARDS ROUTES =====
  app.get("/api/rewards", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const rewards = await storage.getRewards(user.id);
    res.json(rewards);
  });

  app.post("/api/rewards", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertRewardSchema.parse({ ...req.body, userId: user.id });
      const reward = await storage.createReward(data);
      res.json(reward);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create reward" });
    }
  });

  app.patch("/api/rewards/:id", requireAuth, async (req, res) => {
    try {
      const updated = await storage.updateReward(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update reward" });
    }
  });

  // ===== POMODORO & SETTINGS ROUTES =====
  app.get("/api/settings/pomodoro", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const settings = await storage.getPomodoroSettings(user.id);
    res.json(settings || {
      userId: user.id,
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
      autoStartNext: true,
      soundEnabled: true,
      notificationsEnabled: true
    });
  });

  app.post("/api/settings/pomodoro", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertPomodoroSettingsSchema.parse({ ...req.body, userId: user.id });
      const settings = await storage.savePomodoroSettings(data);
      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to save settings" });
    }
  });

  app.get("/api/settings/preferences", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const prefs = await storage.getAppPreferences(user.id);
    res.json(prefs || {
      userId: user.id,
      theme: "light",
      hasSeenTour: false,
      healthRemindersEnabled: true,
      focusMusicVolume: 50
    });
  });

  app.post("/api/settings/preferences", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertAppPreferencesSchema.parse({ ...req.body, userId: user.id });
      const prefs = await storage.saveAppPreferences(data);
      res.json(prefs);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to save preferences" });
    }
  });

  // ===== STATS ROUTES =====
  app.get("/api/stats", requireAuth, async (req, res) => {
    const user = (req as any).user;
    res.json({
      dailyStreak: user.dailyStreak || 0,
      totalFocusMinutes: user.totalFocusMinutes || 0,
      todayFocusMinutes: user.todayFocusMinutes || 0,
      totalTasksCompleted: user.totalTasksCompleted || 0,
      badges: user.badges || []
    });
  });

  app.post("/api/stats/focus", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { minutes } = req.body;
      
      await storage.updateUser(user.id, {
        totalFocusMinutes: (user.totalFocusMinutes || 0) + minutes,
        todayFocusMinutes: (user.todayFocusMinutes || 0) + minutes
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update focus time" });
    }
  });

  app.post("/api/stats/streak", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const today = new Date().toDateString();
      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toDateString() : null;
      
      if (lastActive !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = lastActive === yesterday ? (user.dailyStreak || 0) + 1 : 1;
        
        await storage.updateUser(user.id, {
          dailyStreak: newStreak,
          lastActiveDate: new Date(),
          todayFocusMinutes: lastActive !== today ? 0 : user.todayFocusMinutes
        });
        
        res.json({ streak: newStreak, updated: true });
      } else {
        res.json({ streak: user.dailyStreak || 0, updated: false });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update streak" });
    }
  });

  // ===== AI CHAT ROUTES =====
  app.get("/api/ai/messages", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const messages = await storage.getAIMessages(user.id);
    res.json(messages);
  });

  app.post("/api/ai/chat", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { message } = req.body;
      
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      // Save user message
      await storage.createAIMessage({
        userId: user.id,
        role: "user",
        content: message
      });

      if (!genai) {
        const fallbackMessage = "I'm your AI study assistant! I can help you understand concepts, generate quiz questions, create study plans, and more. However, the AI service is not currently configured. Please add your GEMINI_API_KEY to use this feature.";
        await storage.createAIMessage({
          userId: user.id,
          role: "assistant",
          content: fallbackMessage
        });
        return res.json({ message: fallbackMessage });
      }

      // Get user context for personalized responses
      const [subjects, tasks, flashcards, calendarEvents] = await Promise.all([
        storage.getSubjects(user.id),
        storage.getTasks(user.id),
        storage.getFlashcards(user.id),
        storage.getCalendarEvents(user.id)
      ]);

      const userContext = `
User Information:
- Name: ${user.name}
- Email: ${user.email}
- Subjects: ${subjects.map(s => s.name).join(", ") || "None yet"}
- Pending Tasks: ${tasks.filter(t => t.status !== "completed").length}
- Flashcards: ${flashcards.length}
- Upcoming Events: ${calendarEvents.filter(e => new Date(e.startTime) > new Date()).length}
- Daily Streak: ${user.dailyStreak || 0} days
- Total Study Time: ${user.totalFocusMinutes || 0} minutes
`;

      const systemPrompt = `You are StudyFlow AI, a friendly and knowledgeable study assistant. You have access to the following information about the user:
${userContext}

You help students:
- Understand complex concepts in simple terms
- Create study plans and schedules
- Generate quiz questions and flashcards
- Provide motivation and study tips
- Answer questions about any academic subject
- Help organize their tasks and calendar

Be encouraging, concise, and helpful. Use clear explanations and examples when needed. Keep responses focused and practical for students. Personalize your responses using the user's data when relevant.`;

      const response = await genai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: {
          systemInstruction: systemPrompt
        }
      });

      const aiMessage = response.text || "I'm here to help with your studies! Feel free to ask me anything.";
      
      await storage.createAIMessage({
        userId: user.id,
        role: "assistant",
        content: aiMessage
      });
      
      res.json({ message: aiMessage });
    } catch (error: any) {
      console.error("AI chat error:", error);
      const fallbackMessage = "I'm having trouble connecting right now. Please try again in a moment!";
      res.status(500).json({ 
        error: "Failed to get AI response",
        message: fallbackMessage
      });
    }
  });

  app.delete("/api/ai/messages", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      await storage.clearAIMessages(user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear messages" });
    }
  });

  // ===== REMINDERS ROUTES =====
  app.get("/api/reminders", requireAuth, async (req, res) => {
    const user = (req as any).user;
    const reminders = await storage.getReminders(user.id);
    res.json(reminders);
  });

  app.post("/api/reminders", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const data = insertReminderSchema.parse({ ...req.body, userId: user.id });
      const reminder = await storage.createReminder(data);
      res.json(reminder);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create reminder" });
    }
  });

  app.delete("/api/reminders/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteReminder(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete reminder" });
    }
  });

  return httpServer;
}
