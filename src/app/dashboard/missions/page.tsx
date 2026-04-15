"use client";

import { useEffect, useState } from "react";
import { subscribeToTasks, submitTaskFeedback, TaskDoc } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Map as MapIcon, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function VolunteerMissionsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDoc[]>([]);

  useEffect(() => {
    return subscribeToTasks(setTasks);
  }, []);

  const myTasks = tasks.filter(t => t.assignedVolunteerId === user?.uid || (user && t.assignedVolunteerName === user.displayName));

  async function handleCompleteTask(taskId: string) {
    try {
      await submitTaskFeedback(taskId, { rating: 5, success: true, note: "Completed via volunteer dashboard" });
      toast({ title: "Mission Accomplished ✓", description: "Great work! The NGO has been notified." });
    } catch {
      toast({ title: "Error", description: "Failed to update mission status.", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline text-foreground">My Missions</h1>
        <p className="text-muted-foreground">View and complete your assigned field operations.</p>
      </div>

      {myTasks.length === 0 ? (
        <Card className="border-none shadow-sm text-center py-12">
          <CardContent>
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-1">No Active Missions</h3>
            <p className="text-muted-foreground text-sm">You are currently on standby. The dispatcher will assign you a task when an urgent need arises.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {myTasks.map(task => (
            <Card key={task.id} className="border-none shadow-md overflow-hidden bg-white">
              <div className="flex">
                <div className={`w-2 shrink-0 ${task.priority === "High" ? "bg-destructive" : task.priority === "Medium" ? "bg-amber-400" : "bg-primary"}`} />
                <div className="flex-1 p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex gap-2 mb-2">
                        <Badge variant="outline" className={`text-[10px] ${task.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" : task.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50"}`}>
                          {task.status}
                        </Badge>
                        <Badge variant={task.priority === "High" ? "destructive" : "secondary"} className="text-[10px]">
                          {task.priority} Priority
                        </Badge>
                      </div>
                      <h3 className="font-bold font-headline text-lg">{task.title}</h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-4 bg-muted/20 p-3 rounded-lg border">
                    <div className="flex items-center gap-2"><MapIcon className="h-4 w-4" /> {task.location}</div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {task.eta || "ASAP"}</div>
                  </div>

                  {task.status !== "Completed" && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1 font-medium">
                        <span>Current Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                    </div>
                  )}

                  <div className="flex gap-3 mt-4 pt-4 border-t">
                    <Button 
                      className="flex-1 gap-2" 
                      variant={task.status === "Completed" ? "outline" : "default"}
                      disabled={task.status === "Completed"}
                      onClick={() => task.id && handleCompleteTask(task.id)}
                    >
                      {task.status === "Completed" ? <><CheckCircle2 className="h-4 w-4 text-accent" /> Completed</> : "Mark Mission Complete"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
