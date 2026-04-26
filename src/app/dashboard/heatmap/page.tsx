"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToNeeds, subscribeToVolunteers, subscribeToFieldReportsByNGO, NeedDoc, VolunteerDoc, FieldReport } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Users, AlertTriangle, Flame, Activity, Brain, Sparkles } from "lucide-react";

const SEV = {
  Critical: { color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500 animate-pulse", bar: "bg-red-500" },
  High:     { color: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-400", bar: "bg-orange-500" },
  Medium:   { color: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-400", bar: "bg-yellow-400" },
  Low:      { color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-400", bar: "bg-green-400" },
};

const DynamicHeatmap = dynamic(() => import("@/components/MapComponent").then(m => ({ default: m.HeatmapComponent })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50/50 text-muted-foreground gap-2 min-h-[500px]">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      <p className="text-xs">Loading Urgency Heatmap…</p>
    </div>
  ),
});

function timeAgo(ts: any) {
  if (!ts?.toDate) return "just now";
  const d = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export default function HeatmapPage() {
  const { user, userRole } = useAuth();
  const [needs, setNeeds]       = useState<NeedDoc[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerDoc[]>([]);
  const [reports, setReports]   = useState<FieldReport[]>([]);

  useEffect(() => {
    const u1 = subscribeToNeeds(setNeeds);
    const u2 = subscribeToVolunteers(setVolunteers);
    return () => { u1(); u2(); };
  }, []);

  useEffect(() => {
    if (!user || userRole !== "NGO") return;
    return subscribeToFieldReportsByNGO(user.uid, setReports);
  }, [user, userRole]);

  const highNeeds   = needs.filter(n => n.priority === "High" && n.status === "Open");
  const medNeeds    = needs.filter(n => n.priority === "Medium" && n.status === "Open");
  const availVols   = volunteers.filter(v => v.status === "Available");

  // Field reports ranked by AI severity score
  const rankedReports = [...reports]
    .filter(r => r.status !== "ActionTaken")
    .sort((a, b) => (b.severity?.score || 0) - (a.severity?.score || 0));

  const categories = ["Food", "Health", "Education", "Shelter", "Water", "Other"] as const;
  const catCounts = categories.map(cat => ({
    cat,
    count: needs.filter(n => n.category === cat && n.status === "Open").length +
           reports.filter(r => (r.categories || []).some(c => c.toLowerCase().includes(cat.toLowerCase()))).length,
  })).filter(c => c.count > 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-destructive/10 rounded-xl">
            <Flame className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold font-headline text-foreground">Urgency Heatmap</h1>
        </div>
        <p className="text-muted-foreground">
          Live geospatial view of community need intensity + AI-ranked field reports.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Critical Zones", value: highNeeds.length + reports.filter(r => r.severity?.level === "Critical").length, icon: AlertTriangle, cls: "bg-destructive/5 text-destructive" },
          { label: "AI Field Reports", value: rankedReports.length, icon: Brain, cls: "bg-primary/5 text-primary" },
          { label: "Avail. Volunteers", value: availVols.length, icon: Users, cls: "bg-emerald-50 text-emerald-600" },
          { label: "Total Open Needs", value: needs.filter(n => n.status === "Open").length + rankedReports.length, icon: Activity, cls: "bg-amber-50 text-amber-600" },
        ].map(({ label, value, icon: Icon, cls }) => (
          <Card key={label} className="border-none shadow-sm bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full ${cls} bg-opacity-20 flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-headline">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        {/* Map */}
        <Card className="lg:col-span-3 border-none shadow-lg overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-base flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-destructive animate-pulse" />
                Live Urgency Map
              </CardTitle>
              <CardDescription className="text-xs">Circles = need intensity · Dots = volunteer positions</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider">
              {[
                { color: "bg-destructive", label: "Critical" },
                { color: "bg-amber-400", label: "Medium" },
                { color: "bg-emerald-500", label: "Low" },
                { color: "bg-emerald-400 border border-white", label: "Volunteer" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  {label}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[500px]">
            <DynamicHeatmap />
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Category breakdown */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-headline">Need Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {catCounts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No open needs</p>
              ) : catCounts.map(({ cat, count }) => {
                const maxCount = Math.max(...catCounts.map(c => c.count));
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{cat}</span>
                      <span className="text-muted-foreground font-bold">{count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* AI-Ranked Field Reports */}
          {rankedReports.length > 0 && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-headline flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  AI-Ranked Reports
                  <Badge className="text-[9px] bg-primary/10 text-primary border-none gap-1">
                    <Sparkles className="h-2.5 w-2.5" />Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[360px] overflow-y-auto">
                {rankedReports.map((r, i) => {
                  const s = SEV[r.severity?.level as keyof typeof SEV] || SEV.Low;
                  return (
                    <div key={r.id} className="p-2.5 rounded-xl border border-slate-100 bg-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${s.dot}`} />
                        <Badge className={`text-[9px] border ${s.color} py-0`}>
                          {r.severity?.level} · {r.severity?.score}/100
                        </Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">#{i + 1}</span>
                      </div>
                      <p className="text-xs font-semibold leading-tight text-slate-800 line-clamp-1">{r.summary}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0 text-primary" />
                        <span className="truncate">{r.location}</span>
                        <span className="shrink-0">{r.estimatedPeopleAffected} affected</span>
                      </div>
                      <Progress value={r.severity?.score || 0} className="h-1 mt-1.5" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Traditional critical needs */}
          {highNeeds.length > 0 && (
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-headline flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                  Critical Zones ({highNeeds.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[200px] overflow-y-auto">
                {highNeeds.map(n => (
                  <div key={n.id} className="p-2.5 bg-destructive/5 border border-destructive/10 rounded-lg">
                    <p className="text-xs font-semibold leading-tight">{n.description}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <MapPin className="h-3 w-3 text-destructive" />{n.location}
                    </div>
                    <Badge variant="outline" className="text-[9px] py-0 border-destructive/30 text-destructive mt-1">{n.category}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
