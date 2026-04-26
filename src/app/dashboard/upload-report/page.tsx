"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { submitFieldReport, subscribeToMyFieldReports, FieldReport } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Upload, FileText, Brain, AlertTriangle, CheckCircle2, Clock,
  MapPin, Users, Lightbulb, FileSpreadsheet, MessageSquare,
  ChevronDown, ChevronUp, Loader2, UploadCloud
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const SEVERITY_CONFIG = {
  Critical: { color: "bg-red-100 text-red-800 border-red-200", bar: "bg-red-500", icon: AlertTriangle },
  High: { color: "bg-orange-100 text-orange-800 border-orange-200", bar: "bg-orange-500", icon: AlertTriangle },
  Medium: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", bar: "bg-yellow-500", icon: Clock },
  Low: { color: "bg-green-100 text-green-800 border-green-200", bar: "bg-green-500", icon: CheckCircle2 },
};

const FILE_TYPE_HINTS = [
  { icon: FileText, label: "Paste Notes", desc: "Hand-written or typed field notes" },
  { icon: FileSpreadsheet, label: "CSV / Excel Data", desc: "Copy-paste from spreadsheet" },
  { icon: MessageSquare, label: "WhatsApp Messages", desc: "Copy forwarded community messages" },
  { icon: UploadCloud, label: "Google Form Responses", desc: "Paste raw form submission text" },
];

