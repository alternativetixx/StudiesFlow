import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  hasCompletedSetup: boolean("has_completed_setup").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActiveDate: timestamp("last_active_date"),
  dailyStreak: integer("daily_streak").default(0).notNull(),
  totalFocusMinutes: integer("total_focus_minutes").default(0).notNull(),
  todayFocusMinutes: integer("today_focus_minutes").default(0).notNull(),
  totalTasksCompleted: integer("total_tasks_completed").default(0).notNull(),
  aiMessagesToday: integer("ai_messages_today").default(0).notNull(),
  aiMessagesLastReset: timestamp("ai_messages_last_reset"),
  badges: jsonb("badges").$type<string[]>().default([]),
  googleCalendarToken: text("google_calendar_token"),
  googleCalendarRefreshToken: text("google_calendar_refresh_token"),
});

export const usersRelations = relations(users, ({ many }) => ({
  subjects: many(subjects),
  exams: many(exams),
  tasks: many(tasks),
  notes: many(notes),
  calendarEvents: many(calendarEvents),
  flashcards: many(flashcards),
  stickyNotes: many(stickyNotes),
  notifications: many(notifications),
  journalEntries: many(journalEntries),
  rewards: many(rewards),
  aiMessages: many(aiMessages),
}));

// Sessions table for auth
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});

// Subjects table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  totalTopics: integer("total_topics").default(0).notNull(),
  coveredTopics: integer("covered_topics").default(0).notNull(),
  googleDriveUrl: text("google_drive_url"),
  studyHours: integer("study_hours").default(0).notNull(),
  weakAreas: text("weak_areas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("subjects_user_id_idx").on(table.userId),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  user: one(users, { fields: [subjects.userId], references: [users.id] }),
  exams: many(exams),
  tasks: many(tasks),
  flashcards: many(flashcards),
}));

// Exams table
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  confidence: integer("confidence").default(50).notNull(),
  weight: integer("weight").default(100).notNull(),
  googleDriveUrl: text("google_drive_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("exams_user_id_idx").on(table.userId),
}));

export const examsRelations = relations(exams, ({ one }) => ({
  user: one(users, { fields: [exams.userId], references: [users.id] }),
  subject: one(subjects, { fields: [exams.subjectId], references: [subjects.id] }),
}));

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority", { enum: ["critical", "high", "medium", "low"] }).default("medium").notNull(),
  status: text("status", { enum: ["pending", "in_progress", "completed"] }).default("pending").notNull(),
  dueDate: timestamp("due_date"),
  estimatedMinutes: integer("estimated_minutes"),
  tags: jsonb("tags").$type<string[]>().default([]),
  order: integer("order").default(0).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("tasks_user_id_idx").on(table.userId),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  subject: one(subjects, { fields: [tasks.subjectId], references: [subjects.id] }),
}));

// Notes table (new feature)
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").default(""),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notes_user_id_idx").on(table.userId),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  subject: one(subjects, { fields: [notes.subjectId], references: [subjects.id] }),
  shares: many(noteShares),
  comments: many(noteComments),
}));

// Note shares table
export const noteShares = pgTable("note_shares", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
  sharedWithEmail: text("shared_with_email").notNull(),
  sharedWithUserId: integer("shared_with_user_id").references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["viewer", "commenter", "editor"] }).default("viewer").notNull(),
  status: text("status", { enum: ["pending", "accepted", "declined"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  noteIdIdx: index("note_shares_note_id_idx").on(table.noteId),
}));

export const noteSharesRelations = relations(noteShares, ({ one }) => ({
  note: one(notes, { fields: [noteShares.noteId], references: [notes.id] }),
  sharedWithUser: one(users, { fields: [noteShares.sharedWithUserId], references: [users.id] }),
}));

// Note comments table
export const noteComments = pgTable("note_comments", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  noteIdIdx: index("note_comments_note_id_idx").on(table.noteId),
}));

export const noteCommentsRelations = relations(noteComments, ({ one }) => ({
  note: one(notes, { fields: [noteComments.noteId], references: [notes.id] }),
  user: one(users, { fields: [noteComments.userId], references: [users.id] }),
}));

