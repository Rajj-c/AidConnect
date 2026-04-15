"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileUp, ScanLine, Send, Loader2, FileText,
  CheckCircle, AlertCircle, X, Sparkles, MapPin, Users,
  Wand2, Camera, UploadCloud
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { prioritizeNeeds, type PrioritizeNeedsOutput } from "@/ai/flows/prioritize-needs-flow";
import { addNeed } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ReportsPage() {
  const { userRole, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userRole === "Volunteer") {
      router.replace("/dashboard");
    }
  }, [userRole, router]);
  const [reportText, setReportText] = useState("");
  const [location, setLocation] = useState("");
  const [geoCoords, setGeoCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PrioritizeNeedsOutput | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const captureInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const priorityConfig = {
    High: { badge: "destructive" as const, color: "bg-destructive", dot: "bg-destructive" },
    Medium: { badge: "secondary" as const, color: "bg-amber-400", dot: "bg-amber-400" },
    Low: { badge: "secondary" as const, color: "bg-accent", dot: "bg-accent" },
  };

  function fetchLiveLocation() {
    if (!navigator.geolocation) {
      toast({ title: "GPS not supported", description: "Your browser does not support location tracking.", variant: "destructive" });
      return;
    }
    toast({ title: "Acquiring GPS Lock...", description: "Please allow location permissions." });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocation(`Live GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        toast({ title: "GPS Locked ✓", description: "Exact coordinates attached to report." });
      },
      (error) => toast({ title: "GPS Error", description: error.message, variant: "destructive" })
    );
  }

  async function handleAnalyze() {
    if (!reportText.trim() && !uploadedFile) {
      toast({ title: "Please enter text or upload a document first", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      let imageUrl: string | undefined = undefined;

      if (uploadedFile) {
        // Compress Image client-side to save bandwidth and bypass Next.js 1MB limits safely
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new globalThis.Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const MAX_WIDTH = 1000;
              let scale = 1;
              if (img.width > MAX_WIDTH) {
                scale = MAX_WIDTH / img.width;
              }
              canvas.width = img.width * scale;
              canvas.height = img.height * scale;
              
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.7));
              } else {
                resolve(event.target?.result as string); // fallback
              }
            };
            img.onerror = reject;
            img.src = event.target?.result as string;
          };
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
        });
      }

      // Execute Google Genkit Multimodal Flow
      const result = await prioritizeNeeds({ 
        collectedData: reportText || "Please analyze the attached handwriting/survey image.", 
        location, 
        imageUrl 
      });
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete ✓",
        description: `Identified ${result.identifiedNeeds.length} needs with priority levels.`,
      });
      // Scroll to results
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "Analysis failed", 
        description: err?.message || "Verify your connection and image size.",
        variant: "destructive" 
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (userRole === "Volunteer") return null;

  async function handleSaveNeed(need: any) {
    if (!user) {
      toast({ title: "You must be logged in to save needs", variant: "destructive" });
      return;
    }
    try {
      await addNeed({
        description: need.description,
        category: need.category,
        priority: need.priority,
        reasons: need.reasons,
        location: location || "Unknown Region",
        lat: geoCoords?.lat,
        lng: geoCoords?.lng,
        status: "Open",
        createdBy: user.uid
      });
      toast({ title: "Need Saved ✓", description: "This need is now synced across all active dashboards." });
    } catch {
      toast({ title: "Error saving need", description: "Could not reach database.", variant: "destructive" });
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline text-foreground">Field Data Submission</h1>
        <p className="text-muted-foreground">Submit surveys, field reports, and community requests for AI prioritization.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Report Details</CardTitle>
              <CardDescription>Enter report text manually or use OCR to scan documents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Geographical Location</Label>
                <div className="flex justify-between items-end gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="e.g. Kondapur, North Sector, Hyderabad"
                      className="pl-10"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" type="button" onClick={fetchLiveLocation} className="shrink-0 gap-2 font-medium">
                     📍 Use Live GPS
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="report">Field Observations / Report Text</Label>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    <CheckCircle className="h-3 w-3 text-accent" /> Offline Ready
                  </div>
                </div>
                <Textarea
                  id="report"
                  placeholder="Describe the community needs, observations, or request details here..."
                  className="min-h-[250px]"
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center bg-muted/30 py-4 px-6 border-t rounded-b-lg">
              <p className="text-xs text-muted-foreground max-w-[60%]">
                Your submission will be processed by AI to identify priority levels and matching requirements.
              </p>
              <Button onClick={handleAnalyze} disabled={isAnalyzing} className="gap-2">
                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isAnalyzing ? "Analyzing..." : "Analyze & Submit"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-md bg-primary/5">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" /> Gemini Vision
              </CardTitle>
              <CardDescription>Upload photos of handwritten notes or field surveys. Gemini 1.5 Pro will natively parse and analyze the handwriting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors ${uploadedFile ? "border-primary bg-primary/10" : "border-muted-foreground/20"}`}>
                {uploadedFile ? (
                  <div className="space-y-3">
                    <FileText className="h-10 w-10 text-primary mx-auto" />
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-sm font-medium truncate max-w-[150px]">{uploadedFile.name}</span>
                      <button onClick={() => setUploadedFile(null)} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <FileUp className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground mb-4">Select an option to scan a field document</p>
                    <div className="flex gap-2">
                       <input 
                         type="file" 
                         ref={captureInputRef}
                         className="hidden" 
                         accept="image/*" 
                         capture="environment"
                         onChange={(e) => e.target.files?.[0] && setUploadedFile(e.target.files[0])} 
                       />
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="gap-2"
                         onClick={() => captureInputRef.current?.click()}
                       >
                         <Camera className="h-4 w-4" /> Capture Photo
                       </Button>

                       <input 
                         type="file" 
                         ref={uploadInputRef}
                         className="hidden" 
                         accept="image/*,.pdf"
                         onChange={(e) => e.target.files?.[0] && setUploadedFile(e.target.files[0])} 
                       />
                       <Button 
                         variant="default" 
                         size="sm" 
                         className="gap-2"
                         onClick={() => uploadInputRef.current?.click()}
                       >
                         <UploadCloud className="h-4 w-4" /> Upload File
                       </Button>
                    </div>
                  </>
                )}
              </div>

              {isAnalyzing && uploadedFile && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground animate-pulse">
                    <span>Extracting handwriting...</span>
                  </div>
                  <Progress value={undefined} className="h-2 animate-pulse" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="font-headline text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-accent" /> Submission Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>Include estimated number of people affected.</li>
                <li>Specify the type of help (Food, Health, etc).</li>
                <li>Clear handwriting helps OCR accuracy.</li>
                <li>Add photos of the site if possible.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Results Panel */}
      {analysisResult && (
        <div ref={resultsRef} className="space-y-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-headline">AI Analysis Results</h2>
              <p className="text-sm text-muted-foreground">{analysisResult.identifiedNeeds.length} needs identified and prioritized</p>
            </div>
          </div>

          {/* Summary */}
          <Card className="border-none shadow-md bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-5">
              <p className="text-sm font-medium mb-1 text-primary">Overall Summary</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{analysisResult.overallSummary}</p>
            </CardContent>
          </Card>

          {/* Identified Needs */}
          <div className="grid gap-3">
            {analysisResult.identifiedNeeds.map((need, i) => {
              const cfg = priorityConfig[need.priority];
              return (
                <Card key={i} className="border-none shadow-sm overflow-hidden">
                  <div className="flex">
                    <div className={`w-1.5 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant={cfg.badge} className="rounded-md text-[11px]">{need.priority} Priority</Badge>
                        <Badge variant="outline" className="rounded-md text-[11px] bg-muted/50">{need.category}</Badge>
                      </div>
                      <p className="text-sm font-semibold mb-2">{need.description}</p>
                      <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground border-l-2 border-primary/30">
                        <span className="font-medium text-foreground">AI Reasoning: </span>
                        {need.reasons}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-7"
                          onClick={() => handleSaveNeed(need)}
                        >
                          Save to Needs
                        </Button>
                        <Button size="sm" className="text-xs h-7 gap-1">
                          <Users className="h-3 w-3" /> Find Volunteers
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
