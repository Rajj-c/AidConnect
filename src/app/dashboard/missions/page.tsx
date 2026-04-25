"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToMyTasks, submitTaskFeedback, updateTaskStatus,
  addFieldEntry, addNotification, TaskDoc, TaskType,
  CollectionEntry, DistributionEntry, ServiceEntry
} from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2, Map as MapIcon, Clock, AlertTriangle, Navigation,
  Camera, UploadCloud, Plus, Package, Truck, HeartHandshake, MessageCircle, FileImage
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TaskChatDialog } from "@/components/TaskChatDialog";

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

function getProgress(status: string) {
  switch (status) {
    case "Assigned": return 10;
    case "In Progress": return 60;
    case "Completed": return 100;
    default: return 0;
  }
}

function getNextAction(task: TaskDoc, onLog: () => void, onComplete: () => void) {
  switch (task.status) {
    case "Assigned":
      return { label: "Start Task", action: () => {}, status: "In Progress" as TaskDoc["status"], icon: <Navigation className="w-4 h-4" /> };
    case "In Progress":
      return null; // handled by buttons below
    default:
      return null;
  }
}

export default function VolunteerMissionsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [sosActive, setSosActive] = useState(false);

  // Field log dialog state
  const [logTask, setLogTask] = useState<TaskDoc | null>(null);
  // Collection fields
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorAddress, setDonorAddress] = useState("");
  const [itemType, setItemType] = useState("Clothes");
  const [quantity, setQuantity] = useState("");
  const [beneficiaryCount, setBeneficiaryCount] = useState("");
  const [condition, setCondition] = useState("Good");
  // Distribution fields
  const [recipientName, setRecipientName] = useState("");
  const [recipientArea, setRecipientArea] = useState("");
  const [quantityGiven, setQuantityGiven] = useState("");
  // Service fields
  const [venue, setVenue] = useState("");
  const [serviceType, setServiceType] = useState("Medical Consultation");
  const [peopleServed, setPeopleServed] = useState("");
  const [duration, setDuration] = useState("");
  // Shared
  const [entryNotes, setEntryNotes] = useState("");
  const [entryPhoto, setEntryPhoto] = useState<string | null>(null);
  const [savingEntry, setSavingEntry] = useState(false);
  const entryFileRef = useRef<HTMLInputElement>(null);

  // Proof / completion dialog
  const [proofTask, setProofTask] = useState<TaskDoc | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const proofFileRef = useRef<HTMLInputElement>(null);

  // Chat dialog
  const [chatTask, setChatTask] = useState<TaskDoc | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeToMyTasks(user.uid, setTasks);
  }, [user]);

  const activeTasks = tasks.filter(t => t.status !== "Verified");
  const completedCount = tasks.filter(t => t.status === "Verified" || t.status === "Completed").length;

  async function handleStatusUpdate(taskId: string, status: TaskDoc["status"]) {
    try {
      await updateTaskStatus(taskId, status);
      toast({ title: `Status → ${status}` });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  function handleImageCapture(file: File | undefined, setter: (s: string | null) => void) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        const scale = MAX / img.width;
        canvas.width = MAX; canvas.height = img.height * scale;
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setter(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function resetLogForm() {
    setDonorName(""); setDonorPhone(""); setDonorAddress(""); setItemType("Clothes");
    setQuantity(""); setBeneficiaryCount(""); setCondition("Good");
    setRecipientName(""); setRecipientArea(""); setQuantityGiven("");
    setVenue(""); setServiceType("Medical Consultation"); setPeopleServed(""); setDuration("");
    setEntryNotes(""); setEntryPhoto(null);
  }

  async function handleSaveEntry() {
    if (!logTask?.id || !user) return;
    setSavingEntry(true);
    try {
      const base = { loggedBy: user.uid, loggedByName: user.displayName ?? "Volunteer", notes: entryNotes || undefined, photo: entryPhoto || undefined };

      if (logTask.taskType === "Collection") {
        const entry: Omit<CollectionEntry, "id"> = {
          entryType: "Collection", donorName, donorPhone: donorPhone || undefined,
          donorAddress: donorAddress || undefined, itemType: itemType as any,
          quantity: Number(quantity), beneficiaryCount: Number(beneficiaryCount),
          condition: condition as any, loggedAt: null, ...base,
        };
        await addFieldEntry(logTask.id, entry);
      } else if (logTask.taskType === "Distribution") {
        const entry: Omit<DistributionEntry, "id"> = {
          entryType: "Distribution", recipientName, recipientArea: recipientArea || undefined,
          itemType: itemType as any, quantityGiven: Number(quantityGiven),
          beneficiaryCount: Number(beneficiaryCount), loggedAt: null, ...base,
        };
        await addFieldEntry(logTask.id, entry);
      } else {
        const entry: Omit<ServiceEntry, "id"> = {
          entryType: "Service", venue, serviceType: serviceType as any,
          peopleServedCount: Number(peopleServed),
          durationMinutes: duration ? Number(duration) : undefined,
          loggedAt: null, ...base,
        };
        await addFieldEntry(logTask.id, entry);
      }

      toast({ title: "Entry Logged ✓", description: "Your NGO can see this update live." });
      resetLogForm();
      setLogTask(null);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSavingEntry(false);
    }
  }

  async function handleSubmitProof() {
    if (!proofTask?.id) return;
    setSubmitting(true);
    try {
      await submitTaskFeedback(proofTask.id, {
        rating: 5, success: true,
        note: proofNote || "Completed via volunteer app",
        imageUrl: proofImage || undefined,
      });
      toast({ title: "Task Submitted ✓", description: "Waiting for NGO verification." });
      setProofTask(null); setProofImage(null); setProofNote("");
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSOS() {
    if (!user) return;
    setSosActive(true);
    await addNotification({ title: "🆘 EMERGENCY SOS", description: `Volunteer ${user.displayName} triggered SOS!`, type: "alert", read: false });
    toast({ title: "SOS Broadcasted", variant: "destructive" });
    setTimeout(() => setSosActive(false), 5000);
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">My Missions</h1>
          <p className="text-muted-foreground">{activeTasks.length} active · {completedCount} completed</p>
        </div>
        <Button onClick={handleSOS} variant="destructive" size="lg"
          className={`gap-2 font-bold ${sosActive ? "animate-pulse ring-4 ring-red-500/50" : "shadow-lg"}`}>
          <AlertTriangle className="h-5 w-5" />
          {sosActive ? "SOS BROADCASTED" : "EMERGENCY SOS"}
        </Button>
      </div>

      {activeTasks.length === 0 && (
        <Card className="border-none shadow-sm text-center py-12">
          <CardContent>
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-1">No Active Missions</h3>
            <p className="text-muted-foreground text-sm">Check "Available Tasks" to pick up a task from your NGO.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-5">
        {activeTasks.map(task => {
          const progress = getProgress(task.status);
          const summary = task.fieldSummary;

          return (
            <Card key={task.id} className="border-none shadow-md bg-white overflow-hidden">
              <div className={`h-1.5 w-full ${task.priority === "High" ? "bg-red-400" : task.priority === "Medium" ? "bg-yellow-400" : "bg-green-400"}`} />
              <CardContent className="p-5 space-y-4">
                {/* Badges & title */}
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {task.taskType && (
                      <Badge variant="outline" className={`text-[10px] gap-1 ${TYPE_COLOR[task.taskType]}`}>
                        {TYPE_ICON[task.taskType]} {task.taskType}
                      </Badge>
                    )}
                    <Badge className={`text-[10px] border-0 ${
                      task.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                      task.status === "Completed" ? "bg-orange-100 text-orange-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>{task.status}</Badge>
                    <Badge className={`text-[10px] border-0 ${task.priority === "High" ? "bg-red-100 text-red-700" : task.priority === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                      {task.priority}
                    </Badge>
                  </div>
                  <h3 className="font-bold font-headline text-xl">{task.title}</h3>
                </div>

                {/* Location & ETA */}
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border">
                  <span className="flex items-center gap-1.5"><MapIcon className="h-4 w-4" />{task.location}</span>
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />ETA: {task.eta ?? "ASAP"}</span>
                </div>

                {/* Progress bar */}
                {task.status !== "Completed" && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 text-muted-foreground font-medium">
                      <span>Pipeline</span><span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5 px-1">
                      <span className={progress >= 10 ? "text-primary" : ""}>Start</span>
                      <span className={progress >= 60 ? "text-primary" : ""}>In Progress</span>
                      <span className={progress >= 100 ? "text-primary" : ""}>Done</span>
                    </div>
                  </div>
                )}

                {/* Field summary */}
                {summary && summary.totalEntries > 0 && (
                  <div className="bg-slate-50 border rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Your Field Log</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><p className="text-lg font-black text-slate-800">{summary.totalEntries}</p><p className="text-[10px] text-muted-foreground">Entries</p></div>
                      {(task.taskType === "Collection" || task.taskType === "Distribution") && (
                        <div><p className="text-lg font-black text-blue-600">{summary.totalItems}</p><p className="text-[10px] text-muted-foreground">Items</p></div>
                      )}
                      <div><p className="text-lg font-black text-green-600">{summary.totalBeneficiaries}</p><p className="text-[10px] text-muted-foreground">People</p></div>
                    </div>
                  </div>
                )}

                {/* Proof image (if completed) */}
                {task.status === "Completed" && task.feedback?.imageUrl && (
                  <div className="rounded-xl overflow-hidden border">
                    <img src={task.feedback.imageUrl} alt="Proof" className="w-full h-40 object-cover" />
                    {task.feedback.note && <p className="text-xs italic text-muted-foreground p-3">"{task.feedback.note}"</p>}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {/* Directions */}
                  {task.status !== "Completed" && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(task.location)}`)}>
                      <Navigation className="h-3.5 w-3.5" /> Directions
                    </Button>
                  )}

                  {/* Chat */}
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setChatTask(task)}>
                    <MessageCircle className="h-3.5 w-3.5" /> Chat NGO
                  </Button>

                  {/* Start task */}
                  {task.status === "Assigned" && (
                    <Button size="sm" className="gap-1.5 text-xs" onClick={() => handleStatusUpdate(task.id!, "In Progress")}>
                      <Navigation className="h-3.5 w-3.5" /> Start Task
                    </Button>
                  )}

                  {/* Log field entry */}
                  {task.status === "In Progress" && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => { resetLogForm(); setLogTask(task); }}>
                      <Plus className="h-3.5 w-3.5" /> Log Entry
                    </Button>
                  )}

                  {/* Submit proof */}
                  {task.status === "In Progress" && (
                    <Button size="sm" className="gap-1.5 text-xs ml-auto bg-green-600 hover:bg-green-700"
                      onClick={() => setProofTask(task)}>
                      <Camera className="h-3.5 w-3.5" /> Submit Proof
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Field Log Dialog */}
      <Dialog open={!!logTask} onOpenChange={open => !open && setLogTask(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2">
              {logTask?.taskType && TYPE_ICON[logTask.taskType]}
              Log {logTask?.taskType} Entry
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {logTask?.taskType === "Collection" && (<>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2"><Label>Donor Name *</Label><Input value={donorName} onChange={e => setDonorName(e.target.value)} placeholder="e.g. Ramesh Kumar" /></div>
                <div className="space-y-1"><Label>Phone</Label><Input value={donorPhone} onChange={e => setDonorPhone(e.target.value)} placeholder="Optional" /></div>
                <div className="space-y-1"><Label>Item Type *</Label>
                  <Select value={itemType} onValueChange={setItemType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Clothes","Food","Medicine","Books","Other"].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Quantity *</Label><Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 15" /></div>
                <div className="space-y-1"><Label>For People *</Label><Input type="number" min="1" value={beneficiaryCount} onChange={e => setBeneficiaryCount(e.target.value)} placeholder="e.g. 20" /></div>
                <div className="space-y-1"><Label>Condition</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Good">Good</SelectItem><SelectItem value="Fair">Fair</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2"><Label>Address</Label><Input value={donorAddress} onChange={e => setDonorAddress(e.target.value)} placeholder="Street / Area" /></div>
              </div>
            </>)}

            {logTask?.taskType === "Distribution" && (<>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2"><Label>Recipient Name *</Label><Input value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="e.g. Priya Devi" /></div>
                <div className="space-y-1"><Label>Area</Label><Input value={recipientArea} onChange={e => setRecipientArea(e.target.value)} placeholder="e.g. Anna Nagar" /></div>
                <div className="space-y-1"><Label>Item Type *</Label>
                  <Select value={itemType} onValueChange={setItemType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Clothes","Food","Medicine","Books","Other"].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Qty Given *</Label><Input type="number" min="1" value={quantityGiven} onChange={e => setQuantityGiven(e.target.value)} /></div>
                <div className="space-y-1"><Label>Beneficiaries *</Label><Input type="number" min="1" value={beneficiaryCount} onChange={e => setBeneficiaryCount(e.target.value)} /></div>
              </div>
            </>)}

            {logTask?.taskType === "Service" && (<>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2"><Label>Venue *</Label><Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="e.g. Community Hall" /></div>
                <div className="space-y-1 col-span-2"><Label>Service Type *</Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["Medical Consultation","Teaching Session","Counselling","Skills Training","Other"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>People Served *</Label><Input type="number" min="1" value={peopleServed} onChange={e => setPeopleServed(e.target.value)} /></div>
                <div className="space-y-1"><Label>Duration (min)</Label><Input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Optional" /></div>
              </div>
            </>)}

            <div className="space-y-1"><Label>Notes</Label><Textarea value={entryNotes} onChange={e => setEntryNotes(e.target.value)} rows={2} placeholder="Any additional observations..." /></div>

            {/* Photo */}
            <input type="file" accept="image/*" capture="environment" ref={entryFileRef} className="hidden"
              onChange={e => handleImageCapture(e.target.files?.[0], setEntryPhoto)} />
            {entryPhoto
              ? <div className="relative rounded-xl overflow-hidden border"><img src={entryPhoto} className="w-full h-36 object-cover" alt="preview" />
                  <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setEntryPhoto(null)}>Retake</Button></div>
              : <Button variant="outline" className="w-full gap-2 border-dashed" type="button" onClick={() => entryFileRef.current?.click()}>
                  <Camera className="h-4 w-4" /> Add Photo (Optional)
                </Button>
            }
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLogTask(null)}>Cancel</Button>
            <Button onClick={handleSaveEntry} disabled={savingEntry} className="gap-2">
              {savingEntry ? "Saving..." : <><Plus className="h-4 w-4" /> Save Entry</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proof Dialog */}
      <Dialog open={!!proofTask} onOpenChange={open => !open && setProofTask(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-headline">Submit Completion Proof</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <input type="file" accept="image/*" capture="environment" ref={proofFileRef} className="hidden"
              onChange={e => handleImageCapture(e.target.files?.[0], setProofImage)} />
            {proofImage
              ? <div className="relative rounded-xl overflow-hidden border"><img src={proofImage} className="w-full h-48 object-cover" alt="proof" />
                  <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => setProofImage(null)}>Retake</Button></div>
              : <div onClick={() => proofFileRef.current?.click()}
                  className="w-full h-48 rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center bg-primary/5 text-primary cursor-pointer hover:bg-primary/10 transition-colors">
                  <Camera className="h-10 w-10 mb-2 opacity-80" /><span className="font-medium text-sm">Tap to Open Camera</span>
                </div>
            }
            <div className="space-y-1"><Label>Field Notes (Optional)</Label>
              <Textarea placeholder="e.g. Handed over 50 supplies to block leader..." value={proofNote} onChange={e => setProofNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProofTask(null)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmitProof} disabled={!proofImage || submitting} className="gap-2">
              {submitting ? "Uploading..." : <><UploadCloud className="h-4 w-4" /> Submit</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat */}
      {chatTask && <TaskChatDialog task={chatTask} open={!!chatTask} onOpenChange={open => !open && setChatTask(null)} />}
    </div>
  );
}
