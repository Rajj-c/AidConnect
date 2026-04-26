"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { submitFieldReport, subscribeToMyFieldReports, FieldReport } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Upload, FileText, Brain, AlertTriangle, CheckCircle2, Clock,
  MapPin, Users, Lightbulb, FileSpreadsheet, MessageSquare,
  ChevronDown, ChevronUp, Loader2, UploadCloud, Image as ImageIcon,
  X, Sparkles, Edit2, Save
} from "lucide-react";

const SEVERITY_CONFIG = {
  Critical: { color: "bg-red-100 text-red-800 border-red-200", bar: "bg-red-500", icon: AlertTriangle },
  High:     { color: "bg-orange-100 text-orange-800 border-orange-200", bar: "bg-orange-500", icon: AlertTriangle },
  Medium:   { color: "bg-yellow-100 text-yellow-800 border-yellow-200", bar: "bg-yellow-500", icon: Clock },
  Low:      { color: "bg-green-100 text-green-800 border-green-200", bar: "bg-green-400", icon: CheckCircle2 },
};

const DATA_TYPES = [
  { icon: MessageSquare, label: "WhatsApp / Chat",  desc: "Paste forwarded community messages", ft: "whatsapp" },
  { icon: FileSpreadsheet, label: "Excel / CSV",     desc: "Upload .xlsx, .csv, .xls files",    ft: "excel" },
  { icon: FileText, label: "Paper Survey / Notes", desc: "Type or paste hand-written notes",   ft: "notes" },
  { icon: ImageIcon, label: "Photo / Scan",         desc: "Upload scanned survey or photo",     ft: "image" },
];

// Supported file extensions grouped by type
const EXCEL_EXTS = ["xlsx", "xls", "ods"];
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"];
const TEXT_EXTS  = ["txt", "csv", "tsv", "md", "log", "json", "pdf", "docx", "doc"];
const ALL_ACCEPT  = ".txt,.csv,.tsv,.md,.json,.xlsx,.xls,.ods,.jpg,.jpeg,.png,.gif,.webp,.bmp,.pdf,.docx,.doc";

function timeAgo(ts: any) {
  if (!ts?.toDate) return "just now";
  const diff = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Compress + resize image on canvas before sending to Gemini
// Keeps file size <1MB regardless of original (phone photos can be 15MB+)
function compressImage(file: File, maxPx = 1024, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Scale down while keeping aspect ratio
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round((height * maxPx) / width); width = maxPx; }
        else { width = Math.round((width * maxPx) / height); height = maxPx; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      // White background for paper scans
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl.split(",")[1] || "");
    };
    img.onerror = reject;
    img.src = url;
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || "");
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function parseExcel(file: File): Promise<string> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  let text = "";
  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    text += `--- Sheet: ${name} ---\n`;
    text += XLSX.utils.sheet_to_csv(sheet) + "\n";
  });
  return text;
}

