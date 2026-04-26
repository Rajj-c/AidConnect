"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToTasks, subscribeToVolunteersByNGO,
  subscribeToFieldReportsByNGO,
  TaskDoc, VolunteerDoc, FieldReport
} from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  Users, CheckCircle2, AlertTriangle, Clock, Radio,
  MapPin, ArrowUpRight, Brain, Sparkles, Zap,
  FileText, ShieldAlert, TrendingUp
} from "lucide-react";
import { EmergencyModeDialog } from "@/components/EmergencyModeDialog";
import Link from "next/link";

const SEV_COLORS = {
  Critical: "#ef4444",
  High:     "#f97316",
  Medium:   "#eab308",
  Low:      "#22c55e",
};

const CAT_COLORS = ["#1566ED", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function timeAgo(ts: any) {
  if (!ts?.toDate) return "Just now";
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  }).format(ts.toDate());
}

function handleEmergencyActivate(type: string, region: string) {
  localStorage.setItem("emergencyActive", "true");
  localStorage.setItem("emergencyInfo", JSON.stringify({ type, region }));
  window.dispatchEvent(new CustomEvent("emergencyActivated", { detail: { type, region } }));
}

export function NGODashboard() {
  const { user } = useAuth();
  const [tasks, setTasks]       = useState<TaskDoc[]>([]);
  const [vols, setVols]         = useState<VolunteerDoc[]>([]);
  const [reports, setReports]   = useState<FieldReport[]>([]);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeToTasks(setTasks);
    const u2 = subscribeToVolunteersByNGO(user.uid, setVols);
    const u3 = subscribeToFieldReportsByNGO(user.uid, setReports);
    return () => { u1(); u2(); u3(); };
  }, [user]);

  // ── Real Metrics ──────────────────────────────────────────────────────
  const availVols       = vols.filter(v => v.status === "Available").length;
  const completedTasks  = tasks.filter(t => t.status === "Completed" || t.status === "Verified").length;
  const activeTasks     = tasks.filter(t => t.status === "Assigned" || t.status === "In Progress").length;
  const criticalReports = reports.filter(r => r.severity?.level === "Critical").length;
  const highReports     = reports.filter(r => r.severity?.level === "High").length;
  const totalAffected   = reports.reduce((s, r) => s + (r.estimatedPeopleAffected || 0), 0);
  const newReports      = reports.filter(r => r.status === "New").length;

  // Top 5 urgent unaddressed needs (from field reports, sorted by AI severity score)
  const top5Needs = [...reports]
    .filter(r => r.status !== "ActionTaken")
    .sort((a, b) => (b.severity?.score || 0) - (a.severity?.score || 0))
    .slice(0, 5);

  // Category breakdown from real field reports
  const catMap = new Map<string, number>();
  reports.forEach(r => {
    (r.categories || []).forEach(cat => {
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });
  });
  const categoryData = Array.from(catMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Weekly tasks bar chart (real data from tasks)
  const weeklyData = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = new Array(7).fill(0);
    tasks.forEach(t => {
      if (t.createdAt?.toDate) {
        const day = t.createdAt.toDate().getDay();
        counts[day]++;
      }
    });
    return days.map((name, i) => ({ name, tasks: counts[i] }));
  })();

  // Recent alerts from real field reports (latest 4)
  const recentAlerts = [...reports]
    .sort((a, b) => {
      const ta = a.createdAt?.toDate?.().getTime() || 0;
      const tb = b.createdAt?.toDate?.().getTime() || 0;
      return tb - ta;
    })
    .slice(0, 4)
    .map(r => ({
      time: timeAgo(r.createdAt),
      title: r.severity?.level === "Critical" ? "🚨 Critical Field Report" :
             r.severity?.level === "High" ? "⚠️ High Priority Report" : "📋 New Field Report",
      desc: r.summary?.substring(0, 80) + (r.summary?.length > 80 ? "..." : ""),
      type: r.severity?.level === "Critical" ? "critical" :
            r.severity?.level === "High" ? "high" : "info",
      categories: r.categories || [],
      affected: r.estimatedPeopleAffected || 0,
    }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Live · Real-time</span>
          </div>
          <h1 className="text-3xl font-bold font-headline">Operational Overview</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            All stats are live from Firestore — synced in real-time as volunteers upload data.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/dashboard/needs-board">
              <Radio className="h-4 w-4" /> Needs Board
            </Link>
          </Button>
          <EmergencyModeDialog onActivate={handleEmergencyActivate} />
        </div>
      </div>

      {/* Live Stats — 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Available Volunteers", value: availVols, total: vols.length, icon: Users, color: "bg-blue-50 text-blue-600", bar: "bg-blue-500" },
          { label: "Unreviewed Reports", value: newReports, total: reports.length, icon: FileText, color: "bg-orange-50 text-orange-600", bar: "bg-orange-500" },
          { label: "Critical Alerts", value: criticalReports + highReports, total: reports.length, icon: ShieldAlert, color: "bg-red-50 text-red-600", bar: "bg-red-500" },
          { label: "Tasks Completed", value: completedTasks, total: tasks.length, icon: CheckCircle2, color: "bg-green-50 text-green-600", bar: "bg-green-500" },
        ].map(({ label, value, total, icon: Icon, color, bar }) => (
          <Card key={label} className="border-none shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <div className={`p-1.5 rounded-lg ${color}`}><Icon className="h-3.5 w-3.5" /></div>
              </div>
              <p className="text-3xl font-black text-slate-800">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">of {total} total</p>
              <div className="mt-2 h-1 bg-slate-100 rounded-full">
                <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: total > 0 ? `${Math.round((value / total) * 100)}%` : "0%" }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* People Affected Banner */}
      {totalAffected > 0 && (
        <Card className="border-none shadow-sm bg-gradient-to-r from-primary/90 to-blue-600 text-white overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-300" />
              <div>
                <p className="text-2xl font-black">{totalAffected.toLocaleString()} people</p>
                <p className="text-blue-100 text-sm">identified as affected across all field reports</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-blue-100">
              <div className="text-center">
                <p className="text-xl font-bold text-white">{reports.length}</p>
                <p>Reports</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">{activeTasks}</p>
                <p>Active Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">{vols.length}</p>
                <p>Volunteers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TOP 5 URGENT NEEDS — The Core Feature */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-headline flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Top 5 Most Urgent Needs Right Now
            <Badge className="bg-primary/10 text-primary border-none text-[10px] gap-1">
              <Sparkles className="h-3 w-3" /> AI-ranked
            </Badge>
          </h2>
          <Button asChild variant="ghost" size="sm" className="text-primary gap-1">
            <Link href="/dashboard/needs-board">View All <ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        {top5Needs.length === 0 ? (
          <Card className="border-dashed border-2 shadow-none bg-white">
            <CardContent className="py-10 text-center">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">No active needs — all clear! 🎉</p>
              <p className="text-xs text-muted-foreground mt-1">Needs will appear here as volunteers upload field reports.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {top5Needs.map((r, i) => {
              const sevColor = SEV_COLORS[r.severity?.level as keyof typeof SEV_COLORS] || "#22c55e";
              return (
                <Card key={r.id} className="border-none shadow-sm bg-white overflow-hidden">
                  <div className="h-1 w-full" style={{ backgroundColor: sevColor }} />
                  <CardContent className="p-3.5">
                    <div className="flex items-start gap-3">
                      {/* Rank */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 text-white`}
                           style={{ backgroundColor: sevColor }}>
                        {i + 1}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <Badge className="text-[10px] border" style={{ backgroundColor: `${sevColor}20`, color: sevColor, borderColor: `${sevColor}40` }}>
                            {r.severity?.level} · {r.severity?.score}/100
                          </Badge>
                          {r.categories?.slice(0, 2).map(c => (
                            <Badge key={c} className="text-[10px] bg-primary/10 text-primary border-none">{c}</Badge>
                          ))}
                        </div>
                        <p className="text-sm text-slate-700 leading-snug line-clamp-1">{r.summary}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{r.location}</span>
                          <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{r.estimatedPeopleAffected} affected</span>
                          <span><Clock className="h-3 w-3 inline mr-0.5" />{timeAgo(r.createdAt)}</span>
                        </div>
                        <Progress value={r.severity?.score || 0} className="h-1 mt-2" />
                      </div>
                      {/* Dispatch CTA */}
                      <Button asChild size="sm" className="shrink-0 h-8 text-xs gap-1">
                        <Link href="/dashboard/needs-board">
                          Dispatch <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Tasks by day */}
        <Card className="lg:col-span-4 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Task Activity This Week</CardTitle>
            <CardDescription>Tasks created per day (live from database)</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                <RechartsTooltip />
                <Bar dataKey="tasks" fill="#1566ED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="lg:col-span-3 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Report Categories</CardTitle>
            <CardDescription>From AI-analysed field reports</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No field reports yet
              </div>
            ) : (
              <>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs mt-2">
                  {categoryData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                      <span>{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Field Report Alerts */}
      <Card className="shadow-sm border-none bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Field Alerts
            </CardTitle>
            <CardDescription>Latest volunteer field reports — real-time from Firestore</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-primary gap-1 shrink-0">
            <Link href="/dashboard/field-reports">View All <ArrowUpRight className="h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No field reports yet. Alerts from volunteers will appear here live.
            </div>
          ) : (
            <div className="space-y-3">
              {recentAlerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-slate-100">
                  <div className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                    alert.type === "critical" ? "bg-red-500 animate-pulse" :
                    alert.type === "high" ? "bg-orange-500" : "bg-primary"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">{alert.title}</p>
                      <span className="text-[10px] text-muted-foreground uppercase shrink-0">{alert.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.desc}</p>
                    {alert.affected > 0 && (
                      <p className="text-[10px] text-primary font-bold mt-1">
                        {alert.affected} people affected
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
