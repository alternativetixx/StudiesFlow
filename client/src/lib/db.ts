import type { 
  User, Subject, Exam, Task, ScheduleBlock, StickyNote, 
  Flashcard, JournalEntry, Reward, Quiz, AIMessage, 
  UserStats, PomodoroSettings, AppPreferences,
  InsertSubject, InsertExam, InsertTask, InsertScheduleBlock,
  InsertStickyNote, InsertFlashcard, InsertJournalEntry,
  InsertReward, InsertQuiz, InsertAIMessage
} from "@shared/schema";

const DB_NAME = "studyflow_db";
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains("users")) {
        database.createObjectStore("users", { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains("subjects")) {
        const store = database.createObjectStore("subjects", { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }
      if (!database.objectStoreNames.contains("exams")) {
        const store = database.createObjectStore("exams", { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }
      if (!database.objectStoreNames.contains("tasks")) {
        const store = database.createObjectStore("tasks", { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }
      if (!database.objectStoreNames.contains("scheduleBlocks")) {
        const store = database.createObjectStore("scheduleBlocks", { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }
      if (!database.objectStoreNames.contains("stickyNotes")) {
        const store = database.createObjectStore("stickyNotes", { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }
      if (!database.objectStoreNames.contains("flashcards")) {
        const store = database.createObjectStore("flashcards", { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }
      if (!database.objectStoreNames.contains("journalEntries")) {
        const store = database.createObjectStore("journalEntries", { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }
      if (!database.objectStoreNames.contains("rewards")) {
        const store = database.createObjectStore("rewards", { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }
      if (!database.objectStoreNames.contains("quizzes")) {
        const store = database.createObjectStore("quizzes", { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }
      if (!database.objectStoreNames.contains("aiMessages")) {
        const store = database.createObjectStore("aiMessages", { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
      }
      if (!database.objectStoreNames.contains("userStats")) {
        database.createObjectStore("userStats", { keyPath: "userId" });
      }
      if (!database.objectStoreNames.contains("pomodoroSettings")) {
        database.createObjectStore("pomodoroSettings", { keyPath: "userId" });
      }
      if (!database.objectStoreNames.contains("appPreferences")) {
        database.createObjectStore("appPreferences", { keyPath: "userId" });
      }
    };
  });
}

function generateId(): string {
  return crypto.randomUUID();
}

async function getStore(storeName: string, mode: IDBTransactionMode = "readonly") {
  const database = await initDB();
  const transaction = database.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

async function getAllFromStore<T>(storeName: string, userId: string): Promise<T[]> {
  const store = await getStore(storeName);
  const index = store.index("userId");
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(userId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getFromStore<T>(storeName: string, id: string): Promise<T | undefined> {
  const store = await getStore(storeName);
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addToStore<T extends { id: string }>(storeName: string, item: T): Promise<T> {
  const store = await getStore(storeName, "readwrite");
  
  return new Promise((resolve, reject) => {
    const request = store.add(item);
    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

async function updateInStore<T>(storeName: string, item: T): Promise<T> {
  const store = await getStore(storeName, "readwrite");
  
  return new Promise((resolve, reject) => {
    const request = store.put(item);
    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const store = await getStore(storeName, "readwrite");
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// User operations
export async function getUser(id: string): Promise<User | undefined> {
  return getFromStore<User>("users", id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const database = await initDB();
  const transaction = database.transaction("users", "readonly");
  const store = transaction.objectStore("users");
  
  return new Promise((resolve, reject) => {
    const request = store.openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        if (cursor.value.email === email) {
          resolve(cursor.value);
        } else {
          cursor.continue();
        }
      } else {
        resolve(undefined);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
  const newUser: User = {
    ...user,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  return addToStore("users", newUser);
}

export async function updateUser(user: User): Promise<User> {
  return updateInStore("users", user);
}

export async function deleteUser(id: string): Promise<void> {
  return deleteFromStore("users", id);
}

// Subject operations
export async function getSubjects(userId: string): Promise<Subject[]> {
  return getAllFromStore<Subject>("subjects", userId);
}

export async function createSubject(subject: InsertSubject): Promise<Subject> {
  const newSubject: Subject = { ...subject, id: generateId() };
  return addToStore("subjects", newSubject);
}

export async function updateSubject(subject: Subject): Promise<Subject> {
  return updateInStore("subjects", subject);
}

export async function deleteSubject(id: string): Promise<void> {
  return deleteFromStore("subjects", id);
}

// Exam operations
export async function getExams(userId: string): Promise<Exam[]> {
  return getAllFromStore<Exam>("exams", userId);
}

export async function createExam(exam: InsertExam): Promise<Exam> {
  const newExam: Exam = { ...exam, id: generateId() };
  return addToStore("exams", newExam);
}

export async function updateExam(exam: Exam): Promise<Exam> {
  return updateInStore("exams", exam);
}

export async function deleteExam(id: string): Promise<void> {
  return deleteFromStore("exams", id);
}

// Task operations
export async function getTasks(userId: string): Promise<Task[]> {
  return getAllFromStore<Task>("tasks", userId);
}

export async function createTask(task: InsertTask): Promise<Task> {
  const newTask: Task = { ...task, id: generateId() };
  return addToStore("tasks", newTask);
}

export async function updateTask(task: Task): Promise<Task> {
  return updateInStore("tasks", task);
}

export async function deleteTask(id: string): Promise<void> {
  return deleteFromStore("tasks", id);
}

// Schedule block operations
export async function getScheduleBlocks(userId: string): Promise<ScheduleBlock[]> {
  return getAllFromStore<ScheduleBlock>("scheduleBlocks", userId);
}

export async function createScheduleBlock(block: InsertScheduleBlock): Promise<ScheduleBlock> {
  const newBlock: ScheduleBlock = { ...block, id: generateId() };
  return addToStore("scheduleBlocks", newBlock);
}

export async function updateScheduleBlock(block: ScheduleBlock): Promise<ScheduleBlock> {
  return updateInStore("scheduleBlocks", block);
}

export async function deleteScheduleBlock(id: string): Promise<void> {
  return deleteFromStore("scheduleBlocks", id);
}

// Sticky note operations
export async function getStickyNotes(userId: string): Promise<StickyNote[]> {
  return getAllFromStore<StickyNote>("stickyNotes", userId);
}

export async function createStickyNote(note: InsertStickyNote): Promise<StickyNote> {
  const newNote: StickyNote = { ...note, id: generateId() };
  return addToStore("stickyNotes", newNote);
}

export async function updateStickyNote(note: StickyNote): Promise<StickyNote> {
  return updateInStore("stickyNotes", note);
}

export async function deleteStickyNote(id: string): Promise<void> {
  return deleteFromStore("stickyNotes", id);
}

// Flashcard operations
export async function getFlashcards(userId: string): Promise<Flashcard[]> {
  return getAllFromStore<Flashcard>("flashcards", userId);
}

export async function createFlashcard(card: InsertFlashcard): Promise<Flashcard> {
  const newCard: Flashcard = { ...card, id: generateId() };
  return addToStore("flashcards", newCard);
}

export async function updateFlashcard(card: Flashcard): Promise<Flashcard> {
  return updateInStore("flashcards", card);
}

export async function deleteFlashcard(id: string): Promise<void> {
  return deleteFromStore("flashcards", id);
}

// Journal entry operations
export async function getJournalEntries(userId: string): Promise<JournalEntry[]> {
  return getAllFromStore<JournalEntry>("journalEntries", userId);
}

export async function createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
  const newEntry: JournalEntry = { ...entry, id: generateId() };
  return addToStore("journalEntries", newEntry);
}

export async function updateJournalEntry(entry: JournalEntry): Promise<JournalEntry> {
  return updateInStore("journalEntries", entry);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  return deleteFromStore("journalEntries", id);
}

// Reward operations
export async function getRewards(userId: string): Promise<Reward[]> {
  return getAllFromStore<Reward>("rewards", userId);
}

export async function createReward(reward: InsertReward): Promise<Reward> {
  const newReward: Reward = { ...reward, id: generateId() };
  return addToStore("rewards", newReward);
}

export async function updateReward(reward: Reward): Promise<Reward> {
  return updateInStore("rewards", reward);
}

export async function deleteReward(id: string): Promise<void> {
  return deleteFromStore("rewards", id);
}

// Quiz operations
export async function getQuizzes(userId: string): Promise<Quiz[]> {
  return getAllFromStore<Quiz>("quizzes", userId);
}

export async function createQuiz(quiz: InsertQuiz): Promise<Quiz> {
  const newQuiz: Quiz = { ...quiz, id: generateId() };
  return addToStore("quizzes", newQuiz);
}

export async function updateQuiz(quiz: Quiz): Promise<Quiz> {
  return updateInStore("quizzes", quiz);
}

export async function deleteQuiz(id: string): Promise<void> {
  return deleteFromStore("quizzes", id);
}

// AI Message operations
export async function getAIMessages(userId: string): Promise<AIMessage[]> {
  return getAllFromStore<AIMessage>("aiMessages", userId);
}

export async function createAIMessage(message: InsertAIMessage): Promise<AIMessage> {
  const newMessage: AIMessage = { ...message, id: generateId() };
  return addToStore("aiMessages", newMessage);
}

export async function clearAIMessages(userId: string): Promise<void> {
  const messages = await getAIMessages(userId);
  for (const message of messages) {
    await deleteFromStore("aiMessages", message.id);
  }
}

// User stats operations
export async function getUserStats(userId: string): Promise<UserStats | undefined> {
  return getFromStore<UserStats>("userStats", userId);
}

export async function saveUserStats(stats: UserStats): Promise<UserStats> {
  return updateInStore("userStats", stats);
}

export async function initUserStats(userId: string): Promise<UserStats> {
  const stats: UserStats = {
    userId,
    dailyStreak: 0,
    totalFocusMinutes: 0,
    todayFocusMinutes: 0,
    totalTasksCompleted: 0,
    aiMessagesToday: 0,
    badges: [],
  };
  return addToStore("userStats", stats);
}

// Pomodoro settings operations
export async function getPomodoroSettings(userId: string): Promise<PomodoroSettings | undefined> {
  return getFromStore<PomodoroSettings>("pomodoroSettings", userId);
}

export async function savePomodoroSettings(userId: string, settings: PomodoroSettings): Promise<PomodoroSettings> {
  return updateInStore("pomodoroSettings", { ...settings, userId });
}

export async function initPomodoroSettings(userId: string): Promise<PomodoroSettings> {
  const settings = {
    userId,
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartNext: true,
    soundEnabled: true,
    notificationsEnabled: true,
  };
  return addToStore("pomodoroSettings", settings);
}

// App preferences operations
export async function getAppPreferences(userId: string): Promise<AppPreferences | undefined> {
  return getFromStore<AppPreferences>("appPreferences", userId);
}

export async function saveAppPreferences(userId: string, prefs: AppPreferences): Promise<AppPreferences> {
  return updateInStore("appPreferences", { ...prefs, userId });
}

export async function initAppPreferences(userId: string): Promise<AppPreferences> {
  const prefs = {
    userId,
    theme: "light" as const,
    hasSeenTour: false,
    healthRemindersEnabled: true,
    focusMusicVolume: 50,
  };
  return addToStore("appPreferences", prefs);
}

// Clear all data for a user
export async function clearAllUserData(userId: string): Promise<void> {
  const stores = [
    "subjects", "exams", "tasks", "scheduleBlocks", "stickyNotes",
    "flashcards", "journalEntries", "rewards", "quizzes", "aiMessages"
  ];
  
  for (const storeName of stores) {
    const items = await getAllFromStore<{ id: string }>(storeName, userId);
    for (const item of items) {
      await deleteFromStore(storeName, item.id);
    }
  }
  
  await deleteFromStore("userStats", userId);
  await deleteFromStore("pomodoroSettings", userId);
  await deleteFromStore("appPreferences", userId);
  await deleteFromStore("users", userId);
}
