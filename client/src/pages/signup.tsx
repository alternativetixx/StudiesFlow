import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { BookOpen, Moon, Sun, Mail, Lock, User, ArrowLeft, Sparkles, PartyPopper } from "lucide-react";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { signup } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState("");

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const user = await signup(data.name, data.email, data.password);
      setUserName(user.name);
      setShowWelcome(true);
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    setShowWelcome(false);
    setLocation("/setup");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-primary/10" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-2/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-4 z-50"
        onClick={toggleTheme}
        data-testid="button-theme-toggle"
      >
        {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>

      <Card className="w-full max-w-md glass-card relative z-10">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
          </Link>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <CardDescription>Start your journey to academic excellence</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="Your name" 
                          className="pl-10"
                          data-testid="input-name"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="email" 
                          placeholder="you@example.com" 
                          className="pl-10"
                          data-testid="input-email"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="At least 6 characters" 
                          className="pl-10"
                          data-testid="input-password"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="Confirm your password" 
                          className="pl-10"
                          data-testid="input-confirm-password"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full gap-2" 
                disabled={isLoading}
                data-testid="button-signup"
              >
                {isLoading ? (
                  "Creating account..."
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
              Sign in
            </Link>
          </div>

          <Link href="/" className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </CardContent>
      </Card>

      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="glass-card text-center">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center animate-bounce-in">
              <PartyPopper className="w-10 h-10 text-white" />
            </div>
            <DialogTitle className="text-2xl">Welcome to StudyFlow, {userName}!</DialogTitle>
            <DialogDescription className="text-base pt-2">
              Your account has been created successfully. Let's set up your study environment!
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleContinue} className="w-full gap-2" data-testid="button-continue-setup">
            <Sparkles className="w-4 h-4" />
            Let's Go!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
