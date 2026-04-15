"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

import { subscribeToTasks, subscribeToVolunteers, submitTaskFeedback, TaskDoc, VolunteerDoc } from "@/lib/firestore";
import { useEffect } from "react";

import {
  Users, MapPin, Clock, CheckCircle2,
  Sparkles, Search, MessageSquare, Loader2,
  AlertCircle, CheckCheck, Activity
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { matchVolunteers, type MatchVolunteersOutput } from "@/ai/flows/ngo-ai-match-volunteers";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";



const statusColors = {
  "In Progress": "bg-primary/10 text-primary border-primary/20",
  "Pending": "bg-amber-50 text-amber-700 border-amber-200",
  "Completed": "bg-accent/10 text-accent border-accent/20",
};

export default function VolunteersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [aiMatches, setAiMatches] = useState<MatchVolunteersOutput | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackTask, setFeedbackTask] = useState({ id: "", title: "" });
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerDoc[]>([]);

  const { userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userRole === "Volunteer") {
      router.replace("/dashboard");
    }
  }, [userRole, router]);

  useEffect(() => {
    const unsubTasks = subscribeToTasks(setTasks);
    const unsubVols = subscribeToVolunteers(setVolunteers);
    return () => {
      unsubTasks();
      unsubVols();
    };
  }, []);

  if (userRole === "Volunteer") return null;

  const filtered = volunteers.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  async function runAiMatch() {
    setIsMatching(true);
    setAiMatches(null);
    try {
      const result = await matchVolunteers({
        tasks: [
          { id: "N1", description: "Medical supplies for children's clinic at Sector 4", requiredSkills: ["medical", "pediatrics", "first aid"], location: { latitude: 17.44, longitude: 78.35 }, priority: "High", urgencyScore: 9 },
          { id: "N2", description: "Food distribution for 50 families in Western Block", requiredSkills: ["logistics", "driving", "coordination"], location: { latitude: 17.45, longitude: 78.38 }, priority: "High", urgencyScore: 8 },
        ],
        volunteers: volunteers.filter((v) => v.status === "Available").map((v) => ({
          id: v.id || "N/A", name: v.name,
          skills: v.skills,
          availability: v.availability,
          currentLocation: { latitude: v.lat || 17.44, longitude: v.lng || 78.35 },
        })),
      });
      setAiMatches(result);
      toast({ title: "AI Matching Complete ✓", description: `${result.matches.length} optimal matches found.` });
    } catch {
      toast({ title: "Matching failed", description: "AI service unavailable.", variant: "destructive" });
    } finally {
      setIsMatching(false);
    }
  }

  function openFeedback(task: TaskDoc) {
    setFeedbackTask({ id: task.id || "", title: task.title });
    setFeedbackOpen(true);
  }

  async function handleFeedback(fb: { rating: number; success: boolean; note: string }) {
    try {
      if (!feedbackTask.id) return;
      await submitTaskFeedback(feedbackTask.id, fb);
      toast({ title: "Feedback submitted ✓", description: "Status synced instantly via Firebase!" });
    } catch {
      toast({ title: "Feedback error", description: "Failed to update Firebase.", variant: "destructive" });
    }
  }

  const needIdToDesc: Record<string, string> = {
    "N1": "Medical Supplies — Sector 4 Clinic",
    "N2": "Food Distribution — Western Block",
  };
  const volunteerMap = Object.fromEntries(volunteers.map((v) => [v.id, v]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">Volunteer Hub</h1>
          <p className="text-muted-foreground">Manage and match volunteers with community tasks.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><MessageSquare className="h-4 w-4" /> Broadcast Alert</Button>
          <Button className="gap-2"><Users className="h-4 w-4" /> Add Volunteer</Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <TabsList className="bg-white/50 border">
            <TabsTrigger value="all">All Volunteers</TabsTrigger>
            <TabsTrigger value="matches">Smart Matches</TabsTrigger>
            <TabsTrigger value="active" className="relative">
              Active Tasks
              <span className="ml-1.5 w-5 h-5 bg-primary text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {tasks.filter(t => t.status !== "Completed").length}
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search by skill or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 w-full bg-white border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* All Volunteers */}
        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filtered.map((v) => (
              <Card key={v.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarImage src={`https://picsum.photos/seed/${v.id || v.name}/100/100`} />
                      <AvatarFallback>{v.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Badge className={v.status === "Available" ? "bg-accent/10 text-accent border border-accent/20 text-[10px]" : "text-[10px]"} variant="outline">
                      {v.status}
                    </Badge>
                  </div>
                  <CardTitle className="font-headline text-base mt-2">{v.name}</CardTitle>
                  <CardDescription className="text-[10px] font-medium text-primary uppercase tracking-tight">{v.role}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {v.skills.map((s) => <Badge key={s} variant="outline" className="text-[10px] py-0">{s}</Badge>)}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.location}</div>
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{v.availability}</div>
                    <div className="flex items-center gap-1"><Users className="h-3 w-3" />{v.tasksCompleted} tasks</div>
                    <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-accent" />{v.rating} / 5.0</div>
                  </div>
                </CardContent>
                <div className="p-4 pt-0 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs">Profile</Button>
                  <Button size="sm" className="flex-1 text-xs" disabled={v.status !== "Available"}>Assign</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Smart Matches */}
        <TabsContent value="matches" className="space-y-4">
          <Card className="border-none shadow-md bg-gradient-to-r from-primary/5 to-accent/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <CardTitle className="font-headline text-xl">AI Volunteer Matching</CardTitle>
                </div>
                <Button onClick={runAiMatch} disabled={isMatching} className="gap-2">
                  {isMatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isMatching ? "Analyzing..." : "Run AI Match"}
                </Button>
              </div>
              <CardDescription>AI will analyze open high-priority needs and available volunteers to find optimal matches.</CardDescription>
            </CardHeader>

            {isMatching && (
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground animate-pulse">Analyzing skills, proximity, and urgency levels...</p>
                  <Progress value={undefined} className="h-2 animate-pulse" />
                </div>
              </CardContent>
            )}

            {aiMatches && (
              <CardContent className="space-y-4">
                {aiMatches.matches.map((match, i) => {
                  const volunteer = volunteerMap[match.volunteerId];
                  return (
                    <div key={i} className="bg-white rounded-xl p-4 border border-primary/10 shadow-sm">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                            <p className="text-sm font-bold">{needIdToDesc[match.taskId] ?? match.taskId}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-6">
                            <CheckCheck className="h-4 w-4 text-accent shrink-0" />
                            <p className="text-sm">
                              Matched: <span className="font-semibold">{volunteer?.name ?? match.volunteerId}</span>
                              {volunteer && volunteer.distance && <span className="text-xs text-muted-foreground ml-1">· {volunteer.distance} away</span>}
                            </p>
                          </div>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="gap-1 shrink-0">
                              <Sparkles className="h-3 w-3" /> Why?
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2 font-headline">
                                <Sparkles className="h-5 w-5 text-primary" /> Matching Explanation
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                              <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary text-sm italic text-muted-foreground leading-relaxed">
                                &ldquo;{match.reason}&rdquo;
                              </div>
                              {volunteer && (
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="p-2 bg-accent/5 rounded-lg border border-accent/10">
                                    <p className="text-[9px] font-bold uppercase text-muted-foreground">Skills</p>
                                    <p className="text-base font-bold text-accent">✓</p>
                                  </div>
                                  {volunteer.distance && (
                                    <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                                      <p className="text-[9px] font-bold uppercase text-muted-foreground">Distance</p>
                                      <p className="text-base font-bold text-primary">{volunteer.distance}</p>
                                    </div>
                                  )}
                                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                                    <p className="text-[9px] font-bold uppercase text-muted-foreground">Rating</p>
                                    <p className="text-base font-bold text-amber-600">★ {volunteer.rating}</p>
                                  </div>
                                </div>
                              )}
                              <Button className="w-full">Confirm Matching & Notify</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}

            {!aiMatches && !isMatching && (
              <CardContent>
                <div className="py-10 text-center text-muted-foreground">
                  <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Click &ldquo;Run AI Match&rdquo; to generate intelligent recommendations</p>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Active Tasks */}
        <TabsContent value="active" className="space-y-4">
          {tasks.map((task) => (
            <Card key={task.id} className="border-none shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex">
                <div className={`w-1.5 shrink-0 ${task.priority === "High" ? "bg-destructive" : task.priority === "Low" ? "bg-accent" : "bg-amber-400"}`} />
                <div className="flex-1 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={task.priority === "High" ? "destructive" : "secondary"} className="text-[10px] rounded-md">{task.priority} Priority</Badge>
                        <Badge className={`text-[10px] rounded-md border text-black ${task.status === "In Progress" ? "bg-blue-100" : task.status === "Completed" ? "bg-green-100" : "bg-gray-100"}`} variant="outline">
                          <Activity className="h-2.5 w-2.5 mr-1" />{task.status}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-bold font-headline">{task.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{task.location}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{task.eta}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2 text-xs">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={`https://picsum.photos/seed/${task.assignedVolunteerId}/100/100`} />
                          <AvatarFallback>{task.assignedVolunteerName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground hidden sm:inline">{task.assignedVolunteerName}</span>
                      </div>
                      <Button
                        size="sm"
                        variant={task.status === "Completed" ? "outline" : "default"}
                        className="text-xs gap-1"
                        disabled={task.status === "Completed"}
                        onClick={() => openFeedback(task)}
                      >
                        {task.status === "Completed" ? <><CheckCircle2 className="h-3 w-3" /> Done</> : "Mark Complete"}
                      </Button>
                    </div>
                  </div>
                  {task.status !== "Completed" && (
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-1.5" />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        taskTitle={feedbackTask.title}
        volunteerId=""
        onSubmit={handleFeedback}
      />
    </div>
  );
}
