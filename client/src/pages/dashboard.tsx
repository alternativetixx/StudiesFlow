import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import * as api from "@/lib/api";
import { getQuoteOfDay, BADGES } from "@shared/schema";
import type { Subject, Exam, Task, StickyNote, Flashcard, JournalEntry, Reward, AIMessage, CalendarEvent, Note, NoteShare, Notification } from "@shared/schema";
import {
  BookOpen, Moon, Sun, Clock, Play, Pause, RotateCcw, Settings, Target, Calendar,
  Brain, MessageSquare, Send, Plus, Trash2, GripVertical, ChevronRight, ChevronDown,
  Flame, Trophy, Zap, AlertTriangle, CheckCircle, BarChart3, TrendingUp, Star,
  StickyNote as StickyNoteIcon, Layers, PenLine, Smile, Frown, Meh, Heart, Coffee,
  Volume2, VolumeX, Home, ListTodo, CalendarDays, LayoutGrid, Award, BookMarked,
  LogOut, User, Crown, ExternalLink, X, Sparkles, Timer, Focus, Music, Bell,
  Keyboard, HelpCircle, ChevronLeft, MoreVertical, Edit, Eye, EyeOff, RefreshCw,
  FileText, Share2, Users, MessageCircle, BellRing
} from "lucide-react";

const MOOD_OPTIONS = [
  { value: "great", label: "Great", icon: Star, color: "text-yellow-500" },
  { value: "good", label: "Good", icon: Smile, color: "text-green-500" },
  { value: "okay", label: "Okay", icon: Meh, color: "text-blue-500" },
  { value: "bad", label: "Bad", icon: Frown, color: "text-orange-500" },
  { value: "terrible", label: "Terrible", icon: Heart, color: "text-red-500" },
];

