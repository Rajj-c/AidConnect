"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  subscribeToTasksByNGO, verifyTask, markTaskCompleted, deleteTask, TaskDoc, TaskType,
} from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList, Plus, MapPin, Clock, Users, Package, Truck,
  HeartHandshake, CheckCircle2, Loader2, MessageCircle, Eye, Trash2, CheckCheck
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { TaskChatDialog } from "@/components/TaskChatDialog";
import { FieldEntriesDialog } from "@/components/FieldEntriesDialog";
import { formatDistanceToNow } from "date-fns";

const TASK_TYPE_ICON: Record<TaskType, React.ReactNode> = {
  Collection: <Package className="h-3.5 w-3.5" />,
  Distribution: <Truck className="h-3.5 w-3.5" />,
  Service: <HeartHandshake className="h-3.5 w-3.5" />,
};

const TASK_TYPE_COLOR: Record<TaskType, string> = {
  Collection: "bg-blue-100 text-blue-700 border-blue-200",
  Distribution: "bg-green-100 text-green-700 border-green-200",
  Service: "bg-purple-100 text-purple-700 border-purple-200",
};

const STATUS_COLOR: Record<TaskDoc["status"], string> = {
  Open: "bg-slate-100 text-slate-600",
  Assigned: "bg-amber-100 text-amber-700",
  "In Progress": "bg-blue-100 text-blue-700",
  Completed: "bg-orange-100 text-orange-700",
  Verified: "bg-green-100 text-green-700",
};

const PRIORITY_COLOR: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700",
};

