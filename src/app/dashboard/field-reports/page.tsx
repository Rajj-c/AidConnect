"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToFieldReportsByNGO, updateFieldReportStatus, FieldReport } from "@/lib/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Brain, AlertTriangle, CheckCircle2, Clock, MapPin, Users,
  Lightbulb, FileText, ChevronDown, ChevronUp, TrendingUp, ShieldAlert
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const SEVERITY_CONFIG = {
  Critical: { color: "bg-red-100 text-red-800 border-red-200", bar: "bg-red-500", icon: AlertTriangle, ring: "ring-red-200" },
  High: { color: "bg-orange-100 text-orange-800 border-orange-200", bar: "bg-orange-500", icon: AlertTriangle, ring: "ring-orange-200" },
  Medium: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", bar: "bg-yellow-500", icon: Clock, ring: "ring-yellow-200" },
  Low: { color: "bg-green-100 text-green-800 border-green-200", bar: "bg-green-400", icon: CheckCircle2, ring: "ring-green-200" },
};

type FilterType = "All" | "Critical" | "High" | "Medium" | "Low" | "New" | "Reviewed";

export default function NGOFieldReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("All");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    return subscribeToFieldReportsByNGO(user.uid, (data) => {
      setReports(data);
      setLoading(false);
    });
  }, [user]);

  async function handleStatusUpdate(report: FieldReport, status: FieldReport["status"]) {
    if (!report.id) return;
    try {
      await updateFieldReportStatus(report.id, status);
      toast({ title: `Report marked as ${status}` });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  }

  const filtered = reports.filter(r => {
    if (filter === "All") return true;
    if (filter === "New" || filter === "Reviewed") return r.status === filter;
    return r.severity?.level === filter;
  });

  const criticalCount = reports.filter(r => r.severity?.level === "Critical").length;
  const highCount = reports.filter(r => r.severity?.level === "High").length;
  const newCount = reports.filter(r => r.status === "New").length;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" /> AI Field Reports
          </h1>
          <p className="text-muted-foreground mt-1">AI-structured reports submitted by your volunteers from the field.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Reports", value: reports.length, icon: FileText, color: "bg-blue-50 text-blue-600" },
          { label: "Needs Review", value: newCount, icon: Clock, color: "bg-amber-50 text-amber-600" },
          { label: "Critical", value: criticalCount, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
          { label: "High Severity", value: highCount, icon: ShieldAlert, color: "bg-orange-50 text-orange-600" },
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["All", "New", "Critical", "High", "Medium", "Low", "Reviewed"] as const).map(f => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setFilter(f)}>
            {f}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-24 text-muted-foreground">
          <Brain className="h-10 w-10 mx-auto mb-3 animate-pulse text-primary" />
          <p>Loading reports...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 bg-white shadow-none">
          <CardContent className="py-20 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">No reports yet</p>
            <p className="text-sm text-muted-foreground">Your volunteers haven't uploaded any field reports yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => {
            const isExpanded = expandedId === r.id;
            const sev = SEVERITY_CONFIG[r.severity?.level as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.Low;
            const SIcon = sev.icon;

            return (
              <Card key={r.id} className={`border-none shadow-md bg-white overflow-hidden ${r.status === "New" && r.severity?.level === "Critical" ? "ring-2 " + sev.ring : ""}`}>
                <div className={`h-1.5 w-full ${sev.bar}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge className={`text-[10px] border gap-1 ${sev.color}`}><SIcon className="h-3 w-3" />{r.severity?.level}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${r.status === "New" ? "bg-amber-50 text-amber-700 border-amber-200" : r.status === "Reviewed" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-green-50 text-green-700 border-green-200"}`}>{r.status}</Badge>
                        {r.categories?.slice(0, 2).map(c => <Badge key={c} className="text-[10px] bg-primary/10 text-primary border-none">{c}</Badge>)}
                      </div>
                      <p className="font-semibold text-slate-800 text-sm">{r.fileName}</p>
                      <p className="text-xs text-muted-foreground">By {r.volunteerName} · {r.createdAt ? formatDistanceToNow(r.createdAt.toDate(), { addSuffix: true }) : "just now"}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-black text-slate-800">{r.severity?.score}</p>
                        <p className="text-[10px] text-muted-foreground">/ 100</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setExpandedId(isExpanded ? null : r.id!)}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Progress value={r.severity?.score} className="h-1.5 mt-3" />

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.location}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.estimatedPeopleAffected} people affected</span>
                  </div>

                  {isExpanded && (
                    <div className="mt-5 space-y-4 border-t pt-4">
                      <div className="bg-slate-50 rounded-xl p-3 border">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-1">AI Summary</p>
                        <p className="text-sm text-slate-700 leading-relaxed">{r.summary}</p>
                      </div>

                      <div className={`rounded-xl p-3 border text-sm ${sev.color}`}>
                        <p className="font-bold text-xs uppercase mb-1 flex items-center gap-1.5"><SIcon className="h-3.5 w-3.5" />Severity Reasoning</p>
                        <p>{r.severity?.reasoning}</p>
                      </div>

                      {r.keyFindings?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Key Findings</p>
                          <ul className="space-y-1.5">
                            {r.keyFindings.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {r.affectedGroups?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase mb-2">Affected Groups</p>
                          <div className="flex flex-wrap gap-1.5">
                            {r.affectedGroups.map(g => <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>)}
                          </div>
                        </div>
                      )}

                      <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                        <p className="text-xs font-bold text-primary uppercase mb-2 flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5" />AI Recommended Actions
                        </p>
                        <ul className="space-y-1.5">
                          {r.actionRecommendations?.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />{a}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {r.rawTextPreview && (
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase mb-1">Raw Data Preview</p>
                          <pre className="text-xs bg-slate-50 border p-3 rounded-lg text-slate-600 whitespace-pre-wrap font-mono overflow-auto max-h-32">{r.rawTextPreview}</pre>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        {r.status === "New" && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(r, "Reviewed")} className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50">
                            <CheckCircle2 className="h-4 w-4" />Mark Reviewed
                          </Button>
                        )}
                        {r.status === "Reviewed" && (
                          <Button size="sm" onClick={() => handleStatusUpdate(r, "ActionTaken")} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle2 className="h-4 w-4" />Mark Action Taken
                          </Button>
                        )}
                      </div>
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
