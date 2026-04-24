"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToVolunteersByNGO, VolunteerDoc, TaskDoc, subscribeToTasks } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, Star, CheckCircle2, Clock, MapPin, Phone, Plus, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

const getAvatarUrl = (gender?: string) => gender === "female" ? "/avatar-female.svg" : "/avatar-male.svg";

export default function MyVolunteersPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<VolunteerDoc[]>([]);
  const [allTasks, setAllTasks] = useState<TaskDoc[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedVol, setSelectedVol] = useState<VolunteerDoc | null>(null);
  const [saving, setSaving] = useState(false);

  // Task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskLocation, setTaskLocation] = useState("");
  const [taskPriority, setTaskPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [taskDescription, setTaskDescription] = useState("");

  useEffect(() => {
    if (userRole !== "NGO" || !user) { router.replace("/dashboard"); return; }
    const unsub = subscribeToVolunteersByNGO(user.uid, setVolunteers);
    const unsubTasks = subscribeToTasks(setAllTasks);
    return () => { unsub(); unsubTasks(); };
  }, [userRole, user, router]);

  const openAssign = (v: VolunteerDoc) => {
    setSelectedVol(v);
    setTaskTitle(""); setTaskLocation(""); setTaskPriority("Medium"); setTaskDescription("");
    setAssignOpen(true);
  };

  async function handleAssignTask() {
    if (!selectedVol || !taskTitle || !taskLocation || !user || !db) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "tasks"), {
        needId: "manual",
        title: taskTitle,
        assignedVolunteerId: selectedVol.userId,
        assignedVolunteerName: selectedVol.name,
        status: "Pending",
        priority: taskPriority,
        location: taskLocation,
        progress: 0,
        ngoId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Task Assigned ✓", description: `${taskTitle} has been sent to ${selectedVol.name}.` });
      setAssignOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const getVolunteerTasks = (vol: VolunteerDoc) =>
    allTasks.filter(t => t.assignedVolunteerId === vol.userId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> My Volunteers
          </h1>
          <p className="text-muted-foreground mt-1">
            {volunteers.length} volunteer{volunteers.length !== 1 ? "s" : ""} assigned to your NGO.
          </p>
        </div>
      </div>

      {volunteers.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-xl border border-dashed text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No volunteers yet</p>
          <p className="text-sm">Volunteers will appear here once Admin assigns them to your NGO.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {volunteers.map(v => {
            const volTasks = getVolunteerTasks(v);
            const completedCount = volTasks.filter(t => t.status === "Verified" || t.status === "Completed").length;
            const activeCount = volTasks.filter(t => !["Verified", "Completed", "Failed"].includes(t.status)).length;

            return (
              <Card key={v.id} className="border-none shadow-sm bg-white overflow-hidden">
                <div className={`h-1 ${v.status === "Available" ? "bg-green-400" : "bg-amber-400"}`} />
                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                      <AvatarImage src={getAvatarUrl(v.gender)} />
                      <AvatarFallback className="text-primary font-bold text-lg">{v.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-base">{v.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-muted-foreground">{v.location}</span>
                      </div>
                      {v.phone && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs text-muted-foreground">{v.phone}</span>
                        </div>
                      )}
                    </div>
                    <Badge className={`self-start text-[10px] shrink-0 ${v.status === "Available" ? "bg-green-100 text-green-700 border-green-200" : "bg-amber-100 text-amber-700 border-amber-200"}`} variant="outline">
                      {v.status}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 rounded-xl p-2.5 border">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Done</p>
                      <p className="text-lg font-black text-slate-800">{v.tasksCompleted}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 border">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Rating</p>
                      <p className="text-lg font-black text-amber-500 flex items-center justify-center gap-0.5">
                        <Star className="h-3.5 w-3.5 fill-current" />{v.rating}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 border">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Active</p>
                      <p className="text-lg font-black text-blue-600">{activeCount}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  {v.skills && v.skills.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Field Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {v.skills.slice(0, 5).map(s => <Badge key={s} variant="outline" className="text-[10px] bg-white">{s}</Badge>)}
                        {v.skills.length > 5 && <Badge variant="outline" className="text-[10px]">+{v.skills.length - 5}</Badge>}
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {v.availability}
                  </div>

                  {/* Assign Task Button */}
                  <Button
                    onClick={() => openAssign(v)}
                    disabled={v.status !== "Available"}
                    className="w-full gap-2 h-10"
                    variant={v.status === "Available" ? "default" : "outline"}
                  >
                    <Plus className="h-4 w-4" />
                    {v.status === "Available" ? "Assign New Task" : "Volunteer is Busy"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Task Modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Assign Task to {selectedVol?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 rounded-xl p-3 border">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Matching Skills</p>
              <div className="flex flex-wrap gap-1">
                {selectedVol?.skills.map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {selectedVol?.availability}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Task Title *</Label>
              <Input placeholder="e.g., Distribute food packets at shelter" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input placeholder="e.g., Gandhi Nagar Community Centre" value={taskLocation} onChange={e => setTaskLocation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={taskPriority} onValueChange={v => setTaskPriority(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">🔴 High Priority</SelectItem>
                  <SelectItem value="Medium">🟡 Medium Priority</SelectItem>
                  <SelectItem value="Low">🟢 Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea placeholder="Any special instructions..." value={taskDescription} onChange={e => setTaskDescription(e.target.value)} rows={2} />
            </div>
            <Button onClick={handleAssignTask} disabled={saving || !taskTitle || !taskLocation} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {saving ? "Assigning..." : "Confirm Assignment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
