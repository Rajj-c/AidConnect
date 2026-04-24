"use client";

import { useEffect, useState, useRef } from "react";
import { subscribeToTasks, submitTaskFeedback, updateTaskStatus, addNotification, TaskDoc } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Map as MapIcon, Clock, AlertTriangle, Navigation, Route, Camera, UploadCloud, FileImage } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { VolunteerChatbot } from "@/components/VolunteerChatbot";

export default function VolunteerMissionsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [sosActive, setSosActive] = useState(false);
  
  // Proof Upload State
  const [proofTask, setProofTask] = useState<TaskDoc | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return subscribeToTasks(setTasks);
  }, []);

  const myTasks = tasks.filter(t => t.assignedVolunteerId === user?.uid || (user && t.assignedVolunteerName === user.displayName));
  const completedCount = myTasks.filter(t => t.status === "Completed").length;
  const peopleHelped = completedCount * 15;

  async function handleStatusUpdate(taskId: string, newStatus: TaskDoc["status"]) {
    try {
      await updateTaskStatus(taskId, newStatus);
      toast({ title: `Status updated to ${newStatus}`, description: "The command centre has been notified." });
    } catch {
      toast({ title: "Error", description: "Failed to update mission status.", variant: "destructive" });
    }
  }

  // Compress image so it fits within Firestore limits (max 1MB doc)
  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setProofImage(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmitProof() {
    if (!proofTask?.id) return;
    setIsSubmitting(true);
    try {
      await submitTaskFeedback(proofTask.id, { 
        rating: 5, 
        success: true, 
        note: proofNote || "Completed via volunteer field app",
        imageUrl: proofImage || undefined
      });
      toast({ title: "Mission Accomplished ✓", description: "Proof uploaded. The NGO has been notified." });
      setProofTask(null);
      setProofImage(null);
      setProofNote("");
    } catch {
      toast({ title: "Error", description: "Failed to upload proof.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSOS() {
    if (!user) return;
    setSosActive(true);
    try {
      await addNotification({
        title: "🆘 EMERGENCY SOS",
        description: `Volunteer ${user.displayName} triggered an SOS alert in the field! Immediate assistance required.`,
        type: "alert",
        read: false
      });
      toast({ title: "SOS Alert Broadcasted", description: "The admin command centre has received your emergency ping.", variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Failed to send SOS.", variant: "destructive" });
    }
    setTimeout(() => setSosActive(false), 5000);
  }

  // Pipeline Logic Helper
  const getNextAction = (task: TaskDoc) => {
    switch (task.status) {
      case "Pending": return { label: "Acknowledge Task", action: () => handleStatusUpdate(task.id!, "Acknowledged"), icon: <CheckCircle2 className="w-4 h-4" /> };
      case "Acknowledged": return { label: "Start Travel", action: () => handleStatusUpdate(task.id!, "En Route"), icon: <Navigation className="w-4 h-4" /> };
      case "En Route": return { label: "Arrived On Site", action: () => handleStatusUpdate(task.id!, "On Site"), icon: <MapIcon className="w-4 h-4" /> };
      case "On Site": 
      case "In Progress": return { label: "Capture Proof & Complete", action: () => setProofTask(task), icon: <Camera className="w-4 h-4" /> };
      case "Completed": return { label: "Mission Accomplished", action: () => {}, icon: <CheckCircle2 className="w-4 h-4 text-accent" />, disabled: true };
      default: return { label: "Acknowledge Task", action: () => handleStatusUpdate(task.id!, "Acknowledged"), icon: <CheckCircle2 className="w-4 h-4" /> };
    }
  };

  const getProgress = (status: string) => {
    switch(status) {
      case "Pending": return 0;
      case "Acknowledged": return 10;
      case "En Route": return 40;
      case "On Site": 
      case "In Progress": return 75;
      case "Completed": return 100;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">Field Operations</h1>
          <p className="text-muted-foreground">Manage your assigned missions and field status.</p>
        </div>
        <Button 
          onClick={handleSOS} 
          variant="destructive" 
          size="lg" 
          className={`gap-2 font-bold transition-all ${sosActive ? "animate-pulse scale-105 ring-4 ring-red-500/50" : "shadow-lg"}`}
        >
          <AlertTriangle className="h-5 w-5" />
          {sosActive ? "SOS BROADCASTED" : "EMERGENCY SOS PING"}
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border-none shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Your Monthly Impact</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-headline text-foreground">{completedCount}</span>
              <span className="text-sm text-muted-foreground font-medium">Missions</span>
              <span className="text-3xl font-bold font-headline text-accent ml-4">~{peopleHelped}</span>
              <span className="text-sm text-muted-foreground font-medium">People Assisted</span>
            </div>
          </div>
          <div className="hidden sm:flex h-12 w-12 rounded-full bg-white items-center justify-center shadow-inner">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          </div>
        </CardContent>
      </Card>

      {myTasks.length === 0 ? (
        <Card className="border-none shadow-sm text-center py-12">
          <CardContent>
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-1">No Active Missions</h3>
            <p className="text-muted-foreground text-sm">You are currently on standby. The dispatcher will assign you a task when an urgent need arises.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {myTasks.sort((a,b) => (a.status === "Completed" ? 1 : -1)).map(task => {
            const nextAction = getNextAction(task);
            const currentProgress = getProgress(task.status);
            
            return (
            <Card key={task.id} className="border-none shadow-md overflow-hidden bg-white">
              <div className="flex flex-col sm:flex-row">
                <div className={`h-2 sm:h-auto sm:w-2 shrink-0 ${task.priority === "High" ? "bg-destructive" : task.priority === "Medium" ? "bg-amber-400" : "bg-primary"}`} />
                <div className="flex-1 p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex gap-2 mb-2">
                        <Badge variant="outline" className={`text-[10px] ${task.status === "In Progress" || task.status === "En Route" || task.status === "On Site" ? "bg-blue-50 text-blue-700 border-blue-200" : task.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50"}`}>
                          {task.status.toUpperCase()}
                        </Badge>
                        <Badge variant={task.priority === "High" ? "destructive" : "secondary"} className="text-[10px]">
                          {task.priority} Priority
                        </Badge>
                      </div>
                      <h3 className="font-bold font-headline text-xl">{task.title}</h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground mb-5 bg-muted/20 p-3 rounded-lg border">
                    <div className="flex items-center gap-2"><MapIcon className="h-4 w-4 shrink-0" /> <span className="truncate">{task.location}</span></div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" /> ETA: {task.eta || "ASAP"}</div>
                  </div>

                  {task.status !== "Completed" && (
                    <div className="mb-5">
                      <div className="flex justify-between text-xs mb-1.5 font-medium text-muted-foreground">
                        <span>Mission Pipeline</span>
                        <span>{currentProgress}%</span>
                      </div>
                      <Progress value={currentProgress} className="h-2.5" />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium px-1">
                        <span className={currentProgress >= 10 ? "text-primary" : ""}>Ack</span>
                        <span className={currentProgress >= 40 ? "text-primary" : ""}>Travel</span>
                        <span className={currentProgress >= 75 ? "text-primary" : ""}>On Site</span>
                        <span className={currentProgress >= 100 ? "text-primary" : ""}>Done</span>
                      </div>
                    </div>
                  )}

                  {/* Render Proof Image if Completed */}
                  {task.status === "Completed" && task.feedback?.imageUrl && (
                    <div className="mb-5 bg-muted/30 rounded-xl p-3 border">
                      <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-2">
                        <FileImage className="h-4 w-4" /> FIELD PROOF CAPTURED
                      </p>
                      <img src={task.feedback.imageUrl} alt="Task Completion Proof" className="w-full h-48 object-cover rounded-lg shadow-sm border" />
                      {task.feedback.note && <p className="text-sm mt-3 italic text-muted-foreground">"{task.feedback.note}"</p>}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t">
                    {task.status !== "Completed" && (
                      <Button 
                        variant="outline" 
                        className="sm:w-1/3 gap-2"
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${task.lat || ''},${task.lng || ''}`)}
                      >
                        <Route className="w-4 h-4" /> Get Directions
                      </Button>
                    )}
                    <Button 
                      className="flex-1 gap-2" 
                      variant={task.status === "Completed" ? "secondary" : "default"}
                      disabled={nextAction.disabled}
                      onClick={nextAction.action}
                    >
                      {nextAction.icon}
                      {nextAction.label}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )})}
        </div>
      )}

      {/* Proof Capture Modal */}
      <Dialog open={!!proofTask} onOpenChange={(open) => !open && setProofTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">Mission Complete Verification</DialogTitle>
            <DialogDescription>
              Capture a photo of the completed task or delivery for the NGO Admin logs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageCapture} 
            />
            
            {proofImage ? (
              <div className="relative rounded-xl overflow-hidden border bg-muted group">
                <img src={proofImage} alt="Preview" className="w-full h-48 object-cover" />
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setProofImage(null)}
                >
                  Retake
                </Button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center bg-primary/5 text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Camera className="h-10 w-10 mb-3 opacity-80" />
                <span className="font-medium text-sm">Tap to Open Camera</span>
                <span className="text-xs opacity-70 mt-1">(or upload from gallery)</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Field Notes (Optional)</label>
              <Textarea 
                placeholder="e.g., Handed over 50 supplies to the block leader..." 
                value={proofNote}
                onChange={(e) => setProofNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProofTask(null)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmitProof} disabled={!proofImage || isSubmitting} className="gap-2">
              {isSubmitting ? "Uploading..." : <><UploadCloud className="h-4 w-4" /> Submit Verification</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VolunteerChatbot />
    </div>
  );
}