export default function UploadReportPage() {
  const { user, userRole } = useAuth();
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("Manual Notes");
  const [fileType, setFileType] = useState("text");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [myNgoId, setMyNgoId] = useState<string | null>(null);
  const [myReports, setMyReports] = useState<FieldReport[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    // Fetch volunteer's NGO
    getDoc(doc(db!, "volunteers", user.uid)).then(snap => {
      if (snap.exists()) setMyNgoId(snap.data().ngoId || null);
    });
    // Subscribe to my submitted reports
    return subscribeToMyFieldReports(user.uid, setMyReports);
  }, [user]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (["csv", "tsv"].includes(ext)) setFileType("csv");
    else if (["xlsx", "xls"].includes(ext)) setFileType("excel");
    else setFileType("text");

    const reader = new FileReader();
    reader.onload = (ev) => setRawText((ev.target?.result as string) || "");
    reader.readAsText(file);
  }

  async function handleAnalyze() {
    if (!rawText.trim()) {
      toast({ title: "Nothing to analyze", description: "Please paste or upload some data first.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze-field-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          fileType,
          volunteerName: user?.displayName || "Volunteer",
          ngoId: myNgoId,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      toast({ title: "✅ Analysis Complete", description: "AI has structured your report." });
    } catch (e: any) {
      toast({ title: "Analysis Failed", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit() {
    if (!result || !user || !myNgoId) {
      toast({ title: "Cannot Submit", description: myNgoId ? "Analyze first." : "You must be assigned to an NGO first.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await submitFieldReport({
        ngoId: myNgoId,
        volunteerId: user.uid,
        volunteerName: user.displayName || "Volunteer",
        fileName,
        fileType,
        rawTextPreview: result.rawTextPreview || rawText.substring(0, 500),
        summary: result.summary,
        keyFindings: result.keyFindings || [],
        affectedGroups: result.affectedGroups || [],
        location: result.location || "Not specified",
        estimatedPeopleAffected: result.estimatedPeopleAffected || 0,
        categories: result.categories || [],
        actionRecommendations: result.actionRecommendations || [],
        severity: result.severity,
        status: "New",
      });
      toast({ title: "📤 Report Submitted", description: "Your NGO can now review the AI-structured report." });
      setRawText("");
      setResult(null);
      setFileName("Manual Notes");
    } catch (e: any) {
      toast({ title: "Submission Failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const SevIcon = result ? SEVERITY_CONFIG[result.severity?.level as keyof typeof SEVERITY_CONFIG]?.icon || AlertTriangle : AlertTriangle;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" /> AI Field Report Uploader
        </h1>
        <p className="text-muted-foreground mt-1">Upload any raw data — notes, WhatsApp messages, CSV, forms — and AI will structure and analyse it for your NGO.</p>
      </div>

      {!myNgoId && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">You are not yet assigned to an NGO. Once the Admin assigns you, your reports will be visible to your NGO.</p>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      <Card className="border-none shadow-md bg-white">
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> Step 1 — Input Your Data
          </CardTitle>
          <CardDescription>Paste text below, or upload a file. Supports any format.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File type hints */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {FILE_TYPE_HINTS.map(({ icon: Icon, label, desc }) => (
              <button
                key={label}
                onClick={() => { setFileType(label.toLowerCase().split("/")[0].trim().replace(" ", "_")); setFileName(label); }}
                className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <Icon className="h-4 w-4 text-primary mb-1" />
                <p className="text-xs font-bold text-slate-700">{label}</p>
                <p className="text-[10px] text-slate-400 leading-tight">{desc}</p>
              </button>
            ))}
          </div>

          <Textarea
            placeholder={`Paste your field data here...\n\nExamples:\n• "Visited area near Rajaji Nagar, 45 families without food for 2 days"\n• Paste WhatsApp conversation screenshots text\n• Copy from Google Form responses\n• Paste CSV rows from Excel`}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={10}
            className="font-mono text-sm bg-slate-50 border-slate-200 resize-none focus:bg-white transition-colors"
          />

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
              <UploadCloud className="h-4 w-4" /> Upload File
            </Button>
            <span className="text-xs text-muted-foreground">{fileName}</span>
            <input ref={fileRef} type="file" accept=".txt,.csv,.tsv,.md,.log" onChange={handleFileUpload} className="hidden" />
          </div>

          <Button onClick={handleAnalyze} disabled={analyzing || !rawText.trim()} className="w-full gap-2 h-11 text-base font-semibold">
            {analyzing ? <><Loader2 className="h-5 w-5 animate-spin" /> Analysing with AI...</> : <><Brain className="h-5 w-5" /> Analyse with AI</>}
          </Button>
        </CardContent>
      </Card>

      {/* AI Results */}
      {result && (
        <div className="space-y-4">
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" /> Step 2 — AI Analysis Results
                </CardTitle>
                <Badge
                  className={`gap-1.5 text-xs border ${SEVERITY_CONFIG[result.severity?.level as keyof typeof SEVERITY_CONFIG]?.color}`}
                >
                  <SevIcon className="h-3.5 w-3.5" />
                  {result.severity?.level} Severity — {result.severity?.score}/100
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Severity bar */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-500 uppercase">Situation Severity Score</p>
                <Progress value={result.severity?.score} className={`h-2.5 rounded-full`} />
                <p className="text-xs text-muted-foreground italic">{result.severity?.reasoning}</p>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 border">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">AI Summary</p>
                <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Location */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Location</p>
                    <p className="text-sm text-slate-700">{result.location}</p>
                  </div>
                </div>
                {/* People affected */}
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">Est. Affected</p>
                    <p className="text-sm font-bold text-slate-800">{result.estimatedPeopleAffected} people</p>
                  </div>
                </div>
                {/* Groups */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Affected Groups</p>
                  <div className="flex flex-wrap gap-1">
                    {result.affectedGroups?.map((g: string) => <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>)}
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Categories Identified</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.categories?.map((c: string) => <Badge key={c} className="text-xs bg-primary/10 text-primary border-none">{c}</Badge>)}
                </div>
              </div>

              {/* Key Findings */}
              {result.keyFindings?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Key Findings</p>
                  <ul className="space-y-1.5">
                    {result.keyFindings.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Recommendations */}
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                <p className="text-xs font-bold text-primary uppercase mb-2 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" /> Recommended Actions for NGO
                </p>
                <ul className="space-y-1.5">
                  {result.actionRecommendations?.map((a: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>

              <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2 h-11 bg-green-600 hover:bg-green-700 text-white font-semibold">
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                {saving ? "Submitting to NGO..." : "✅ Submit Report to NGO"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* My submitted reports */}
      {myReports.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold font-headline flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> My Submitted Reports ({myReports.length})
          </h2>
          <div className="space-y-3">
            {myReports.map(r => {
              const isExpanded = expandedId === r.id;
              const sev = SEVERITY_CONFIG[r.severity?.level as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.Low;
              const SIcon = sev.icon;
              return (
                <Card key={r.id} className="border-none shadow-sm bg-white overflow-hidden">
                  <div className={`h-1 w-full ${sev.bar}`} />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div>
                          <p className="font-semibold text-sm text-slate-800 truncate">{r.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.createdAt ? formatDistanceToNow(r.createdAt.toDate(), { addSuffix: true }) : "just now"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`text-[10px] border gap-1 ${sev.color}`}>
                          <SIcon className="h-3 w-3" /> {r.severity?.level}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {r.status}
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setExpandedId(isExpanded ? null : r.id!)}>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 space-y-3 border-t pt-3">
                        <p className="text-sm text-slate-600">{r.summary}</p>
                        <div className="flex flex-wrap gap-1">
                          {r.categories?.map(c => <Badge key={c} className="text-[10px] bg-primary/10 text-primary border-none">{c}</Badge>)}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.location}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.estimatedPeopleAffected} affected</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
