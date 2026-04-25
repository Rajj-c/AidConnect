"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  subscribeToOpenTasksByNGO, selfAssignTask, TaskDoc, VolunteerDoc,
} from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package, Truck, HeartHandshake, MapPin, Clock, CheckCircle2,
  Loader2, ClipboardList, Star
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { TaskType } from "@/lib/firestore";

const TYPE_ICON: Record<TaskType, React.ReactNode> = {
  Collection: <Package className="h-3.5 w-3.5" />,
  Distribution: <Truck className="h-3.5 w-3.5" />,
  Service: <HeartHandshake className="h-3.5 w-3.5" />,
};

const TYPE_COLOR: Record<TaskType, string> = {
  Collection: "bg-blue-100 text-blue-700 border-blue-200",
  Distribution: "bg-green-100 text-green-700 border-green-200",
  Service: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function AvailableTasksPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<VolunteerDoc | null>(null);

  useEffect(() => {
    if (userRole !== "Volunteer" || !user) { router.replace("/dashboard/missions"); return; }
    // Get volunteer profile to find their ngoId
    const volRef = doc(db!, "volunteers", user.uid);
    getDoc(volRef).then(snap => {
      if (snap.exists()) {
        const vol = snap.data() as VolunteerDoc;
        setMyProfile(vol);
        if (vol.ngoId) {
          return subscribeToOpenTasksByNGO(vol.ngoId, setTasks);
        }
      }
    });
  }, [user, userRole, router]);

  async function handleClaim(task: TaskDoc) {
    if (!task.id || !user) return;
    if (myProfile?.status === "Busy") {
      toast({ title: "You have an active task", description: "Complete your current task before picking a new one.", variant: "destructive" });
      return;
    }
    setClaimingId(task.id);
    try {
      await selfAssignTask(task.id, user.uid, user.displayName ?? "Volunteer");
      toast({ title: "Task Claimed ✓", description: `You've picked up "${task.title}". Check My Missions.` });
    } catch {
      toast({ title: "Error", description: "Could not claim this task.", variant: "destructive" });
    } finally {
      setClaimingId(null);
    }
  }

  // Check skill match
  function matchScore(task: TaskDoc): number {
    if (!myProfile || task.skillsRequired.length === 0) return 0;
    const matched = task.skillsRequired.filter(s => myProfile.skills?.includes(s));
    return Math.round((matched.length / task.skillsRequired.length) * 100);
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-primary" /> Available Tasks
        </h1>
        <p className="text-muted-foreground mt-1">
          Open tasks from your NGO — pick one up to get started.
        </p>
      </div>

      {!myProfile?.ngoId && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed text-muted-foreground">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Not assigned to an NGO yet</p>
          <p className="text-sm mt-1">Once an Admin assigns you to an NGO, tasks will appear here.</p>
        </div>
      )}

      {myProfile?.ngoId && tasks.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30 text-green-500" />
          <p className="font-medium">No open tasks right now</p>
          <p className="text-sm mt-1">Check back later or ask your NGO coordinator.</p>
        </div>
      )}

      <div className="space-y-4">
        {tasks.map(task => {
          const score = matchScore(task);
          const matchedSkills = myProfile?.skills?.filter(s => task.skillsRequired.includes(s)) ?? [];

          return (
            <Card key={task.id} className="border-none shadow-sm bg-white overflow-hidden">
              <div className={`h-1 w-full ${
                task.priority === "High" ? "bg-red-400" :
                task.priority === "Medium" ? "bg-yellow-400" : "bg-green-400"
              }`} />
              <CardContent className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <Badge variant="outline" className={`text-[10px] gap-1 ${TYPE_COLOR[task.taskType]}`}>
                        {TYPE_ICON[task.taskType]} {task.taskType}
                      </Badge>
                      <Badge className={`text-[10px] border-0 ${
                        task.priority === "High" ? "bg-red-100 text-red-700" :
                        task.priority === "Medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>{task.priority}</Badge>
                      <Badge className="text-[10px] border-0 bg-slate-100 text-slate-600">{task.category}</Badge>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>
                  {score > 0 && (
                    <div className="shrink-0 text-center bg-primary/5 rounded-xl p-2.5 min-w-[56px]">
                      <Star className="h-3.5 w-3.5 text-primary mx-auto mb-0.5" />
                      <p className="text-base font-black text-primary">{score}%</p>
                      <p className="text-[9px] text-muted-foreground">match</p>
                    </div>
                  )}
                </div>

                {/* Location & deadline */}
                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{task.location}</span>
                  {task.deadline && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Due {formatDistanceToNow((task.deadline as any).toDate?.() ?? task.deadline, { addSuffix: true })}
                    </span>
                  )}
                </div>

                {/* Skill match */}
                {task.skillsRequired.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Skills Needed</p>
                    <div className="flex flex-wrap gap-1">
                      {task.skillsRequired.map(s => (
                        <Badge
                          key={s}
                          variant="outline"
                          className={`text-[10px] ${matchedSkills.includes(s) ? "bg-green-50 text-green-700 border-green-200" : "bg-white"}`}
                        >
                          {matchedSkills.includes(s) && "✓ "}{s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Claim button */}
                <Button
                  className="w-full gap-2"
                  onClick={() => handleClaim(task)}
                  disabled={claimingId === task.id || myProfile?.status === "Busy"}
                >
                  {claimingId === task.id
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Claiming...</>
                    : myProfile?.status === "Busy"
                    ? "Complete your current task first"
                    : <><CheckCircle2 className="h-4 w-4" /> Take This Task</>
                  }
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
