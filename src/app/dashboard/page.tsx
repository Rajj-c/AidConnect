"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToApprovedNGOs, subscribeToVolunteers, subscribeToTasks, assignVolunteerToNGO,
  NGOProfile, VolunteerDoc, TaskDoc, subscribeToPendingUsers, UserProfile
} from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, CheckCircle2, Clock, ShieldAlert, TrendingUp, MapPin, ChevronRight, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { NGODashboard } from "@/components/NGODashboard";

export default function AdminDashboard() {
  const { userRole } = useAuth();
  const router = useRouter();
  const [ngos, setNGOs] = useState<NGOProfile[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerDoc[]>([]);
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [selectedNGOs, setSelectedNGOs] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getAvatarUrl = (gender?: string) => {
    if (gender === "female") return `/avatar-female.svg`;
    return `/avatar-male.svg`;
  };

  useEffect(() => {
    if (userRole !== "Admin") return;
    const u1 = subscribeToApprovedNGOs(setNGOs);
    const u2 = subscribeToVolunteers(setVolunteers);
    const u3 = subscribeToTasks(setTasks);
    const u4 = subscribeToPendingUsers(setPendingUsers);
    return () => { u1(); u2(); u3(); u4(); };
  }, [userRole]);

  if (userRole === "NGO") return <NGODashboard />;
  if (userRole !== "Admin") return null;

  const completedTasks = tasks.filter(t => t.status === "Verified" || t.status === "Completed").length;
  const assignedVolunteers = volunteers.filter(v => v.ngoId).length;
  const unassignedVolunteers = volunteers.filter(v => !v.ngoId).length;

  // Count volunteers per NGO
  const volunteersByNGO: Record<string, number> = {};
  volunteers.forEach(v => { if (v.ngoId) volunteersByNGO[v.ngoId] = (volunteersByNGO[v.ngoId] || 0) + 1; });

  const tasksByNGO: Record<string, number> = {};
  tasks.forEach(t => { if (t.ngoId) tasksByNGO[t.ngoId] = (tasksByNGO[t.ngoId] || 0) + 1; });

  const unassignedVolunteersList = volunteers.filter(v => !v.ngoId);

  async function handleAssign(volunteerId: string) {
    const ngoId = selectedNGOs[volunteerId];
    if (!ngoId) {
      toast({ title: "Select NGO", description: "Please select an NGO to assign.", variant: "destructive" });
      return;
    }
    const ngo = ngos.find(n => n.uid === ngoId);
    if (!ngo) return;

    setProcessingId(volunteerId);
    try {
      await assignVolunteerToNGO(volunteerId, ngoId, ngo.orgName);
      toast({ title: "Assigned Successfully", description: `Volunteer assigned to ${ngo.orgName}` });
    } catch {
      toast({ title: "Assignment Failed", description: "There was an error assigning the volunteer.", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline">Admin Command Centre</h1>
        <p className="text-muted-foreground mt-1">Full platform overview across all NGOs and volunteers.</p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total NGOs", value: ngos.length, icon: Building2, color: "bg-blue-50 text-blue-600" },
          { label: "Total Volunteers", value: volunteers.length, icon: Users, color: "bg-green-50 text-green-600" },
          { label: "Tasks Completed", value: completedTasks, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
          { label: "Pending Approvals", value: pendingUsers.length, icon: ShieldAlert, color: "bg-amber-50 text-amber-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-none shadow-sm bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${color}`}><Icon className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-black text-slate-800">{value}</p>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Volunteer Assignment Overview */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="p-2 bg-green-50 rounded-xl"><TrendingUp className="h-5 w-5 text-green-600" /></div>
          <div>
            <CardTitle className="font-headline text-lg">Volunteer Assignment Status</CardTitle>
            <CardDescription>Track which volunteers are assigned to NGOs.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-3xl font-black text-green-600">{assignedVolunteers}</p>
              <p className="text-xs text-muted-foreground">Assigned</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-amber-500">{unassignedVolunteers}</p>
              <p className="text-xs text-muted-foreground">Unassigned</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-slate-800">{volunteers.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
          {unassignedVolunteers > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-amber-50 text-amber-700 text-sm p-3 rounded-lg border border-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {unassignedVolunteers} volunteer{unassignedVolunteers > 1 ? "s" : ""} pending NGO assignment.
              <Link href="/dashboard/ngos" className="ml-auto font-semibold underline hover:no-underline">Go to Verifications →</Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NGO Registry */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-headline flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> NGO Registry
          </h2>
          <Badge variant="secondary">{ngos.length} registered</Badge>
        </div>

        {ngos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No NGOs registered yet</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ngos.map(ngo => (
              <Card key={ngo.uid} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-base leading-tight">{ngo.orgName}</p>
                      <p className="text-xs text-primary font-medium uppercase tracking-wide mt-0.5">{ngo.orgType}</p>
                    </div>
                    <div className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold ${
                      (volunteersByNGO[ngo.uid] || 0) > 0 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {volunteersByNGO[ngo.uid] || 0} volunteers
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" /> {ngo.city}, {ngo.state}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {ngo.focusAreas.slice(0, 2).map(f => (
                      <Badge key={f} variant="secondary" className="text-[10px] bg-primary/5 text-primary border-none">{f}</Badge>
                    ))}
                    {ngo.focusAreas.length > 2 && (
                      <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500">+{ngo.focusAreas.length - 2}</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> {tasksByNGO[ngo.uid] || 0} tasks</span>
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary group-hover:bg-primary/5 p-2">
                      <Link href={`/dashboard/admin/ngo/${ngo.uid}`}>
                        View Details <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Unassigned Volunteers */}
      {unassignedVolunteersList.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-headline flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" /> Action Required: Unassigned Volunteers
            </h2>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">{unassignedVolunteersList.length} pending</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {unassignedVolunteersList.map(v => (
              <Card key={v.id} className="border-amber-200 bg-amber-50/30 shadow-sm overflow-hidden">
                <div className="h-1 bg-amber-400 w-full" />
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-amber-200">
                      <AvatarImage src={getAvatarUrl(v.gender)} />
                      <AvatarFallback className="text-amber-700 font-bold bg-amber-100">{v.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm">{v.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{v.location}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {v.skills.slice(0, 3).map(s => (
                      <Badge key={s} variant="outline" className="text-[10px] bg-white">{s}</Badge>
                    ))}
                    {v.skills.length > 3 && <Badge variant="outline" className="text-[10px] bg-white">+{v.skills.length - 3}</Badge>}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-amber-100">
                    <Select
                      value={selectedNGOs[v.id] || ""}
                      onValueChange={(val) => setSelectedNGOs(prev => ({ ...prev, [v.id]: val }))}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white border-amber-200 flex-1">
                        <SelectValue placeholder="Select NGO..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ngos.map(n => (
                          <SelectItem key={n.uid} value={n.uid} className="text-xs">
                            {n.orgName} ({n.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      size="sm" 
                      className="h-8 text-xs shrink-0 bg-amber-600 hover:bg-amber-700"
                      onClick={() => handleAssign(v.id)}
                      disabled={processingId === v.id}
                    >
                      {processingId === v.id ? "Assigning..." : "Assign"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
