import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import { 
  Brain, Clock, Target, Calendar, Sparkles, Trophy, 
  ChevronLeft, ChevronRight, Moon, Sun, Zap, BookOpen,
  CheckCircle, BarChart3, Music, Flame
} from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Pomodoro Pro Timer",
    description: "Customizable work sessions with beautiful progress rings, notifications, and focus tracking.",
  },
  {
    icon: Brain,
    title: "AI Study Assistant",
    description: "Get instant explanations, generate quizzes, and create study timetables with AI power.",
  },
  {
    icon: Target,
    title: "Smart Task Management",
    description: "Prioritize tasks with drag-and-drop, dual views, and satisfying completion animations.",
  },
  {
    icon: Calendar,
    title: "Exam Countdown Center",
    description: "Track exam dates with live countdowns, confidence meters, and Google Drive integration.",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Beautiful charts showing study hours, productivity heatmaps, and performance insights.",
  },
  {
    icon: Trophy,
    title: "Gamification & Rewards",
    description: "Daily streaks, achievement badges, and custom reward tracking to keep you motivated.",
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Medical Student",
    content: "This app literally changed my study life. The Pomodoro timer with the AI assistant is a game changer!",
    avatar: "SM",
  },
  {
    name: "James K.",
    role: "Law Student",
    content: "Finally, a study app that doesn't feel like a chore. The gamification keeps me coming back every day.",
    avatar: "JK",
  },
  {
    name: "Emily R.",
    role: "Engineering Student",
    content: "The exam countdown and progress tracking helped me go from C's to A's in one semester!",
    avatar: "ER",
  },
  {
    name: "Michael T.",
    role: "High School Senior",
    content: "Battle mode is incredible for focus. I've never been this productive during exam season.",
    avatar: "MT",
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [nextExamDays, setNextExamDays] = useState({ days: 12, hours: 5, minutes: 32 });

  useEffect(() => {
    const targetCount = 50847;
    const duration = 2000;
    const steps = 60;
    const increment = targetCount / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetCount) {
        setStudentCount(targetCount);
        clearInterval(timer);
      } else {
        setStudentCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNextExamDays(prev => {
        let { days, hours, minutes } = prev;
        minutes--;
        if (minutes < 0) {
          minutes = 59;
          hours--;
          if (hours < 0) {
            hours = 23;
            days--;
          }
        }
        return { days: Math.max(0, days), hours: Math.max(0, hours), minutes: Math.max(0, minutes) };
      });
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">StudyFlow</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Link href="/login">
              <Button variant="ghost" data-testid="link-login">Login</Button>
            </Link>
            <Link href="/signup">
              <Button data-testid="link-signup">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative min-h-[85vh] flex items-center justify-center pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10 animate-gradient" 
             style={{ backgroundSize: "400% 400%" }} />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-2/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-chart-3/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "-1.5s" }} />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">The #1 Study App for Top Students</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            The Only Study App That<br />
            <span className="gradient-text">Feels Like Cheating</span>
            <span className="text-muted-foreground text-3xl md:text-4xl block mt-2">(Legally)</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered study assistant, Pomodoro timer, progress tracking, flashcards, 
            and gamification - all in one beautiful dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/signup">
              <Button size="lg" className="gap-2 neon-glow" data-testid="button-get-started-hero">
                <Zap className="w-5 h-5" />
                Start Studying Free
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="gap-2" data-testid="button-watch-demo">
              <span>Watch Demo</span>
            </Button>
          </div>

          <Card className="max-w-md mx-auto glass-card">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Next Exam Countdown</p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{nextExamDays.days}</div>
                  <div className="text-xs text-muted-foreground">Days</div>
                </div>
                <span className="text-2xl text-muted-foreground">:</span>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{nextExamDays.hours}</div>
                  <div className="text-xs text-muted-foreground">Hours</div>
                </div>
                <span className="text-2xl text-muted-foreground">:</span>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">{nextExamDays.minutes}</div>
                  <div className="text-xs text-muted-foreground">Mins</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Ace Your Exams</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Packed with features designed by top students, for students who want to achieve more.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="glass-card hover-elevate transition-all duration-300"
                data-testid={`card-feature-${index}`}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by <span className="gradient-text">{studentCount.toLocaleString()}+</span> Students
            </h2>
          </div>
          
          <div className="relative">
            <Card className="glass-card">
              <CardContent className="p-8 md:p-12 text-center">
                <p className="text-xl md:text-2xl mb-6 italic">
                  "{testimonials[currentTestimonial].content}"
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-white font-semibold">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{testimonials[currentTestimonial].name}</p>
                    <p className="text-sm text-muted-foreground">{testimonials[currentTestimonial].role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                data-testid="button-testimonial-prev"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentTestimonial ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                    onClick={() => setCurrentTestimonial(index)}
                    data-testid={`button-testimonial-dot-${index}`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
                data-testid="button-testimonial-next"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Flame className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold">Join thousands of successful students</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Study Game?
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8">
            Start free today. No credit card required.
          </p>
          
          <Link href="/signup">
            <Button size="lg" className="gap-2 neon-glow text-lg px-8 py-6" data-testid="button-get-started-cta">
              <Sparkles className="w-5 h-5" />
              Get Started Free
            </Button>
          </Link>
          
          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Free forever tier</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">StudyFlow</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Made with love for students everywhere
          </p>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="mailto:gallium.bot@gmail.com" className="hover:text-foreground transition-colors">
              Contact
            </a>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
