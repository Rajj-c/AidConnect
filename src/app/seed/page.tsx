"use client";

import { useAuth } from "@/contexts/AuthContext";
import { addNeed, addTask } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

const VOLUNTEERS = [
  {
    id: "V1",
    userId: "mock_uid_1",
    name: "Dr. Ananya Sharma",
    gender: "female",
    role: "Medical Volunteer",
    skills: ["Pediatrics", "First Aid", "Emergency Care", "Hindi", "Telugu"],
    location: "Gachibowli, Hyderabad",
    availability: "Immediate",
    status: "Available",
    rating: 4.9,
    tasksCompleted: 24,
    lat: 17.4401,
    lng: 78.3489,
    distance: "1.2 km",
    phone: "+91-9876543210",
    bio: "Senior pediatrician volunteering during disaster relief ops.",
  },
  {
    id: "V2",
    userId: "mock_uid_2",
    name: "Rajesh Kumar",
    gender: "male",
    role: "Logistics Coordinator",
    skills: ["Logistics", "Driving", "Telugu", "Inventory Management"],
    location: "Madhapur, Hyderabad",
    availability: "After 4 PM",
    status: "Busy",
    rating: 4.7,
    tasksCompleted: 45,
    lat: 17.4486,
    lng: 78.3908,
    distance: "3.7 km",
    phone: "+91-9123456789",
    bio: "Experienced in supply chain and last-mile delivery during floods.",
  },
  {
    id: "V3",
    userId: "mock_uid_3",
    name: "Priya Venkatesh",
    gender: "female",
    role: "Community Educator",
    skills: ["Teaching", "Telugu", "Tamil", "Child Psychology", "Communication"],
    location: "Kondapur, Hyderabad",
    availability: "Weekdays 9-5",
    status: "Available",
    rating: 4.8,
    tasksCompleted: 31,
    lat: 17.4597,
    lng: 78.3614,
    distance: "2.1 km",
    phone: "+91-9988776655",
    bio: "Teacher turned field volunteer. Specialises in community outreach.",
  },
  {
    id: "V4",
    userId: "mock_uid_4",
    name: "Mohammed Irfan",
    gender: "male",
    role: "Water & Sanitation Specialist",
    skills: ["Water Testing", "Sanitation", "Civil Engineering", "Urdu", "English"],
    location: "Tolichowki, Hyderabad",
    availability: "24/7 On Call",
    status: "Available",
    rating: 4.6,
    tasksCompleted: 18,
    lat: 17.4089,
    lng: 78.4176,
    distance: "5.2 km",
    phone: "+91-9001122334",
    bio: "Civil engineer volunteering water quality testing after flood events.",
  },
  {
    id: "V5",
    userId: "mock_uid_5",
    name: "Sunita Rao",
    gender: "female",
    role: "Food Distribution Lead",
    skills: ["Food Handling", "Team Leadership", "Kannada", "Hindi", "Operations"],
    location: "Kukatpally, Hyderabad",
    availability: "Morning 7-1 PM",
    status: "Available",
    rating: 4.95,
    tasksCompleted: 62,
    lat: 17.4849,
    lng: 78.4138,
    distance: "6.1 km",
    phone: "+91-8877665544",
    bio: "Leads food distribution drives for large communities. Ex-NGO coordinator.",
  },
];

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
      // 1. Seed Volunteers (rich profiles)
      for (const v of VOLUNTEERS) {
        await setDoc(doc(db!, "volunteers", v.id), v);
      }

      // 2. Seed Needs
      const n1Ref = await addNeed({
        description: "Urgent — 50 units of medical supplies needed at children's clinic",
        category: "Health",
        priority: "High",
        reasons: "Children's clinic flooded, running out of essential medicines and sanitizers.",
        location: "Sector 4, Gachibowli",
        lat: 17.4401, lng: 78.3489,
        peopleAffected: 50,
        status: "Open",
        createdBy: user.uid,
      });

      const n2Ref = await addNeed({
        description: "Food packages needed for 150 stranded families in Western Block",
        category: "Food",
        priority: "High",
        reasons: "Entire block cut off by floods. No food for 48 hours.",
        location: "Western Block, Madhapur",
        lat: 17.4486, lng: 78.3908,
        peopleAffected: 150,
        status: "Open",
        createdBy: user.uid,
      });

      await addNeed({
        description: "Clean drinking water needed — community well contaminated",
        category: "Water",
        priority: "Medium",
        reasons: "Well contaminated by floodwater. Residents have no access to potable water.",
        location: "Old Village Road, Kondapur",
        lat: 17.4597, lng: 78.3614,
        peopleAffected: 80,
        status: "Open",
        createdBy: user.uid,
      });

      // 3. Seed Tasks
      await addTask({
        title: "Medical supplies delivery — Sector 4 Clinic",
        needId: n1Ref.id,
        assignedVolunteerId: "V1",
        assignedVolunteerName: "Dr. Ananya Sharma",
        status: "In Progress",
        priority: "High",
        location: "Sector 4, Gachibowli",
        lat: 17.4401, lng: 78.3489,
        progress: 65,
        eta: "~30 min",
      });

      await addTask({
        title: "Food distribution — Western Block families",
        needId: n2Ref.id,
        assignedVolunteerId: "V5",
        assignedVolunteerName: "Sunita Rao",
        status: "Pending",
        priority: "High",
        location: "Western Block, Madhapur",
        lat: 17.4486, lng: 78.3908,
        progress: 0,
        eta: "~1 hour",
      });

      toast({ title: "Database Seeded ✓", description: "5 Volunteers, 3 Needs, and 2 Tasks loaded." });
      router.push("/dashboard/volunteers");
    } catch (e: any) {
      toast({ title: "Seed Failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm space-y-4">
        <h1 className="text-2xl font-bold font-headline">Seed Database</h1>
        <p className="text-muted-foreground text-sm">
          Injects <strong>5 Volunteers</strong>, <strong>3 Needs</strong>, and <strong>2 Tasks</strong> with full GPS coords into Firebase for live demo/testing.
        </p>
        <Button onClick={handleSeed} disabled={loading || !user} className="w-full">
          {loading ? "Seeding..." : "🌱 Seed Firebase DB"}
        </Button>
        {!user && <p className="text-xs text-red-500">Please log in first.</p>}
      </div>
    </div>
  );
}
