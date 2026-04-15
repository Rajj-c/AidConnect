
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  FileUp, 
  ScanLine, 
  Send, 
  Loader2, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { prioritizeNeeds } from "@/ai/flows/prioritize-needs-flow";

export default function ReportsPage() {
  const [reportText, setReportText] = useState("");
  const [location, setLocation] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleOcrSim = () => {
    if (!uploadedFile) {
      toast({ title: "Please upload a document first", variant: "destructive" });
      return;
    }
    setIsOcrLoading(true);
    // Simulate OCR processing delay
    setTimeout(() => {
      setReportText(prev => prev + "\n[Scanned Content]: " + (uploadedFile.name.includes("food") ? "Community reported urgent food shortage in the northern block. Approximately 50 families are affected. Water supply is also intermittent." : "Medical supplies running low at the local clinic. Need bandages, antiseptic and basic fever medication for approximately 30 children."));
      setIsOcrLoading(false);
      toast({ title: "OCR Successful", description: "Text extracted from document." });
    }, 2000);
  };

  const handleAnalyze = async () => {
    if (!reportText.trim()) {
      toast({ title: "Please enter report text or scan a document", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await prioritizeNeeds({ collectedData: reportText, location });
      toast({
        title: "Analysis Complete",
        description: `Identified ${result.identifiedNeeds.length} needs with priority levels.`,
      });
      // Clear form after success
      setReportText("");
      setLocation("");
      setUploadedFile(null);
    } catch (error) {
      toast({ title: "Analysis failed", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline text-foreground">Field Data Submission</h1>
        <p className="text-muted-foreground">Submit surveys, field reports, and community requests for AI prioritization.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Report Details</CardTitle>
              <CardDescription>Enter report text manually or use OCR to scan documents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Geographical Location</Label>
                <Input 
                  id="location" 
                  placeholder="e.g. Kondapur, North Sector, Hyderabad" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
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
                Analyze & Submit
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md bg-primary/5">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-primary" /> Document OCR
              </CardTitle>
              <CardDescription>Scan physical reports into digital data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors ${uploadedFile ? 'border-primary bg-primary/10' : 'border-muted-foreground/20'}`}>
                {uploadedFile ? (
                  <div className="space-y-3">
                    <FileText className="h-10 w-10 text-primary mx-auto" />
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-sm font-medium truncate max-w-[150px]">{uploadedFile.name}</span>
                      <button onClick={() => setUploadedFile(null)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <FileUp className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-sm text-muted-foreground mb-4">Drag and drop field reports or click to upload</p>
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" className="pointer-events-none">Select File</Button>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*,.pdf" 
                        onChange={(e) => e.target.files?.[0] && setUploadedFile(e.target.files[0])} 
                      />
                    </label>
                  </>
                )}
              </div>
              <Button 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={!uploadedFile || isOcrLoading}
                onClick={handleOcrSim}
              >
                {isOcrLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Extracting Text...
                  </>
                ) : (
                  <>
                    <ScanLine className="h-4 w-4 mr-2" /> Start Digitization
                  </>
                )}
              </Button>
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
    </div>
  );
}
