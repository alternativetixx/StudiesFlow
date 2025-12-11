import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { createSubject, createExam, initUserStats, initPomodoroSettings, initAppPreferences } from "@/lib/db";
import { 
  BookOpen, Moon, Sun, ArrowRight, ArrowLeft, Plus, Trash2, 
  Sparkles, CheckCircle, GraduationCap, Calendar, Link as LinkIcon,
  Palette
} from "lucide-react";

const SUBJECT_COLORS = [
  { name: "Purple", value: "#8B5CF6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Pink", value: "#EC4899" },
  { name: "Green", value: "#22C55E" },
  { name: "Orange", value: "#F97316" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Red", value: "#EF4444" },
  { name: "Yellow", value: "#EAB308" },
];

const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  color: z.string().min(1, "Please select a color"),
  googleDriveUrl: z.string().optional(),
});

const step1Schema = z.object({
  subjects: z.array(subjectSchema).min(1, "Add at least one subject"),
});

const examSchema = z.object({
  name: z.string().min(1, "Exam name is required"),
  subjectId: z.string().min(1, "Please select a subject"),
  date: z.string().min(1, "Please select a date"),
  weight: z.number().min(0).max(100).optional(),
});

const step2Schema = z.object({
  exams: z.array(examSchema),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

export default function SetupPage() {
  const [, setLocation] = useLocation();
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSubjects, setCreatedSubjects] = useState<Array<{ id: string; name: string; color: string }>>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      subjects: [{ name: "", color: SUBJECT_COLORS[0].value, googleDriveUrl: "" }],
    },
  });

  const { fields: subjectFields, append: appendSubject, remove: removeSubject } = useFieldArray({
    control: step1Form.control,
    name: "subjects",
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      exams: [],
    },
  });

  const { fields: examFields, append: appendExam, remove: removeExam } = useFieldArray({
    control: step2Form.control,
    name: "exams",
  });

  const handleStep1Submit = async (data: Step1Data) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const created = [];
      for (const subject of data.subjects) {
        const newSubject = await createSubject({
          userId: user.id,
          name: subject.name,
          color: subject.color,
          googleDriveUrl: subject.googleDriveUrl || undefined,
          totalTopics: 0,
          coveredTopics: 0,
          studyHours: 0,
        });
        created.push({ id: newSubject.id, name: newSubject.name, color: newSubject.color });
      }
      setCreatedSubjects(created);
      toast({ title: "Subjects added!", description: `${created.length} subjects created successfully.` });
      setStep(2);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create subjects", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Submit = async (data: Step2Data) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      for (const exam of data.exams) {
        await createExam({
          userId: user.id,
          subjectId: exam.subjectId,
          name: exam.name,
          date: exam.date,
          confidence: 50,
          weight: exam.weight || 100,
        });
      }
      if (data.exams.length > 0) {
        toast({ title: "Exams added!", description: `${data.exams.length} exams scheduled.` });
      }
      setStep(3);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create exams", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await initUserStats(user.id);
      await initPomodoroSettings(user.id);
      await initAppPreferences(user.id);
      await updateProfile({ hasCompletedSetup: true });
      toast({ title: "Setup complete!", description: "Welcome to StudyFlow!" });
      setLocation("/dashboard");
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete setup", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

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

      <Card className="w-full max-w-2xl glass-card relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">
            {step === 1 && "Add Your Subjects"}
            {step === 2 && "Schedule Your Exams"}
            {step === 3 && "You're All Set!"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "What are you studying? Add subjects with optional Google Drive links."}
            {step === 2 && "When are your exams? We'll help you prepare."}
            {step === 3 && "Your study environment is ready. Let's ace those exams!"}
          </CardDescription>

          <div className="mt-4 flex items-center gap-2">
            <Progress value={(step / 3) * 100} className="flex-1" />
            <span className="text-sm text-muted-foreground">Step {step}/3</span>
          </div>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {subjectFields.map((field, index) => (
                    <div key={field.id} className="p-4 rounded-lg bg-muted/50 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">Subject {index + 1}</span>
                        </div>
                        {subjectFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSubject(index)}
                            data-testid={`button-remove-subject-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={step1Form.control}
                          name={`subjects.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., Mathematics" 
                                  data-testid={`input-subject-name-${index}`}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={step1Form.control}
                          name={`subjects.${index}.color`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Color</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid={`select-subject-color-${index}`}>
                                    <SelectValue placeholder="Pick a color">
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-4 h-4 rounded-full" 
                                          style={{ backgroundColor: field.value }} 
                                        />
                                        {SUBJECT_COLORS.find(c => c.value === field.value)?.name}
                                      </div>
                                    </SelectValue>
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {SUBJECT_COLORS.map((color) => (
                                    <SelectItem key={color.value} value={color.value}>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-4 h-4 rounded-full" 
                                          style={{ backgroundColor: color.value }} 
                                        />
                                        {color.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={step1Form.control}
                        name={`subjects.${index}.googleDriveUrl`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <LinkIcon className="w-4 h-4" />
                              Google Drive Link (Optional)
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://drive.google.com/..." 
                                data-testid={`input-subject-drive-${index}`}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => appendSubject({ name: "", color: SUBJECT_COLORS[subjectFields.length % SUBJECT_COLORS.length].value, googleDriveUrl: "" })}
                  data-testid="button-add-subject"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Subject
                </Button>

                <Button 
                  type="submit" 
                  className="w-full gap-2" 
                  disabled={isSubmitting}
                  data-testid="button-next-step1"
                >
                  {isSubmitting ? "Saving..." : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {step === 2 && (
            <Form {...step2Form}>
              <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6">
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {examFields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No exams added yet. Add your upcoming exams below.</p>
                    </div>
                  ) : (
                    examFields.map((field, index) => (
                      <div key={field.id} className="p-4 rounded-lg bg-muted/50 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                            <span className="font-medium">Exam {index + 1}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExam(index)}
                            data-testid={`button-remove-exam-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={step2Form.control}
                            name={`exams.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Exam Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., Midterm Exam" 
                                    data-testid={`input-exam-name-${index}`}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={step2Form.control}
                            name={`exams.${index}.subjectId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-exam-subject-${index}`}>
                                      <SelectValue placeholder="Select subject" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {createdSubjects.map((subject) => (
                                      <SelectItem key={subject.id} value={subject.id}>
                                        <div className="flex items-center gap-2">
                                          <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: subject.color }} 
                                          />
                                          {subject.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={step2Form.control}
                          name={`exams.${index}.date`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exam Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  data-testid={`input-exam-date-${index}`}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => appendExam({ name: "", subjectId: "", date: "", weight: 100 })}
                  data-testid="button-add-exam"
                >
                  <Plus className="w-4 h-4" />
                  Add Exam
                </Button>

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1 gap-2" 
                    onClick={() => setStep(1)}
                    data-testid="button-back-step2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 gap-2" 
                    disabled={isSubmitting}
                    data-testid="button-next-step2"
                  >
                    {isSubmitting ? "Saving..." : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center animate-bounce-in">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>

              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {createdSubjects.length} subject{createdSubjects.length !== 1 && "s"} ready
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {createdSubjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: subject.color }}
                    >
                      {subject.name}
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-muted-foreground">
                Your personalized study dashboard awaits with AI assistance, Pomodoro timer, 
                progress tracking, and much more!
              </p>

              <Button 
                onClick={handleFinish}
                className="w-full gap-2 neon-glow" 
                disabled={isSubmitting}
                data-testid="button-finish-setup"
              >
                {isSubmitting ? "Finalizing..." : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Launch My Dashboard
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