export default function UploadReportPage() {
  const { user } = useAuth();
  const [rawText, setRawText]     = useState("");
  const [fileName, setFileName]   = useState("");
  const [fileType, setFileType]   = useState("notes");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64]   = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [result, setResult]       = useState<any>(null);
  const [myNgoId, setMyNgoId]     = useState<string | null>(null);
  const [myReports, setMyReports] = useState<FieldReport[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    import("firebase/firestore").then(({ doc, getDoc }) =>
      import("@/lib/firebase").then(({ db }) => {
        if (!db) return;
        getDoc(doc(db, "volunteers", user.uid)).then(snap => {
          if (snap.exists()) setMyNgoId(snap.data().ngoId || null);
        }).catch(() => {});
      })
    );
    return subscribeToMyFieldReports(user.uid, setMyReports);
  }, [user]);

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    setFileName(file.name);
    setImagePreview(null);
    setImageBase64(null);
    setRawText("");

    if (IMAGE_EXTS.includes(ext) || file.type.startsWith("image/")) {
      // Image: compress on canvas first (phone photos can be 15MB+, API limit is 4MB)
      setFileType("image");
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
      const originalMB = (file.size / 1024 / 1024).toFixed(1);
      try {
        const b64 = await compressImage(file, 1024, 0.82);
        const compressedKB = Math.round((b64.length * 3) / 4 / 1024);
        setImageBase64(b64);
        setRawText("");
        toast({
          title: "📷 Image ready for AI",
          description: `${originalMB}MB → ${compressedKB}KB. Gemini will read all text from the photo.`
        });
      } catch {
        toast({ title: "Image load failed", description: "Please try a different photo.", variant: "destructive" });
      }
    } else if (EXCEL_EXTS.includes(ext)) {
      // Excel: parse with SheetJS
      setFileType("excel");
      try {
        const text = await parseExcel(file);
        setRawText(text);
        toast({ title: "📊 Excel parsed", description: `Extracted data from ${file.name}` });
      } catch {
        toast({ title: "Excel parse failed", description: "Please copy-paste the data manually.", variant: "destructive" });
      }
    } else {
      // Text-based: CSV, TXT, DOC, PDF, MD, etc.
      setFileType(ext === "csv" || ext === "tsv" ? "csv" : "text");
      const text = await readAsText(file);
      setRawText(text);
      toast({ title: "📄 File loaded", description: `${file.name} — ${text.length} characters extracted` });
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  async function handleAnalyze() {
    if (!rawText.trim() && !imageBase64) {
      toast({ title: "Nothing to analyse", description: "Paste data or upload a file first.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    if (result) {
        setResult(null);
        setIsEditing(false);
      }
    try {
      const res = await fetch("/api/analyze-field-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          fileType,
          volunteerName: user?.displayName || "Volunteer",
          ngoId: myNgoId,
          imageBase64: imageBase64 || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setIsEditing(false);
      toast({ title: data.aiPowered ? "✨ Gemini AI Analysis Complete" : "✅ Analysis Complete", description: "Report structured successfully." });
    } catch (e: any) {
      toast({ title: "Analysis Failed", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit() {
    if (!result || !user) { toast({ title: "Analyse first.", variant: "destructive" }); return; }
    if (!myNgoId) { toast({ title: "Not assigned to an NGO yet.", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await submitFieldReport({
        ngoId: myNgoId,
        volunteerId: user.uid,
        volunteerName: user.displayName || "Volunteer",
        fileName: fileName || fileType,
        fileType,
        rawTextPreview: (rawText || "Image upload").substring(0, 500),
        summary: result.summary || "",
        keyFindings: result.keyFindings || [],
        affectedGroups: result.affectedGroups || [],
        location: result.location || "Not specified",
        estimatedPeopleAffected: result.estimatedPeopleAffected || 0,
        categories: result.categories || [],
        actionRecommendations: result.actionRecommendations || [],
        severity: result.severity || { level: "Low", score: 0, reasoning: "" },
        status: "New",
      });
      toast({ title: "📤 Report Submitted!", description: "Your NGO can now view the AI-structured report." });
      setRawText(""); setResult(null); setFileName(""); setImagePreview(null); setImageBase64(null);
    } catch (e: any) {
      toast({ title: "Submission Failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const canAnalyse = (!!rawText.trim() || !!imageBase64) && !analyzing;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" /> AI Field Report Uploader
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload <strong>any</strong> format — WhatsApp messages, Excel sheets, paper survey photos, Google Form exports — AI will structure and analyse it for your NGO.
        </p>
      </div>

      {!myNgoId && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">You must be assigned to an NGO before submitting reports. Reports will be saved once assigned.</p>
          </CardContent>
        </Card>
      )}

      {/* Step 1 */}
      <Card className="border-none shadow-md bg-white">
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" /> Step 1 — Choose Your Data Source
          </CardTitle>
          <CardDescription>Select the type of data you're uploading, then provide it below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data type selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {DATA_TYPES.map(({ icon: Icon, label, desc, ft }) => (
              <button
                key={ft}
                onClick={() => setFileType(ft)}
                className={`text-left p-3 rounded-xl border transition-all ${fileType === ft ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"}`}
              >
                <Icon className={`h-4 w-4 mb-1.5 ${fileType === ft ? "text-primary" : "text-slate-400"}`} />
                <p className="text-xs font-bold text-slate-700 leading-tight">{label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{desc}</p>
              </button>
            ))}
          </div>

          {/* Drag & drop zone OR text area */}
          {fileType === "image" ? (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragging ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/50 hover:bg-slate-50"}`}
            >
              {imagePreview ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="preview" className="max-h-48 rounded-lg mx-auto shadow" />
                  <button
                    onClick={e => { e.stopPropagation(); setImagePreview(null); setImageBase64(null); setFileName(""); }}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow border"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <p className="text-xs text-muted-foreground mt-2">{fileName}</p>
                </div>
              ) : (
                <>
                  <ImageIcon className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">Drop your photo/scan here</p>
                  <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WEBP, GIF — scanned surveys, handwritten notes, WhatsApp screenshots</p>
                  <Badge className="mt-3 bg-primary/10 text-primary border-none text-xs">
                    <Sparkles className="h-3 w-3 mr-1" /> Gemini AI will extract & analyse the content
                  </Badge>
                </>
              )}
            </div>
          ) : (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed transition-all ${isDragging ? "border-primary bg-primary/5" : "border-transparent"}`}
              >
                <Textarea
                  placeholder={
                    fileType === "whatsapp"
                      ? `Paste your WhatsApp messages here...\n\nExample:\n[10:32 AM, 4/23] Ravi: The families near old bus stand haven't received food for 3 days\n[10:35 AM] Priya: Around 20 families, many with children under 5\n[10:36 AM] Ravi: They also need medicines, some elderly are sick`
                      : fileType === "excel"
                      ? `Paste CSV data here, or upload an Excel file below...\n\nName, Area, Issue, People Affected\nKumar Family, Rajaji Nagar, No food, 6\nPatel Group, Old Town, Water shortage, 15`
                      : `Paste your field notes here...\n\nExample:\nVisited Sector 4 today. Found 45 families displaced by flooding.\n3 children need urgent medical attention.\nLocal school is being used as shelter — needs cots and food.`
                  }
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  rows={9}
                  className="font-mono text-sm bg-slate-50 resize-none border-slate-200 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2 shrink-0">
                  <UploadCloud className="h-4 w-4" /> Upload File
                </Button>
                <span className="text-xs text-muted-foreground">
                  {fileName || "Excel (.xlsx), CSV, TXT, PDF, Word, Images — all supported"}
                </span>
              </div>
            </>
          )}

          <input
            ref={fileRef}
            type="file"
            accept={ALL_ACCEPT}
            onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; }}
            className="hidden"
          />

          <Button
            onClick={handleAnalyze}
            disabled={!canAnalyse}
            className="w-full gap-2 h-11 text-base font-semibold"
          >
            {analyzing
              ? <><Loader2 className="h-5 w-5 animate-spin" /> Analysing with AI...</>
              : <><Sparkles className="h-5 w-5" /> Analyse with Gemini AI</>
            }
          </Button>
        </CardContent>
      </Card>

      {/* Step 2: Results */}
      {result && (
        <Card className="border-none shadow-md bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" /> Step 2 — AI Analysis Results
                {result.aiPowered && <Badge className="text-[10px] bg-primary/10 text-primary border-none gap-1"><Sparkles className="h-3 w-3" />Gemini AI</Badge>}
              </CardTitle>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Button variant="default" size="sm" onClick={() => setIsEditing(false)} className="gap-1 h-7 text-xs bg-green-600 hover:bg-green-700">
                    <Save className="h-3 w-3" /> Save Edits
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-1 h-7 text-xs">
                    <Edit2 className="h-3 w-3" /> Edit Data
                  </Button>
                )}
                {result.severity && (
                  <Badge className={`gap-1.5 text-xs border ${SEVERITY_CONFIG[result.severity.level as keyof typeof SEVERITY_CONFIG]?.color || ""}`}>
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {result.severity.level} · {result.severity.score}/100
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {result.severity && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-500 uppercase">Situation Severity Score</p>
                <Progress value={result.severity.score} className="h-2.5" />
                <p className="text-xs text-muted-foreground italic">{result.severity.reasoning}</p>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-4 border">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">AI Summary</p>
              {isEditing ? (
                <Textarea 
                  value={result.summary} 
                  onChange={e => setResult({ ...result, summary: e.target.value })}
                  className="text-sm bg-white"
                  rows={3}
                />
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="w-full">
                  <p className="text-xs font-bold text-slate-500 uppercase">Location</p>
                  {isEditing ? (
                    <Input 
                      value={result.location} 
                      onChange={e => setResult({ ...result, location: e.target.value })}
                      className="text-sm h-8 mt-1 bg-white"
                    />
                  ) : (
                    <p className="text-sm text-slate-700">{result.location}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="w-full">
                  <p className="text-xs font-bold text-slate-500 uppercase">Est. Affected</p>
                  {isEditing ? (
                    <Input 
                      type="number"
                      value={result.estimatedPeopleAffected} 
                      onChange={e => setResult({ ...result, estimatedPeopleAffected: parseInt(e.target.value) || 0 })}
                      className="text-sm h-8 mt-1 bg-white"
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-800">{result.estimatedPeopleAffected} people</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Affected Groups</p>
                <div className="flex flex-wrap gap-1">
                  {(result.affectedGroups || []).map((g: string) => <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>)}
                </div>
              </div>
            </div>

            {(result.categories || []).length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Categories Identified</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.categories.map((c: string) => <Badge key={c} className="text-xs bg-primary/10 text-primary border-none">{c}</Badge>)}
                </div>
              </div>
            )}

            {(result.keyFindings || []).length > 0 && (
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

            {(result.actionRecommendations || []).length > 0 && (
              <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                <p className="text-xs font-bold text-primary uppercase mb-2 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" /> Recommended Actions for NGO
                </p>
                <ul className="space-y-1.5">
                  {result.actionRecommendations.map((a: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />{a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2 h-11 bg-green-600 hover:bg-green-700 text-white font-semibold">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              {saving ? "Submitting..." : "✅ Submit Report to NGO"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Past reports */}
      {myReports.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold font-headline flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> My Submitted Reports ({myReports.length})
          </h2>
          {myReports.map(r => {
            const isExp = expandedId === r.id;
            const sev = SEVERITY_CONFIG[r.severity?.level as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.Low;
            return (
              <Card key={r.id} className="border-none shadow-sm bg-white overflow-hidden">
                <div className={`h-1 w-full ${sev.bar}`} />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate">{r.fileName || r.fileType}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] border ${sev.color}`}>{r.severity?.level}</Badge>
                      <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setExpandedId(isExp ? null : r.id!)}>
                        {isExp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {isExp && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <p className="text-sm text-slate-600">{r.summary}</p>
                      <div className="flex flex-wrap gap-1">
                        {(r.categories || []).map(c => <Badge key={c} className="text-[10px] bg-primary/10 text-primary border-none">{c}</Badge>)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
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
      )}
    </div>
  );
}
