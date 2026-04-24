"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createNGOProfile, updateUserApprovalStatus } from "@/lib/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Building2, ShieldCheck, MapPin, Phone, Globe, Users, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ─── Static Data ─────────────────────────────────────────────────────────────

const FOCUS_AREAS = [
  "Disaster Relief", "Food Security", "Healthcare & Medical",
  "Education & Literacy", "Women Empowerment", "Child Welfare",
  "Clean Water & Sanitation", "Mental Health Support", "Livelihood & Skills",
  "Environmental Conservation", "Elderly Care", "Disability Support",
  "Refugee & Migrant Aid", "Animal Welfare", "Housing & Shelter",
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry",
];

const LANGUAGES = [
  "English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam",
  "Bengali", "Marathi", "Gujarati", "Punjabi", "Urdu", "Odia", "Assamese",
];

const STEPS = [
  { id: 1, label: "Organisation Identity", icon: Building2 },
  { id: 2, label: "Legal & Compliance", icon: ShieldCheck },
  { id: 3, label: "Location & Contact", icon: MapPin },
  { id: 4, label: "Operations & Focus", icon: Users },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function NGOOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — Identity
  const [orgName, setOrgName] = useState(user?.displayName || "");
  const [orgType, setOrgType] = useState("Trust");
  const [yearEstablished, setYearEstablished] = useState("");
  const [missionStatement, setMissionStatement] = useState("");

  // Step 2 — Legal
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [ngo12AStatus, setNgo12AStatus] = useState(false);
  const [ngo80GStatus, setNgo80GStatus] = useState(false);
  const [fcraRegistered, setFcraRegistered] = useState(false);
  const [ngoDarpanId, setNgoDarpanId] = useState("");

  // Step 3 — Location & Contact
  const [officialAddress, setOfficialAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Step 4 — Operations
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [geographicScope, setGeographicScope] = useState<"Local" | "State" | "National" | "International">("State");
  const [operationalStates, setOperationalStates] = useState<string[]>([]);
  const [activeVolunteers, setActiveVolunteers] = useState("");
  const [annualBudgetRange, setAnnualBudgetRange] = useState("");
  const [providesAccommodation, setProvidesAccommodation] = useState(false);
  const [hasVehicles, setHasVehicles] = useState(false);
  const [hasMedicalFacilities, setHasMedicalFacilities] = useState(false);
  const [languagesSupported, setLanguagesSupported] = useState<string[]>(["English"]);

  const toggleItem = (arr: string[], setArr: (a: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  function validateStep() {
    if (step === 1 && (!orgName || !orgType || !yearEstablished || !missionStatement)) {
      toast({ title: "Fill all fields", description: "All identity fields are required.", variant: "destructive" });
      return false;
    }
    if (step === 2 && (!registrationNumber || !panNumber)) {
      toast({ title: "Fill required fields", description: "Registration number and PAN are required.", variant: "destructive" });
      return false;
    }
    if (step === 3 && (!officialAddress || !city || !state || !pinCode || !phone)) {
      toast({ title: "Fill all contact fields", description: "Address, city, state, PIN code and phone are required.", variant: "destructive" });
      return false;
    }
    if (step === 4 && focusAreas.length === 0) {
      toast({ title: "Select focus areas", description: "Select at least one cause area.", variant: "destructive" });
      return false;
    }
    return true;
  }

  const handleNext = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, 4));
  };

  const handleSubmit = async () => {
    if (!validateStep() || !user) return;
    setLoading(true);
    try {
      await createNGOProfile(user.uid, {
        orgName, orgType: orgType as any, yearEstablished, missionStatement,
        registrationNumber, panNumber, ngo12AStatus, ngo80GStatus, fcraRegistered, ngoDarpanId,
        officialAddress, city, state, pinCode, phone, website,
        focusAreas, geographicScope, operationalStates, activeVolunteers, annualBudgetRange,
        providesAccommodation, hasVehicles, hasMedicalFacilities, languagesSupported,
      });
      await updateUserApprovalStatus(user.uid, "Pending", false);
      toast({ title: "Application Submitted!", description: "Your NGO profile is under review." });
      window.location.href = "/status";
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 mb-4">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold font-headline text-slate-900">NGO Registration</h1>
          <p className="text-slate-500 mt-1">Complete your profile to activate your AidConnect Command Centre</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-0 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                step === s.id ? "bg-primary text-white shadow-md" :
                step > s.id ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
              }`}>
                {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-6 h-0.5 mx-1 ${step > s.id ? "bg-green-300" : "bg-slate-200"}`} />}
            </div>
          ))}
        </div>

        <Card className="border-none shadow-xl bg-white">
          <CardHeader className="border-b bg-slate-50/50 rounded-t-xl">
            <CardTitle className="font-headline text-xl flex items-center gap-2">
              {(() => { const S = STEPS[step - 1]; return <S.icon className="h-5 w-5 text-primary" />; })()}
              {STEPS[step - 1].label}
            </CardTitle>
            <CardDescription>Step {step} of {STEPS.length}</CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">

            {/* ── Step 1: Identity ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Organisation Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g., Asha Foundation" value={orgName} onChange={e => setOrgName(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Organisation Type <span className="text-red-500">*</span></Label>
                    <Select value={orgType} onValueChange={setOrgType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Trust">Public Charitable Trust</SelectItem>
                        <SelectItem value="Society">Registered Society</SelectItem>
                        <SelectItem value="Section8">Section 8 Company</SelectItem>
                        <SelectItem value="INGO">International NGO</SelectItem>
                        <SelectItem value="Government">Government Body</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year Established <span className="text-red-500">*</span></Label>
                    <Input placeholder="e.g., 2005" value={yearEstablished} onChange={e => setYearEstablished(e.target.value)} type="number" min="1800" max={new Date().getFullYear()} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mission Statement <span className="text-red-500">*</span></Label>
                  <Textarea
                    placeholder="Briefly describe your organisation's mission and vision..."
                    value={missionStatement}
                    onChange={e => setMissionStatement(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">This will be shown to volunteers when they are matched to your tasks.</p>
                </div>
              </div>
            )}

            {/* ── Step 2: Legal & Compliance ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Registration Number <span className="text-red-500">*</span></Label>
                    <Input placeholder="e.g., TN/123/2005" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>PAN Number <span className="text-red-500">*</span></Label>
                    <Input placeholder="e.g., AAAAA1234A" value={panNumber} onChange={e => setPanNumber(e.target.value.toUpperCase())} maxLength={10} />
                  </div>
                  <div className="space-y-2">
                    <Label>NGO Darpan ID <span className="text-slate-400 text-xs">(optional)</span></Label>
                    <Input placeholder="e.g., TN/2005/0123456" value={ngoDarpanId} onChange={e => setNgoDarpanId(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Government of India NGO Darpan portal ID</p>
                  </div>
                </div>

                <Separator />
                <p className="text-sm font-semibold text-slate-700">Tax & Regulatory Status</p>

                <div className="space-y-3">
                  {[
                    { key: "12a", label: "12A Registration", desc: "Tax exemption for the NGO's income under Income Tax Act", value: ngo12AStatus, set: setNgo12AStatus },
                    { key: "80g", label: "80G Registration", desc: "Donors can claim tax deduction on contributions to your NGO", value: ngo80GStatus, set: setNgo80GStatus },
                    { key: "fcra", label: "FCRA Registration", desc: "Foreign Contribution Regulation Act — allows receipt of foreign funds", value: fcraRegistered, set: setFcraRegistered },
                  ].map(({ key, label, desc, value, set }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <Switch checked={value} onCheckedChange={set} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 3: Location & Contact ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Official Registered Address <span className="text-red-500">*</span></Label>
                  <Textarea placeholder="Street address, building, area..." value={officialAddress} onChange={e => setOfficialAddress(e.target.value)} rows={2} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City <span className="text-red-500">*</span></Label>
                    <Input placeholder="e.g., Chennai" value={city} onChange={e => setCity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>State <span className="text-red-500">*</span></Label>
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>PIN Code <span className="text-red-500">*</span></Label>
                    <Input placeholder="e.g., 600001" value={pinCode} onChange={e => setPinCode(e.target.value)} maxLength={6} type="number" />
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Contact Phone <span className="text-red-500">*</span></Label>
                    <Input placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Official Website <span className="text-slate-400 text-xs">(optional)</span></Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="https://www.yourorg.org" value={website} onChange={e => setWebsite(e.target.value)} type="url" />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 4: Operations & Focus ── */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base">Focus Areas / Cause Categories <span className="text-red-500">*</span></Label>
                  <p className="text-xs text-muted-foreground -mt-1">Select all areas your organisation actively works in.</p>
                  <div className="flex flex-wrap gap-2">
                    {FOCUS_AREAS.map(area => (
                      <Badge
                        key={area}
                        variant={focusAreas.includes(area) ? "default" : "outline"}
                        className="cursor-pointer py-1.5 px-3 text-xs"
                        onClick={() => toggleItem(focusAreas, setFocusAreas, area)}
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Geographic Scope</Label>
                    <Select value={geographicScope} onValueChange={v => setGeographicScope(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Local">Local / District</SelectItem>
                        <SelectItem value="State">State-wide</SelectItem>
                        <SelectItem value="National">National</SelectItem>
                        <SelectItem value="International">International</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Active Volunteers / Staff</Label>
                    <Select value={activeVolunteers} onValueChange={setActiveVolunteers}>
                      <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1–10</SelectItem>
                        <SelectItem value="11-50">11–50</SelectItem>
                        <SelectItem value="51-200">51–200</SelectItem>
                        <SelectItem value="201-500">201–500</SelectItem>
                        <SelectItem value="500+">500+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Budget Range</Label>
                    <Select value={annualBudgetRange} onValueChange={setAnnualBudgetRange}>
                      <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<5L">Less than ₹5 Lakh</SelectItem>
                        <SelectItem value="5L-25L">₹5L – ₹25L</SelectItem>
                        <SelectItem value="25L-1Cr">₹25L – ₹1 Crore</SelectItem>
                        <SelectItem value="1Cr-5Cr">₹1Cr – ₹5 Crore</SelectItem>
                        <SelectItem value="5Cr+">₹5 Crore+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />
                <p className="text-sm font-semibold text-slate-700">Operational States</p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                  {INDIAN_STATES.map(s => (
                    <Badge
                      key={s}
                      variant={operationalStates.includes(s) ? "default" : "outline"}
                      className="cursor-pointer py-1 px-2.5 text-[11px]"
                      onClick={() => toggleItem(operationalStates, setOperationalStates, s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>

                <Separator />
                <p className="text-sm font-semibold text-slate-700">Languages Supported</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(l => (
                    <Badge
                      key={l}
                      variant={languagesSupported.includes(l) ? "default" : "outline"}
                      className="cursor-pointer py-1.5 px-3 text-xs"
                      onClick={() => toggleItem(languagesSupported, setLanguagesSupported, l)}
                    >
                      {l}
                    </Badge>
                  ))}
                </div>

                <Separator />
                <p className="text-sm font-semibold text-slate-700">Field Capacity</p>
                <div className="space-y-3">
                  {[
                    { label: "Can provide accommodation for deployed volunteers", value: providesAccommodation, set: setProvidesAccommodation },
                    { label: "Has vehicles / transport fleet", value: hasVehicles, set: setHasVehicles },
                    { label: "Has on-site medical facilities or staff", value: hasMedicalFacilities, set: setHasMedicalFacilities },
                  ].map(({ label, value, set }) => (
                    <div key={label} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50">
                      <p className="text-sm">{label}</p>
                      <Switch checked={value} onCheckedChange={set} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t p-5 flex justify-between bg-slate-50/50 rounded-b-xl">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            ) : <div />}

            {step < 4 ? (
              <Button onClick={handleNext} className="gap-2">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading} className="gap-2 px-8 bg-green-600 hover:bg-green-700">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Your data is encrypted and only shared with verified AidConnect administrators.
        </p>
      </div>
    </div>
  );
}
