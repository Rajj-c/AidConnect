"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

import {
  subscribeToTasks, subscribeToVolunteers, subscribeToNeeds,
  submitTaskFeedback, addTask, updateTaskStatus,
  TaskDoc, VolunteerDoc, NeedDoc
} from "@/lib/firestore";

import {
  Users, MapPin, Clock, CheckCircle2, Phone,
  Sparkles, Search, MessageSquare, Loader2,
  AlertCircle, CheckCheck, Activity, Star, Zap
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { matchVolunteers, type MatchVolunteersOutput } from "@/ai/flows/ngo-ai-match-volunteers";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const getAvatarUrl = (id: string, name: string, gender?: string) => {
  if (gender === "female") return `/avatar-female.svg`;
  if (gender === "male") return `/avatar-male.svg`;
  return `/avatar-male.svg`;
};

function VolunteerProfileContent({ v, tasks }: { v: VolunteerDoc, tasks: TaskDoc[] }) {
  const [showTasks, setShowTasks] = useState(false);
  const verifiedTasks = tasks.filter(t => t.assignedVolunteerId === v.id && t.status === "Verified");

  return (
    <DialogContent className="max-w-md p-6 sm:p-8 bg-[#f8fafc] border-none rounded-[24px] shadow-2xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-5 relative">
          <Avatar className="h-20 w-20 shadow-md border-4 border-white shrink-0">
            <AvatarImage src={getAvatarUrl(v.id || "", v.name, v.gender)} />
            <AvatarFallback>{v.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 pt-1">
            <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">{v.name}</h2>
            <p className="text-base text-slate-500 font-medium mt-0.5">{v.role}</p>
          </div>
        </div>

        {/* Skills */}
        <div className="flex gap-2.5">
          {v.skills.slice(0, 3).map(s => (
            <Badge key={s} variant="outline" className="bg-white border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm">{s}</Badge>
          ))}
          {v.skills.length > 3 && (
            <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm">+{v.skills.length - 3}</Badge>
          )}
        </div>

        {/* Info row */}
        <div className="flex justify-between items-center text-slate-500 text-sm font-medium px-1">
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" />{v.location}</div>
          <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />{v.phone || "No phone"}</div>
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" />{v.availability}</div>
        </div>

        {/* Languages row */}
        {v.languages && v.languages.length > 0 && (
          <div className="px-1 -mt-2 flex flex-wrap gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase mr-1 mt-0.5">Languages:</span>
            {v.languages.map(l => (
              <Badge key={l} variant="secondary" className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0 border-none">{l}</Badge>
            ))}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider mb-1">TASKS</p>
            <p className="text-2xl font-black text-slate-800">{v.tasksCompleted}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider mb-1">RATING</p>
            <p className="text-2xl font-black text-amber-500">{v.rating}</p>
          </div>
          <div className={`rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-white ${v.status === "Available" ? "bg-green-50/70" : "bg-amber-50/70"}`}>
            <p className="text-[11px] font-bold text-slate-400 tracking-wider mb-1">STATUS</p>
            <p className={`text-sm font-bold ${v.status === "Available" ? "text-green-600" : "text-amber-600"}`}>{v.status}</p>
          </div>
        </div>

        {/* Toggle Button for Tasks */}
        <Button 
          variant="outline" 
          className="w-full rounded-xl h-12 font-bold text-sm bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm transition-all"
          onClick={() => setShowTasks(!showTasks)}
        >
          {showTasks ? "Hide Verified Tasks" : `View Verified Tasks (${verifiedTasks.length})`}
        </Button>

        {/* Tasks List */}
        {showTasks && (
          <div className="space-y-3 mt-1 max-h-[260px] overflow-y-auto pr-2 pb-2 animate-in slide-in-from-top-2 fade-in">
            {verifiedTasks.length === 0 ? (
              <div className="text-center py-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                <p className="text-sm text-slate-500 font-medium">No verified tasks yet.</p>
              </div>
            ) : (
              verifiedTasks.map(vt => (
                <div key={vt.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4 transition-all hover:shadow-md">
                  {vt.feedback?.imageUrl ? (
                    <img src={vt.feedback.imageUrl} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 shadow-sm" alt="Proof" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl border border-green-100 bg-green-50/50 flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-bold text-slate-800 leading-snug">{vt.title}</p>
                    <p className="text-[13px] text-slate-500 mt-1.5 italic line-clamp-2">"{vt.feedback?.note || "Mission completed and verified."}"</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </DialogContent>
  );
}

export default function VolunteersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [aiMatches, setAiMatches] = useState<MatchVolunteersOutput | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackTask, setFeedbackTask] = useState({ id: "", title: "" });
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerDoc[]>([]);
  const [needs, setNeeds] = useState<NeedDoc[]>([]);

  // Assign Task Dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerDoc | null>(null);
  const [selectedNeedId, setSelectedNeedId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const { userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userRole === "Volunteer") router.replace("/dashboard/missions");
  }, [userRole, router]);

  useEffect(() => {
    const unsubTasks = subscribeToTasks(setTasks);
    const unsubVols = subscribeToVolunteers(setVolunteers);
    const unsubNeeds = subscribeToNeeds(setNeeds);
    return () => { unsubTasks(); unsubVols(); unsubNeeds(); };
  }, []);

  if (userRole === "Volunteer") return null;

  const filtered = volunteers.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.skills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openNeeds = needs.filter(n => n.status === "Open");

  function openAssignDialog(vol: VolunteerDoc) {
    setSelectedVolunteer(vol);
    setSelectedNeedId("");
    setAssignDialogOpen(true);
  }

  async function handleAssignTask() {
    if (!selectedVolunteer || !selectedNeedId) {
      toast({ title: "Please select a need first", variant: "destructive" });
      return;
    }
    const need = needs.find(n => n.id === selectedNeedId);
    if (!need) return;

    setIsAssigning(true);
    try {
      await addTask({
        needId: selectedNeedId,
        title: need.description,
        assignedVolunteerId: selectedVolunteer.id || "",
        assignedVolunteerName: selectedVolunteer.name,
        status: "Pending",
        priority: need.priority,
        location: need.location,
        lat: need.lat,
        lng: need.lng,
        progress: 0,
        eta: "ETA pending",
      });
      setAssignDialogOpen(false);
      toast({
        title: `Task Assigned to ${selectedVolunteer.name} ✓`,
        description: `Mission: "${need.description.substring(0, 50)}..." is now live.`,
      });
    } catch (err: any) {
      toast({ title: "Assignment failed", description: err.message, variant: "destructive" });
    } finally {
      setIsAssigning(false);
    }
  }

  async function runAiMatch() {
    setIsMatching(true);
    setAiMatches(null);
    try {
      const result = await matchVolunteers({
        tasks: openNeeds.slice(0, 3).map(n => ({
          id: n.id || "",
          description: n.description,
          requiredSkills: [],
          location: { latitude: n.lat || 17.44, longitude: n.lng || 78.35 },
          priority: n.priority,
          urgencyScore: n.priority === "High" ? 9 : n.priority === "Medium" ? 5 : 2,
        })),
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

  const volunteerMap = Object.fromEntries(volunteers.map((v) => [v.id, v]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">Volunteer Hub</h1>
          <p className="text-muted-foreground">Manage and dispatch volunteers for community tasks.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><MessageSquare className="h-4 w-4" /> Broadcast Alert</Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <TabsList className="bg-white/50 border">
            <TabsTrigger value="all">
              All Volunteers
              <span className="ml-1.5 w-5 h-5 bg-muted text-foreground text-[9px] rounded-full flex items-center justify-center font-bold">
                {volunteers.length}
              </span>
            </TabsTrigger>
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
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No volunteers yet.</p>
              <p className="text-sm">Visit <a href="/seed" className="text-primary underline">/seed</a> to load demo volunteer data.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((v) => (
                <Card key={v.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarImage src={getAvatarUrl(v.id || "", v.name, v.gender)} />
                        <AvatarFallback className="text-lg font-bold">{v.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Badge className={`text-[10px] ${v.status === "Available" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`} variant="outline">
                        {v.status === "Available" ? "● Available" : "● Busy"}
                      </Badge>
                    </div>
                    <CardTitle className="font-headline text-base mt-2">{v.name}</CardTitle>
                    <CardDescription className="text-[10px] font-medium text-primary uppercase tracking-tight">{v.role}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {v.skills.slice(0, 3).map((s) => <Badge key={s} variant="outline" className="text-[10px] py-0">{s}</Badge>)}
                      {v.skills.length > 3 && <Badge variant="outline" className="text-[10px] py-0">+{v.skills.length - 3}</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" />{v.location.split(",")[0]}</div>
                      <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{v.availability}</div>
                      <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-accent" />{v.tasksCompleted} tasks done</div>
                      <div className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500 fill-amber-500" />{v.rating} / 5.0</div>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0 flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 text-xs">Profile</Button>
                      </DialogTrigger>
                      <VolunteerProfileContent v={v} tasks={tasks} />
                    </Dialog>
                    <Button
                      size="sm"
                      className="flex-1 text-xs gap-1"
                      disabled={v.status !== "Available"}
                      onClick={() => openAssignDialog(v)}
                    >
                      <Zap className="h-3 w-3" /> Assign Task
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
              <CardDescription>AI analyzes open high-priority needs and available volunteers to find optimal matches based on skill, location, and urgency.</CardDescription>
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
                  const matchedNeed = needs.find(n => n.id === match.taskId);
                  return (
                    <div key={i} className="bg-white rounded-xl p-4 border border-primary/10 shadow-sm">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                            <p className="text-sm font-bold">{matchedNeed?.description ?? match.taskId}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-6">
                            <CheckCheck className="h-4 w-4 text-accent shrink-0" />
                            <p className="text-sm">
                              Matched: <span className="font-semibold">{volunteer?.name ?? match.volunteerId}</span>
                              {volunteer?.distance && <span className="text-xs text-muted-foreground ml-1">· {volunteer.distance} away</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-1">
                                <Sparkles className="h-3 w-3" /> Why?
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 font-headline">
                                  <Sparkles className="h-5 w-5 text-primary" /> Matching Explanation
                                </DialogTitle>
                              </DialogHeader>
                              <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary text-sm italic text-muted-foreground leading-relaxed">
                                &ldquo;{match.reason}&rdquo;
                              </div>
                            </DialogContent>
                          </Dialog>
                          {volunteer && (
                            <Button size="sm" className="gap-1" onClick={() => openAssignDialog(volunteer)}>
                              <Zap className="h-3 w-3" /> Dispatch
                            </Button>
                          )}
                        </div>
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
                  <p className="text-sm">&ldquo;Run AI Match&rdquo; to generate intelligent recommendations</p>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Active Tasks */}
        <TabsContent value="active" className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No tasks dispatched yet.</p>
            </div>
          ) : (
            tasks.map((task) => (
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
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getAvatarUrl(task.assignedVolunteerId, task.assignedVolunteerName, volunteerMap[task.assignedVolunteerId]?.gender)} />
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
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Assign Task Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-3">
              {selectedVolunteer && (
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={getAvatarUrl(selectedVolunteer.id || "", selectedVolunteer.name, selectedVolunteer.gender)} />
                  <AvatarFallback className="text-lg">{selectedVolunteer.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              Assign Task to {selectedVolunteer?.name}
            </DialogTitle>
            <DialogDescription>
              Select an open community need from the database to dispatch to this volunteer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {selectedVolunteer && (
              <div className="flex flex-wrap gap-1 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs font-semibold text-muted-foreground w-full mb-1">Volunteer Skills:</p>
                {selectedVolunteer.skills.map(s => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Select Need to Assign</Label>
              {openNeeds.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No open needs found. Submit a field report first.</p>
              ) : (
                <Select value={selectedNeedId} onValueChange={setSelectedNeedId}>
                  <SelectTrigger className="h-auto">
                    <SelectValue placeholder="Choose a community need..." />
                  </SelectTrigger>
                  <SelectContent>
                    {openNeeds.map(n => (
                      <SelectItem key={n.id} value={n.id!}>
                        <div className="py-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={n.priority === "High" ? "destructive" : "secondary"} className="text-[9px]">{n.priority}</Badge>
                            <span className="font-medium text-xs">{n.description.substring(0, 50)}{n.description.length > 50 ? "..." : ""}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 ml-1">{n.location}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAssignTask}
              disabled={isAssigning || !selectedNeedId}
              className="gap-2"
            >
              {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {isAssigning ? "Dispatching..." : "Dispatch Mission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
