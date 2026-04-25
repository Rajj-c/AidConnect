"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { createTask, TaskType, getNGOProfile } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Loader2, Plus, X, Package, Truck, HeartHandshake } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { LocationPicker, PickedLocation } from "@/components/LocationPicker";

const TASK_TYPE_INFO: Record<TaskType, { icon: React.ReactNode; label: string; desc: string; color: string }> = {
  Collection: {
    icon: <Package className="h-6 w-6" />,
    label: "Collection Drive",
    desc: "Collect donated items (clothes, food, etc.) from donor families",
    color: "border-blue-400 bg-blue-50 text-blue-700",
  },
  Distribution: {
    icon: <Truck className="h-6 w-6" />,
    label: "Distribution Run",
    desc: "Distribute collected items or resources to beneficiaries",
    color: "border-green-400 bg-green-50 text-green-700",
  },
  Service: {
    icon: <HeartHandshake className="h-6 w-6" />,
    label: "Service Camp",
    desc: "Deliver a service (medical, teaching, counselling, etc.)",
    color: "border-purple-400 bg-purple-50 text-purple-700",
  },
};

const ALL_SKILLS = [
  "First Aid", "Driving", "Teaching", "Counselling", "Cooking", "Medical",
  "Logistics", "Communication", "Physical Labour", "Language Translation",
  "Photography", "IT Support", "Social Work", "Child Care", "Elder Care",
];

export default function NewTaskPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [ngoName, setNgoName] = useState("");

  // Form fields
  const [taskType, setTaskType] = useState<TaskType | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [deadline, setDeadline] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    if (userRole !== "NGO" || !user) { router.replace("/dashboard"); return; }
    getNGOProfile(user.uid).then(p => { if (p) setNgoName(p.orgName); });
  }, [user, userRole, router]);

  function addSkill(s: string) {
    const trimmed = s.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed]);
    }
    setSkillInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskType || !title || !location || !category || !user) return;
    setSaving(true);
    try {
      await createTask({
        ngoId: user.uid,
        ngoName,
        title,
        description,
        taskType: taskType as TaskType,
        category: category as any,
        skillsRequired: skills,
        location,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        priority,
        deadline: deadline ? new Date(deadline) as any : null,
        status: "Open",
      });
      toast({ title: "Task Posted ✓", description: "Your task is now visible to volunteers in your org." });
      router.push("/dashboard/tasks");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-primary" /> Post a New Task
        </h1>
        <p className="text-muted-foreground mt-1">Create a task that volunteers from your org can pick up.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Task Type */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Step 1: What kind of task is this?</CardTitle>
            <CardDescription>Choose the type that best describes the activity.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(TASK_TYPE_INFO) as TaskType[]).map(type => {
              const info = TASK_TYPE_INFO[type];
              const isSelected = taskType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTaskType(type)}
                  className={`rounded-xl border-2 p-4 text-left transition-all hover:shadow-sm ${
                    isSelected ? info.color + " border-2 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className={`mb-2 ${isSelected ? "" : "text-slate-500"}`}>{info.icon}</div>
                  <p className="font-semibold text-sm text-slate-900">{info.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{info.desc}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Step 2: Details */}
        {taskType && (
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Step 2: Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  placeholder={
                    taskType === "Collection" ? "e.g., Collect donated clothes in Anna Nagar" :
                    taskType === "Distribution" ? "e.g., Distribute winter kits in Trichy North" :
                    "e.g., Free medical camp at Gandhi Nagar"
                  }
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What exactly needs to be done? Any special instructions?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {["Food", "Health", "Education", "Shelter", "Water", "Other"].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority *</Label>
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">🔴 High</SelectItem>
                      <SelectItem value="Medium">🟡 Medium</SelectItem>
                      <SelectItem value="Low">🟢 Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <LocationPicker
                    label="Task Location *"
                    placeholder="e.g. Anna Nagar, Trichy"
                    onSelect={(loc: PickedLocation) => {
                      setLocation(loc.address);
                      setLat(loc.lat || null);
                      setLng(loc.lng || null);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Skills */}
        {taskType && (
          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Step 3: Skills Required (optional)</CardTitle>
              <CardDescription>Helps match the right volunteers to this task.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select value={skillInput} onValueChange={v => { addSkill(v); setSkillInput(""); }}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Pick from common skills..." /></SelectTrigger>
                  <SelectContent>
                    {ALL_SKILLS.filter(s => !skills.includes(s)).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or type custom skill"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); } }}
                  className="flex-1"
                />
              </div>
              <div className="flex flex-wrap gap-2 min-h-[32px]">
                {skills.map(s => (
                  <Badge key={s} variant="secondary" className="gap-1 pr-1 text-sm">
                    {s}
                    <button type="button" onClick={() => setSkills(prev => prev.filter(x => x !== s))}>
                      <X className="h-3 w-3 hover:text-destructive" />
                    </button>
                  </Badge>
                ))}
                {skills.length === 0 && <p className="text-xs text-muted-foreground">No skills added yet.</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {taskType && (
          <Button type="submit" disabled={saving || !title || !location || !category} className="w-full h-11 gap-2 text-base">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Posting Task..." : "Post Task"}
          </Button>
        )}
      </form>
    </div>
  );
}
