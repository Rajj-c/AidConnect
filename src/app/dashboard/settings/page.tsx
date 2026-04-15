"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  User, Bell, Shield, Info, Zap, Save, Loader2,
  Building2, Languages, Database
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user?.displayName ?? "NGO Coordinator");
  const [org, setOrg] = useState("Hyderabad Social Aid Foundation");
  const [lang, setLang] = useState("en");

  const [notifs, setNotifs] = useState({
    highPriority: true,
    taskComplete: true,
    volunteerMatch: true,
    weeklyDigest: false,
    emergency: true,
  });

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    toast({ title: "Settings saved ✓", description: "Your preferences have been updated." });
  }

  const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data & Privacy", icon: Shield },
    { id: "about", label: "About", icon: Info },
  ];

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
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="s-name">Full Name</Label>
              <Input id="s-name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex items-center gap-2 h-10">
                <Badge variant="secondary" className="text-sm px-3 py-1">NGO Coordinator</Badge>
                <span className="text-xs text-muted-foreground">Change via Role Switcher</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-email">Email Address</Label>
              <Input id="s-email" type="email" value={user?.email ?? ""} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-org" className="flex items-center gap-1"><Building2 className="h-3 w-3" /> Organisation</Label>
              <Input id="s-org" value={org} onChange={e => setOrg(e.target.value)} />
            </div>
          </div>
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
            { key: "volunteerMatch", label: "Volunteer Match Ready", desc: "Notify when AI completes a volunteer match recommendation" },
            { key: "taskComplete", label: "Task Completion Updates", desc: "When a volunteer marks a task as complete" },
            { key: "weeklyDigest", label: "Weekly Impact Digest", desc: "Summary of NGO performance every Monday" },
          ].map(({ key, label, desc }) => (
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
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Data Retention</p>
              <p className="text-xs text-muted-foreground">How long field reports are kept</p>
            </div>
            <Select defaultValue="12">
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 months</SelectItem>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months</SelectItem>
                <SelectItem value="forever">Forever</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
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
