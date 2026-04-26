"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToFieldReportsByNGO, subscribeToVolunteersByNGO,
  createTask, assignTaskToVolunteer, updateFieldReportStatus,
  FieldReport, VolunteerDoc
} from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Brain, AlertTriangle, CheckCircle2, Clock, MapPin, Users,
  Zap, ChevronDown, ChevronUp, Loader2, Star, TrendingUp,
  Sparkles, Send, ShieldAlert, BarChart3, Radio
} from "lucide-react";

const SEV = {
  Critical: { color: "bg-red-100 text-red-800 border-red-200", bar: "bg-red-500", dot: "bg-red-500", icon: AlertTriangle, pulse: true },
  High:     { color: "bg-orange-100 text-orange-800 border-orange-200", bar: "bg-orange-500", dot: "bg-orange-400", icon: AlertTriangle, pulse: false },
  Medium:   { color: "bg-yellow-100 text-yellow-800 border-yellow-200", bar: "bg-yellow-400", dot: "bg-yellow-400", icon: Clock, pulse: false },
  Low:      { color: "bg-green-100 text-green-800 border-green-200", bar: "bg-green-400", dot: "bg-green-400", icon: CheckCircle2, pulse: false },
};

function timeAgo(ts: any) {
  if (!ts?.toDate) return "just now";
  const d = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

interface DispatchRec {
  volunteerId: string;
  volunteerName: string;
  score: number;
  reasons: string[];
  dispatchMessage: string;
  aiPowered: boolean;
}

export default function NeedsBoardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerDoc[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState<string | null>(null); // reportId being dispatched
  const [dispatchResults, setDispatchResults] = useState<Record<string, DispatchRec[]>>({});
  const [assigning, setAssigning] = useState<string | null>(null);
  const [ngoName, setNgoName] = useState("NGO");

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeToFieldReportsByNGO(user.uid, setReports);
    const u2 = subscribeToVolunteersByNGO(user.uid, setVolunteers);
    // Fetch NGO name
    import("firebase/firestore").then(({ doc, getDoc }) =>
      import("@/lib/firebase").then(({ db }) => {
        if (!db) return;
        getDoc(doc(db, "ngos", user.uid)).then(s => {
          if (s.exists()) setNgoName(s.data().orgName || "NGO");
        });
      })
    );
    return () => { u1(); u2(); };
  }, [user]);

  // Only show unresolved reports
  const active = reports.filter(r => r.status !== "ActionTaken");
  const critCount = active.filter(r => r.severity?.level === "Critical").length;
  const highCount = active.filter(r => r.severity?.level === "High").length;
  const totalPeople = active.reduce((s, r) => s + (r.estimatedPeopleAffected || 0), 0);
  const availVols = volunteers.filter(v => v.status === "Available").length;

  async function handleAIDispatch(report: FieldReport) {
    if (!report.id) return;
    setDispatching(report.id);
    try {
      // Build task preview from report
      const taskPreview = {
        title: `[URGENT] ${report.categories?.[0] || "Aid"} — ${report.location}`,
        category: report.categories?.[0] === "Food Security" ? "Food"
          : report.categories?.[0] === "Healthcare" ? "Health"
          : report.categories?.[0] === "Water & Sanitation" ? "Water"
          : report.categories?.[0] === "Shelter" ? "Shelter"
          : report.categories?.[0] === "Education" ? "Education"
          : "Other",
        priority: report.severity?.level === "Critical" ? "High"
          : report.severity?.level === "High" ? "High" : "Medium",
        skillsRequired: report.categories?.includes("Healthcare") ? ["First Aid", "Medical Professional"]
          : report.categories?.includes("Education") ? ["Teaching", "Childcare"]
          : [],
        location: report.location,
        description: report.summary,
      };

      // Fetch volunteer details from users collection too for richer data
      const volData = volunteers.map(v => ({
        userId: v.userId || v.id,
        name: v.name || "Volunteer",
        skills: v.skills || [],
        status: v.status,
        rating: v.rating || 3,
        tasksCompleted: v.tasksCompleted || 0,
        location: v.location || "",
        availability: v.availability || "Flexible",
        languages: v.languages || [],
      }));

      const res = await fetch("/api/smart-dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskPreview, volunteers: volData }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setDispatchResults(prev => ({ ...prev, [report.id!]: data.recommendations }));
      setExpandedId(report.id!);
      toast({
        title: `${data.aiPowered ? "✨ Gemini AI" : "🤖 AI"} found ${data.recommendations.length} best matches`,
        description: `${data.availableCount} of ${data.totalPoolSize} volunteers are available right now.`
      });
    } catch (e: any) {
      toast({ title: "Dispatch failed", description: e.message, variant: "destructive" });
    } finally {
      setDispatching(null);
    }
  }

  async function handleAssign(report: FieldReport, rec: DispatchRec) {
    if (!user || !report.id) return;
    setAssigning(rec.volunteerId);
    try {
      // 1. Create the task from the report
      const taskRef = await createTask({
        ngoId: user.uid,
        ngoName,
        title: `${report.severity?.level === "Critical" ? "🚨 " : ""}${report.categories?.[0] || "Aid"} — ${report.location}`,
        description: `${report.summary}\n\n📋 Key findings:\n${report.keyFindings?.slice(0, 3).map(f => `• ${f}`).join("\n")}`,
        taskType: report.categories?.includes("Healthcare") ? "Service" : "Distribution",
        category: report.categories?.[0] === "Food Security" ? "Food"
          : report.categories?.[0] === "Healthcare" ? "Health"
          : report.categories?.[0] === "Water & Sanitation" ? "Water"
          : report.categories?.[0] === "Shelter" ? "Shelter"
          : report.categories?.[0] === "Education" ? "Education" : "Other",
        skillsRequired: [],
        location: report.location,
        priority: report.severity?.level === "Critical" || report.severity?.level === "High" ? "High" : "Medium",
        status: "Assigned",
        deadline: null,
        assignedVolunteerId: rec.volunteerId,
        assignedVolunteerName: rec.volunteerName,
      });

      // 2. Assign volunteer to task
      await assignTaskToVolunteer(taskRef.id, rec.volunteerId, rec.volunteerName);

      // 3. Mark report as ActionTaken
      await updateFieldReportStatus(report.id, "ActionTaken");

      toast({
        title: `✅ ${rec.volunteerName} dispatched!`,
        description: rec.dispatchMessage,
      });

      // Clear dispatch results for this report
      setDispatchResults(prev => {
        const next = { ...prev };
        delete next[report.id!];
        return next;
      });
      setExpandedId(null);
    } catch (e: any) {
      toast({ title: "Assignment failed", description: e.message, variant: "destructive" });
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Live Intelligence</span>
          </div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <Radio className="h-7 w-7 text-primary" /> Needs Intelligence Board
          </h1>
          <p className="text-muted-foreground mt-1">AI-aggregated community needs. One click to dispatch the right volunteer.</p>
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Needs", value: active.length, icon: ShieldAlert, color: "text-primary bg-primary/10" },
          { label: "Critical Alerts", value: critCount, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
          { label: "People Affected", value: totalPeople.toLocaleString(), icon: Users, color: "text-orange-600 bg-orange-50" },
          { label: "Vols Available", value: availVols, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-none shadow-sm bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-xl ${color}`}><Icon className="h-4 w-4" /></div>
              <div>
                <p className="text-xl font-black text-slate-800">{value}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Needs feed */}
      {active.length === 0 ? (
        <Card className="border-dashed border-2 shadow-none bg-white">
          <CardContent className="py-20 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">No active needs</p>
            <p className="text-sm text-muted-foreground">All community reports have been addressed, or none have been uploaded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {active
            .sort((a, b) => (b.severity?.score || 0) - (a.severity?.score || 0))
            .map(report => {
              const sev = SEV[report.severity?.level as keyof typeof SEV] || SEV.Low;
              const SIcon = sev.icon;
              const isExpanded = expandedId === report.id;
              const recs = dispatchResults[report.id!] || [];
              const isDispatching = dispatching === report.id;

              return (
                <Card key={report.id} className={`border-none shadow-md bg-white overflow-hidden ${report.severity?.level === "Critical" ? "ring-1 ring-red-200" : ""}`}>
                  <div className={`h-1.5 w-full ${sev.bar}`} />
                  <CardContent className="p-5">
                    {/* Top row */}
                    <div 
                      className="flex items-start justify-between gap-3 cursor-pointer group hover:bg-slate-50/50 -m-5 p-5 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : report.id!)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {sev.pulse && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
                          <Badge className={`text-[10px] border gap-1 ${sev.color}`}>
                            <SIcon className="h-3 w-3" /> {report.severity?.level}
                          </Badge>
                          {report.categories?.slice(0, 2).map(c => (
                            <Badge key={c} className="text-[10px] bg-primary/10 text-primary border-none">{c}</Badge>
                          ))}
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">{report.fileType}</Badge>
                        </div>

                        <p className={`text-sm text-slate-800 mb-0.5 leading-relaxed ${isExpanded ? "font-normal mt-3" : "font-bold"}`}>
                          {isExpanded ? report.summary : `${report.summary?.substring(0, 100)}...`}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{report.location}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{report.estimatedPeopleAffected} affected</span>
                          <span>by {report.volunteerName} · {timeAgo(report.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-2xl font-black text-slate-800">{report.severity?.score}</span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (recs.length > 0) setExpandedId(isExpanded ? null : report.id!);
                            else handleAIDispatch(report);
                          }}
                          disabled={isDispatching}
                          className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90"
                        >
                          {isDispatching
                            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Matching...</>
                            : recs.length > 0
                            ? <>{isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />} {recs.length} Matches</>
                            : <><Sparkles className="h-3.5 w-3.5" /> AI Dispatch</>
                          }
                        </Button>
                      </div>
                    </div>

                    {/* Severity bar */}
                    <Progress value={report.severity?.score} className="h-1 mt-3" />

                    {/* Key findings quick preview */}
                    {report.keyFindings?.length > 0 && !isExpanded && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {report.keyFindings.slice(0, 2).map((f, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">• {f.substring(0, 50)}</span>
                        ))}
                      </div>
                    )}

                    {/* Expanded: full details + dispatch results */}
                    {isExpanded && (
                      <div className="mt-5 space-y-5 border-t pt-5">
                        
                        {/* Raw Field Data Preview */}
                        {report.rawTextPreview && (
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Raw Field Data ({report.fileType})</p>
                            <p className="text-xs text-slate-600 font-mono whitespace-pre-wrap">{report.rawTextPreview}</p>
                          </div>
                        )}
                        {/* Key findings */}
                        {report.keyFindings?.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Key Findings from Field</p>
                            <ul className="space-y-1">
                              {report.keyFindings.map((f, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Dispatch recommendations */}
                        {recs.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-primary uppercase mb-3 flex items-center gap-1.5">
                              <Brain className="h-3.5 w-3.5" />
                              {recs[0]?.aiPowered ? "Gemini AI" : "AI"} Volunteer Recommendations
                            </p>
                            <div className="space-y-2">
                              {recs.map((rec, i) => (
                                <div key={rec.volunteerId} className={`rounded-xl border p-3.5 ${i === 0 ? "border-primary/30 bg-primary/5" : "border-slate-200 bg-white"}`}>
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${i === 0 ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}>
                                        {rec.volunteerName?.charAt(0) || "?"}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="font-bold text-sm text-slate-800">{rec.volunteerName}</p>
                                          {i === 0 && <Badge className="text-[9px] bg-primary text-white border-none px-1.5">Best Match</Badge>}
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                          {rec.reasons?.slice(0, 2).map((r, j) => (
                                            <span key={j} className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded-full">{r}</span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <div className="text-right">
                                        <p className="text-lg font-black text-primary">{rec.score}%</p>
                                        <p className="text-[9px] text-muted-foreground">match</p>
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={() => handleAssign(report, rec)}
                                        disabled={!!assigning}
                                        className={`gap-1 text-xs h-8 ${i === 0 ? "bg-primary hover:bg-primary/90 text-white" : "border border-primary/30 text-primary bg-white hover:bg-primary/5"}`}
                                        variant={i === 0 ? "default" : "outline"}
                                      >
                                        {assigning === rec.volunteerId
                                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          : <Send className="h-3.5 w-3.5" />
                                        }
                                        Dispatch
                                      </Button>
                                    </div>
                                  </div>
                                  {i === 0 && rec.dispatchMessage && (
                                    <p className="text-xs text-slate-500 italic mt-2 pl-10 border-l-2 border-primary/20">&ldquo;{rec.dispatchMessage}&rdquo;</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Re-run dispatch if no results yet */}
                        {recs.length === 0 && (
                          <Button onClick={() => handleAIDispatch(report)} disabled={isDispatching} className="w-full gap-2">
                            <Sparkles className="h-4 w-4" /> Run AI Dispatch
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