// Calendar events table (replacing schedule)
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type", { enum: ["event", "task", "reminder"] }).default("event").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  allDay: boolean("all_day").default(false).notNull(),
  color: text("color").default("#8B5CF6"),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  googleEventId: text("google_event_id"),
  recurrence: text("recurrence"),
  reminderMinutes: integer("reminder_minutes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("calendar_events_user_id_idx").on(table.userId),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one, many }) => ({
  user: one(users, { fields: [calendarEvents.userId], references: [users.id] }),
  subject: one(subjects, { fields: [calendarEvents.subjectId], references: [subjects.id] }),
  shares: many(eventShares),
}));

// Event shares table (for sharing calendar events)
export const eventShares = pgTable("event_shares", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => calendarEvents.id, { onDelete: "cascade" }),
  sharedWithEmail: text("shared_with_email").notNull(),
  sharedWithUserId: integer("shared_with_user_id").references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["pending", "accepted", "declined"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  eventIdIdx: index("event_shares_event_id_idx").on(table.eventId),
}));

export const eventSharesRelations = relations(eventShares, ({ one }) => ({
  event: one(calendarEvents, { fields: [eventShares.eventId], references: [calendarEvents.id] }),
  sharedWithUser: one(users, { fields: [eventShares.sharedWithUserId], references: [users.id] }),
}));

// Reminders table
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  reminderTime: timestamp("reminder_time").notNull(),
  eventId: integer("event_id").references(() => calendarEvents.id, { onDelete: "cascade" }),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("reminders_user_id_idx").on(table.userId),
}));

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["share", "reminder", "task_due", "event", "achievement", "system"] }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  referenceId: integer("reference_id"),
  referenceType: text("reference_type"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notifications_user_id_idx").on(table.userId),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

// Sticky notes table
export const stickyNotes = pgTable("sticky_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  color: text("color").default("#8B5CF6").notNull(),
  x: integer("x").default(0).notNull(),
  y: integer("y").default(0).notNull(),
  width: integer("width").default(200).notNull(),
  height: integer("height").default(200).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("sticky_notes_user_id_idx").on(table.userId),
}));

export const stickyNotesRelations = relations(stickyNotes, ({ one }) => ({
  user: one(users, { fields: [stickyNotes.userId], references: [users.id] }),
}));

// Flashcards table
export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  front: text("front").notNull(),
  back: text("back").notNull(),
  box: integer("box").default(1).notNull(),
  nextReviewDate: timestamp("next_review_date").defaultNow().notNull(),
  lastReviewDate: timestamp("last_review_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("flashcards_user_id_idx").on(table.userId),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  user: one(users, { fields: [flashcards.userId], references: [users.id] }),
  subject: one(subjects, { fields: [flashcards.subjectId], references: [subjects.id] }),
}));

// Journal entries table
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  mood: text("mood", { enum: ["great", "good", "okay", "bad", "terrible"] }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("journal_entries_user_id_idx").on(table.userId),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(users, { fields: [journalEntries.userId], references: [users.id] }),
}));

// Rewards table
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetTasks: integer("target_tasks").notNull(),
  reward: text("reward").notNull(),
  currentProgress: integer("current_progress").default(0).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("rewards_user_id_idx").on(table.userId),
}));

export const rewardsRelations = relations(rewards, ({ one }) => ({
  user: one(users, { fields: [rewards.userId], references: [users.id] }),
}));

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  questions: jsonb("questions").$type<{
    question: string;
    options: string[];
    correctAnswer: number;
    type: "mcq" | "true_false";
  }[]>().notNull(),
  score: integer("score"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("quizzes_user_id_idx").on(table.userId),
}));

// AI Messages table
export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("ai_messages_user_id_idx").on(table.userId),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  user: one(users, { fields: [aiMessages.userId], references: [users.id] }),
}));

// Pomodoro settings table
export const pomodoroSettings = pgTable("pomodoro_settings", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  workDuration: integer("work_duration").default(25).notNull(),
  shortBreakDuration: integer("short_break_duration").default(5).notNull(),
  longBreakDuration: integer("long_break_duration").default(15).notNull(),
  sessionsUntilLongBreak: integer("sessions_until_long_break").default(4).notNull(),
  autoStartNext: boolean("auto_start_next").default(true).notNull(),
  soundEnabled: boolean("sound_enabled").default(true).notNull(),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
});

