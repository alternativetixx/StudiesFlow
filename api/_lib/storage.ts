import { db } from './db';
import { 
  users, subjects, exams, tasks, notes, noteShares, noteComments,
  calendarEvents, eventShares, reminders, notifications, stickyNotes,
  flashcards, journalEntries, rewards, quizzes, aiMessages,
  pomodoroSettings, appPreferences, sessions
} from '../../shared/schema';
import { eq, and, or, desc, asc, gte, lte, inArray } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export const storage = {
  async getUser(id: number) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async createUser(insertUser: { name: string; email: string; password: string; isPremium?: boolean; hasCompletedSetup?: boolean }) {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  },

  async updateUser(id: number, updates: Partial<typeof users.$inferSelect>) {
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  },

  async deleteUser(id: number) {
    await db.delete(users).where(eq(users.id, id));
  },

  async createSession(userId: number) {
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [session] = await db.insert(sessions).values({ id, userId, expiresAt }).returning();
    return session;
  },

  async getSession(id: string) {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    if (session && session.expiresAt < new Date()) {
      await db.delete(sessions).where(eq(sessions.id, id));
      return undefined;
    }
    return session;
  },

  async deleteSession(id: string) {
    await db.delete(sessions).where(eq(sessions.id, id));
  },

  async getSubjects(userId: number) {
    return db.select().from(subjects).where(eq(subjects.userId, userId)).orderBy(asc(subjects.name));
  },

  async getSubject(id: number) {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  },

  async createSubject(subject: typeof subjects.$inferInsert) {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  },

  async updateSubject(id: number, updates: Partial<typeof subjects.$inferSelect>) {
    const [subject] = await db.update(subjects).set(updates).where(eq(subjects.id, id)).returning();
    return subject;
  },

  async deleteSubject(id: number) {
    await db.delete(subjects).where(eq(subjects.id, id));
  },

  async getExams(userId: number) {
    return db.select().from(exams).where(eq(exams.userId, userId)).orderBy(asc(exams.date));
  },

  async getExam(id: number) {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  },

  async createExam(exam: typeof exams.$inferInsert) {
    const [newExam] = await db.insert(exams).values(exam).returning();
    return newExam;
  },

  async updateExam(id: number, updates: Partial<typeof exams.$inferSelect>) {
    const [exam] = await db.update(exams).set(updates).where(eq(exams.id, id)).returning();
    return exam;
  },

  async deleteExam(id: number) {
    await db.delete(exams).where(eq(exams.id, id));
  },

  async getTasks(userId: number) {
    return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(asc(tasks.order));
  },

  async getTask(id: number) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  },

  async createTask(task: typeof tasks.$inferInsert) {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  },

  async updateTask(id: number, updates: Partial<typeof tasks.$inferSelect>) {
    const [task] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return task;
  },

  async deleteTask(id: number) {
    await db.delete(tasks).where(eq(tasks.id, id));
  },

  async getNotes(userId: number) {
    return db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.updatedAt));
  },

  async getNote(id: number) {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  },

  async getSharedNotes(userId: number) {
    const shares = await db.select().from(noteShares)
      .where(and(eq(noteShares.sharedWithUserId, userId), eq(noteShares.status, "accepted")));
    if (shares.length === 0) return [];
    const noteIds = shares.map(s => s.noteId);
    return db.select().from(notes).where(inArray(notes.id, noteIds));
  },

  async createNote(note: typeof notes.$inferInsert) {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  },

  async updateNote(id: number, updates: Partial<typeof notes.$inferSelect>) {
    const [note] = await db.update(notes).set({ ...updates, updatedAt: new Date() }).where(eq(notes.id, id)).returning();
    return note;
  },

  async deleteNote(id: number) {
    await db.delete(notes).where(eq(notes.id, id));
  },

  async getNoteShares(noteId: number) {
    return db.select().from(noteShares).where(eq(noteShares.noteId, noteId));
  },

  async createNoteShare(share: typeof noteShares.$inferInsert) {
    const [newShare] = await db.insert(noteShares).values(share).returning();
    return newShare;
  },

  async updateNoteShare(id: number, updates: Partial<typeof noteShares.$inferSelect>) {
    const [share] = await db.update(noteShares).set(updates).where(eq(noteShares.id, id)).returning();
    return share;
  },

  async deleteNoteShare(id: number) {
    await db.delete(noteShares).where(eq(noteShares.id, id));
  },

  async getNoteComments(noteId: number) {
    return db.select().from(noteComments).where(eq(noteComments.noteId, noteId)).orderBy(asc(noteComments.createdAt));
  },

  async createNoteComment(comment: typeof noteComments.$inferInsert) {
    const [newComment] = await db.insert(noteComments).values(comment).returning();
    return newComment;
  },

  async getCalendarEvents(userId: number, startDate?: Date, endDate?: Date) {
    let query = db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId));
    if (startDate && endDate) {
      query = db.select().from(calendarEvents).where(
        and(
          eq(calendarEvents.userId, userId),
          gte(calendarEvents.startTime, startDate),
          lte(calendarEvents.startTime, endDate)
        )
      );
    }
    return query.orderBy(asc(calendarEvents.startTime));
  },

  async getCalendarEvent(id: number) {
    const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return event;
  },

  async getSharedCalendarEvents(userId: number) {
    const shares = await db.select().from(eventShares)
      .where(and(eq(eventShares.sharedWithUserId, userId), eq(eventShares.status, "accepted")));
    if (shares.length === 0) return [];
    const eventIds = shares.map(s => s.eventId);
    return db.select().from(calendarEvents).where(inArray(calendarEvents.id, eventIds));
  },

  async createCalendarEvent(event: typeof calendarEvents.$inferInsert) {
    const [newEvent] = await db.insert(calendarEvents).values(event).returning();
    return newEvent;
  },

  async updateCalendarEvent(id: number, updates: Partial<typeof calendarEvents.$inferSelect>) {
    const [event] = await db.update(calendarEvents).set({ ...updates, updatedAt: new Date() }).where(eq(calendarEvents.id, id)).returning();
    return event;
  },

  async deleteCalendarEvent(id: number) {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  },

  async getEventShares(eventId: number) {
    return db.select().from(eventShares).where(eq(eventShares.eventId, eventId));
  },

  async createEventShare(share: typeof eventShares.$inferInsert) {
    const [newShare] = await db.insert(eventShares).values(share).returning();
    return newShare;
  },

  async updateEventShare(id: number, updates: Partial<typeof eventShares.$inferSelect>) {
    const [share] = await db.update(eventShares).set(updates).where(eq(eventShares.id, id)).returning();
    return share;
  },

  async createReminder(reminder: typeof reminders.$inferInsert) {
    const [newReminder] = await db.insert(reminders).values(reminder).returning();
    return newReminder;
  },

  async getReminders(userId: number) {
    return db.select().from(reminders).where(eq(reminders.userId, userId)).orderBy(asc(reminders.reminderTime));
  },

  async deleteReminder(id: number) {
    await db.delete(reminders).where(eq(reminders.id, id));
  },

  async getNotifications(userId: number) {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  },

  async createNotification(notification: typeof notifications.$inferInsert) {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  },

  async markNotificationRead(id: number) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  },

  async markAllNotificationsRead(userId: number) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  },

  async getStickyNotes(userId: number) {
    return db.select().from(stickyNotes).where(eq(stickyNotes.userId, userId));
  },

  async createStickyNote(note: typeof stickyNotes.$inferInsert) {
    const [newNote] = await db.insert(stickyNotes).values(note).returning();
    return newNote;
  },

  async updateStickyNote(id: number, updates: Partial<typeof stickyNotes.$inferSelect>) {
    const [note] = await db.update(stickyNotes).set(updates).where(eq(stickyNotes.id, id)).returning();
    return note;
  },

  async deleteStickyNote(id: number) {
    await db.delete(stickyNotes).where(eq(stickyNotes.id, id));
  },

  async getStickyNote(id: number) {
    const [note] = await db.select().from(stickyNotes).where(eq(stickyNotes.id, id));
    return note;
  },

  async getFlashcards(userId: number) {
    return db.select().from(flashcards).where(eq(flashcards.userId, userId));
  },

  async createFlashcard(card: typeof flashcards.$inferInsert) {
    const [newCard] = await db.insert(flashcards).values(card).returning();
    return newCard;
  },

  async updateFlashcard(id: number, updates: Partial<typeof flashcards.$inferSelect>) {
    const [card] = await db.update(flashcards).set(updates).where(eq(flashcards.id, id)).returning();
    return card;
  },

  async deleteFlashcard(id: number) {
    await db.delete(flashcards).where(eq(flashcards.id, id));
  },

  async getFlashcard(id: number) {
    const [card] = await db.select().from(flashcards).where(eq(flashcards.id, id));
    return card;
  },

  async getJournalEntries(userId: number) {
    return db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.createdAt));
  },

  async createJournalEntry(entry: typeof journalEntries.$inferInsert) {
    const [newEntry] = await db.insert(journalEntries).values(entry).returning();
    return newEntry;
  },

  async getRewards(userId: number) {
    return db.select().from(rewards).where(eq(rewards.userId, userId));
  },

  async createReward(reward: typeof rewards.$inferInsert) {
    const [newReward] = await db.insert(rewards).values(reward).returning();
    return newReward;
  },

  async updateReward(id: number, updates: Partial<typeof rewards.$inferSelect>) {
    const [reward] = await db.update(rewards).set(updates).where(eq(rewards.id, id)).returning();
    return reward;
  },

  async getReward(id: number) {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward;
  },

  async getAIMessages(userId: number) {
    return db.select().from(aiMessages).where(eq(aiMessages.userId, userId)).orderBy(asc(aiMessages.createdAt));
  },

  async createAIMessage(message: typeof aiMessages.$inferInsert) {
    const [newMessage] = await db.insert(aiMessages).values(message).returning();
    return newMessage;
  },

  async clearAIMessages(userId: number) {
    await db.delete(aiMessages).where(eq(aiMessages.userId, userId));
  },

  async getPomodoroSettings(userId: number) {
    const [settings] = await db.select().from(pomodoroSettings).where(eq(pomodoroSettings.userId, userId));
    return settings;
  },

  async savePomodoroSettings(settings: typeof pomodoroSettings.$inferInsert) {
    const [saved] = await db.insert(pomodoroSettings)
      .values(settings)
      .onConflictDoUpdate({ target: pomodoroSettings.userId, set: settings })
      .returning();
    return saved;
  },

  async getAppPreferences(userId: number) {
    const [prefs] = await db.select().from(appPreferences).where(eq(appPreferences.userId, userId));
    return prefs;
  },

  async saveAppPreferences(prefs: typeof appPreferences.$inferInsert) {
    const [saved] = await db.insert(appPreferences)
      .values(prefs)
      .onConflictDoUpdate({ target: appPreferences.userId, set: prefs })
      .returning();
    return saved;
  },
};
