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
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter
} from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import {
  getSubjects, getExams, getTasks, createTask, updateTask, deleteTask,
  getScheduleBlocks, getStickyNotes, createStickyNote, updateStickyNote, deleteStickyNote,
  getFlashcards, createFlashcard, updateFlashcard,
  getJournalEntries, createJournalEntry,
  getRewards, createReward, updateReward,
  getAIMessages, createAIMessage, clearAIMessages,
  getUserStats, saveUserStats,
  getPomodoroSettings, savePomodoroSettings
} from "@/lib/db";
import { getQuoteOfDay, BADGES } from "@shared/schema";
import type { Subject, Exam, Task, StickyNote, Flashcard, JournalEntry, Reward, AIMessage, UserStats, PomodoroSettings } from "@shared/schema";
import {
  BookOpen, Moon, Sun, Clock, Play, Pause, RotateCcw, Settings, Target, Calendar,
  Brain, MessageSquare, Send, Plus, Trash2, GripVertical, ChevronRight, ChevronDown,
  Flame, Trophy, Zap, AlertTriangle, CheckCircle, BarChart3, TrendingUp, Star,
  StickyNote as StickyNoteIcon, Layers, PenLine, Smile, Frown, Meh, Heart, Coffee,
  Volume2, VolumeX, Home, ListTodo, CalendarDays, LayoutGrid, Award, BookMarked,
  LogOut, User, Crown, ExternalLink, X, Sparkles, Timer, Focus, Music, Bell,
  Keyboard, HelpCircle, ChevronLeft, MoreVertical, Edit, Eye, EyeOff, RefreshCw
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

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "schedule", label: "Schedule", icon: CalendarDays },
  { id: "exams", label: "Exams", icon: Calendar },
  { id: "subjects", label: "Subjects", icon: BookMarked },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "notes", label: "Sticky Notes", icon: StickyNoteIcon },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "rewards", label: "Rewards", icon: Award },
  { id: "journal", label: "Journal", icon: PenLine },
];

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { user, logout, isLoading: authLoading } = useAuth();
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
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings | null>(null);
  
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
  
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteColor, setNewNoteColor] = useState("#8B5CF6");
  
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
  const [showBattleMode, setShowBattleMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const [focusMusicPlaying, setFocusMusicPlaying] = useState(false);
  
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
    }
  }, [user, authLoading, setLocation]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [subjectsData, examsData, tasksData, notesData, flashcardsData, journalData, rewardsData, messagesData, statsData, settingsData] = await Promise.all([
        getSubjects(user.id),
        getExams(user.id),
        getTasks(user.id),
        getStickyNotes(user.id),
        getFlashcards(user.id),
        getJournalEntries(user.id),
        getRewards(user.id),
        getAIMessages(user.id),
        getUserStats(user.id),
        getPomodoroSettings(user.id),
      ]);
      setSubjects(subjectsData);
      setExams(examsData);
      setTasks(tasksData);
      setStickyNotes(notesData);
      setFlashcards(flashcardsData);
      setJournalEntries(journalData);
      setRewards(rewardsData);
      setAiMessages(messagesData);
      setUserStats(statsData || null);
      setPomodoroSettings(settingsData || null);
      if (settingsData) {
        setTimerSeconds(settingsData.workDuration * 60);
      }
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
      if (userStats && user) {
        const newStats = {
          ...userStats,
          totalFocusMinutes: userStats.totalFocusMinutes + (pomodoroSettings?.workDuration || 25),
          todayFocusMinutes: userStats.todayFocusMinutes + (pomodoroSettings?.workDuration || 25),
        };
        await saveUserStats(newStats);
        setUserStats(newStats);
      }
      toast({ title: "Pomodoro Complete!", description: "Great work! Take a break." });
      const nextMode = (pomodoroCount + 1) % 4 === 0 ? "longBreak" : "shortBreak";
      setTimerMode(nextMode);
      setTimerSeconds(nextMode === "longBreak" 
        ? (pomodoroSettings?.longBreakDuration || 15) * 60 
        : (pomodoroSettings?.shortBreakDuration || 5) * 60
      );
    } else {
      toast({ title: "Break Over!", description: "Ready to focus again?" });
      setTimerMode("work");
      setTimerSeconds((pomodoroSettings?.workDuration || 25) * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerProgress = () => {
    const total = timerMode === "work" 
      ? (pomodoroSettings?.workDuration || 25) * 60
      : timerMode === "shortBreak"
        ? (pomodoroSettings?.shortBreakDuration || 5) * 60
        : (pomodoroSettings?.longBreakDuration || 15) * 60;
    return ((total - timerSeconds) / total) * 100;
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerMode("work");
    setTimerSeconds((pomodoroSettings?.workDuration || 25) * 60);
  };

  const handleAddTask = async () => {
    if (!user || !newTaskTitle.trim()) return;
    try {
      const task = await createTask({
        userId: user.id,
        title: newTaskTitle,
        priority: newTaskPriority,
        status: "pending",
        subjectId: newTaskSubject || undefined,
        tags: [],
        order: tasks.length,
      });
      setTasks([...tasks, task]);
      setNewTaskTitle("");
      setNewTaskPriority("medium");
      setNewTaskSubject("");
      setShowAddTask(false);
      toast({ title: "Task added!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      const updated = await updateTask({
        ...task,
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date().toISOString() : undefined,
      });
      setTasks(tasks.map(t => t.id === task.id ? updated : t));
      if (newStatus === "completed" && userStats && user) {
        const newStats = { ...userStats, totalTasksCompleted: userStats.totalTasksCompleted + 1 };
        await saveUserStats(newStats);
        setUserStats(newStats);
        const activeRewards = rewards.filter(r => !r.isCompleted);
        for (const reward of activeRewards) {
          const newProgress = reward.currentProgress + 1;
          if (newProgress >= reward.targetTasks) {
            await updateReward({ ...reward, currentProgress: newProgress, isCompleted: true });
            toast({ title: "Reward Unlocked!", description: reward.reward });
          } else {
            await updateReward({ ...reward, currentProgress: newProgress });
          }
        }
        loadData();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      toast({ title: "Task deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  };

  const handleSendAIMessage = async () => {
    if (!user || !aiInput.trim()) return;
    setAiLoading(true);
    try {
      const userMessage = await createAIMessage({
        userId: user.id,
        role: "user",
        content: aiInput,
        timestamp: new Date().toISOString(),
      });
      setAiMessages([...aiMessages, userMessage]);
      setAiInput("");

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: aiInput, userId: user.id }),
      });
      
      const data = await response.json();
      const assistantMessage = await createAIMessage({
        userId: user.id,
        role: "assistant",
        content: data.message || "I'm here to help with your studies! Ask me anything about your subjects, and I'll do my best to explain.",
        timestamp: new Date().toISOString(),
      });
      setAiMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const fallbackMessage = await createAIMessage({
        userId: user.id,
        role: "assistant",
        content: "I'm your AI study assistant! I can help you understand concepts, generate quiz questions, create study plans, and more. What would you like to learn about today?",
        timestamp: new Date().toISOString(),
      });
      setAiMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setAiLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handleAddStickyNote = async () => {
    if (!user || !newNoteContent.trim()) return;
    try {
      const note = await createStickyNote({
        userId: user.id,
        content: newNoteContent,
        color: newNoteColor,
        x: Math.random() * 200,
        y: Math.random() * 200,
        width: 200,
        height: 200,
      });
      setStickyNotes([...stickyNotes, note]);
      setNewNoteContent("");
      setShowAddNote(false);
      toast({ title: "Note added!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add note", variant: "destructive" });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteStickyNote(noteId);
      setStickyNotes(stickyNotes.filter(n => n.id !== noteId));
      toast({ title: "Note deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
    }
  };

  const handleAddFlashcard = async () => {
    if (!user || !newFlashcardFront.trim() || !newFlashcardBack.trim()) return;
    try {
      const card = await createFlashcard({
        userId: user.id,
        front: newFlashcardFront,
        back: newFlashcardBack,
        subjectId: newFlashcardSubject || undefined,
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
      await updateFlashcard({
        ...card,
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
    if (!user || !journalContent.trim()) return;
    try {
      const entry = await createJournalEntry({
        userId: user.id,
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
    if (!user || !newRewardName.trim()) return;
    try {
      const reward = await createReward({
        userId: user.id,
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
                  <span className="font-bold">{userStats?.dailyStreak || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-sidebar-accent/50">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm">Focus Today</span>
                  </div>
                  <span className="font-bold">{userStats?.todayFocusMinutes || 0}m</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-sidebar-accent/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Tasks Done</span>
                  </div>
                  <span className="font-bold">{completedTasks.length}</span>
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
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between gap-4 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-xl font-bold capitalize">{activeView}</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(true)} data-testid="button-shortcuts">
                <Keyboard className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              {user?.isPremium && (
                <Badge variant="secondary" className="gap-1">
                  <Crown className="w-3 h-3" />
                  Pro
                </Badge>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            {activeView === "dashboard" && (
              <div className="space-y-6">
                <Card className="glass-card border-primary/20 overflow-visible">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">Today's Motivation</p>
                        <p className="text-lg font-medium italic">"{quote.quote}"</p>
                        <p className="text-sm text-muted-foreground mt-1">- {quote.author}</p>
                      </div>
                      <Button variant="outline" className="gap-2" onClick={() => setShowBattleMode(true)} data-testid="button-battle-mode">
                        <Focus className="w-4 h-4" />
                        Battle Mode
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Pomodoro Timer
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setFocusMusicPlaying(!focusMusicPlaying)} data-testid="button-focus-music">
                          {focusMusicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center py-6">
                        <div className="relative w-48 h-48 mb-6">
                          <svg className="w-full h-full progress-ring" viewBox="0 0 100 100">
                            <circle
                              cx="50" cy="50" r="45"
                              fill="none"
                              stroke="hsl(var(--muted))"
                              strokeWidth="6"
                            />
                            <circle
                              cx="50" cy="50" r="45"
                              fill="none"
                              stroke="hsl(var(--primary))"
                              strokeWidth="6"
                              strokeLinecap="round"
                              strokeDasharray={`${getTimerProgress() * 2.83} 283`}
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold" data-testid="text-timer">{formatTime(timerSeconds)}</span>
                            <span className="text-sm text-muted-foreground capitalize">{timerMode.replace(/([A-Z])/g, " $1")}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Button
                            size="lg"
                            onClick={() => setTimerRunning(!timerRunning)}
                            className="gap-2 min-w-[120px]"
                            data-testid="button-timer-toggle"
                          >
                            {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            {timerRunning ? "Pause" : "Start"}
                          </Button>
                          <Button variant="outline" size="icon" onClick={resetTimer} data-testid="button-timer-reset">
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-4">
                          <span className="text-sm text-muted-foreground">Sessions: {pomodoroCount}</span>
                          <Separator orientation="vertical" className="h-4" />
                          <span className="text-sm text-muted-foreground">Total: {userStats?.totalFocusMinutes || 0}m</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        Upcoming Exams
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {getUpcomingExams().length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No upcoming exams</p>
                        ) : (
                          getUpcomingExams().map((exam) => {
                            const subject = subjects.find(s => s.id === exam.subjectId);
                            const daysLeft = getDaysUntil(exam.date);
                            return (
                              <div key={exam.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {subject && (
                                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
                                    )}
                                    <span className="font-medium truncate">{exam.name}</span>
                                  </div>
                                  <Badge variant={daysLeft <= 7 ? "destructive" : "secondary"}>
                                    {daysLeft}d
                                  </Badge>
                                </div>
                                <Progress value={exam.confidence} className="h-2" />
                                <p className="text-xs text-muted-foreground">{exam.confidence}% confidence</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ListTodo className="w-5 h-5 text-primary" />
                        Today's Tasks
                      </CardTitle>
                      <Button size="sm" onClick={() => setShowAddTask(true)} data-testid="button-add-task">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {pendingTasks.slice(0, 8).map((task) => {
                            const config = PRIORITY_CONFIG[task.priority];
                            const subject = subjects.find(s => s.id === task.subjectId);
                            return (
                              <div
                                key={task.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group"
                              >
                                <Checkbox
                                  checked={task.status === "completed"}
                                  onCheckedChange={() => handleToggleTask(task)}
                                  data-testid={`checkbox-task-${task.id}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`font-medium truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                    {task.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={`text-xs ${config.color}`}>
                                      <config.icon className="w-3 h-3 mr-1" />
                                      {config.label}
                                    </Badge>
                                    {subject && (
                                      <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }} />
                                        <span className="text-xs text-muted-foreground">{subject.name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleDeleteTask(task.id)}
                                  data-testid={`button-delete-task-${task.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            );
                          })}
                          {pendingTasks.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>All tasks completed!</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookMarked className="w-5 h-5 text-primary" />
                        Subject Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-4">
                          {subjects.map((subject) => {
                            const progress = subject.totalTopics > 0 
                              ? Math.round((subject.coveredTopics / subject.totalTopics) * 100) 
                              : 0;
                            return (
                              <div key={subject.id} className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                                    <span className="font-medium">{subject.name}</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{subject.studyHours}h studied</span>
                                  {subject.googleDriveUrl && (
                                    <a
                                      href={subject.googleDriveUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 hover:text-primary transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      Drive
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {subjects.length === 0 && (
                            <p className="text-center py-8 text-muted-foreground">No subjects added yet</p>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="hover-elevate cursor-pointer" onClick={() => setActiveView("flashcards")}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{flashcards.length}</p>
                        <p className="text-sm text-muted-foreground">Flashcards</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="hover-elevate cursor-pointer" onClick={() => setActiveView("notes")}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                        <StickyNoteIcon className="w-5 h-5 text-chart-2" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stickyNotes.length}</p>
                        <p className="text-sm text-muted-foreground">Sticky Notes</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="hover-elevate cursor-pointer" onClick={() => setActiveView("rewards")}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-chart-3" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{userStats?.badges?.length || 0}</p>
                        <p className="text-sm text-muted-foreground">Badges</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="hover-elevate cursor-pointer" onClick={() => setActiveView("journal")}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                        <PenLine className="w-5 h-5 text-chart-4" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{journalEntries.length}</p>
                        <p className="text-sm text-muted-foreground">Journal</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeView === "tasks" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Task Manager</h2>
                  <Button onClick={() => setShowAddTask(true)} className="gap-2" data-testid="button-add-task-main">
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
                        const subject = subjects.find(s => s.id === task.subjectId);
                        return (
                          <Card key={task.id} className="hover-elevate">
                            <CardContent className="p-4 flex items-center gap-4">
                              <Checkbox
                                checked={false}
                                onCheckedChange={() => handleToggleTask(task)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{task.title}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge variant="outline" className={config.color}>
                                    <config.icon className="w-3 h-3 mr-1" />
                                    {config.label}
                                  </Badge>
                                  {subject && (
                                    <Badge variant="secondary">
                                      <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: subject.color }} />
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
                        <Card key={task.id} className="opacity-70">
                          <CardContent className="p-4 flex items-center gap-4">
                            <Checkbox
                              checked={true}
                              onCheckedChange={() => handleToggleTask(task)}
                            />
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

            {activeView === "exams" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Exam Countdown Center</h2>
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
                          {exam.googleDriveUrl && (
                            <a
                              href={exam.googleDriveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Study Materials
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {exams.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="p-12 text-center">
                        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No exams scheduled</p>
                        <p className="text-muted-foreground">Add exams from the setup to track them here</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {activeView === "subjects" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Subject Overview</h2>
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
                          {subject.googleDriveUrl && (
                            <a
                              href={subject.googleDriveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Google Drive Materials
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {subjects.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="p-12 text-center">
                        <BookMarked className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No subjects added</p>
                        <p className="text-muted-foreground">Add subjects from the setup to track them here</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
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

            {activeView === "notes" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Sticky Notes</h2>
                  <Button onClick={() => setShowAddNote(true)} className="gap-2" data-testid="button-add-note">
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
                        onClick={() => handleDeleteNote(note.id)}
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
                        <Button onClick={() => setShowAddNote(true)}>
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
                          <p className="text-3xl font-bold">{userStats?.totalFocusMinutes || 0}</p>
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
                          <p className="text-3xl font-bold">{userStats?.totalTasksCompleted || 0}</p>
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
                          <p className="text-3xl font-bold">{userStats?.dailyStreak || 0}</p>
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
                          <p className="text-3xl font-bold">{userStats?.badges?.length || 0}</p>
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
                        const earned = userStats?.badges?.includes(badge.id);
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

            {activeView === "schedule" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Weekly Schedule</h2>
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-7 gap-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                        <div key={day} className="text-center">
                          <p className="font-medium text-sm mb-2">{day}</p>
                          <div className="min-h-[200px] rounded-lg bg-muted/50 p-2">
                            <p className="text-xs text-muted-foreground">No blocks</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-muted-foreground mt-4">
                      Schedule blocks coming soon. Add study blocks to organize your week.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>

        <Button
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-xl neon-glow z-50"
          onClick={() => setShowAIChat(!showAIChat)}
          data-testid="button-ai-chat"
        >
          <Brain className="w-6 h-6" />
        </Button>

        {showAIChat && (
          <Card className="fixed bottom-24 right-6 w-[380px] max-h-[500px] shadow-2xl z-50 flex flex-col">
            <CardHeader className="pb-2 flex flex-row items-center justify-between gap-4 space-y-0">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">AI Study Assistant</CardTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAIChat(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-[340px] p-4">
                {aiMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Ask me anything about your studies!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-lg ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <form
                className="flex items-center gap-2 w-full"
                onSubmit={(e) => { e.preventDefault(); handleSendAIMessage(); }}
              >
                <Input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={aiLoading}
                  data-testid="input-ai-message"
                />
                <Button type="submit" size="icon" disabled={aiLoading || !aiInput.trim()} data-testid="button-send-ai">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        )}

        <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Task Title</label>
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  data-testid="input-new-task-title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select value={newTaskPriority} onValueChange={(v: any) => setNewTaskPriority(v)}>
                  <SelectTrigger data-testid="select-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="w-4 h-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Subject (Optional)</label>
                <Select value={newTaskSubject} onValueChange={setNewTaskSubject}>
                  <SelectTrigger data-testid="select-task-subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                          {subject.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
              <Button onClick={handleAddTask} disabled={!newTaskTitle.trim()} data-testid="button-save-task">Add Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Sticky Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Note Content</label>
                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Write your note..."
                  className="min-h-[100px]"
                  data-testid="input-new-note"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2 mt-2">
                  {["#8B5CF6", "#06B6D4", "#EC4899", "#22C55E", "#F97316", "#EAB308"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${newNoteColor === color ? "border-foreground" : "border-transparent"}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewNoteColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddNote(false)}>Cancel</Button>
              <Button onClick={handleAddStickyNote} disabled={!newNoteContent.trim()} data-testid="button-save-note">Add Note</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddFlashcard} onOpenChange={setShowAddFlashcard}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Flashcard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Question (Front)</label>
                <Textarea
                  value={newFlashcardFront}
                  onChange={(e) => setNewFlashcardFront(e.target.value)}
                  placeholder="Enter the question..."
                  data-testid="input-flashcard-front"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Answer (Back)</label>
                <Textarea
                  value={newFlashcardBack}
                  onChange={(e) => setNewFlashcardBack(e.target.value)}
                  placeholder="Enter the answer..."
                  data-testid="input-flashcard-back"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subject (Optional)</label>
                <Select value={newFlashcardSubject} onValueChange={setNewFlashcardSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                          {subject.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddFlashcard(false)}>Cancel</Button>
              <Button onClick={handleAddFlashcard} disabled={!newFlashcardFront.trim() || !newFlashcardBack.trim()} data-testid="button-save-flashcard">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showJournalModal} onOpenChange={setShowJournalModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Journal Entry</DialogTitle>
              <DialogDescription>How are you feeling today?</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                {MOOD_OPTIONS.map((mood) => {
                  const Icon = mood.icon;
                  return (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={() => setJournalMood(mood.value as any)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        journalMood === mood.value ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"
                      }`}
                    >
                      <Icon className={`w-8 h-8 ${mood.color}`} />
                      <p className="text-xs mt-1">{mood.label}</p>
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="text-sm font-medium">Reflection</label>
                <Textarea
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="What's on your mind? How did your study session go?"
                  className="min-h-[150px]"
                  data-testid="input-journal-content"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowJournalModal(false)}>Cancel</Button>
              <Button onClick={handleAddJournalEntry} disabled={!journalContent.trim()} data-testid="button-save-journal">Save Entry</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddReward} onOpenChange={setShowAddReward}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Reward</DialogTitle>
              <DialogDescription>Set a reward for completing tasks!</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reward</label>
                <Input
                  value={newRewardName}
                  onChange={(e) => setNewRewardName(e.target.value)}
                  placeholder="e.g., Watch an episode of my favorite show"
                  data-testid="input-reward-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tasks Required: {newRewardTarget}</label>
                <Slider
                  value={[newRewardTarget]}
                  onValueChange={(v) => setNewRewardTarget(v[0])}
                  min={1}
                  max={20}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddReward(false)}>Cancel</Button>
              <Button onClick={handleAddReward} disabled={!newRewardName.trim()} data-testid="button-save-reward">Add Reward</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Pomodoro Timer</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Work Duration</span>
                    <span className="text-sm font-medium">{pomodoroSettings?.workDuration || 25} min</span>
                  </div>
                  <Slider
                    value={[pomodoroSettings?.workDuration || 25]}
                    onValueChange={async (v) => {
                      if (pomodoroSettings && user) {
                        const updated = { ...pomodoroSettings, workDuration: v[0] };
                        await savePomodoroSettings(user.id, updated);
                        setPomodoroSettings(updated);
                        if (timerMode === "work" && !timerRunning) {
                          setTimerSeconds(v[0] * 60);
                        }
                      }
                    }}
                    min={5}
                    max={60}
                    step={5}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Short Break</span>
                    <span className="text-sm font-medium">{pomodoroSettings?.shortBreakDuration || 5} min</span>
                  </div>
                  <Slider
                    value={[pomodoroSettings?.shortBreakDuration || 5]}
                    onValueChange={async (v) => {
                      if (pomodoroSettings && user) {
                        const updated = { ...pomodoroSettings, shortBreakDuration: v[0] };
                        await savePomodoroSettings(user.id, updated);
                        setPomodoroSettings(updated);
                      }
                    }}
                    min={1}
                    max={15}
                    step={1}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Notifications</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sound Effects</span>
                  <Switch
                    checked={pomodoroSettings?.soundEnabled ?? true}
                    onCheckedChange={async (checked) => {
                      if (pomodoroSettings && user) {
                        const updated = { ...pomodoroSettings, soundEnabled: checked };
                        await savePomodoroSettings(user.id, updated);
                        setPomodoroSettings(updated);
                      }
                    }}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Account</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBattleMode} onOpenChange={setShowBattleMode}>
          <DialogContent className="max-w-full h-screen bg-black/95 border-none">
            <div className="h-full flex flex-col items-center justify-center text-white">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/10"
                onClick={() => setShowBattleMode(false)}
              >
                <X className="w-6 h-6" />
              </Button>

              <div className="text-center space-y-8">
                <h1 className="text-4xl md:text-6xl font-bold gradient-text">BATTLE MODE</h1>
                <p className="text-xl text-white/60">Zero distractions. Maximum focus.</p>

                <div className="relative w-64 h-64">
                  <svg className="w-full h-full progress-ring" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="45"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="50" cy="50" r="45"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${getTimerProgress() * 2.83} 283`}
                      className="transition-all duration-1000 animate-pulse-glow"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-bold">{formatTime(timerSeconds)}</span>
                    <span className="text-lg text-white/60 capitalize mt-2">{timerMode.replace(/([A-Z])/g, " $1")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    size="lg"
                    onClick={() => setTimerRunning(!timerRunning)}
                    className="gap-2 min-w-[150px] text-lg"
                  >
                    {timerRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    {timerRunning ? "Pause" : "Start"}
                  </Button>
                  <Button variant="outline" size="icon" onClick={resetTimer} className="border-white/20 hover:bg-white/10">
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </div>

                <p className="text-white/40 text-sm">Press ESC or click X to exit Battle Mode</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Keyboard Shortcuts</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {[
                { key: "Space", action: "Start/Pause Timer" },
                { key: "R", action: "Reset Timer" },
                { key: "B", action: "Toggle Battle Mode" },
                { key: "T", action: "Add New Task" },
                { key: "N", action: "Add New Note" },
                { key: "D", action: "Toggle Dark Mode" },
                { key: "?", action: "Show Shortcuts" },
              ].map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">{shortcut.action}</span>
                  <kbd className="px-2 py-1 rounded bg-muted text-sm font-mono">{shortcut.key}</kbd>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
}
