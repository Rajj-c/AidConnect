"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { NGOProfile, VolunteerDoc, TaskDoc } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, MapPin, Phone, Globe, Users, CheckCircle2, Clock, ShieldCheck, AlertCircle, Languages, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function NGODetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ngo, setNGO] = useState<NGOProfile | null>(null);
  const [volunteers, setVolunteers] = useState<VolunteerDoc[]>([]);
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!db || !id) return;
      try {
        // Load NGO profile
        const ngoSnap = await getDoc(doc(db, "ngos", id));
        if (ngoSnap.exists()) setNGO(ngoSnap.data() as NGOProfile);

        // Load volunteers assigned to this NGO
        const volQuery = query(collection(db, "volunteers"), where("ngoId", "==", id));
        const volSnap = await getDocs(volQuery);
        setVolunteers(volSnap.docs.map(d => ({ id: d.id, ...d.data() } as VolunteerDoc)));

        // Load tasks for this NGO
        const taskQuery = query(collection(db, "tasks"), where("ngoId", "==", id), orderBy("createdAt", "desc"));
        const taskSnap = await getDocs(taskQuery);
        setTasks(taskSnap.docs.map(d => ({ id: d.id, ...d.data() } as TaskDoc)));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-muted-foreground">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mr-3" />
      Loading NGO profile...
    </div>
  );

  if (!ngo) return (
    <div className="text-center py-32">
      <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-lg font-medium">NGO not found</p>
      <Button asChild variant="outline" className="mt-4"><Link href="/dashboard">← Back to Dashboard</Link></Button>
    </div>
  );

  const completedTasks = tasks.filter(t => t.status === "Verified" || t.status === "Completed").length;
  const pendingTasks = tasks.filter(t => !["Verified", "Completed", "Failed"].includes(t.status)).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{ngo.orgName}</span>
      </div>

      {/* NGO Header */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm border border-primary/20">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold font-headline text-slate-900">{ngo.orgName}</h1>
              <p className="text-sm text-primary font-semibold uppercase tracking-wider mt-0.5">{ngo.orgType} · Est. {ngo.yearEstablished}</p>
              <p className="text-slate-600 text-sm mt-3 italic">"{ngo.missionStatement}"</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {ngo.focusAreas.map(f => <Badge key={f} variant="secondary" className="text-[11px] bg-primary/5 text-primary border-none">{f}</Badge>)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Volunteers", value: volunteers.length, icon: Users, color: "text-blue-600 bg-blue-50" },
          { label: "Tasks Completed", value: completedTasks, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
          { label: "Pending Tasks", value: pendingTasks, icon: Clock, color: "text-amber-600 bg-amber-50" },
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact & Legal */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-headline">Contact & Legal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-slate-400 shrink-0" /><span>{ngo.officialAddress}, {ngo.city}, {ngo.state} – {ngo.pinCode}</span></div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" />{ngo.phone}</div>
            {ngo.website && <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-slate-400" /><a href={ngo.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{ngo.website}</a></div>}
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/40 rounded-lg p-2"><span className="text-muted-foreground">Reg. No:</span> <b>{ngo.registrationNumber}</b></div>
              <div className="bg-muted/40 rounded-lg p-2"><span className="text-muted-foreground">PAN:</span> <b>{ngo.panNumber}</b></div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {ngo.ngo12AStatus && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">12A</Badge>}
              {ngo.ngo80GStatus && <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">80G</Badge>}
              {ngo.fcraRegistered && <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">FCRA</Badge>}
            </div>
          </CardContent>
        </Card>

        {/* Capacity */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-headline">Operations & Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 rounded-xl p-3 border"><p className="text-[10px] font-bold text-slate-400 uppercase">Scope</p><p className="text-sm font-bold mt-0.5">{ngo.geographicScope}</p></div>
              <div className="bg-slate-50 rounded-xl p-3 border"><p className="text-[10px] font-bold text-slate-400 uppercase">Staff</p><p className="text-sm font-bold mt-0.5">{ngo.activeVolunteers || "—"}</p></div>
              <div className="bg-slate-50 rounded-xl p-3 border"><p className="text-[10px] font-bold text-slate-400 uppercase">Budget</p><p className="text-sm font-bold mt-0.5">{ngo.annualBudgetRange || "—"}</p></div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {ngo.providesAccommodation && <Badge variant="secondary" className="text-[11px]">🏠 Accommodation</Badge>}
              {ngo.hasVehicles && <Badge variant="secondary" className="text-[11px]">🚐 Vehicles</Badge>}
              {ngo.hasMedicalFacilities && <Badge variant="secondary" className="text-[11px]">🏥 Medical</Badge>}
            </div>
            {ngo.languagesSupported && ngo.languagesSupported.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1"><Languages className="h-3.5 w-3.5" /> Languages</p>
                <div className="flex flex-wrap gap-1">{ngo.languagesSupported.map(l => <Badge key={l} variant="secondary" className="text-[10px]">{l}</Badge>)}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Volunteers */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="p-2 bg-green-50 rounded-xl"><Users className="h-5 w-5 text-green-600" /></div>
          <div>
            <CardTitle className="font-headline text-lg">Assigned Volunteers ({volunteers.length})</CardTitle>
            <CardDescription>Volunteers currently deployed under this NGO.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {volunteers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No volunteers assigned yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {volunteers.map(v => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarFallback className="font-bold text-primary">{v.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800">{v.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{v.location}</p>
                    <div className="flex gap-1 mt-1">
                      {v.skills.slice(0, 2).map(s => <Badge key={s} variant="outline" className="text-[9px] px-1.5 py-0">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-0.5 text-amber-500"><Star className="h-3 w-3 fill-current" /><span className="text-xs font-bold">{v.rating}</span></div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{v.tasksCompleted} tasks</p>
                    <Badge variant="secondary" className={`text-[9px] mt-1 ${v.status === "Available" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{v.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="p-2 bg-blue-50 rounded-xl"><CheckCircle2 className="h-5 w-5 text-blue-600" /></div>
          <div>
            <CardTitle className="font-headline text-lg">Task History ({tasks.length})</CardTitle>
            <CardDescription>All field missions created by this NGO.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tasks created yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 10).map(t => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    t.status === "Verified" ? "bg-green-500" :
                    t.status === "Completed" ? "bg-blue-500" :
                    t.status === "Failed" ? "bg-red-500" : "bg-amber-500"
                  }`} />
                  <p className="text-sm font-medium text-slate-800 flex-1 truncate">{t.title}</p>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{t.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