export default function NGOTasksPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [chatTask, setChatTask] = useState<TaskDoc | null>(null);
  const [entriesTask, setEntriesTask] = useState<TaskDoc | null>(null);

  useEffect(() => {
    if (userRole !== "NGO" || !user) { router.replace("/dashboard"); return; }
    return subscribeToTasksByNGO(user.uid, setTasks);
  }, [user, userRole, router]);

  const byStatus = (status: TaskDoc["status"]) => tasks.filter(t => t.status === status);

  async function handleVerify(task: TaskDoc) {
    if (!task.id || !task.assignedVolunteerId) return;
    setVerifyingId(task.id);
    try {
      await verifyTask(task.id, task.assignedVolunteerId);
      toast({ title: "Task Verified ✓", description: `${task.title} has been verified. Volunteer is now available again.` });
    } catch {
      toast({ title: "Error", description: "Failed to verify task.", variant: "destructive" });
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleMarkCompleted(task: TaskDoc) {
    if (!task.id) return;
    if (!window.confirm(`Mark "${task.title}" as completed? This will free up the assigned volunteer.`)) return;
    setCompletingId(task.id);
    try {
      await markTaskCompleted(task.id, task.assignedVolunteerId);
      toast({ title: "✅ Marked as Completed", description: `"${task.title}" has been marked complete. You can now verify it.` });
    } catch {
      toast({ title: "Error", description: "Failed to mark task as completed.", variant: "destructive" });
    } finally {
      setCompletingId(null);
    }
  }

  async function handleDelete(task: TaskDoc) {
    if (!task.id) return;
    if (!window.confirm(`Delete "${task.title}"? This action cannot be undone.`)) return;
    setDeletingId(task.id);
    try {
      await deleteTask(task.id, task.assignedVolunteerId);
      toast({ title: "🗑️ Task Deleted", description: `"${task.title}" has been permanently deleted.` });
    } catch {
      toast({ title: "Error", description: "Failed to delete task.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  function TaskCard({ task }: { task: TaskDoc }) {
    const summary = task.fieldSummary;
    const hasEntries = summary && summary.totalEntries > 0;

    return (
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className={`h-1 w-full ${
          task.priority === "High" ? "bg-red-400" :
          task.priority === "Medium" ? "bg-yellow-400" : "bg-green-400"
        }`} />
        <CardContent className="p-5 space-y-4">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <Badge variant="outline" className={`text-[10px] gap-1 ${TASK_TYPE_COLOR[task.taskType]}`}>
                  {TASK_TYPE_ICON[task.taskType]} {task.taskType}
                </Badge>
                <Badge className={`text-[10px] border-0 ${STATUS_COLOR[task.status]}`}>
                  {task.status}
                </Badge>
                <Badge className={`text-[10px] border-0 ${PRIORITY_COLOR[task.priority]}`}>
                  {task.priority}
                </Badge>
              </div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">{task.title}</h3>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
              )}
            </div>
          </div>

          {/* Location & time */}
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{task.location}</span>
            {task.deadline && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Due {formatDistanceToNow((task.deadline as any).toDate?.() ?? task.deadline, { addSuffix: true })}
              </span>
            )}
            {task.assignedVolunteerName && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />{task.assignedVolunteerName}
              </span>
            )}
          </div>

          {/* Field Summary — shown when entries exist */}
          {hasEntries && (
            <div className="bg-slate-50 rounded-xl border p-3 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Field Progress</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-base font-black text-slate-800">{summary!.totalEntries}</p>
                  <p className="text-[10px] text-muted-foreground">Entries</p>
                </div>
                {(task.taskType === "Collection" || task.taskType === "Distribution") && (
                  <div>
                    <p className="text-base font-black text-blue-600">{summary!.totalItems}</p>
                    <p className="text-[10px] text-muted-foreground">Items</p>
                  </div>
                )}
                <div>
                  <p className="text-base font-black text-green-600">{summary!.totalBeneficiaries}</p>
                  <p className="text-[10px] text-muted-foreground">People</p>
                </div>
              </div>
            </div>
          )}

          {/* Skills */}
          {task.skillsRequired?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.skillsRequired.slice(0, 3).map(s => (
                <Badge key={s} variant="outline" className="text-[10px] bg-white">{s}</Badge>
              ))}
              {task.skillsRequired.length > 3 && (
                <Badge variant="outline" className="text-[10px]">+{task.skillsRequired.length - 3}</Badge>
              )}
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
            {/* Chat button */}
            {task.assignedVolunteerId && (
              <Button
                size="sm" variant="outline"
                className="gap-1.5 text-xs h-8"
                onClick={() => setChatTask(task)}
              >
                <MessageCircle className="h-3.5 w-3.5" /> Chat
              </Button>
            )}

            {/* View field entries */}
            {hasEntries && (
              <Button
                size="sm" variant="outline"
                className="gap-1.5 text-xs h-8"
                onClick={() => setEntriesTask(task)}
              >
                <Eye className="h-3.5 w-3.5" /> View Logs
              </Button>
            )}

            {/* NGO can manually mark as completed (if not already done/verified) */}
            {task.status !== "Completed" && task.status !== "Verified" && (
              <Button
                size="sm" variant="outline"
                className="gap-1.5 text-xs h-8 border-orange-300 text-orange-600 hover:bg-orange-50"
                onClick={() => handleMarkCompleted(task)}
                disabled={completingId === task.id}
              >
                {completingId === task.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <CheckCheck className="h-3.5 w-3.5" />
                }
                Mark Complete
              </Button>
            )}

            {/* Verify when completed */}
            {task.status === "Completed" && (
              <Button
                size="sm"
                className="gap-1.5 text-xs h-8 bg-green-600 hover:bg-green-700"
                onClick={() => handleVerify(task)}
                disabled={verifyingId === task.id}
              >
                {verifyingId === task.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <CheckCircle2 className="h-3.5 w-3.5" />
                }
                Verify
              </Button>
            )}

            {/* Delete task — always available */}
            <Button
              size="sm" variant="outline"
              className="gap-1.5 text-xs h-8 ml-auto border-red-200 text-red-500 hover:bg-red-50"
              onClick={() => handleDelete(task)}
              disabled={deletingId === task.id}
            >
              {deletingId === task.id
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Trash2 className="h-3.5 w-3.5" />
              }
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tabs: { value: TaskDoc["status"]; label: string }[] = [
    { value: "Open", label: "Open" },
    { value: "Assigned", label: "Assigned" },
    { value: "In Progress", label: "In Progress" },
    { value: "Completed", label: "Completed" },
    { value: "Verified", label: "Verified" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" /> Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} posted by your organisation.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/tasks/new">
            <Plus className="h-4 w-4" /> Post Task
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="Open">
        <TabsList className="bg-white border shadow-sm w-full justify-start overflow-x-auto">
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              {byStatus(tab.value).length > 0 && (
                <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-1.5">
                  {byStatus(tab.value).length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {byStatus(tab.value).length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed text-muted-foreground">
                <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No {tab.label.toLowerCase()} tasks</p>
                {tab.value === "Open" && (
                  <Button asChild variant="outline" className="mt-4 gap-2">
                    <Link href="/dashboard/tasks/new"><Plus className="h-4 w-4" /> Post your first task</Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {byStatus(tab.value).map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Chat Dialog */}
      {chatTask && (
        <TaskChatDialog task={chatTask} open={!!chatTask} onOpenChange={open => !open && setChatTask(null)} />
      )}
      {/* Field Entries Dialog */}
      {entriesTask && (
        <FieldEntriesDialog task={entriesTask} open={!!entriesTask} onOpenChange={open => !open && setEntriesTask(null)} />
      )}
    </div>
  );
}
