"use client";

import { useAuth } from "@/contexts/AuthContext";
import { addNeed, addTask, collection, doc, setDoc } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SeedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSeed() {
    if (!user) {
      toast({ title: "Must be logged in", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // 1. Seed Volunteers
      const vols = [
        { id: "V1", name: "Dr. Ananya Sharma", role: "Medical Volunteer", skills: ["Pediatrics", "First Aid", "Hindi"], location: "Gachibowli", status: "Available", availability: "Immediate", rating: 4.9, tasksCompleted: 24, userId: "mock1" },
        { id: "V2", name: "Rajesh Kumar", role: "General Volunteer", skills: ["Logistics", "Driving", "Telugu"], location: "Madhapur", status: "Busy", availability: "After 4 PM", rating: 4.7, tasksCompleted: 45, userId: "mock2" },
      ];
      for (const v of vols) {
        await setDoc(doc(db!, "volunteers", v.id), v);
      }

      // 2. Seed Needs
      await addNeed({
        description: "Medical supplies for children's clinic",
        category: "Health",
        priority: "High",
        reasons: "Lack of basic pediatric medicines",
        location: "Sector 4, Gachibowli",
        peopleAffected: 50,
        status: "Open",
        createdBy: user.uid,
      });

      await addNeed({
        description: "Food distribution for stranded families",
        category: "Food",
        priority: "Medium",
        reasons: "Flooded area restricting food supply",
        location: "Western Block, Madhapur",
        peopleAffected: 150,
        status: "Open",
        createdBy: user.uid,
      });

      // 3. Seed Tasks
      await addTask({
        title: "Medical supplies delivery — Sector 4",
        needId: "mockNeed1",
        assignedVolunteerId: "V1",
        assignedVolunteerName: "Dr. Ananya Sharma",
        status: "In Progress",
        priority: "High",
        location: "Sector 4, Gachibowli",
        progress: 65,
        eta: "~30 min"
      });

      toast({ title: "Data Seeded Successfully ✓", description: "Your dashboard should now show real data." });
      router.push("/dashboard");
    } catch (e: any) {
      toast({ title: "Failed to Seed Data", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-sm">
        <h1 className="text-2xl font-bold font-headline mb-2">Seed Database</h1>
        <p className="text-muted-foreground text-sm mb-6">
          This will inject mock Volunteers, Needs, and Tasks into your live Firebase Database so you can test the dashboard immediately.
        </p>
        <Button onClick={handleSeed} disabled={loading || !user} className="w-full">
          {loading ? "Seeding..." : "Seed Firebase DB"}
        </Button>
        {!user && <p className="text-xs text-red-500 mt-2">Please log in first.</p>}
      </div>
    </div>
  );
}
