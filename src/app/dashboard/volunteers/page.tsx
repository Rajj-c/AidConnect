
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  MapPin, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Search,
  MessageSquare
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockVolunteers = [
  {
    id: "V1",
    name: "Dr. Ananya Sharma",
    role: "Medical Volunteer",
    skills: ["Pediatrics", "First Aid", "Hindi"],
    location: "Gachibowli",
    status: "Available",
    availability: "Immediate",
    rating: 4.9,
    tasksCompleted: 24,
    distance: "1.2 km"
  },
  {
    id: "V2",
    name: "Rajesh Kumar",
    role: "General Volunteer",
    skills: ["Logistics", "Driving", "Telugu"],
    location: "Madhapur",
    status: "Busy",
    availability: "After 4 PM",
    rating: 4.7,
    tasksCompleted: 45,
    distance: "3.5 km"
  },
  {
    id: "V3",
    name: "Sarah Jenkins",
    role: "Support Specialist",
    skills: ["Translation", "Education", "Tamil"],
    location: "Kondapur",
    status: "Available",
    availability: "Weekends Only",
    rating: 4.8,
    tasksCompleted: 12,
    distance: "2.1 km"
  }
];

export default function VolunteersPage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">Volunteer Hub</h1>
          <p className="text-muted-foreground">Manage and match volunteers with community tasks.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
             <MessageSquare className="h-4 w-4" /> Broadcast Alert
          </Button>
          <Button className="gap-2">
             <Users className="h-4 w-4" /> Add Volunteer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <TabsList className="bg-white/50 border">
            <TabsTrigger value="all">All Volunteers</TabsTrigger>
            <TabsTrigger value="matches">Smart Matches</TabsTrigger>
            <TabsTrigger value="active">Active Tasks</TabsTrigger>
          </TabsList>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              placeholder="Search by skill or name..." 
              className="pl-9 h-9 w-full bg-white border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockVolunteers.map((v) => (
              <Card key={v.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarImage src={`https://picsum.photos/seed/${v.id}/100/100`} />
                      <AvatarFallback>{v.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Badge variant={v.status === 'Available' ? 'secondary' : 'outline'} className={v.status === 'Available' ? 'bg-accent/10 text-accent border-accent/20' : ''}>
                      {v.status}
                    </Badge>
                  </div>
                  <CardTitle className="font-headline text-lg mt-2">{v.name}</CardTitle>
                  <CardDescription className="text-xs font-medium text-primary uppercase tracking-tight">{v.role}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {v.skills.map(s => <Badge key={s} variant="outline" className="text-[10px] py-0">{s}</Badge>)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {v.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {v.availability}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {v.tasksCompleted} tasks
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-accent" /> {v.rating} / 5.0
                    </div>
                  </div>
                </CardContent>
                <div className="p-4 pt-0 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">Profile</Button>
                  <Button size="sm" className="flex-1">Assign</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="matches" className="space-y-6">
           <Card className="border-none shadow-md bg-gradient-to-r from-primary/5 to-accent/5">
             <CardHeader>
               <div className="flex items-center gap-2">
                 <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                 <CardTitle className="font-headline text-xl">Top Smart Recommendations</CardTitle>
               </div>
               <CardDescription>AI matched volunteers for high priority needs in Sector 4.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="bg-white rounded-xl p-4 border border-primary/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Need: Medical Supplies for Sector 4</h4>
                      <p className="text-xs text-muted-foreground">High Priority • Health • 45 Affected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Top Match</p>
                      <p className="text-sm font-bold">Dr. Ananya Sharma</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                         <Button size="sm" className="gap-1 bg-primary">
                           <Sparkles className="h-3 w-3" /> Why?
                         </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 font-headline">
                             <Sparkles className="h-5 w-5 text-primary" /> Matching Explanation
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                           <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary italic text-sm">
                             "Matched because of her Pediatrics background, proximity (1.2km), and immediate availability. This specific need involves a children's clinic, requiring her specialist level skills."
                           </div>
                           <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-3 bg-accent/5 rounded-lg border border-accent/10">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Skills</p>
                                <p className="text-lg font-bold text-accent">100%</p>
                              </div>
                              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Proximity</p>
                                <p className="text-lg font-bold text-primary">0.8km</p>
                              </div>
                              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Urgency</p>
                                <p className="text-lg font-bold text-amber-600">High</p>
                              </div>
                           </div>
                           <Button className="w-full">Confirm Matching & Notify</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
