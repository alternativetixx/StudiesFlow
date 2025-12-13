import { 
  users, subjects, exams, tasks, notes, noteShares, noteComments,
  calendarEvents, eventShares, reminders, notifications, stickyNotes,
  flashcards, journalEntries, rewards, quizzes, aiMessages,
  pomodoroSettings, appPreferences, sessions,
  type User, type InsertUser, type Subject, type InsertSubject,
  type Exam, type InsertExam, type Task, type InsertTask,
  type Note, type InsertNote, type NoteShare, type InsertNoteShare,
  type NoteComment, type InsertNoteComment, type CalendarEvent, type InsertCalendarEvent,
  type EventShare, type InsertEventShare, type Reminder, type InsertReminder,
  type Notification, type InsertNotification, type StickyNote, type InsertStickyNote,
  type Flashcard, type InsertFlashcard, type JournalEntry, type InsertJournalEntry,
  type Reward, type InsertReward, type Quiz, type InsertQuiz,
  type AIMessage, type InsertAIMessage, type PomodoroSettings, type InsertPomodoroSettings,
  type AppPreferences, type InsertAppPreferences, type Session
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, gte, lte } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  
  // Session operations
  createSession(userId: number): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;
  deleteUserSessions(userId: number): Promise<void>;
  
  // Subject operations
  getSubjects(userId: number): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, updates: Partial<Subject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<void>;
  
  // Exam operations
  getExams(userId: number): Promise<Exam[]>;
  getExam(id: number): Promise<Exam | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, updates: Partial<Exam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<void>;
  
  // Task operations
  getTasks(userId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;
  
  // Note operations
  getNotes(userId: number): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  getSharedNotes(userId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, updates: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<void>;
  
  // Note share operations
  getNoteShares(noteId: number): Promise<NoteShare[]>;
  createNoteShare(share: InsertNoteShare): Promise<NoteShare>;
  updateNoteShare(id: number, updates: Partial<NoteShare>): Promise<NoteShare | undefined>;
  deleteNoteShare(id: number): Promise<void>;
  
  // Note comment operations
  getNoteComments(noteId: number): Promise<NoteComment[]>;
  createNoteComment(comment: InsertNoteComment): Promise<NoteComment>;
  deleteNoteComment(id: number): Promise<void>;
  
  // Calendar event operations
  getCalendarEvents(userId: number, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]>;
  getCalendarEvent(id: number): Promise<CalendarEvent | undefined>;
  getSharedCalendarEvents(userId: number): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: number, updates: Partial<CalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: number): Promise<void>;
  
  // Event share operations
  getEventShares(eventId: number): Promise<EventShare[]>;
  createEventShare(share: InsertEventShare): Promise<EventShare>;
  updateEventShare(id: number, updates: Partial<EventShare>): Promise<EventShare | undefined>;
  deleteEventShare(id: number): Promise<void>;
  
  // Reminder operations
  getReminders(userId: number): Promise<Reminder[]>;
  createReminder(reminder: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, updates: Partial<Reminder>): Promise<Reminder | undefined>;
  deleteReminder(id: number): Promise<void>;
  
  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  
  // Sticky note operations
  getStickyNotes(userId: number): Promise<StickyNote[]>;
  createStickyNote(note: InsertStickyNote): Promise<StickyNote>;
  updateStickyNote(id: number, updates: Partial<StickyNote>): Promise<StickyNote | undefined>;
  deleteStickyNote(id: number): Promise<void>;
  
  // Flashcard operations
  getFlashcards(userId: number): Promise<Flashcard[]>;
  createFlashcard(card: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: number, updates: Partial<Flashcard>): Promise<Flashcard | undefined>;
  deleteFlashcard(id: number): Promise<void>;
  
  // Journal entry operations
  getJournalEntries(userId: number): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: number, updates: Partial<JournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: number): Promise<void>;
  
  // Reward operations
  getRewards(userId: number): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: number, updates: Partial<Reward>): Promise<Reward | undefined>;
  deleteReward(id: number): Promise<void>;
  
  // Quiz operations
  getQuizzes(userId: number): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: number, updates: Partial<Quiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: number): Promise<void>;
  
  // AI message operations
  getAIMessages(userId: number): Promise<AIMessage[]>;
  createAIMessage(message: InsertAIMessage): Promise<AIMessage>;
  clearAIMessages(userId: number): Promise<void>;
  
  // Pomodoro settings operations
  getPomodoroSettings(userId: number): Promise<PomodoroSettings | undefined>;
  savePomodoroSettings(settings: InsertPomodoroSettings): Promise<PomodoroSettings>;
  
  // App preferences operations
  getAppPreferences(userId: number): Promise<AppPreferences | undefined>;
  saveAppPreferences(prefs: InsertAppPreferences): Promise<AppPreferences>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Session operations
  async createSession(userId: number): Promise<Session> {
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const [session] = await db.insert(sessions).values({ id, userId, expiresAt }).returning();
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    if (session && session.expiresAt < new Date()) {
      await this.deleteSession(id);
      return undefined;
    }
    return session;
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  async deleteUserSessions(userId: number): Promise<void> {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  // Subject operations
  async getSubjects(userId: number): Promise<Subject[]> {
    return db.select().from(subjects).where(eq(subjects.userId, userId)).orderBy(asc(subjects.name));
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject;
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  }

  async updateSubject(id: number, updates: Partial<Subject>): Promise<Subject | undefined> {
    const [subject] = await db.update(subjects).set(updates).where(eq(subjects.id, id)).returning();
    return subject;
  }

  async deleteSubject(id: number): Promise<void> {
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  // Exam operations
  async getExams(userId: number): Promise<Exam[]> {
    return db.select().from(exams).where(eq(exams.userId, userId)).orderBy(asc(exams.date));
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const [newExam] = await db.insert(exams).values(exam).returning();
    return newExam;
  }

  async updateExam(id: number, updates: Partial<Exam>): Promise<Exam | undefined> {
    const [exam] = await db.update(exams).set(updates).where(eq(exams.id, id)).returning();
    return exam;
  }

  async deleteExam(id: number): Promise<void> {
    await db.delete(exams).where(eq(exams.id, id));
  }

  // Task operations
  async getTasks(userId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(asc(tasks.order));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return task;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Note operations
  async getNotes(userId: number): Promise<Note[]> {
    return db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.updatedAt));
  }

  async getNote(id: number): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async getSharedNotes(userId: number): Promise<Note[]> {
    const shares = await db.select().from(noteShares)
      .where(and(eq(noteShares.sharedWithUserId, userId), eq(noteShares.status, "accepted")));
    if (shares.length === 0) return [];
    const noteIds = shares.map(s => s.noteId);
    return db.select().from(notes).where(or(...noteIds.map(id => eq(notes.id, id))));
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  async updateNote(id: number, updates: Partial<Note>): Promise<Note | undefined> {
    const [note] = await db.update(notes).set({ ...updates, updatedAt: new Date() }).where(eq(notes.id, id)).returning();
    return note;
  }

  async deleteNote(id: number): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  }

  // Note share operations
  async getNoteShares(noteId: number): Promise<NoteShare[]> {
    return db.select().from(noteShares).where(eq(noteShares.noteId, noteId));
  }

  async createNoteShare(share: InsertNoteShare): Promise<NoteShare> {
    const [newShare] = await db.insert(noteShares).values(share).returning();
    return newShare;
  }

  async updateNoteShare(id: number, updates: Partial<NoteShare>): Promise<NoteShare | undefined> {
    const [share] = await db.update(noteShares).set(updates).where(eq(noteShares.id, id)).returning();
    return share;
  }

  async deleteNoteShare(id: number): Promise<void> {
    await db.delete(noteShares).where(eq(noteShares.id, id));
  }

  // Note comment operations
  async getNoteComments(noteId: number): Promise<NoteComment[]> {
    return db.select().from(noteComments).where(eq(noteComments.noteId, noteId)).orderBy(asc(noteComments.createdAt));
  }

  async createNoteComment(comment: InsertNoteComment): Promise<NoteComment> {
    const [newComment] = await db.insert(noteComments).values(comment).returning();
    return newComment;
  }

  async deleteNoteComment(id: number): Promise<void> {
    await db.delete(noteComments).where(eq(noteComments.id, id));
  }

  // Calendar event operations
  async getCalendarEvents(userId: number, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
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
  }

  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return event;
  }

  async getSharedCalendarEvents(userId: number): Promise<CalendarEvent[]> {
    const shares = await db.select().from(eventShares)
      .where(and(eq(eventShares.sharedWithUserId, userId), eq(eventShares.status, "accepted")));
    if (shares.length === 0) return [];
    const eventIds = shares.map(s => s.eventId);
    return db.select().from(calendarEvents).where(or(...eventIds.map(id => eq(calendarEvents.id, id))));
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [newEvent] = await db.insert(calendarEvents).values(event).returning();
    return newEvent;
  }

  async updateCalendarEvent(id: number, updates: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    const [event] = await db.update(calendarEvents).set({ ...updates, updatedAt: new Date() }).where(eq(calendarEvents.id, id)).returning();
    return event;
  }

  async deleteCalendarEvent(id: number): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }

  // Event share operations
  async getEventShares(eventId: number): Promise<EventShare[]> {
    return db.select().from(eventShares).where(eq(eventShares.eventId, eventId));
  }

  async createEventShare(share: InsertEventShare): Promise<EventShare> {
    const [newShare] = await db.insert(eventShares).values(share).returning();
    return newShare;
  }

  async updateEventShare(id: number, updates: Partial<EventShare>): Promise<EventShare | undefined> {
    const [share] = await db.update(eventShares).set(updates).where(eq(eventShares.id, id)).returning();
    return share;
  }

  async deleteEventShare(id: number): Promise<void> {
    await db.delete(eventShares).where(eq(eventShares.id, id));
  }

  // Reminder operations
  async getReminders(userId: number): Promise<Reminder[]> {
    return db.select().from(reminders).where(eq(reminders.userId, userId)).orderBy(asc(reminders.reminderTime));
  }

  async createReminder(reminder: InsertReminder): Promise<Reminder> {
    const [newReminder] = await db.insert(reminders).values(reminder).returning();
    return newReminder;
  }

  async updateReminder(id: number, updates: Partial<Reminder>): Promise<Reminder | undefined> {
    const [reminder] = await db.update(reminders).set(updates).where(eq(reminders.id, id)).returning();
    return reminder;
  }

  async deleteReminder(id: number): Promise<void> {
    await db.delete(reminders).where(eq(reminders.id, id));
  }

  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Sticky note operations
  async getStickyNotes(userId: number): Promise<StickyNote[]> {
    return db.select().from(stickyNotes).where(eq(stickyNotes.userId, userId));
  }

  async createStickyNote(note: InsertStickyNote): Promise<StickyNote> {
    const [newNote] = await db.insert(stickyNotes).values(note).returning();
    return newNote;
  }

  async updateStickyNote(id: number, updates: Partial<StickyNote>): Promise<StickyNote | undefined> {
    const [note] = await db.update(stickyNotes).set(updates).where(eq(stickyNotes.id, id)).returning();
    return note;
  }

  async deleteStickyNote(id: number): Promise<void> {
    await db.delete(stickyNotes).where(eq(stickyNotes.id, id));
  }

  // Flashcard operations
  async getFlashcards(userId: number): Promise<Flashcard[]> {
    return db.select().from(flashcards).where(eq(flashcards.userId, userId));
  }

  async createFlashcard(card: InsertFlashcard): Promise<Flashcard> {
    const [newCard] = await db.insert(flashcards).values(card).returning();
    return newCard;
  }

  async updateFlashcard(id: number, updates: Partial<Flashcard>): Promise<Flashcard | undefined> {
    const [card] = await db.update(flashcards).set(updates).where(eq(flashcards.id, id)).returning();
    return card;
  }

  async deleteFlashcard(id: number): Promise<void> {
    await db.delete(flashcards).where(eq(flashcards.id, id));
  }

  // Journal entry operations
  async getJournalEntries(userId: number): Promise<JournalEntry[]> {
    return db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.createdAt));
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [newEntry] = await db.insert(journalEntries).values(entry).returning();
    return newEntry;
  }

  async updateJournalEntry(id: number, updates: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    const [entry] = await db.update(journalEntries).set(updates).where(eq(journalEntries.id, id)).returning();
    return entry;
  }

  async deleteJournalEntry(id: number): Promise<void> {
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  }

  // Reward operations
  async getRewards(userId: number): Promise<Reward[]> {
    return db.select().from(rewards).where(eq(rewards.userId, userId));
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db.insert(rewards).values(reward).returning();
    return newReward;
  }

  async updateReward(id: number, updates: Partial<Reward>): Promise<Reward | undefined> {
    const [reward] = await db.update(rewards).set(updates).where(eq(rewards.id, id)).returning();
    return reward;
  }

  async deleteReward(id: number): Promise<void> {
    await db.delete(rewards).where(eq(rewards.id, id));
  }

  // Quiz operations
  async getQuizzes(userId: number): Promise<Quiz[]> {
    return db.select().from(quizzes).where(eq(quizzes.userId, userId)).orderBy(desc(quizzes.createdAt));
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [newQuiz] = await db.insert(quizzes).values(quiz).returning();
    return newQuiz;
  }

  async updateQuiz(id: number, updates: Partial<Quiz>): Promise<Quiz | undefined> {
    const [quiz] = await db.update(quizzes).set(updates).where(eq(quizzes.id, id)).returning();
    return quiz;
  }

  async deleteQuiz(id: number): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  // AI message operations
  async getAIMessages(userId: number): Promise<AIMessage[]> {
    return db.select().from(aiMessages).where(eq(aiMessages.userId, userId)).orderBy(asc(aiMessages.createdAt));
  }

  async createAIMessage(message: InsertAIMessage): Promise<AIMessage> {
    const [newMessage] = await db.insert(aiMessages).values(message).returning();
    return newMessage;
  }

  async clearAIMessages(userId: number): Promise<void> {
    await db.delete(aiMessages).where(eq(aiMessages.userId, userId));
  }

  // Pomodoro settings operations
  async getPomodoroSettings(userId: number): Promise<PomodoroSettings | undefined> {
    const [settings] = await db.select().from(pomodoroSettings).where(eq(pomodoroSettings.userId, userId));
    return settings;
  }

  async savePomodoroSettings(settings: InsertPomodoroSettings): Promise<PomodoroSettings> {
    const [saved] = await db.insert(pomodoroSettings)
      .values(settings)
      .onConflictDoUpdate({ target: pomodoroSettings.userId, set: settings })
      .returning();
    return saved;
  }

  // App preferences operations
  async getAppPreferences(userId: number): Promise<AppPreferences | undefined> {
    const [prefs] = await db.select().from(appPreferences).where(eq(appPreferences.userId, userId));
    return prefs;
  }

  async saveAppPreferences(prefs: InsertAppPreferences): Promise<AppPreferences> {
    const [saved] = await db.insert(appPreferences)
      .values(prefs)
      .onConflictDoUpdate({ target: appPreferences.userId, set: prefs })
      .returning();
    return saved;
  }
}

export const storage = new DatabaseStorage();
