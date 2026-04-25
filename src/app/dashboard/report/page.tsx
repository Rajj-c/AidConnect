"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { createDonationLead, createNeedReport } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { VolunteerDoc } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, AlertTriangle, CheckCircle2, Loader2, Radio } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ReportPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<VolunteerDoc | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState<"donation" | "need" | null>(null);

  // Donation Lead form
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorAddress, setDonorAddress] = useState("");
  const [itemType, setItemType] = useState("Clothes");
  const [estimatedQty, setEstimatedQty] = useState("");
  const [availability, setAvailability] = useState("");
  const [donorNotes, setDonorNotes] = useState("");

  // Need Report form
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("Medium");
  const [numberOfPeople, setNumberOfPeople] = useState("");
  const [needNotes, setNeedNotes] = useState("");

  useEffect(() => {
    if (userRole !== "Volunteer" || !user) { router.replace("/dashboard/missions"); return; }
    getDoc(doc(db!, "volunteers", user.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data() as VolunteerDoc);
    });
  }, [user, userRole, router]);

  async function handleDonationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile?.ngoId) {
      toast({ title: "Not assigned to NGO", description: "You need to be assigned to an NGO to submit reports.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createDonationLead({
        ngoId: profile.ngoId,
        reportedBy: user.uid,
        reportedByName: user.displayName ?? "Volunteer",
        donorName, donorPhone: donorPhone || undefined,
        donorAddress, itemType: itemType as any,
        estimatedQuantity: estimatedQty, availability,
        notes: donorNotes || undefined,
      });
      setSubmitted("donation");
      setDonorName(""); setDonorPhone(""); setDonorAddress(""); setEstimatedQty(""); setAvailability(""); setDonorNotes("");
      toast({ title: "Donation Lead Reported ✓", description: "Your NGO has been notified and will create a collection task." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleNeedSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile?.ngoId) {
      toast({ title: "Not assigned to NGO", description: "You need to be assigned to an NGO to submit reports.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createNeedReport({
        ngoId: profile.ngoId,
        reportedBy: user.uid,
        reportedByName: user.displayName ?? "Volunteer",
        contactName, contactPhone: contactPhone || undefined,
        address, category: category as any,
        description, urgency: urgency as any,
        numberOfPeople: Number(numberOfPeople),
        notes: needNotes || undefined,
      });
      setSubmitted("need");
      setContactName(""); setContactPhone(""); setAddress(""); setDescription(""); setNumberOfPeople(""); setNeedNotes("");
      toast({ title: "Need Reported ✓", description: "Your NGO has been notified and will arrange assistance." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Radio className="h-7 w-7 text-primary animate-pulse" /> Field Report
        </h1>
        <p className="text-muted-foreground mt-1">
          Spotted a donation opportunity or someone in need? Report it — your NGO will act on it.
        </p>
      </div>

      {!profile?.ngoId && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 text-sm text-amber-700">
            ⚠️ You are not yet assigned to an NGO. Once assigned, you can submit field reports.
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="donation">
        <TabsList className="w-full bg-white border shadow-sm">
          <TabsTrigger value="donation" className="flex-1 gap-2">
            <Gift className="h-4 w-4 text-blue-500" /> Donation Lead
          </TabsTrigger>
          <TabsTrigger value="need" className="flex-1 gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" /> Need Report
          </TabsTrigger>
        </TabsList>

        {/* ─── Donation Lead ─── */}
        <TabsContent value="donation" className="mt-4">
          {submitted === "donation" ? (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-8 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="font-bold text-lg">Donation Lead Sent!</h3>
                <p className="text-sm text-muted-foreground">Your NGO has received this report. They'll create a collection task soon.</p>
                <Button variant="outline" onClick={() => setSubmitted(null)}>Report Another</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4 text-blue-500" /> Someone wants to donate
                </CardTitle>
                <CardDescription>Fill what you know — even partial info helps.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDonationSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                      <Label>Donor's Name *</Label>
                      <Input value={donorName} onChange={e => setDonorName(e.target.value)} placeholder="e.g. Ramesh Kumar" required />
                    </div>
                    <div className="space-y-1">
                      <Label>Phone Number</Label>
                      <Input value={donorPhone} onChange={e => setDonorPhone(e.target.value)} placeholder="Optional" type="tel" />
                    </div>
                    <div className="space-y-1">
                      <Label>Item Type *</Label>
                      <Select value={itemType} onValueChange={setItemType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Clothes", "Food", "Medicine", "Books", "Other"].map(i => (
                            <SelectItem key={i} value={i}>{i}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label>Donor's Address / Location *</Label>
                      <Input value={donorAddress} onChange={e => setDonorAddress(e.target.value)} placeholder="e.g. 14, Anna Nagar, Trichy" required />
                    </div>
                    <div className="space-y-1">
                      <Label>Estimated Quantity *</Label>
                      <Input value={estimatedQty} onChange={e => setEstimatedQty(e.target.value)} placeholder="e.g. 20 kg, 50 clothes" required />
                    </div>
                    <div className="space-y-1">
                      <Label>When Available *</Label>
                      <Input value={availability} onChange={e => setAvailability(e.target.value)} placeholder="e.g. Weekends, anytime" required />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label>Additional Notes</Label>
                      <Textarea value={donorNotes} onChange={e => setDonorNotes(e.target.value)} rows={2} placeholder="Any special details?" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={saving || !profile?.ngoId}>
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Gift className="h-4 w-4" /> Submit Donation Lead</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Need Report ─── */}
        <TabsContent value="need" className="mt-4">
          {submitted === "need" ? (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-8 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="font-bold text-lg">Need Report Sent!</h3>
                <p className="text-sm text-muted-foreground">Your NGO has received this report. They'll arrange assistance as soon as possible.</p>
                <Button variant="outline" onClick={() => setSubmitted(null)}>Report Another</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" /> Someone needs help
                </CardTitle>
                <CardDescription>Report a family or group that needs assistance from your NGO.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleNeedSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                      <Label>Contact Person's Name *</Label>
                      <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="e.g. Priya Devi" required />
                    </div>
                    <div className="space-y-1">
                      <Label>Phone Number</Label>
                      <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Optional" type="tel" />
                    </div>
                    <div className="space-y-1">
                      <Label>Urgency *</Label>
                      <Select value={urgency} onValueChange={setUrgency}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">🔴 High — Immediate</SelectItem>
                          <SelectItem value="Medium">🟡 Medium — This week</SelectItem>
                          <SelectItem value="Low">🟢 Low — When possible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label>Their Address / Location *</Label>
                      <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. 3rd Cross, Gandhi Nagar, Trichy" required />
                    </div>
                    <div className="space-y-1">
                      <Label>Type of Need *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Food", "Health", "Education", "Shelter", "Water", "Other"].map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Number of People *</Label>
                      <Input type="number" min="1" value={numberOfPeople} onChange={e => setNumberOfPeople(e.target.value)} placeholder="e.g. 4" required />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label>Description *</Label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                        placeholder="Describe the situation in detail. What do they need? Since when?" required />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label>Additional Notes</Label>
                      <Textarea value={needNotes} onChange={e => setNeedNotes(e.target.value)} rows={2} placeholder="Anything else the NGO should know?" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gap-2 bg-red-600 hover:bg-red-700" disabled={saving || !profile?.ngoId}>
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><AlertTriangle className="h-4 w-4" /> Submit Need Report</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
