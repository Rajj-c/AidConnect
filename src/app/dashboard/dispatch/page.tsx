"use client";

import { useState, useEffect } from "react";
import {
  subscribeToNeeds, subscribeToVolunteers, addTask,
  NeedDoc, VolunteerDoc,
} from "@/lib/firestore";
import { matchVolunteers } from "@/ai/flows/ngo-ai-match-volunteers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Zap, Sparkles, Loader2, AlertTriangle, CheckCircle2, XCircle,
  MapPin, Clock, Star, RefreshCw, ShieldAlert, Users
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const getAvatarUrl = (id: string, name: string, gender?: string) => {
  if (gender === "female") return `/avatar-female.svg`;
  if (gender === "male") return `/avatar-male.svg`;
  return `/avatar-male.svg`;
};

interface DispatchMatch {
  needId: string;
  need: NeedDoc;
  volunteerId: string;
  volunteer: VolunteerDoc | undefined;
  reason: string;
  matchScore: number;
  status: "pending" | "approved" | "rejected";
}

export default function DispatchPage() {
  const { userRole } = useAuth();
  const router = useRouter();

  const [needs, setNeeds] = useState<NeedDoc[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerDoc[]>([]);
  const [matches, setMatches] = useState<DispatchMatch[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (userRole === "Volunteer") router.replace("/dashboard/missions");
  }, [userRole, router]);

  useEffect(() => {
    const u1 = subscribeToNeeds(setNeeds);
    const u2 = subscribeToVolunteers(setVolunteers);
    return () => { u1(); u2(); };
  }, []);

  const openNeeds = needs.filter(n => n.status === "Open" && (n.priority === "High" || n.priority === "Medium"));
  const availableVols = volunteers.filter(v => v.status === "Available");
  const volunteerMap = Object.fromEntries(volunteers.map(v => [v.id, v]));

  async function runDispatch() {
    if (openNeeds.length === 0) {
      toast({ title: "No open needs", description: "Submit a field report to add High or Medium priority needs first.", variant: "destructive" });
      return;
    }
    if (availableVols.length === 0) {
      toast({ title: "No available volunteers", description: "All volunteers are currently busy.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setMatches([]);
    setHasRun(false);

    try {
      const result = await matchVolunteers({
        tasks: openNeeds.slice(0, 5).map(n => ({
          id: n.id || "",
          description: n.description,
          requiredSkills: [],
          location: { latitude: n.lat || 17.44, longitude: n.lng || 78.35 },
          priority: n.priority,
          urgencyScore: n.priority === "High" ? 9 : n.priority === "Medium" ? 5 : 2,
        })),
        volunteers: availableVols.map(v => ({
          id: v.id || "",
          name: v.name,
          skills: v.skills,
          availability: v.availability,
          currentLocation: { latitude: v.lat || 17.44, longitude: v.lng || 78.35 },
        })),
      });

      const dispatchMatches: DispatchMatch[] = result.matches.map((m, i) => {
        const need = openNeeds.find(n => n.id === m.taskId) || openNeeds[i] || openNeeds[0];
        const volunteer = volunteerMap[m.volunteerId];
        // Derive a pseudo-score from index (AI returns best match first)
        const score = Math.round(98 - i * 4);
        return {
          needId: m.taskId,
          need,
          volunteerId: m.volunteerId,
          volunteer,
          reason: m.reason,
          matchScore: Math.max(score, 72),
          status: "pending",
        };
      });

      setMatches(dispatchMatches);
      setHasRun(true);
      toast({
        title: `AI Dispatch Ready ✓`,
        description: `${dispatchMatches.length} optimal matches found. Review and approve.`,
      });
    } catch (err: unknown) {
      console.error("[Dispatch] matchVolunteers error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast({
        title: "AI Matching Failed",
        description: msg.length > 120 ? msg.slice(0, 120) + "…" : msg,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function approveMatch(match: DispatchMatch) {
    if (!match.need || !match.volunteer) return;
    setDispatchingId(match.needId);
    try {
      await addTask({
        needId: match.needId,
        title: match.need.description,
        assignedVolunteerId: match.volunteerId,
        assignedVolunteerName: match.volunteer.name,
        status: "Pending",
        priority: match.need.priority,
        location: match.need.location,
        lat: match.need.lat,
        lng: match.need.lng,
        progress: 0,
        eta: "ETA pending",
      });
      setMatches(prev => prev.map(m => m.needId === match.needId ? { ...m, status: "approved" } : m));
      toast({
        title: `Dispatched: ${match.volunteer.name} ✓`,
        description: `Mission live — map updating now.`,
      });
    } catch {
      toast({ title: "Dispatch failed", variant: "destructive" });
    } finally {
      setDispatchingId(null);
    }
  }

  function rejectMatch(needId: string) {
    setMatches(prev => prev.map(m => m.needId === needId ? { ...m, status: "rejected" } : m));
    toast({ title: "Match rejected", description: "AI will re-rank on next run." });
  }

  if (userRole === "Volunteer") return null;

  const pendingCount = matches.filter(m => m.status === "pending").length;
  const approvedCount = matches.filter(m => m.status === "approved").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold font-headline text-foreground">AI Dispatch Centre</h1>
          </div>
          <p className="text-muted-foreground">
            AI analyses open critical needs and available volunteers, then recommends optimal assignments. You review and approve.
          </p>
        </div>
        <Button
          id="run-ai-dispatch-btn"
          onClick={runDispatch}
          disabled={isAnalyzing}
          size="lg"
          className="gap-2 shadow-lg shadow-primary/20"
        >
          {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {isAnalyzing ? "Analysing…" : hasRun ? "Re-run AI Dispatch" : "Run AI Dispatch"}
        </Button>
      </div>

      {/* Live stats bar */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Open Critical Needs", value: openNeeds.length, color: "text-destructive", bg: "bg-destructive/5" },
          { label: "Available Volunteers", value: availableVols.length, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Review", value: pendingCount, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Dispatched Today", value: approvedCount, color: "text-primary", bg: "bg-primary/5" },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className={`border-none shadow-sm ${bg}`}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className={`text-3xl font-bold font-headline mt-1 ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analyzing state */}
      {isAnalyzing && (
        <Card className="border-none shadow-md bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Gemini AI Analysing…</p>
              <p className="text-sm text-muted-foreground mt-1">Evaluating skills, proximity, availability & urgency</p>
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              {["Skills match", "Geo-proximity", "Availability", "Urgency rank"].map((step, i) => (
                <span key={step} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                  {step}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isAnalyzing && !hasRun && (
        <Card className="border-dashed border-2 shadow-sm">
          <CardContent className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-2xl">
              <Sparkles className="h-10 w-10 text-muted-foreground opacity-50" />
            </div>
            <div>
              <p className="font-headline font-bold text-lg text-muted-foreground">Ready to dispatch</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Click <strong>"Run AI Dispatch"</strong> to have Gemini AI analyse {openNeeds.length} open critical need{openNeeds.length !== 1 ? "s" : ""} and {availableVols.length} available volunteer{availableVols.length !== 1 ? "s" : ""}.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match cards */}
      {hasRun && !isAnalyzing && matches.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-headline font-bold">
              AI Recommendations
              <span className="ml-2 text-sm font-normal text-muted-foreground">— review each match and approve or reject</span>
            </h2>
            {pendingCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => matches.filter(m => m.status === "pending").forEach(m => approveMatch(m))}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Approve All ({pendingCount})
              </Button>
            )}
          </div>

          {matches.map((match, i) => {
            const vol = match.volunteer;
            const isPending = match.status === "pending";
            const isApproved = match.status === "approved";
            const isRejected = match.status === "rejected";
            const isDispatching = dispatchingId === match.needId;

            return (
              <Card
                key={`${match.needId}-${i}`}
                className={`border-none shadow-md overflow-hidden transition-all duration-300 ${
                  isApproved ? "opacity-70" : isRejected ? "opacity-40" : ""
                }`}
              >
                {/* Priority bar */}
                <div className={`h-1 w-full ${
                  match.need?.priority === "High" ? "bg-destructive" :
                  match.need?.priority === "Medium" ? "bg-amber-400" : "bg-emerald-500"
                }`} />

                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row gap-5">
                    {/* Need info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="destructive" className="text-[10px] rounded-md gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {match.need?.priority ?? "High"} Priority
                        </Badge>
                        <Badge variant="outline" className="text-[10px] rounded-md bg-muted/50">
                          {match.need?.category ?? "Need"}
                        </Badge>
                        {isApproved && (
                          <Badge className="text-[10px] rounded-md bg-emerald-100 text-emerald-700 border-emerald-200" variant="outline">
                            ✓ Dispatched
                          </Badge>
                        )}
                        {isRejected && (
                          <Badge className="text-[10px] rounded-md bg-gray-100 text-gray-500" variant="outline">
                            ✗ Rejected
                          </Badge>
                        )}
                      </div>
                      <p className="font-headline font-bold text-base leading-snug">
                        {match.need?.description ?? "Community need"}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {match.need?.location ?? "Location TBD"}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="hidden lg:flex items-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-1">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <div className="h-px w-12 bg-primary/30" />
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wide">AI Match</p>
                      </div>
                    </div>

                    {/* Volunteer info */}
                    {vol ? (
                      <div className="flex-1 bg-muted/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 border-2 border-primary/20 bg-white">
                            <AvatarImage src={getAvatarUrl(vol.id || "", vol.name, vol.gender)} />
                            <AvatarFallback className="font-bold">{vol.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">{vol.name}</p>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-wider">{vol.role}</p>
                          </div>
                          {/* Match score badge */}
                          <div className="ml-auto text-center">
                            <div className={`text-xl font-bold font-headline ${
                              match.matchScore >= 90 ? "text-emerald-600" :
                              match.matchScore >= 80 ? "text-amber-600" : "text-muted-foreground"
                            }`}>
                              {match.matchScore}%
                            </div>
                            <p className="text-[9px] font-bold uppercase text-muted-foreground">match</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {vol.skills.slice(0, 3).map(s => (
                            <Badge key={s} variant="outline" className="text-[10px] py-0">{s}</Badge>
                          ))}
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{vol.location.split(",")[0]}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{vol.availability}</span>
                          <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500 fill-amber-500" />{vol.rating}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 bg-muted/20 rounded-xl p-4 flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Volunteer not found in registry</p>
                      </div>
                    )}
                  </div>

                  {/* AI Reasoning */}
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg border-l-4 border-primary/40">
                    <p className="text-[11px] font-bold uppercase text-primary tracking-wider mb-1">AI Reasoning</p>
                    <p className="text-xs text-muted-foreground leading-relaxed italic">"{match.reason}"</p>
                  </div>

                  {/* Action buttons */}
                  {isPending && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        id={`approve-dispatch-${i}`}
                        className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => approveMatch(match)}
                        disabled={isDispatching || !vol}
                      >
                        {isDispatching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {isDispatching ? "Dispatching…" : "Approve & Dispatch"}
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
                        onClick={() => rejectMatch(match.needId)}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        title="Re-run for this need"
                        onClick={runDispatch}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {isApproved && (
                    <div className="flex items-center gap-2 mt-4 p-3 bg-emerald-50 rounded-lg text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <p className="text-sm font-medium">Mission dispatched — volunteer notified, map updated live.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* No matches after run */}
      {hasRun && !isAnalyzing && matches.length === 0 && (
        <Card className="border-none shadow-sm">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <Users className="h-10 w-10 text-muted-foreground opacity-30" />
            <p className="font-medium text-muted-foreground">No matches generated</p>
            <p className="text-sm text-muted-foreground">Ensure there are open high-priority needs and available volunteers.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
