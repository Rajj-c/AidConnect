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

const MASS_NGOS = [
  { name: "Food Rescue Trichy", category: "Food", location: "Trichy" },
  { name: "HealthNet Chennai", category: "Health", location: "Chennai" },
  { name: "EduCare Coimbatore", category: "Education", location: "Coimbatore" },
  { name: "Shelter Hope Madurai", category: "Shelter", location: "Madurai" },
  { name: "CleanWater Salem", category: "Water", location: "Salem" },
  { name: "AllRelief Erode", category: "General", location: "Erode" },
  { name: "Food for All Tirunelveli", category: "Food", location: "Tirunelveli" },
  { name: "MedAssist Vellore", category: "Health", location: "Vellore" },
  { name: "BrightFuture Thoothukudi", category: "Education", location: "Thoothukudi" },
  { name: "SafeHome Dindigul", category: "Shelter", location: "Dindigul" },
];

const MASS_VOL_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya",
  "Saanvi", "Aanya", "Aadhya", "Aaradhya", "Ananya", "Pari", "Diya", "Navya", "Manya", "Aliya",
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

  async function handleMassSeed() {
    if (!user) {
      toast({ title: "Must be logged in", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      let count = 0;
      for (let i = 0; i < MASS_NGOS.length; i++) {
        const ngo = MASS_NGOS[i];
        const ngoId = `mock_ngo_${i + 1}`;
        await setDoc(doc(db!, "users", ngoId), {
          email: `ngo${i+1}@demo.com`,
          role: "NGO",
          displayName: ngo.name,
          approvalStatus: "Pending",
          createdAt: serverTimestamp(),
        });
        await setDoc(doc(db!, "ngos", ngoId), {
          orgName: ngo.name,
          regNumber: `REG-${2000 + i}`,
          phone: `+91-90000${2000 + i}`,
          address: ngo.location,
          category: ngo.category,
          description: `Dedicated to ${ngo.category.toLowerCase()} relief in ${ngo.location}.`,
          status: "pending",
          createdAt: serverTimestamp(),
        });
        for (let j = 1; j <= 12; j++) {
          const volId = `mock_vol_${i + 1}_${j}`;
          const volName = `${MASS_VOL_NAMES[(i * 12 + j) % MASS_VOL_NAMES.length]} ${ngo.location.charAt(0)}`;
          await setDoc(doc(db!, "users", volId), {
            email: `vol_${i+1}_${j}@demo.com`,
            role: "Volunteer",
            displayName: volName,
            approved: true,
            ngoId: ngoId,
            createdAt: serverTimestamp(),
          });
          await setDoc(doc(db!, "volunteers", volId), {
            name: volName,
            gender: j % 2 === 0 ? "female" : "male",
            phone: `+91-98000${1000 + i * 12 + j}`,
            address: `${ngo.location} Zone ${j % 4 + 1}`,
            role: "Field Volunteer",
            skills: [ngo.category, "Logistics", "First Aid"].slice(0, (j % 3) + 1),
            availability: j % 2 === 0 ? "Immediate" : "Weekends",
            ngoId: ngoId,
            status: "Available",
            rating: 4.0 + (j % 10) / 10,
            tasksCompleted: j % 5,
            createdAt: serverTimestamp(),
          });
          count++;
        }
      }
      toast({ title: `Successfully seeded 10 NGOs and 120 Volunteers!` });
    } catch (err: any) {
      toast({ title: "Error seeding data", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Database Seeder</h1>
        <p className="text-muted-foreground">Populate your AidConnect database with mock data for testing.</p>
      </div>

      <div className="grid gap-4">
        <Button 
          onClick={handleSeed} 
          disabled={loading || !user}
          size="lg"
          className="w-full text-lg"
        >
          {loading ? "Seeding..." : "Seed Hackathon Missions (Tasks & Needs)"}
        </Button>

        <Button 
          onClick={handleMassSeed} 
          disabled={loading || !user}
          size="lg"
          variant="secondary"
          className="w-full text-lg border-primary/20 border"
        >
          {loading ? "Seeding..." : "Mass Seed: 10 NGOs & 120 Volunteers"}
        </Button>
      </div>

      {!user && (
        <p className="text-sm text-destructive text-center">You must be logged in to seed data.</p>
      )}
    </div>
  );
}
