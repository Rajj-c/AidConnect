"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createVolunteerProfile, updateUserApprovalStatus } from "@/lib/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SKILLS_LIST = [
  "First Aid", "CPR Certified", "Search & Rescue", "Logistics/Supply Chain",
  "Heavy Machinery Operator", "Medical Professional", "Mental Health Support",
  "Translation/Interpretation", "Food Preparation", "Childcare", "Water Purification",
  "Electrical Repair", "Carpentry/Construction", "Debris Removal", "Drone Operator",
  "Communication/HAM Radio", "Event Coordination", "Data Entry/Admin",
  "Crowdfunding/Fundraising", "Legal Aid", "Animal Rescue", "IT/Tech Support",
  "Driving (Light Vehicle)", "Driving (Heavy Vehicle)", "Security"
];

const LANGUAGES_LIST = [
  "English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", 
  "Bengali", "Marathi", "Gujarati", "Punjabi", "Urdu", "Odia", "Assamese"
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("Flexible");
  
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (selectedSkills.length === 0) {
      toast({ title: "Select Skills", description: "Please select at least one skill.", variant: "destructive" });
      return;
    }
    if (!phone || !location) {
      toast({ title: "Missing Information", description: "Please fill out your phone number and location.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Create the detailed volunteer record
      await createVolunteerProfile(user.uid, {
        name: user.displayName || "Volunteer",
        gender,
        phone,
        location,
        availability,
        skills: selectedSkills,
        languages: selectedLanguages
      });

      // 2. Update their auth status to Pending so they enter the Admin's queue
      await updateUserApprovalStatus(user.uid, "Pending", false);
      
      toast({ title: "Profile Completed", description: "Your application is now under review." });
      
      // Force reload to update auth context state cleanly, or push
      window.location.href = "/status";
    } catch (error: any) {
      toast({ title: "Error Saving Profile", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 flex justify-center items-start">
      <Card className="max-w-3xl w-full shadow-lg border-none">
        <CardHeader className="text-center pb-8 border-b">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Complete Your Profile</CardTitle>
          <CardDescription className="text-base mt-2">
            Welcome to AidConnect! Please provide your field expertise and availability so our smart dispatch system can assign you to the right missions.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8 pt-8">
            
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={(val: any) => setGender(val)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input 
                  placeholder="+91 9876543210" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Location / City</Label>
                <Input 
                  placeholder="e.g., Chennai, Tamil Nadu" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Availability</Label>
                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger><SelectValue placeholder="Select availability" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flexible">Flexible / On-Call</SelectItem>
                    <SelectItem value="Weekends">Weekends Only</SelectItem>
                    <SelectItem value="Evenings">Evenings Only</SelectItem>
                    <SelectItem value="Weekdays">Weekdays</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-3">
              <Label className="text-base">Languages Spoken</Label>
              <CardDescription className="text-xs -mt-2 mb-2">Select all languages you are comfortable communicating in.</CardDescription>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES_LIST.map(lang => (
                  <Badge 
                    key={lang}
                    variant={selectedLanguages.includes(lang) ? "default" : "outline"}
                    className="cursor-pointer text-xs py-1.5 px-3"
                    onClick={() => toggleLanguage(lang)}
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-3">
              <Label className="text-base">Field Expertise & Skills</Label>
              <CardDescription className="text-xs -mt-2 mb-2">Select your areas of expertise. This helps our AI assign the right tasks to you during crises.</CardDescription>
              <div className="flex flex-wrap gap-2">
                {SKILLS_LIST.map(skill => (
                  <Badge 
                    key={skill}
                    variant={selectedSkills.includes(skill) ? "default" : "outline"}
                    className="cursor-pointer text-xs py-1.5 px-3"
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            
          </CardContent>
          <CardFooter className="border-t pt-6 bg-gray-50/50 rounded-b-xl">
            <Button type="submit" className="w-full text-lg h-12 gap-2" disabled={loading}>
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {loading ? "Saving Profile..." : "Submit Profile & Join Waitlist"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