const PRIORITY_CONFIG = {
  critical: { label: "Critical", icon: Flame, color: "bg-red-500/10 text-red-500 border-red-500/20" },
  high: { label: "High", icon: Zap, color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  medium: { label: "Medium", icon: AlertTriangle, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  low: { label: "Low", icon: CheckCircle, color: "bg-green-500/10 text-green-500 border-green-500/20" },
};

const NOTE_COLORS = [
  "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#6366F1"
];

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "exams", label: "Exams", icon: Calendar },
  { id: "subjects", label: "Subjects", icon: BookMarked },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "sticky", label: "Sticky Notes", icon: StickyNoteIcon },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "rewards", label: "Rewards", icon: Award },
  { id: "journal", label: "Journal", icon: PenLine },
];

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user, logout, isLoading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  
  const [activeView, setActiveView] = useState("dashboard");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<Note[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [sharedEvents, setSharedEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({ dailyStreak: 0, totalFocusMinutes: 0, todayFocusMinutes: 0, totalTasksCompleted: 0, badges: [] as string[] });
  const [pomodoroSettings, setPomodoroSettings] = useState({ workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15 });
  
  const [timerMode, setTimerMode] = useState<"work" | "shortBreak" | "longBreak">("work");
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"critical" | "high" | "medium" | "low">("medium");
  const [newTaskSubject, setNewTaskSubject] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>();
  
  const [showAddStickyNote, setShowAddStickyNote] = useState(false);
  const [newStickyContent, setNewStickyContent] = useState("");
  const [newStickyColor, setNewStickyColor] = useState("#8B5CF6");
  
  const [showAddFlashcard, setShowAddFlashcard] = useState(false);
  const [newFlashcardFront, setNewFlashcardFront] = useState("");
  const [newFlashcardBack, setNewFlashcardBack] = useState("");
  const [newFlashcardSubject, setNewFlashcardSubject] = useState("");
  
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showFlashcardBack, setShowFlashcardBack] = useState(false);
  
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalMood, setJournalMood] = useState<"great" | "good" | "okay" | "bad" | "terrible">("okay");
  const [journalContent, setJournalContent] = useState("");
  
  const [showAddReward, setShowAddReward] = useState(false);
  const [newRewardName, setNewRewardName] = useState("");
  const [newRewardTarget, setNewRewardTarget] = useState(5);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteSubject, setNewNoteSubject] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteShares, setNoteShares] = useState<NoteShare[]>([]);
  const [showShareNote, setShowShareNote] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState<"viewer" | "commenter" | "editor">("viewer");
  
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState("#8B5CF6");
  const [newSubjectTopics, setNewSubjectTopics] = useState(0);
  
  const [showAddExam, setShowAddExam] = useState(false);
  const [newExamName, setNewExamName] = useState("");
  const [newExamDate, setNewExamDate] = useState<Date | undefined>();
  const [newExamSubject, setNewExamSubject] = useState("");
  const [newExamConfidence, setNewExamConfidence] = useState(50);
  
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventType, setNewEventType] = useState<"event" | "task" | "reminder">("event");
  const [newEventDate, setNewEventDate] = useState<Date | undefined>();
  const [newEventTime, setNewEventTime] = useState("09:00");
  const [newEventEndTime, setNewEventEndTime] = useState("10:00");
  const [newEventAllDay, setNewEventAllDay] = useState(false);
  const [newEventReminder, setNewEventReminder] = useState(15);
  const [shareEventEmail, setShareEventEmail] = useState("");
  const [showShareEvent, setShowShareEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const quote = getQuoteOfDay();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
      return;
    }
    if (user && !user.hasCompletedSetup) {
      setLocation("/setup");
      return;
    }
    if (user) {
      loadData();
      api.updateStreak();
    }
  }, [user, authLoading, setLocation]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [
        subjectsData, examsData, tasksData, stickyData, flashcardsData, 
        journalData, rewardsData, messagesData, notesData, calendarData,
        notificationsData, statsData, settingsData
      ] = await Promise.all([
        api.getSubjects(),
        api.getExams(),
        api.getTasks(),
        api.getStickyNotes(),
        api.getFlashcards(),
        api.getJournalEntries(),
        api.getRewards(),
        api.getAIMessages(),
        api.getNotes(),
        api.getCalendarEvents(),
        api.getNotifications(),
        api.getStats(),
        api.getPomodoroSettings(),
      ]);
      setSubjects(subjectsData);
      setExams(examsData);
      setTasks(tasksData);
      setStickyNotes(stickyData);
      setFlashcards(flashcardsData);
      setJournalEntries(journalData);
      setRewards(rewardsData);
      setAiMessages(messagesData);
      setNotes(notesData.ownNotes);
      setSharedNotes(notesData.sharedNotes);
      setCalendarEvents(calendarData.ownEvents);
      setSharedEvents(calendarData.sharedEvents);
      setNotifications(notificationsData.notifications);
      setUnreadCount(notificationsData.unreadCount);
      setStats(statsData);
      setPomodoroSettings(settingsData);
      setTimerSeconds(settingsData.workDuration * 60);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setTimeout(() => setTimerSeconds(s => s - 1), 1000);
    } else if (timerSeconds === 0) {
      handleTimerComplete();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerRunning, timerSeconds]);

  const handleTimerComplete = async () => {
    setTimerRunning(false);
    if (timerMode === "work") {
      setPomodoroCount(c => c + 1);
      await api.updateFocusTime(pomodoroSettings.workDuration);
      setStats(prev => ({
        ...prev,
        totalFocusMinutes: prev.totalFocusMinutes + pomodoroSettings.workDuration,
        todayFocusMinutes: prev.todayFocusMinutes + pomodoroSettings.workDuration
      }));
      toast({ title: "Pomodoro Complete!", description: "Great work! Take a break." });
      const nextMode = (pomodoroCount + 1) % 4 === 0 ? "longBreak" : "shortBreak";
      setTimerMode(nextMode);
      setTimerSeconds(nextMode === "longBreak" ? pomodoroSettings.longBreakDuration * 60 : pomodoroSettings.shortBreakDuration * 60);
    } else {
      toast({ title: "Break Over!", description: "Ready to focus again?" });
      setTimerMode("work");
      setTimerSeconds(pomodoroSettings.workDuration * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerProgress = () => {
    const total = timerMode === "work" 
      ? pomodoroSettings.workDuration * 60
      : timerMode === "shortBreak" ? pomodoroSettings.shortBreakDuration * 60 : pomodoroSettings.longBreakDuration * 60;
    return ((total - timerSeconds) / total) * 100;
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerMode("work");
    setTimerSeconds(pomodoroSettings.workDuration * 60);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const task = await api.createTask({
        title: newTaskTitle,
        priority: newTaskPriority,
        status: "pending",
        subjectId: newTaskSubject ? parseInt(newTaskSubject) : undefined,
        dueDate: newTaskDueDate?.toISOString(),
        tags: [],
        order: tasks.length,
      });
      setTasks([...tasks, task]);
      setNewTaskTitle("");
      setNewTaskPriority("medium");
      setNewTaskSubject("");
      setNewTaskDueDate(undefined);
      setShowAddTask(false);
      toast({ title: "Task added!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      const updated = await api.updateTask(task.id, { status: newStatus });
      setTasks(tasks.map(t => t.id === task.id ? updated : t));
      if (newStatus === "completed") {
        setStats(prev => ({ ...prev, totalTasksCompleted: prev.totalTasksCompleted + 1 }));
        toast({ title: "Task completed!" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await api.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      toast({ title: "Task deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      const subject = await api.createSubject({
        name: newSubjectName,
        color: newSubjectColor,
        totalTopics: newSubjectTopics,
        coveredTopics: 0,
        studyHours: 0,
      });
      setSubjects([...subjects, subject]);
      setNewSubjectName("");
      setNewSubjectColor("#8B5CF6");
      setNewSubjectTopics(0);
      setShowAddSubject(false);
      toast({ title: "Subject added!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add subject", variant: "destructive" });
    }
  };

  const handleDeleteSubject = async (id: number) => {
    try {
      await api.deleteSubject(id);
      setSubjects(subjects.filter(s => s.id !== id));
      toast({ title: "Subject deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete subject", variant: "destructive" });
    }
  };

  const handleAddExam = async () => {
    if (!newExamName.trim() || !newExamDate) return;
    try {
      const exam = await api.createExam({
        name: newExamName,
        date: newExamDate.toISOString(),
        subjectId: newExamSubject ? parseInt(newExamSubject) : undefined,
        confidence: newExamConfidence,
        weight: 100,
      });
      setExams([...exams, exam]);
      setNewExamName("");
      setNewExamDate(undefined);
      setNewExamSubject("");
      setNewExamConfidence(50);
      setShowAddExam(false);
      toast({ title: "Exam added!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add exam", variant: "destructive" });
    }
  };

  const handleDeleteExam = async (id: number) => {
    try {
      await api.deleteExam(id);
      setExams(exams.filter(e => e.id !== id));
      toast({ title: "Exam deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete exam", variant: "destructive" });
    }
  };

  const handleAddNote = async () => {
    if (!newNoteTitle.trim()) return;
    try {
      const note = await api.createNote({
        title: newNoteTitle,
        content: newNoteContent,
        subjectId: newNoteSubject ? parseInt(newNoteSubject) : undefined,
      });
      setNotes([note, ...notes]);
      setNewNoteTitle("");
      setNewNoteContent("");
      setNewNoteSubject("");
      setShowAddNote(false);
      toast({ title: "Note created!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create note", variant: "destructive" });
    }
  };

  const handleUpdateNote = async (id: number, updates: Partial<Note>) => {
    try {
      const updated = await api.updateNote(id, updates);
      setNotes(notes.map(n => n.id === id ? updated : n));
      if (selectedNote?.id === id) setSelectedNote(updated);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update note", variant: "destructive" });
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await api.deleteNote(id);
      setNotes(notes.filter(n => n.id !== id));
      setSelectedNote(null);
      toast({ title: "Note deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
    }
  };

  const handleShareNote = async () => {
    if (!selectedNote || !shareEmail.trim()) return;
    try {
      const share = await api.shareNote(selectedNote.id, shareEmail, shareRole);
      setNoteShares([...noteShares, share]);
      setShareEmail("");
      toast({ title: "Note shared!", description: `Shared with ${shareEmail}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to share note", variant: "destructive" });
    }
  };

  const handleUpdateNoteShare = async (shareId: number, role: string) => {
    try {
      const updated = await api.updateNoteShare(shareId, { role: role as "viewer" | "commenter" | "editor" });
      setNoteShares(noteShares.map(s => s.id === shareId ? updated : s));
      toast({ title: "Access updated" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update access", variant: "destructive" });
    }
  };

  const handleRemoveNoteShare = async (shareId: number) => {
    try {
      await api.deleteNoteShare(shareId);
      setNoteShares(noteShares.filter(s => s.id !== shareId));
      toast({ title: "Access removed" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove access", variant: "destructive" });
    }
  };

  const loadNoteDetails = async (note: Note) => {
    try {
      const details = await api.getNote(note.id);
      setSelectedNote(details.note);
      setNoteShares(details.shares);
    } catch (error) {
      console.error("Failed to load note details:", error);
    }
  };

  const handleAddEvent = async () => {
    if (!newEventTitle.trim() || !newEventDate) return;
    try {
      const startTime = new Date(newEventDate);
      if (!newEventAllDay) {
        const [hours, mins] = newEventTime.split(":").map(Number);
        startTime.setHours(hours, mins, 0, 0);
      }
      
      let endTime: Date | undefined;
      if (!newEventAllDay) {
        endTime = new Date(newEventDate);
        const [endHours, endMins] = newEventEndTime.split(":").map(Number);
        endTime.setHours(endHours, endMins, 0, 0);
      }

      const event = await api.createCalendarEvent({
        title: newEventTitle,
        description: newEventDescription,
        type: newEventType,
        startTime: startTime.toISOString(),
        endTime: endTime?.toISOString(),
        allDay: newEventAllDay,
        reminderMinutes: newEventReminder > 0 ? newEventReminder : undefined,
      });
      setCalendarEvents([...calendarEvents, event]);
      setNewEventTitle("");
      setNewEventDescription("");
      setNewEventType("event");
      setNewEventDate(undefined);
      setNewEventTime("09:00");
      setNewEventEndTime("10:00");
      setNewEventAllDay(false);
      setNewEventReminder(15);
      setShowAddEvent(false);
      toast({ title: "Event added!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add event", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await api.deleteCalendarEvent(id);
      setCalendarEvents(calendarEvents.filter(e => e.id !== id));
      setSelectedEvent(null);
      toast({ title: "Event deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete event", variant: "destructive" });
    }
  };

  const handleShareEvent = async () => {
    if (!selectedEvent || !shareEventEmail.trim()) return;
    try {
      await api.shareCalendarEvent(selectedEvent.id, shareEventEmail);
      setShareEventEmail("");
      setShowShareEvent(false);
      toast({ title: "Event shared!", description: `Invitation sent to ${shareEventEmail}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to share event", variant: "destructive" });
    }
  };

  const handleSendAIMessage = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    const userMsg = aiInput;
    setAiInput("");
    
    try {
      const tempUserMessage: AIMessage = {
        id: Date.now(),
        userId: user!.id,
        role: "user",
        content: userMsg,
        createdAt: new Date(),
      };
      setAiMessages(prev => [...prev, tempUserMessage]);

      const response = await api.sendAIMessage(userMsg);
      
      const assistantMessage: AIMessage = {
        id: Date.now() + 1,
        userId: user!.id,
        role: "assistant",
        content: response.message,
        createdAt: new Date(),
      };
      setAiMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const fallbackMessage: AIMessage = {
        id: Date.now() + 1,
        userId: user!.id,
        role: "assistant",
        content: "I'm your AI study assistant! I can help you understand concepts, generate quiz questions, create study plans, and more. What would you like to learn about today?",
        createdAt: new Date(),
      };
      setAiMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setAiLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handleAddStickyNote = async () => {
    if (!newStickyContent.trim()) return;
    try {
      const note = await api.createStickyNote({
        content: newStickyContent,
        color: newStickyColor,
        x: Math.random() * 200,
        y: Math.random() * 200,
        width: 200,
        height: 200,
      });
      setStickyNotes([...stickyNotes, note]);
      setNewStickyContent("");
      setShowAddStickyNote(false);
      toast({ title: "Note added!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add note", variant: "destructive" });
    }
  };

  const handleDeleteStickyNote = async (noteId: number) => {
    try {
      await api.deleteStickyNote(noteId);
      setStickyNotes(stickyNotes.filter(n => n.id !== noteId));
      toast({ title: "Note deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
    }
  };

  const handleAddFlashcard = async () => {
    if (!newFlashcardFront.trim() || !newFlashcardBack.trim()) return;
    try {
      const card = await api.createFlashcard({
        front: newFlashcardFront,
        back: newFlashcardBack,
        subjectId: newFlashcardSubject ? parseInt(newFlashcardSubject) : undefined,
        box: 1,
        nextReviewDate: new Date().toISOString(),
      });
      setFlashcards([...flashcards, card]);
      setNewFlashcardFront("");
      setNewFlashcardBack("");
      setNewFlashcardSubject("");
      setShowAddFlashcard(false);
      toast({ title: "Flashcard added!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add flashcard", variant: "destructive" });
    }
  };

  const handleFlashcardResponse = async (correct: boolean) => {
    const card = flashcards[currentFlashcardIndex];
    if (!card) return;
    try {
      const newBox = correct ? Math.min(card.box + 1, 5) : 1;
      const daysUntilReview = Math.pow(2, newBox - 1);
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + daysUntilReview);
      await api.updateFlashcard(card.id, {
        box: newBox,
        lastReviewDate: new Date().toISOString(),
        nextReviewDate: nextDate.toISOString(),
      });
      setShowFlashcardBack(false);
      if (currentFlashcardIndex < flashcards.length - 1) {
        setCurrentFlashcardIndex(i => i + 1);
      } else {
        setCurrentFlashcardIndex(0);
        toast({ title: "Review complete!", description: "You've reviewed all cards." });
      }
      loadData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update flashcard", variant: "destructive" });
    }
  };

  const handleAddJournalEntry = async () => {
    if (!journalContent.trim()) return;
    try {
      const entry = await api.createJournalEntry({
        date: new Date().toISOString().split("T")[0],
        mood: journalMood,
        content: journalContent,
      });
      setJournalEntries([entry, ...journalEntries]);
      setJournalContent("");
      setJournalMood("okay");
      setShowJournalModal(false);
      toast({ title: "Journal entry saved!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save journal", variant: "destructive" });
    }
  };

  const handleAddReward = async () => {
    if (!newRewardName.trim()) return;
    try {
      const reward = await api.createReward({
        targetTasks: newRewardTarget,
        reward: newRewardName,
        currentProgress: 0,
        isCompleted: false,
      });
      setRewards([...rewards, reward]);
      setNewRewardName("");
      setNewRewardTarget(5);
      setShowAddReward(false);
      toast({ title: "Reward added!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add reward", variant: "destructive" });
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const getUpcomingExams = () => {
    const now = new Date();
    return exams
      .filter(e => new Date(e.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  };

  const getDaysUntil = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return [...calendarEvents, ...sharedEvents].filter(e => {
      const eventDate = new Date(e.startTime).toISOString().split("T")[0];
      return eventDate === dateStr;
    });
  };

  const pendingTasks = tasks.filter(t => t.status !== "completed");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const todayTasks = pendingTasks.filter(t => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate).toDateString() === new Date().toDateString();
  });

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  } as React.CSSProperties;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full bg-background">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg gradient-text">StudyFlow</p>
                <p className="text-xs text-muted-foreground truncate">{user?.name}</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveView(item.id)}
                        data-active={activeView === item.id}
                        data-testid={`nav-${item.id}`}
                        className="data-[active=true]:bg-sidebar-accent"
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
              <SidebarGroupContent className="px-2 space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-sidebar-accent/50">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Streak</span>
                  </div>
                  <span className="font-bold">{stats.dailyStreak}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-sidebar-accent/50">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm">Focus Today</span>
                  </div>
                  <span className="font-bold">{stats.todayFocusMinutes}m</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-sidebar-accent/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Tasks Done</span>
                  </div>
                  <span className="font-bold">{stats.totalTasksCompleted}</span>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 space-y-2">
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setShowSettings(true)} data-testid="button-settings">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground" onClick={handleLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4" />
              Log Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-xl font-bold capitalize">{activeView === "sticky" ? "Sticky Notes" : activeView}</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {quote.quote.slice(0, 60)}...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={showNotifications} onOpenChange={setShowNotifications}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-64">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No notifications</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.slice(0, 10).map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-2 rounded-lg cursor-pointer hover-elevate ${!notif.isRead ? "bg-primary/5" : ""}`}
                            onClick={() => handleMarkNotificationRead(notif.id)}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`w-2 h-2 rounded-full mt-2 ${!notif.isRead ? "bg-primary" : "bg-muted"}`} />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{notif.title}</p>
                                <p className="text-xs text-muted-foreground">{notif.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="default" size="icon" onClick={() => setShowAIChat(true)} data-testid="button-ai-chat">
                <Sparkles className="w-5 h-5" />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            {activeView === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                          <Flame className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold">{stats.dailyStreak}</p>
                          <p className="text-sm text-muted-foreground">Day Streak</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold">{stats.todayFocusMinutes}</p>
                          <p className="text-sm text-muted-foreground">Focus Today (min)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold">{stats.totalTasksCompleted}</p>
                          <p className="text-sm text-muted-foreground">Tasks Done</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-chart-3" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold">{stats.badges?.length || 0}</p>
                          <p className="text-sm text-muted-foreground">Badges</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between gap-2">
                      <CardTitle>Pomodoro Timer</CardTitle>
                      <div className="flex gap-1">
                        {["work", "shortBreak", "longBreak"].map((mode) => (
                          <Button
                            key={mode}
                            variant={timerMode === mode ? "default" : "ghost"}
                            size="sm"
                            onClick={() => {
                              setTimerMode(mode as any);
                              setTimerRunning(false);
                              setTimerSeconds(
                                mode === "work" ? pomodoroSettings.workDuration * 60 :
                                mode === "shortBreak" ? pomodoroSettings.shortBreakDuration * 60 :
                                pomodoroSettings.longBreakDuration * 60
                              );
                            }}
                          >
                            {mode === "work" ? "Focus" : mode === "shortBreak" ? "Short" : "Long"}
                          </Button>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center">
                        <div className="relative w-48 h-48 mb-6">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                            <circle
                              cx="96" cy="96" r="88"
                              stroke="currentColor" strokeWidth="8" fill="none"
                              className="text-primary"
                              strokeDasharray={553}
                              strokeDashoffset={553 - (553 * getTimerProgress()) / 100}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold">{formatTime(timerSeconds)}</span>
                            <span className="text-sm text-muted-foreground capitalize">{timerMode === "shortBreak" ? "Short Break" : timerMode === "longBreak" ? "Long Break" : "Focus"}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="lg" onClick={() => setTimerRunning(!timerRunning)} data-testid="button-timer-toggle">
                            {timerRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                            {timerRunning ? "Pause" : "Start"}
                          </Button>
                          <Button variant="outline" size="lg" onClick={resetTimer} data-testid="button-timer-reset">
                            <RotateCcw className="w-5 h-5" />
                          </Button>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                          Pomodoros completed today: {pomodoroCount}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Exams</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {getUpcomingExams().map((exam) => {
                        const subject = subjects.find(s => s.id === exam.subjectId);
                        const daysLeft = getDaysUntil(exam.date);
                        return (
                          <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              {subject && (
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                              )}
                              <div>
                                <p className="font-medium">{exam.name}</p>
                                <p className="text-xs text-muted-foreground">{subject?.name}</p>
                              </div>
                            </div>
                            <Badge variant={daysLeft <= 3 ? "destructive" : daysLeft <= 7 ? "secondary" : "outline"}>
                              {daysLeft} days
                            </Badge>
                          </div>
                        );
                      })}
                      {exams.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No upcoming exams</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2">
                      <CardTitle>Today's Tasks</CardTitle>
                      <Button size="sm" onClick={() => setShowAddTask(true)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {todayTasks.slice(0, 5).map((task) => {
                          const config = PRIORITY_CONFIG[task.priority];
                          const PriorityIcon = config.icon;
                          return (
                            <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover-elevate">
                              <Checkbox
                                checked={task.status === "completed"}
                                onCheckedChange={() => handleToggleTask(task)}
                              />
                              <div className="flex-1">
                                <p className={`text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                  {task.title}
                                </p>
                              </div>
                              <Badge variant="outline" className={config.color}>
                                <PriorityIcon className="w-3 h-3" />
                              </Badge>
                            </div>
                          );
                        })}
                        {todayTasks.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No tasks due today</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => setShowAddTask(true)}>
                        <ListTodo className="w-5 h-5" />
                        <span className="text-xs">Add Task</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => setShowAddEvent(true)}>
                        <CalendarDays className="w-5 h-5" />
                        <span className="text-xs">Add Event</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => setShowAddNote(true)}>
                        <FileText className="w-5 h-5" />
                        <span className="text-xs">New Note</span>
                      </Button>
                      <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => setShowAIChat(true)}>
                        <Sparkles className="w-5 h-5" />
                        <span className="text-xs">Ask AI</span>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeView === "tasks" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Task Manager</h2>
                  <Button onClick={() => setShowAddTask(true)} className="gap-2" data-testid="button-add-task">
                    <Plus className="w-4 h-4" />
                    Add Task
                  </Button>
                </div>

                <Tabs defaultValue="pending">
                  <TabsList>
                    <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pending" className="mt-4">
                    <div className="space-y-2">
                      {pendingTasks.map((task) => {
                        const config = PRIORITY_CONFIG[task.priority];
                        const PriorityIcon = config.icon;
                        const subject = subjects.find(s => s.id === task.subjectId);
                        return (
                          <Card key={task.id} className="hover-elevate">
                            <CardContent className="p-4 flex items-center gap-4">
                              <Checkbox
                                checked={false}
                                onCheckedChange={() => handleToggleTask(task)}
                                data-testid={`checkbox-task-${task.id}`}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {subject && (
                                    <Badge variant="outline" style={{ borderColor: subject.color, color: subject.color }}>
                                      {subject.name}
                                    </Badge>
                                  )}
                                  {task.dueDate && (
                                    <span className="text-xs text-muted-foreground">
                                      Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline" className={config.color}>
                                <PriorityIcon className="w-3 h-3 mr-1" />
                                {config.label}
                              </Badge>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {pendingTasks.length === 0 && (
                        <Card>
                          <CardContent className="p-12 text-center">
                            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
                            <p className="text-lg font-medium">All caught up!</p>
                            <p className="text-muted-foreground">No pending tasks</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="completed" className="mt-4">
                    <div className="space-y-2">
                      {completedTasks.map((task) => (
                        <Card key={task.id} className="opacity-60">
                          <CardContent className="p-4 flex items-center gap-4">
                            <Checkbox checked={true} onCheckedChange={() => handleToggleTask(task)} />
                            <div className="flex-1">
                              <p className="font-medium line-through text-muted-foreground">{task.title}</p>
                              {task.completedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Completed: {new Date(task.completedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeView === "calendar" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Calendar</h2>
                  <Button onClick={() => setShowAddEvent(true)} className="gap-2" data-testid="button-add-event">
                    <Plus className="w-4 h-4" />
                    Add Event
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardContent className="p-4">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        className="w-full"
                        modifiers={{
                          hasEvents: (date) => getEventsForDate(date).length > 0
                        }}
                        modifiersClassNames={{
                          hasEvents: "bg-primary/20 font-bold"
                        }}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Events for {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {getEventsForDate(selectedDate).map((event) => (
                            <div
                              key={event.id}
                              className="p-3 rounded-lg bg-muted/50 hover-elevate cursor-pointer"
                              onClick={() => setSelectedEvent(event)}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color || "#8B5CF6" }} />
                                  <span className="font-medium">{event.title}</span>
                                </div>
                                <Badge variant="outline">{event.type}</Badge>
                              </div>
                              {!event.allDay && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  {event.endTime && ` - ${new Date(event.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                                </p>
                              )}
                            </div>
                          ))}
                          {getEventsForDate(selectedDate).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No events for this day</p>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>All Upcoming Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...calendarEvents, ...sharedEvents]
                        .filter(e => new Date(e.startTime) >= new Date())
                        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                        .slice(0, 6)
                        .map((event) => (
                          <Card key={event.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedEvent(event)}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium">{event.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(event.startTime).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge variant="outline">{event.type}</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeView === "exams" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Exam Countdown Center</h2>
                  <Button onClick={() => setShowAddExam(true)} className="gap-2" data-testid="button-add-exam">
                    <Plus className="w-4 h-4" />
                    Add Exam
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exams.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((exam) => {
                    const subject = subjects.find(s => s.id === exam.subjectId);
                    const daysLeft = getDaysUntil(exam.date);
                    const isPast = daysLeft < 0;
                    return (
                      <Card key={exam.id} className={`hover-elevate ${isPast ? "opacity-60" : ""}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between gap-2">
                            {subject && (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }} />
                                <span className="text-sm text-muted-foreground">{subject.name}</span>
                              </div>
                            )}
                            <Badge variant={isPast ? "secondary" : daysLeft <= 7 ? "destructive" : "outline"}>
                              {isPast ? "Past" : `${daysLeft} days`}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{exam.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            {new Date(exam.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Confidence Level</span>
                              <span className="font-medium">{exam.confidence}%</span>
                            </div>
                            <Progress value={exam.confidence} className="h-2" />
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteExam(exam.id)}>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                  {exams.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="p-12 text-center">
                        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No exams scheduled</p>
                        <p className="text-muted-foreground mb-4">Add your upcoming exams to track them</p>
                        <Button onClick={() => setShowAddExam(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Exam
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {activeView === "subjects" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Subject Overview</h2>
                  <Button onClick={() => setShowAddSubject(true)} className="gap-2" data-testid="button-add-subject">
                    <Plus className="w-4 h-4" />
                    Add Subject
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjects.map((subject) => {
                    const subjectExams = exams.filter(e => e.subjectId === subject.id);
                    const subjectTasks = tasks.filter(t => t.subjectId === subject.id);
                    const progress = subject.totalTopics > 0 
                      ? Math.round((subject.coveredTopics / subject.totalTopics) * 100) 
                      : 0;
                    return (
                      <Card key={subject.id} className="hover-elevate">
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: subject.color + "20" }}>
                              <BookMarked className="w-6 h-6" style={{ color: subject.color }} />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{subject.name}</CardTitle>
                              <CardDescription>{subject.studyHours}h total study time</CardDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSubject(subject.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Topic Progress</span>
                              <span>{subject.coveredTopics}/{subject.totalTopics}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{subjectExams.length} exams</span>
                            <span>{subjectTasks.length} tasks</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {subjects.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="p-12 text-center">
                        <BookMarked className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No subjects added</p>
                        <p className="text-muted-foreground mb-4">Add your subjects to track your progress</p>
                        <Button onClick={() => setShowAddSubject(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Subject
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {activeView === "notes" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Notes</h2>
                  <Button onClick={() => setShowAddNote(true)} className="gap-2" data-testid="button-add-note">
                    <Plus className="w-4 h-4" />
                    New Note
                  </Button>
                </div>

                <Tabs defaultValue="my-notes">
                  <TabsList>
                    <TabsTrigger value="my-notes">My Notes ({notes.length})</TabsTrigger>
                    <TabsTrigger value="shared">Shared with Me ({sharedNotes.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="my-notes" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {notes.map((note) => {
                        const subject = subjects.find(s => s.id === note.subjectId);
                        return (
                          <Card key={note.id} className="hover-elevate cursor-pointer" onClick={() => loadNoteDetails(note)}>
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-base truncate">{note.title}</CardTitle>
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                              {subject && (
                                <Badge variant="outline" style={{ borderColor: subject.color }}>
                                  {subject.name}
                                </Badge>
                              )}
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {note.content || "No content yet..."}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Updated: {new Date(note.updatedAt).toLocaleDateString()}
                              </p>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {notes.length === 0 && (
                        <Card className="col-span-full">
                          <CardContent className="p-12 text-center">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No notes yet</p>
                            <p className="text-muted-foreground mb-4">Create your first note to get started</p>
                            <Button onClick={() => setShowAddNote(true)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Create Note
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="shared" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sharedNotes.map((note) => (
                        <Card key={note.id} className="hover-elevate cursor-pointer" onClick={() => loadNoteDetails(note)}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between gap-2">
                              <CardTitle className="text-base truncate">{note.title}</CardTitle>
                              <Badge variant="secondary">
                                <Users className="w-3 h-3 mr-1" />
                                Shared
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {note.content || "No content..."}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                      {sharedNotes.length === 0 && (
                        <Card className="col-span-full">
                          <CardContent className="p-12 text-center">
                            <Share2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No shared notes</p>
                            <p className="text-muted-foreground">Notes shared with you will appear here</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {activeView === "flashcards" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Flashcards</h2>
                  <Button onClick={() => setShowAddFlashcard(true)} className="gap-2" data-testid="button-add-flashcard">
                    <Plus className="w-4 h-4" />
                    Add Card
                  </Button>
                </div>

                {flashcards.length > 0 ? (
                  <div className="max-w-lg mx-auto">
                    <Card className="min-h-[300px] cursor-pointer" onClick={() => setShowFlashcardBack(!showFlashcardBack)}>
                      <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                        <p className="text-xs text-muted-foreground mb-4">
                          Card {currentFlashcardIndex + 1} of {flashcards.length} - Click to flip
                        </p>
                        <p className="text-xl font-medium text-center">
                          {showFlashcardBack ? flashcards[currentFlashcardIndex]?.back : flashcards[currentFlashcardIndex]?.front}
                        </p>
                        <Badge variant="outline" className="mt-4">
                          {showFlashcardBack ? "Answer" : "Question"}
                        </Badge>
                      </CardContent>
                    </Card>
                    {showFlashcardBack && (
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <Button variant="destructive" onClick={() => handleFlashcardResponse(false)} data-testid="button-flashcard-wrong">
                          <X className="w-4 h-4 mr-2" />
                          Wrong
                        </Button>
                        <Button variant="default" onClick={() => handleFlashcardResponse(true)} data-testid="button-flashcard-correct">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Correct
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentFlashcardIndex === 0}
                        onClick={() => { setCurrentFlashcardIndex(i => i - 1); setShowFlashcardBack(false); }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {currentFlashcardIndex + 1} / {flashcards.length}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={currentFlashcardIndex === flashcards.length - 1}
                        onClick={() => { setCurrentFlashcardIndex(i => i + 1); setShowFlashcardBack(false); }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No flashcards yet</p>
                      <p className="text-muted-foreground mb-4">Create your first flashcard to start reviewing</p>
                      <Button onClick={() => setShowAddFlashcard(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Flashcard
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeView === "sticky" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Sticky Notes</h2>
                  <Button onClick={() => setShowAddStickyNote(true)} className="gap-2" data-testid="button-add-sticky">
                    <Plus className="w-4 h-4" />
                    Add Note
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {stickyNotes.map((note) => (
                    <Card
                      key={note.id}
                      className="relative group"
                      style={{ backgroundColor: note.color + "20", borderColor: note.color + "40" }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteStickyNote(note.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      <CardContent className="p-4 pt-8">
                        <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                  {stickyNotes.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="p-12 text-center">
                        <StickyNoteIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No sticky notes</p>
                        <p className="text-muted-foreground mb-4">Add quick notes and reminders</p>
                        <Button onClick={() => setShowAddStickyNote(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Note
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {activeView === "analytics" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Analytics & Progress</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Clock className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold">{stats.totalFocusMinutes}</p>
                          <p className="text-sm text-muted-foreground">Total Focus Minutes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold">{stats.totalTasksCompleted}</p>
                          <p className="text-sm text-muted-foreground">Tasks Completed</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                          <Flame className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold">{stats.dailyStreak}</p>
                          <p className="text-sm text-muted-foreground">Day Streak</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-chart-3" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold">{stats.badges?.length || 0}</p>
                          <p className="text-sm text-muted-foreground">Badges Earned</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Badges Collection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {Object.values(BADGES).map((badge) => {
                        const earned = stats.badges?.includes(badge.id);
                        return (
                          <div
                            key={badge.id}
                            className={`p-4 rounded-lg border text-center transition-all ${
                              earned ? "bg-primary/10 border-primary" : "bg-muted/50 opacity-50"
                            }`}
                          >
                            <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                              earned ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}>
                              <Trophy className="w-6 h-6" />
                            </div>
                            <p className="font-medium text-sm">{badge.name}</p>
                            <p className="text-xs text-muted-foreground">{badge.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeView === "rewards" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Rewards Tracker</h2>
                  <Button onClick={() => setShowAddReward(true)} className="gap-2" data-testid="button-add-reward">
                    <Plus className="w-4 h-4" />
                    Add Reward
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rewards.map((reward) => (
                    <Card key={reward.id} className={reward.isCompleted ? "border-green-500/50" : ""}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              reward.isCompleted ? "bg-green-500 text-white" : "bg-primary/10"
                            }`}>
                              {reward.isCompleted ? <CheckCircle className="w-5 h-5" /> : <Star className="w-5 h-5 text-primary" />}
                            </div>
                            <div>
                              <p className="font-medium">{reward.reward}</p>
                              <p className="text-sm text-muted-foreground">
                                {reward.currentProgress}/{reward.targetTasks} tasks
                              </p>
                            </div>
                          </div>
                          {reward.isCompleted && <Badge variant="secondary">Unlocked!</Badge>}
                        </div>
                        <Progress value={(reward.currentProgress / reward.targetTasks) * 100} className="h-2" />
                      </CardContent>
                    </Card>
                  ))}
                  {rewards.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="p-12 text-center">
                        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No rewards set</p>
                        <p className="text-muted-foreground mb-4">Set rewards to motivate yourself!</p>
                        <Button onClick={() => setShowAddReward(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Reward
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {activeView === "journal" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Study Journal</h2>
                  <Button onClick={() => setShowJournalModal(true)} className="gap-2" data-testid="button-add-journal">
                    <Plus className="w-4 h-4" />
                    New Entry
                  </Button>
                </div>

                <div className="space-y-4">
                  {journalEntries.map((entry) => {
                    const moodConfig = MOOD_OPTIONS.find(m => m.value === entry.mood);
                    const MoodIcon = moodConfig?.icon || Meh;
                    return (
                      <Card key={entry.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <MoodIcon className={`w-6 h-6 ${moodConfig?.color}`} />
                              <div>
                                <p className="font-medium capitalize">{entry.mood}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(entry.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                                </p>
                              </div>
                            </div>
                          </div>
                          <p className="text-muted-foreground whitespace-pre-wrap">{entry.content}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {journalEntries.length === 0 && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <PenLine className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No journal entries</p>
                        <p className="text-muted-foreground mb-4">Track your mood and reflections</p>
                        <Button onClick={() => setShowJournalModal(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Write Entry
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>

        <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
          <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                StudyFlow AI Assistant
              </DialogTitle>
              <DialogDescription>
                Ask me anything about your studies! I have access to your subjects, tasks, calendar, and more.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {aiMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
            <div className="flex gap-2 pt-4 border-t">
              <Input
                placeholder="Ask about your studies..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendAIMessage()}
                disabled={aiLoading}
                data-testid="input-ai-message"
              />
              <Button onClick={handleSendAIMessage} disabled={aiLoading || !aiInput.trim()} data-testid="button-send-ai">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                data-testid="input-task-title"
              />
              <Select value={newTaskPriority} onValueChange={(v: any) => setNewTaskPriority(v)}>
                <SelectTrigger data-testid="select-task-priority">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newTaskSubject} onValueChange={setNewTaskSubject}>
                <SelectTrigger data-testid="select-task-subject">
                  <SelectValue placeholder="Subject (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    {newTaskDueDate ? newTaskDueDate.toLocaleDateString() : "Due date (optional)"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={newTaskDueDate} onSelect={setNewTaskDueDate} />
                </PopoverContent>
              </Popover>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
              <Button onClick={handleAddTask} data-testid="button-submit-task">Add Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Subject name"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                data-testid="input-subject-name"
              />
              <div className="space-y-2">
                <label className="text-sm">Color</label>
                <div className="flex gap-2">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${newSubjectColor === color ? "border-foreground" : "border-transparent"}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewSubjectColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm">Total Topics</label>
                <Input
                  type="number"
                  min={0}
                  value={newSubjectTopics}
                  onChange={(e) => setNewSubjectTopics(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddSubject(false)}>Cancel</Button>
              <Button onClick={handleAddSubject} data-testid="button-submit-subject">Add Subject</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddExam} onOpenChange={setShowAddExam}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Exam</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Exam name"
                value={newExamName}
                onChange={(e) => setNewExamName(e.target.value)}
                data-testid="input-exam-name"
              />
              <Select value={newExamSubject} onValueChange={setNewExamSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Subject (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    {newExamDate ? newExamDate.toLocaleDateString() : "Select exam date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={newExamDate} onSelect={setNewExamDate} />
                </PopoverContent>
              </Popover>
              <div className="space-y-2">
                <label className="text-sm">Confidence Level: {newExamConfidence}%</label>
                <Slider
                  value={[newExamConfidence]}
                  onValueChange={(v) => setNewExamConfidence(v[0])}
                  max={100}
                  step={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddExam(false)}>Cancel</Button>
              <Button onClick={handleAddExam} data-testid="button-submit-exam">Add Exam</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Note title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                data-testid="input-note-title"
              />
              <Textarea
                placeholder="Note content..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={6}
              />
              <Select value={newNoteSubject} onValueChange={setNewNoteSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Subject (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddNote(false)}>Cancel</Button>
              <Button onClick={handleAddNote} data-testid="button-submit-note">Create Note</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedNote} onOpenChange={() => setSelectedNote(null)}>
          <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <Input
                  className="text-xl font-bold border-0 p-0 focus-visible:ring-0"
                  value={selectedNote?.title || ""}
                  onChange={(e) => selectedNote && setSelectedNote({ ...selectedNote, title: e.target.value })}
                  onBlur={() => selectedNote && handleUpdateNote(selectedNote.id, { title: selectedNote.title })}
                />
                <Button variant="outline" size="sm" onClick={() => setShowShareNote(true)}>
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              </div>
            </DialogHeader>
            <Textarea
              className="flex-1 resize-none border-0 focus-visible:ring-0"
              placeholder="Start writing..."
              value={selectedNote?.content || ""}
              onChange={(e) => selectedNote && setSelectedNote({ ...selectedNote, content: e.target.value })}
              onBlur={() => selectedNote && handleUpdateNote(selectedNote.id, { content: selectedNote.content })}
            />
            {noteShares.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Shared with:</p>
                <div className="space-y-2">
                  {noteShares.map((share) => (
                    <div key={share.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                      <span className="text-sm">{share.sharedWithEmail}</span>
                      <div className="flex items-center gap-2">
                        <Select value={share.role} onValueChange={(v) => handleUpdateNoteShare(share.id, v)}>
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="commenter">Commenter</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveNoteShare(share.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showShareNote} onOpenChange={setShowShareNote}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Note</DialogTitle>
              <DialogDescription>
                Invite someone to view, comment, or edit this note.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
              <Select value={shareRole} onValueChange={(v: any) => setShareRole(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Permission level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer - Can only view</SelectItem>
                  <SelectItem value="commenter">Commenter - Can view and comment</SelectItem>
                  <SelectItem value="editor">Editor - Can view, comment, and edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShareNote(false)}>Cancel</Button>
              <Button onClick={handleShareNote}>Share</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Calendar Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Event title"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                data-testid="input-event-title"
              />
              <Textarea
                placeholder="Description (optional)"
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                rows={3}
              />
              <Select value={newEventType} onValueChange={(v: any) => setNewEventType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    {newEventDate ? newEventDate.toLocaleDateString() : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={newEventDate} onSelect={setNewEventDate} />
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-2">
                <Switch checked={newEventAllDay} onCheckedChange={setNewEventAllDay} />
                <span className="text-sm">All day</span>
              </div>
              {!newEventAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Start time</label>
                    <Input type="time" value={newEventTime} onChange={(e) => setNewEventTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm">End time</label>
                    <Input type="time" value={newEventEndTime} onChange={(e) => setNewEventEndTime(e.target.value)} />
                  </div>
                </div>
              )}
              <Select value={newEventReminder.toString()} onValueChange={(v) => setNewEventReminder(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Reminder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No reminder</SelectItem>
                  <SelectItem value="5">5 minutes before</SelectItem>
                  <SelectItem value="15">15 minutes before</SelectItem>
                  <SelectItem value="30">30 minutes before</SelectItem>
                  <SelectItem value="60">1 hour before</SelectItem>
                  <SelectItem value="1440">1 day before</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddEvent(false)}>Cancel</Button>
              <Button onClick={handleAddEvent} data-testid="button-submit-event">Add Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedEvent?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                {selectedEvent && new Date(selectedEvent.startTime).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </div>
              {!selectedEvent?.allDay && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {selectedEvent && new Date(selectedEvent.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {selectedEvent?.endTime && ` - ${new Date(selectedEvent.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                </div>
              )}
              {selectedEvent?.description && (
                <p className="text-sm">{selectedEvent.description}</p>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowShareEvent(true)}>
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button variant="destructive" onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showShareEvent} onOpenChange={setShowShareEvent}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Event</DialogTitle>
              <DialogDescription>
                Send an invitation to someone. They'll need to accept to see this event.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email address"
                value={shareEventEmail}
                onChange={(e) => setShareEventEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShareEvent(false)}>Cancel</Button>
              <Button onClick={handleShareEvent}>Send Invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddStickyNote} onOpenChange={setShowAddStickyNote}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Sticky Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Note content..."
                value={newStickyContent}
                onChange={(e) => setNewStickyContent(e.target.value)}
                rows={4}
              />
              <div className="space-y-2">
                <label className="text-sm">Color</label>
                <div className="flex gap-2">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${newStickyColor === color ? "border-foreground" : "border-transparent"}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewStickyColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddStickyNote(false)}>Cancel</Button>
              <Button onClick={handleAddStickyNote}>Add Note</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddFlashcard} onOpenChange={setShowAddFlashcard}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Flashcard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Question (Front)"
                value={newFlashcardFront}
                onChange={(e) => setNewFlashcardFront(e.target.value)}
                data-testid="input-flashcard-front"
              />
              <Textarea
                placeholder="Answer (Back)"
                value={newFlashcardBack}
                onChange={(e) => setNewFlashcardBack(e.target.value)}
                rows={3}
              />
              <Select value={newFlashcardSubject} onValueChange={setNewFlashcardSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Subject (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddFlashcard(false)}>Cancel</Button>
              <Button onClick={handleAddFlashcard} data-testid="button-submit-flashcard">Add Flashcard</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showJournalModal} onOpenChange={setShowJournalModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Journal Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm">How are you feeling?</label>
                <div className="flex gap-2">
                  {MOOD_OPTIONS.map((mood) => {
                    const MoodIcon = mood.icon;
                    return (
                      <Button
                        key={mood.value}
                        variant={journalMood === mood.value ? "default" : "outline"}
                        size="icon"
                        onClick={() => setJournalMood(mood.value as any)}
                      >
                        <MoodIcon className={`w-5 h-5 ${mood.color}`} />
                      </Button>
                    );
                  })}
                </div>
              </div>
              <Textarea
                placeholder="Write about your day..."
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                rows={6}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowJournalModal(false)}>Cancel</Button>
              <Button onClick={handleAddJournalEntry} data-testid="button-submit-journal">Save Entry</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddReward} onOpenChange={setShowAddReward}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Reward</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Reward (e.g., Watch a movie)"
                value={newRewardName}
                onChange={(e) => setNewRewardName(e.target.value)}
                data-testid="input-reward-name"
              />
              <div className="space-y-2">
                <label className="text-sm">Tasks to complete: {newRewardTarget}</label>
                <Slider
                  value={[newRewardTarget]}
                  onValueChange={(v) => setNewRewardTarget(v[0])}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddReward(false)}>Cancel</Button>
              <Button onClick={handleAddReward} data-testid="button-submit-reward">Add Reward</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Pomodoro Timer</h3>
                <div className="space-y-2">
                  <label className="text-sm">Focus Duration: {pomodoroSettings.workDuration} min</label>
                  <Slider
                    value={[pomodoroSettings.workDuration]}
                    onValueChange={(v) => setPomodoroSettings({ ...pomodoroSettings, workDuration: v[0] })}
                    min={15}
                    max={60}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Short Break: {pomodoroSettings.shortBreakDuration} min</label>
                  <Slider
                    value={[pomodoroSettings.shortBreakDuration]}
                    onValueChange={(v) => setPomodoroSettings({ ...pomodoroSettings, shortBreakDuration: v[0] })}
                    min={3}
                    max={15}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Long Break: {pomodoroSettings.longBreakDuration} min</label>
                  <Slider
                    value={[pomodoroSettings.longBreakDuration]}
                    onValueChange={(v) => setPomodoroSettings({ ...pomodoroSettings, longBreakDuration: v[0] })}
                    min={10}
                    max={30}
                    step={5}
                  />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span>Theme</span>
                <Button variant="outline" size="sm" onClick={toggleTheme}>
                  {theme === "dark" ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                  {theme === "dark" ? "Light" : "Dark"}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                await api.savePomodoroSettings(pomodoroSettings);
                setTimerSeconds(pomodoroSettings.workDuration * 60);
                setShowSettings(false);
                toast({ title: "Settings saved!" });
              }}>
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
}
