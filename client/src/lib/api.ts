import type {
  User, Subject, Exam, Task, Note, NoteShare, NoteComment,
  CalendarEvent, EventShare, Notification, StickyNote, Flashcard,
  JournalEntry, Reward, AIMessage, PomodoroSettings, AppPreferences, Reminder
} from "@shared/schema";

const SESSION_KEY = "studyflow_session";

function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

function setSessionId(sessionId: string): void {
  localStorage.setItem(SESSION_KEY, sessionId);
}

function clearSessionId(): void {
  localStorage.removeItem(SESSION_KEY);
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const sessionId = getSessionId();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (sessionId) {
    headers.Authorization = `Bearer ${sessionId}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: "Request failed" };
      }
      throw new Error(
        errorData.error || errorData.message || `HTTP ${response.status}: Request failed`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      // Network error, no internet, server down, CORS issue, etc.
      throw new Error(
        "I'm having trouble connecting right now. Please check your internet connection and try again in a moment!"
      );
    }

    // Re-throw other errors (including custom API errors)
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("An unexpected error occurred. Please try again.");
  }
}

// Auth API
export async function signup(name: string, email: string, password: string): Promise<User> {
  const result = await fetchApi<{ user: User; sessionId: string }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  setSessionId(result.sessionId);
  return result.user;
}

export async function login(email: string, password: string): Promise<User> {
  const result = await fetchApi<{ user: User; sessionId: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setSessionId(result.sessionId);
  return result.user;
}

export async function logout(): Promise<void> {
  try {
    await fetchApi("/api/auth/logout", { method: "POST" });
  } finally {
    clearSessionId();
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const sessionId = getSessionId();
  if (!sessionId) return null;

  try {
    const result = await fetchApi<{ user: User }>("/api/auth/me");
    return result.user;
  } catch {
    clearSessionId();
    return null;
  }
}

export async function updateProfile(updates: Partial<User>): Promise<User> {
  const result = await fetchApi<{ user: User }>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return result.user;
}

export async function deleteAccount(confirmEmail: string): Promise<void> {
  await fetchApi("/api/auth/me", {
    method: "DELETE",
    body: JSON.stringify({ confirmEmail }),
  });
  clearSessionId();
}

// Subjects API
export async function getSubjects(): Promise<Subject[]> {
  return fetchApi<Subject[]>("/api/subjects");
}

export async function createSubject(subject: {
  name: string;
  color: string;
  totalTopics?: number;
  coveredTopics?: number;
  studyHours?: number;
  googleDriveUrl?: string | null;
  weakAreas?: string | null;
}): Promise<Subject> {
  return fetchApi<Subject>("/api/subjects", {
    method: "POST",
    body: JSON.stringify(subject),
  });
}

export async function updateSubject(id: number, updates: Partial<Subject>): Promise<Subject> {
  return fetchApi<Subject>(`/api/subjects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteSubject(id: number): Promise<void> {
  await fetchApi(`/api/subjects/${id}`, { method: "DELETE" });
}

// Exams API
export async function getExams(): Promise<Exam[]> {
  return fetchApi<Exam[]>("/api/exams");
}

export async function createExam(exam: {
  name: string;
  date: string;
  subjectId?: number | null;
  confidence?: number;
  weight?: number;
  googleDriveUrl?: string | null;
}): Promise<Exam> {
  return fetchApi<Exam>("/api/exams", {
    method: "POST",
    body: JSON.stringify(exam),
  });
}

export async function updateExam(id: number, updates: Partial<Exam>): Promise<Exam> {
  return fetchApi<Exam>(`/api/exams/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteExam(id: number): Promise<void> {
  await fetchApi(`/api/exams/${id}`, { method: "DELETE" });
}

// Tasks API
export async function getTasks(): Promise<Task[]> {
  return fetchApi<Task[]>("/api/tasks");
}

export async function createTask(task: {
  title: string;
  description?: string | null;
  priority?: "critical" | "high" | "medium" | "low";
  status?: "pending" | "in_progress" | "completed";
  subjectId?: number | null;
  dueDate?: string | null;
  estimatedMinutes?: number | null;
  tags?: string[];
  order?: number;
  completedAt?: string | null;
}): Promise<Task> {
  return fetchApi<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export async function updateTask(id: number, updates: Partial<Task>): Promise<Task> {
  return fetchApi<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteTask(id: number): Promise<void> {
  await fetchApi(`/api/tasks/${id}`, { method: "DELETE" });
}

// Notes API
export async function getNotes(): Promise<{ ownNotes: Note[]; sharedNotes: Note[] }> {
  return fetchApi<{ ownNotes: Note[]; sharedNotes: Note[] }>("/api/notes");
}

export async function getNote(id: number): Promise<{ note: Note; shares: NoteShare[]; comments: NoteComment[] }> {
  return fetchApi<{ note: Note; shares: NoteShare[]; comments: NoteComment[] }>(`/api/notes/${id}`);
}

export async function createNote(note: { title: string; content?: string; subjectId?: number }): Promise<Note> {
  return fetchApi<Note>("/api/notes", {
    method: "POST",
    body: JSON.stringify(note),
  });
}

export async function updateNote(id: number, updates: Partial<Note>): Promise<Note> {
  return fetchApi<Note>(`/api/notes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteNote(id: number): Promise<void> {
  await fetchApi(`/api/notes/${id}`, { method: "DELETE" });
}

export async function shareNote(noteId: number, email: string, role: "viewer" | "commenter" | "editor"): Promise<NoteShare> {
  return fetchApi<NoteShare>(`/api/notes/${noteId}/share`, {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export async function updateNoteShare(shareId: number, updates: Partial<NoteShare>): Promise<NoteShare> {
  return fetchApi<NoteShare>(`/api/notes/shares/${shareId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteNoteShare(shareId: number): Promise<void> {
  await fetchApi(`/api/notes/shares/${shareId}`, { method: "DELETE" });
}

export async function addNoteComment(noteId: number, content: string): Promise<NoteComment> {
  return fetchApi<NoteComment>(`/api/notes/${noteId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

// Calendar API
export async function getCalendarEvents(start?: string, end?: string): Promise<{ ownEvents: CalendarEvent[]; sharedEvents: CalendarEvent[] }> {
  const params = new URLSearchParams();
  if (start) params.append("start", start);
  if (end) params.append("end", end);
  const query = params.toString() ? `?${params.toString()}` : "";
  return fetchApi<{ ownEvents: CalendarEvent[]; sharedEvents: CalendarEvent[] }>(`/api/calendar${query}`);
}

export async function createCalendarEvent(event: {
  title: string;
  description?: string | null;
  type?: "event" | "task" | "reminder";
  startTime: string;
  endTime?: string | null;
  allDay?: boolean;
  color?: string | null;
  subjectId?: number | null;
  googleEventId?: string | null;
  recurrence?: string | null;
  reminderMinutes?: number | null;
}): Promise<CalendarEvent> {
  return fetchApi<CalendarEvent>("/api/calendar", {
    method: "POST",
    body: JSON.stringify(event),
  });
}

export async function updateCalendarEvent(id: number, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
  return fetchApi<CalendarEvent>(`/api/calendar/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteCalendarEvent(id: number): Promise<void> {
  await fetchApi(`/api/calendar/${id}`, { method: "DELETE" });
}

export async function shareCalendarEvent(eventId: number, email: string): Promise<EventShare> {
  return fetchApi<EventShare>(`/api/calendar/${eventId}/share`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function updateEventShare(shareId: number, updates: Partial<EventShare>): Promise<EventShare> {
  return fetchApi<EventShare>(`/api/calendar/shares/${shareId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// Notifications API
export async function getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
  return fetchApi<{ notifications: Notification[]; unreadCount: number }>("/api/notifications");
}

export async function markNotificationRead(id: number): Promise<void> {
  await fetchApi(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetchApi("/api/notifications/read-all", { method: "POST" });
}

// Sticky Notes API
export async function getStickyNotes(): Promise<StickyNote[]> {
  return fetchApi<StickyNote[]>("/api/sticky-notes");
}

export async function createStickyNote(note: Omit<StickyNote, "id" | "userId" | "createdAt">): Promise<StickyNote> {
  return fetchApi<StickyNote>("/api/sticky-notes", {
    method: "POST",
    body: JSON.stringify(note),
  });
}

export async function updateStickyNote(id: number, updates: Partial<StickyNote>): Promise<StickyNote> {
  return fetchApi<StickyNote>(`/api/sticky-notes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteStickyNote(id: number): Promise<void> {
  await fetchApi(`/api/sticky-notes/${id}`, { method: "DELETE" });
}

// Flashcards API
export async function getFlashcards(): Promise<Flashcard[]> {
  return fetchApi<Flashcard[]>("/api/flashcards");
}

export async function createFlashcard(card: Omit<Flashcard, "id" | "userId" | "createdAt">): Promise<Flashcard> {
  return fetchApi<Flashcard>("/api/flashcards", {
    method: "POST",
    body: JSON.stringify(card),
  });
}

export async function updateFlashcard(id: number, updates: Partial<Flashcard>): Promise<Flashcard> {
  return fetchApi<Flashcard>(`/api/flashcards/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteFlashcard(id: number): Promise<void> {
  await fetchApi(`/api/flashcards/${id}`, { method: "DELETE" });
}

// Journal API
export async function getJournalEntries(): Promise<JournalEntry[]> {
  return fetchApi<JournalEntry[]>("/api/journal");
}

export async function createJournalEntry(entry: Omit<JournalEntry, "id" | "userId" | "createdAt">): Promise<JournalEntry> {
  return fetchApi<JournalEntry>("/api/journal", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

// Rewards API
export async function getRewards(): Promise<Reward[]> {
  return fetchApi<Reward[]>("/api/rewards");
}

export async function createReward(reward: Omit<Reward, "id" | "userId" | "createdAt">): Promise<Reward> {
  return fetchApi<Reward>("/api/rewards", {
    method: "POST",
    body: JSON.stringify(reward),
  });
}

export async function updateReward(id: number, updates: Partial<Reward>): Promise<Reward> {
  return fetchApi<Reward>(`/api/rewards/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// AI API
export async function getAIMessages(): Promise<AIMessage[]> {
  return fetchApi<AIMessage[]>("/api/ai/messages");
}

export async function sendAIMessage(message: string): Promise<{ message: string }> {
  return fetchApi<{ message: string }>("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function clearAIMessages(): Promise<void> {
  await fetchApi("/api/ai/messages", { method: "DELETE" });
}

// Reminders API
export async function getReminders(): Promise<Reminder[]> {
  return fetchApi<Reminder[]>("/api/reminders");
}

export async function createReminder(reminder: Omit<Reminder, "id" | "userId" | "createdAt">): Promise<Reminder> {
  return fetchApi<Reminder>("/api/reminders", {
    method: "POST",
    body: JSON.stringify(reminder),
  });
}

export async function deleteReminder(id: number): Promise<void> {
  await fetchApi(`/api/reminders/${id}`, { method: "DELETE" });
}

// Settings API
export async function getPomodoroSettings(): Promise<PomodoroSettings> {
  return fetchApi<PomodoroSettings>("/api/settings/pomodoro");
}

export async function savePomodoroSettings(settings: Partial<PomodoroSettings>): Promise<PomodoroSettings> {
  return fetchApi<PomodoroSettings>("/api/settings/pomodoro", {
    method: "POST",
    body: JSON.stringify(settings),
  });
}

export async function getAppPreferences(): Promise<AppPreferences> {
  return fetchApi<AppPreferences>("/api/settings/preferences");
}

export async function saveAppPreferences(prefs: Partial<AppPreferences>): Promise<AppPreferences> {
  return fetchApi<AppPreferences>("/api/settings/preferences", {
    method: "POST",
    body: JSON.stringify(prefs),
  });
}

// Stats API
export async function getStats(): Promise<{
  dailyStreak: number;
  totalFocusMinutes: number;
  todayFocusMinutes: number;
  totalTasksCompleted: number;
  badges: string[];
}> {
  return fetchApi("/api/stats");
}

export async function updateFocusTime(minutes: number): Promise<void> {
  await fetchApi("/api/stats/focus", {
    method: "POST",
    body: JSON.stringify({ minutes }),
  });
}

export async function updateStreak(): Promise<{ streak: number; updated: boolean }> {
  return fetchApi("/api/stats/streak", { method: "POST" });
}