// App preferences table
export const appPreferences = pgTable("app_preferences", {
  userId: integer("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme", { enum: ["light", "dark"] }).default("light").notNull(),
  hasSeenTour: boolean("has_seen_tour").default(false).notNull(),
  healthRemindersEnabled: boolean("health_reminders_enabled").default(true).notNull(),
  focusMusicVolume: integer("focus_music_volume").default(50).notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
export const insertExamSchema = createInsertSchema(exams).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNoteShareSchema = createInsertSchema(noteShares).omit({ id: true, createdAt: true });
export const insertNoteCommentSchema = createInsertSchema(noteComments).omit({ id: true, createdAt: true });
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEventShareSchema = createInsertSchema(eventShares).omit({ id: true, createdAt: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertStickyNoteSchema = createInsertSchema(stickyNotes).omit({ id: true, createdAt: true });
export const insertFlashcardSchema = createInsertSchema(flashcards).omit({ id: true, createdAt: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true });
export const insertRewardSchema = createInsertSchema(rewards).omit({ id: true, createdAt: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true });
export const insertAIMessageSchema = createInsertSchema(aiMessages).omit({ id: true, createdAt: true });
export const insertPomodoroSettingsSchema = createInsertSchema(pomodoroSettings);
export const insertAppPreferencesSchema = createInsertSchema(appPreferences);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type NoteShare = typeof noteShares.$inferSelect;
export type InsertNoteShare = z.infer<typeof insertNoteShareSchema>;
export type NoteComment = typeof noteComments.$inferSelect;
export type InsertNoteComment = z.infer<typeof insertNoteCommentSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type EventShare = typeof eventShares.$inferSelect;
export type InsertEventShare = z.infer<typeof insertEventShareSchema>;
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type StickyNote = typeof stickyNotes.$inferSelect;
export type InsertStickyNote = z.infer<typeof insertStickyNoteSchema>;
export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type AIMessage = typeof aiMessages.$inferSelect;
export type InsertAIMessage = z.infer<typeof insertAIMessageSchema>;
export type PomodoroSettings = typeof pomodoroSettings.$inferSelect;
export type InsertPomodoroSettings = z.infer<typeof insertPomodoroSettingsSchema>;
export type AppPreferences = typeof appPreferences.$inferSelect;
export type InsertAppPreferences = z.infer<typeof insertAppPreferencesSchema>;
export type Session = typeof sessions.$inferSelect;

// Badge definitions
export const BADGES = {
  NIGHT_OWL: { id: "night_owl", name: "Night Owl", description: "Study after midnight", icon: "Moon" },
  MARATHON: { id: "marathon", name: "Marathon", description: "Study for 4+ hours in one session", icon: "Timer" },
  PERFECT_WEEK: { id: "perfect_week", name: "Perfect Week", description: "7-day streak", icon: "Calendar" },
  CENTURION: { id: "centurion", name: "Centurion", description: "Complete 100 tasks", icon: "Trophy" },
  EARLY_BIRD: { id: "early_bird", name: "Early Bird", description: "Start studying before 6 AM", icon: "Sun" },
  STREAK_14: { id: "streak_14", name: "Two Week Warrior", description: "14-day streak", icon: "Flame" },
  STREAK_30: { id: "streak_30", name: "Monthly Master", description: "30-day streak", icon: "Crown" },
  QUIZ_MASTER: { id: "quiz_master", name: "Quiz Master", description: "Complete 50 quizzes", icon: "Brain" },
  FLASHCARD_PRO: { id: "flashcard_pro", name: "Flashcard Pro", description: "Review 500 flashcards", icon: "Layers" },
} as const;

// Motivational quotes
export const MOTIVATIONAL_QUOTES = [
  { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { quote: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { quote: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { quote: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { quote: "Study hard what interests you the most in the most undisciplined, irreverent and original manner possible.", author: "Richard Feynman" },
  { quote: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { quote: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
  { quote: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { quote: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { quote: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { quote: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { quote: "Knowledge is power.", author: "Francis Bacon" },
  { quote: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { quote: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { quote: "Education is not the filling of a pail, but the lighting of a fire.", author: "William Butler Yeats" },
  { quote: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { quote: "Anyone who stops learning is old, whether at twenty or eighty.", author: "Henry Ford" },
  { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { quote: "The difference between ordinary and extraordinary is that little extra.", author: "Jimmy Johnson" },
  { quote: "What we learn with pleasure we never forget.", author: "Alfred Mercier" },
  { quote: "I am still learning.", author: "Michelangelo" },
  { quote: "The purpose of learning is growth, and our minds, unlike our bodies, can continue growing as we continue to live.", author: "Mortimer Adler" },
];

export function getQuoteOfDay(): { quote: string; author: string } {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}
