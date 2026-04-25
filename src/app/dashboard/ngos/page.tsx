"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToPendingUsers,
  updateUserApprovalStatus,
  UserProfile, VolunteerDoc, NGOProfile,
  assignVolunteerToNGO,
  subscribeToApprovedNGOs,
} from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, ShieldAlert, Loader2, RefreshCcw, MapPin, Phone, Clock, Languages, Sparkles, Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

type EnrichedProfile = UserProfile & { volunteerData?: VolunteerDoc | null; ngoData?: NGOProfile | null };

type AISuggestion = {
  suggestedNgoId: string;
  suggestedNgoName: string;
  reason: string;
  confidenceScore: number;
};

const getAvatarUrl = (_: string, __: string, gender?: string) => {
  if (gender === "female") return `/avatar-female.svg`;
  return `/avatar-male.svg`;
};

export default function AdminManageUsersPage() {
  const { userRole } = useAuth();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [enrichedUsers, setEnrichedUsers] = useState<EnrichedProfile[]>([]);
  const [allNGOs, setAllNGOs] = useState<NGOProfile[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, AISuggestion>>({});
  const [loadingAI, setLoadingAI] = useState<Record<string, boolean>>({});
  const [selectedNGO, setSelectedNGO] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userRole === "Volunteer" || userRole === "NGO") router.replace("/dashboard");
  }, [userRole, router]);

  useEffect(() => {
    if (userRole !== "Admin") return;
    const unsub = subscribeToPendingUsers(setPendingUsers);
    const unsubNGOs = subscribeToApprovedNGOs(setAllNGOs);
    return () => { unsub(); unsubNGOs(); };
  }, [userRole]);

  useEffect(() => {
    async function enrichUsers() {
      const enriched = await Promise.all(pendingUsers.map(async (u) => {
        if (u.role === "Volunteer" && u.uid && db) {
          try {
            const volSnap = await getDoc(doc(db, "volunteers", u.uid));
            if (volSnap.exists()) return { ...u, volunteerData: volSnap.data() as VolunteerDoc };
          } catch { }
        }
        if (u.role === "NGO" && u.uid && db) {
          try {
            const ngoSnap = await getDoc(doc(db, "ngos", u.uid));
            if (ngoSnap.exists()) return { ...u, ngoData: ngoSnap.data() as NGOProfile };
          } catch { }
        }
        return u as EnrichedProfile;
      }));
      setEnrichedUsers(enriched);
    }
    if (pendingUsers.length > 0) enrichUsers();
    else setEnrichedUsers([]);
  }, [pendingUsers]);

  async function runAISuggestion(u: EnrichedProfile) {
    if (!u.uid || !u.volunteerData) return;
    setLoadingAI(prev => ({ ...prev, [u.uid!]: true }));
    try {
      const res = await fetch("/api/suggest-ngo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volunteer: u.volunteerData, ngos: allNGOs }),
      });
      const data = await res.json();
      setSuggestions(prev => ({ ...prev, [u.uid!]: data }));
      setSelectedNGO(prev => ({ ...prev, [u.uid!]: data.suggestedNgoId }));
    } catch {
      toast({ title: "AI Unavailable", description: "Using local matching instead.", variant: "destructive" });
    } finally {
      setLoadingAI(prev => ({ ...prev, [u.uid!]: false }));
    }
  }

  async function handleDecision(u: EnrichedProfile, isApproved: boolean) {
    if (!u.uid) return;
    setProcessingId(u.uid);
    try {
      await updateUserApprovalStatus(u.uid, isApproved ? "Approved" : "Rejected", !isApproved);

      // Assign to NGO if volunteer is approved and an NGO is selected
      if (isApproved && u.role === "Volunteer") {
        const ngoId = selectedNGO[u.uid];
        if (ngoId) {
          const ngo = allNGOs.find(n => n.uid === ngoId);
          if (ngo) await assignVolunteerToNGO(u.uid, ngoId, ngo.orgName);
        }
      }

      toast({ title: `User ${isApproved ? "Approved" : "Rejected"}`, description: `${u.name} has been ${isApproved ? "granted access" : "rejected"}.` });
    } catch {
      toast({ title: "Error", description: "Failed to update user status.", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  }

  if (userRole !== "Admin") return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-primary" /> User Verification Console
        </h1>
        <p className="text-muted-foreground mt-1">Review, approve, and assign pending NGO and Volunteer applications.</p>
      </div>

      {enrichedUsers.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground bg-white rounded-xl border border-dashed">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500/40" />
          <p className="text-lg font-medium">Queue is Empty</p>
          <p className="text-sm">There are no pending registrations.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {enrichedUsers.map(u => {
            const vData = u.volunteerData;
            const nData = u.ngoData;
            const suggestion = suggestions[u.uid!];
            const isAILoading = loadingAI[u.uid!];
            const userName = u.name || (u as any).displayName || "Unknown User";

            return (
              <Card key={u.uid} className="shadow-sm border-none bg-white flex flex-col overflow-hidden">
                <div className={`h-1.5 w-full ${u.role === "NGO" ? "bg-primary" : "bg-accent"}`} />

                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                      <AvatarImage src={getAvatarUrl(u.uid!, userName, vData?.gender)} />
                      <AvatarFallback className="text-primary font-bold">{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="font-headline text-base">{userName}</CardTitle>
                      <CardDescription className="text-xs uppercase tracking-wider">{u.role} · {u.email}</CardDescription>
                    </div>
                  </div>
                  {(u.rejectionCount ?? 0) > 0 ? (
                    <Badge className="bg-red-100 text-red-800 border-none text-[10px]">
                      <RefreshCcw className="h-3 w-3 mr-1" /> Re-applied ({u.rejectionCount})
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[10px]">Needs Review</Badge>
                  )}
                </div>

                <CardContent className="p-5 space-y-4 flex-1">
                  {/* VOLUNTEER details */}
                  {vData && (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {vData.location}</div>
                        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> {vData.phone}</div>
                        <div className="flex items-center gap-1.5 col-span-2"><Clock className="h-3.5 w-3.5 text-slate-400" /> {vData.availability}</div>
                      </div>
                      {vData.languages && vData.languages.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1"><Languages className="h-3 w-3" /> Languages</p>
                          <div className="flex flex-wrap gap-1">
                            {vData.languages.map(l => <Badge key={l} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">{l}</Badge>)}
                          </div>
                        </div>
                      )}
                      {vData.skills && vData.skills.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {vData.skills.slice(0, 6).map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                            {vData.skills.length > 6 && <Badge variant="outline" className="text-[10px]">+{vData.skills.length - 6}</Badge>}
                          </div>
                        </div>
                      )}

                      {/* AI NGO Suggestion */}
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-primary" /> Assign to NGO</p>
                          {!suggestion && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 text-primary border-primary/30" onClick={() => runAISuggestion(u)} disabled={isAILoading || allNGOs.length === 0}>
                              {isAILoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                              {isAILoading ? "Analysing..." : "AI Suggest"}
                            </Button>
                          )}
                        </div>

                        {suggestion && (
                          <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                <span className="text-xs font-bold text-primary">AI Recommends</span>
                              </div>
                              <Badge className="text-[10px] bg-primary/10 text-primary border-none">{suggestion.confidenceScore}% match</Badge>
                            </div>
                            <p className="text-xs font-semibold text-slate-800">{suggestion.suggestedNgoName}</p>
                            <p className="text-[11px] text-slate-500 italic">"{suggestion.reason}"</p>
                            <Progress value={suggestion.confidenceScore} className="h-1.5" />
                          </div>
                        )}

                        <Select
                          value={selectedNGO[u.uid!] || ""}
                          onValueChange={(val) => setSelectedNGO(prev => ({ ...prev, [u.uid!]: val }))}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder={allNGOs.length === 0 ? "No NGOs registered yet" : "Select NGO manually..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {allNGOs.map(n => (
                              <SelectItem key={n.uid} value={n.uid}>
                                {n.orgName} — {n.city}, {n.state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {/* NGO details */}
                  {nData && (
                    <>
                      <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                        <p className="text-xs font-bold text-primary uppercase">{nData.orgType || "NGO"} · Est. {nData.yearEstablished || "N/A"}</p>
                        <p className="text-sm text-slate-700 italic mt-1 line-clamp-2">"{nData.missionStatement || "No mission statement provided."}"</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{nData.city || ""}{nData.state ? `, ${nData.state}` : ""}</div>
                        <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" />{nData.phone || "N/A"}</div>
                        <div className="col-span-2 text-xs text-muted-foreground">Reg: {nData.registrationNumber || "N/A"} · PAN: {nData.panNumber || "N/A"}</div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {nData.ngo12AStatus && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">12A</Badge>}
                        {nData.ngo80GStatus && <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">80G</Badge>}
                        {nData.fcraRegistered && <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">FCRA</Badge>}
                      </div>
                      {(nData.focusAreas ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(nData.focusAreas ?? []).map(f => <Badge key={f} variant="outline" className="text-[10px] bg-white">{f}</Badge>)}
                        </div>
                      )}
                    </>
                  )}

                  {!vData && !nData && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 bg-amber-50 p-2 rounded border border-amber-200">
                      <ShieldAlert className="h-4 w-4" /> Onboarding profile is incomplete.
                    </p>
                  )}
                </CardContent>

                <CardFooter className="bg-slate-50 p-4 border-t flex gap-3">
                  <Button variant="outline" className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/20" disabled={processingId === u.uid} onClick={() => handleDecision(u, false)}>
                    {processingId === u.uid ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />} Reject
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={processingId === u.uid || (!vData && !nData && u.role === "Volunteer")} onClick={() => handleDecision(u, true)}>
                    {processingId === u.uid ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />} Approve
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
