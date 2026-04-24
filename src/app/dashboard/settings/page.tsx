"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  User, Bell, Shield, Info, Zap, Save, Loader2,
  Building2, Languages, Database, MapPin, Clock, Phone, ShieldCheck, Users, Globe
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import type { VolunteerDoc, NGOProfile } from "@/lib/firestore";

const ROLE_LABELS: Record<string, string> = {
  Admin: "Platform Administrator",
  NGO: "NGO Coordinator",
  Volunteer: "Field Volunteer",
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  Admin: ShieldCheck,
  NGO: Building2,
  Volunteer: Users,
};

const getAvatarUrl = (gender?: string) => {
  if (gender === "female") return `/avatar-female.svg`;
  return `/avatar-male.svg`;
};

export default function SettingsPage() {
  const { user, userRole } = useAuth();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.displayName ?? "");
  const [org, setOrg] = useState("");
  const [lang, setLang] = useState("en");
  const [volunteerData, setVolunteerData] = useState<VolunteerDoc | null>(null);
  const [ngoData, setNgoData] = useState<NGOProfile | null>(null);

  const [notifs, setNotifs] = useState({
    highPriority: true,
    taskComplete: true,
    volunteerMatch: true,
    weeklyDigest: false,
    emergency: true,
  });

  // Load volunteer profile data if role is Volunteer
  useEffect(() => {
    async function loadProfile() {
      if (!user || !db) return;

      // Load org from user's Firestore profile
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setOrg(data.organisation || "");
          setName(data.name || user.displayName || "");
        }
      } catch (e) {
        console.error("Error loading user profile", e);
      }

      // Load volunteer details if applicable
      if (userRole === "Volunteer") {
        try {
          const volSnap = await getDoc(doc(db, "volunteers", user.uid));
          if (volSnap.exists()) {
            setVolunteerData(volSnap.data() as VolunteerDoc);
          }
        } catch (e) {
          console.error("Error loading volunteer data", e);
        }
      }

      // Load NGO profile if applicable
      if (userRole === "NGO") {
        try {
          const ngoSnap = await getDoc(doc(db, "ngos", user.uid));
          if (ngoSnap.exists()) {
            setNgoData(ngoSnap.data() as NGOProfile);
          }
        } catch (e) {
          console.error("Error loading NGO data", e);
        }
      }
    }
    loadProfile();
  }, [user, userRole]);

  async function handleSave() {
    if (!user || !db) return;
    setSaving(true);
    try {
      // Update user name in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        name,
        ...(userRole !== "Volunteer" && { organisation: org }),
      });

      // Also update Firebase Auth display name
      const { updateProfile } = await import("firebase/auth");
      if (auth?.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      toast({ title: "Settings saved ✓", description: "Your profile has been updated." });
    } catch (e: any) {
      toast({ title: "Error saving", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const RoleIcon = ROLE_ICONS[userRole ?? "NGO"] ?? User;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your account and platform preferences.</p>
      </div>

      {/* Profile */}
      <Card className="border-none shadow-sm bg-white" id="profile">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="p-2 bg-primary/10 rounded-xl text-primary"><User className="h-5 w-5" /></div>
          <div>
            <CardTitle className="font-headline text-lg">Profile</CardTitle>
            <CardDescription>Your personal information and role.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Avatar + role pill */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border">
            <Avatar className="h-16 w-16 border-2 border-white shadow-md">
              <AvatarImage src={getAvatarUrl(volunteerData?.gender)} />
              <AvatarFallback className="text-xl font-bold text-primary">
                {(name || user?.displayName || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-lg text-slate-900">{name || user?.displayName || "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <RoleIcon className="h-3.5 w-3.5 text-primary" />
                <Badge variant="secondary" className="text-xs px-2 py-0.5">{ROLE_LABELS[userRole ?? "NGO"]}</Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-name">Full Name</Label>
              <Input id="s-name" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="s-email">Email Address</Label>
              <Input id="s-email" type="email" value={user?.email ?? ""} disabled className="bg-muted/50" />
            </div>
          </div>

          {/* NGO Onboarding Profile */}
          {userRole === "NGO" && ngoData && (
            <>
              <Separator />
              <div className="space-y-5">
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Organisation Profile
                </p>

                {/* Identity */}
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-1">
                  <p className="font-bold text-slate-800 text-base">{ngoData.orgName}</p>
                  <p className="text-xs text-primary font-semibold uppercase tracking-wide">{ngoData.orgType} · Est. {ngoData.yearEstablished}</p>
                  <p className="text-sm text-slate-600 italic mt-2">"{ngoData.missionStatement}"</p>
                </div>

                {/* Contact & Address */}
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{ngoData.city}, {ngoData.state} – {ngoData.pinCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    {ngoData.phone}
                  </div>
                  {ngoData.website && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                      <a href={ngoData.website} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm truncate">{ngoData.website}</a>
                    </div>
                  )}
                  <div className="col-span-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2">
                    <span className="font-semibold">Address:</span> {ngoData.officialAddress}, {ngoData.city}, {ngoData.state} – {ngoData.pinCode}
                  </div>
                </div>

                {/* Legal */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase">Legal & Compliance</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="bg-muted/40 rounded-lg p-2">
                      <span className="text-muted-foreground">Reg. No:</span> <span className="font-semibold">{ngoData.registrationNumber}</span>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2">
                      <span className="text-muted-foreground">PAN:</span> <span className="font-semibold">{ngoData.panNumber}</span>
                    </div>
                    {ngoData.ngoDarpanId && (
                      <div className="bg-muted/40 rounded-lg p-2 col-span-2">
                        <span className="text-muted-foreground">NGO Darpan ID:</span> <span className="font-semibold">{ngoData.ngoDarpanId}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {ngoData.ngo12AStatus && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">12A Registered</Badge>}
                    {ngoData.ngo80GStatus && <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">80G Registered</Badge>}
                    {ngoData.fcraRegistered && <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">FCRA Certified</Badge>}
                  </div>
                </div>

                {/* Operations */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase">Operations</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 rounded-xl p-3 text-center border">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Scope</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{ngoData.geographicScope}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center border">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Volunteers</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{ngoData.activeVolunteers || "—"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center border">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Budget</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{ngoData.annualBudgetRange || "—"}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {ngoData.providesAccommodation && <Badge variant="secondary" className="text-[11px]">🏠 Accommodation</Badge>}
                    {ngoData.hasVehicles && <Badge variant="secondary" className="text-[11px]">🚐 Vehicles</Badge>}
                    {ngoData.hasMedicalFacilities && <Badge variant="secondary" className="text-[11px]">🏥 Medical Facilities</Badge>}
                  </div>
                </div>

                {/* Focus Areas */}
                {ngoData.focusAreas && ngoData.focusAreas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Focus Areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ngoData.focusAreas.map(f => <Badge key={f} variant="outline" className="text-[11px] bg-white shadow-sm">{f}</Badge>)}
                    </div>
                  </div>
                )}

                {/* Operational States */}
                {ngoData.operationalStates && ngoData.operationalStates.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">States of Operation</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ngoData.operationalStates.map(s => <Badge key={s} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">{s}</Badge>)}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {ngoData.languagesSupported && ngoData.languagesSupported.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5"><Languages className="h-3.5 w-3.5" /> Languages Supported</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ngoData.languagesSupported.map(l => <Badge key={l} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">{l}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {userRole === "NGO" && !ngoData && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
              Your NGO profile is not yet available. It may still be under review.
            </div>
          )}

          {/* Volunteer-specific read-only onboarding details */}
          {userRole === "Volunteer" && volunteerData && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">Field Profile (from onboarding)</p>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {volunteerData.location || "Not set"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    {volunteerData.phone || "Not set"}
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Availability: <span className="font-medium ml-1">{volunteerData.availability || "Not set"}</span>
                  </div>
                </div>

                {volunteerData.languages && volunteerData.languages.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                      <Languages className="h-3.5 w-3.5" /> Languages
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {volunteerData.languages.map(l => (
                        <Badge key={l} variant="secondary" className="text-[11px] bg-slate-100 text-slate-600">{l}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {volunteerData.skills && volunteerData.skills.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Field Expertise</p>
                    <div className="flex flex-wrap gap-1.5">
                      {volunteerData.skills.map(s => (
                        <Badge key={s} variant="outline" className="text-[11px] bg-white shadow-sm">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="bg-slate-50 rounded-xl p-3 text-center border">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Tasks Done</p>
                    <p className="text-xl font-black text-slate-800 mt-0.5">{volunteerData.tasksCompleted ?? 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center border">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Rating</p>
                    <p className="text-xl font-black text-amber-500 mt-0.5">{volunteerData.rating ?? 5.0}</p>
                  </div>
                  <div className={`rounded-xl p-3 text-center border ${volunteerData.status === "Available" ? "bg-green-50" : "bg-amber-50"}`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                    <p className={`text-sm font-bold mt-0.5 ${volunteerData.status === "Available" ? "text-green-600" : "text-amber-600"}`}>
                      {volunteerData.status}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><Languages className="h-3 w-3" /> Preferred Language</Label>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                <SelectItem value="ml">മലയാളം (Malayalam)</SelectItem>
                <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                <SelectItem value="mr">मराठी (Marathi)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="border-none shadow-sm bg-white" id="notifications">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="p-2 bg-accent/10 rounded-xl text-accent"><Bell className="h-5 w-5" /></div>
          <div>
            <CardTitle className="font-headline text-lg">Notification Preferences</CardTitle>
            <CardDescription>Control which alerts you receive.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "emergency", label: "Emergency Mode Alerts", desc: "Critical broadcasts when emergency is activated" },
            { key: "highPriority", label: "High Priority Needs", desc: "Instant alerts when a new high-priority need is detected" },
            userRole !== "Volunteer" && { key: "volunteerMatch", label: "Volunteer Match Ready", desc: "Notify when AI completes a volunteer match recommendation" },
            { key: "taskComplete", label: "Task Completion Updates", desc: userRole === "Volunteer" ? "When you complete a mission" : "When a volunteer marks a task as complete" },
            userRole !== "Volunteer" && { key: "weeklyDigest", label: "Weekly Impact Digest", desc: "Summary of platform performance every Monday" },
          ].filter(Boolean).map(({ key, label, desc }: any) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={notifs[key as keyof typeof notifs]}
                onCheckedChange={(v) => setNotifs(prev => ({ ...prev, [key]: v }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card className="border-none shadow-sm bg-white" id="data">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="p-2 bg-muted rounded-xl text-muted-foreground"><Database className="h-5 w-5" /></div>
          <div>
            <CardTitle className="font-headline text-lg">Data & Privacy</CardTitle>
            <CardDescription>Manage your data and security settings.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Shield className="h-4 w-4" /> Export My Data
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 to-accent/5" id="about">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="bg-primary rounded-xl p-2.5 shadow-md shadow-primary/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-headline font-bold">AidConnect Platform</h3>
            <p className="text-xs text-muted-foreground mt-1">Version 0.1.0 · Built for Social Impact</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="text-[10px]">Powered by Genkit AI</Badge>
              <Badge variant="outline" className="text-[10px]">Next.js 15</Badge>
              <Badge variant="outline" className="text-[10px]">Firebase</Badge>
              <Badge variant="outline" className="text-[10px]">Tesseract OCR</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pb-6">
        <Button onClick={handleSave} disabled={saving} className="gap-2 px-8">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
