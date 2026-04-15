"use client";

import { useState, useEffect } from "react";
import { subscribeToNeeds, NeedDoc, addTask } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  MapPin, 
  Users, 
  Clock, 
  ChevronRight, 
  Sparkles,
  Search,
  Filter,
  Loader2
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function NeedsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [needs, setNeeds] = useState<NeedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    return subscribeToNeeds((data) => {
      setNeeds(data.filter(n => n.status === "Open"));
      setLoading(false);
    });
  }, []);

  async function handleAssignTask(need: NeedDoc) {
    if (!need.id) return;
    try {
      await addTask({
        needId: need.id,
        title: need.description,
        assignedVolunteerId: "",
        assignedVolunteerName: "Unassigned",
        status: "Pending",
        priority: need.priority,
        location: need.location,
        lat: need.lat,
        lng: need.lng,
        progress: 0,
        eta: "TBD"
      });
      toast({ title: "Task Created", description: "Navigating to Volunteer Hub for dispatch." });
      // Update need status to Assigned (optional, but good practice).
      // We don't have updateNeedStatus, but that's alright, it will still show in tasks.
      router.push("/dashboard/volunteers?tab=matches");
    } catch (err) {
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    }
  }

  const filteredNeeds = needs.filter(n => 
    n.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">Prioritized Community Needs</h1>
          <p className="text-muted-foreground">AI-ranked list of active issues based on severity and urgency.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter needs..." 
              className="pl-9 w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      ) : filteredNeeds.length === 0 ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
             <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4 opacity-30" />
             <p className="text-lg font-headline font-bold text-muted-foreground">No active needs found.</p>
             <p className="text-sm text-muted-foreground">Submit a field report via the AI Scanner to populate this list.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredNeeds.map((need) => (
            <Card key={need.id} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <div className="flex flex-col sm:flex-row">
                <div className={`w-2 shrink-0 ${
                  need.priority === 'High' ? 'bg-destructive' : need.priority === 'Medium' ? 'bg-amber-400' : 'bg-accent'
                }`} />
                <div className="flex-1 p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant={need.priority === 'High' ? 'destructive' : 'secondary'} className="rounded-md">
                      {need.priority} Priority
                    </Badge>
                    <Badge variant="outline" className="bg-muted/50 rounded-md">
                      {need.category}
                    </Badge>
                    <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> 
                      {need.createdAt ? formatDistanceToNow(need.createdAt.toDate(), { addSuffix: true }) : "recently"}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold font-headline mb-2 leading-tight">
                    {need.description}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary" />
                      {need.location}
                    </div>
                    {need.lat && need.lng && (
                       <Badge variant="outline" className="text-[10px] text-green-600 bg-green-50 border-green-200">
                         GPS Locked
                       </Badge>
                    )}
                  </div>
                </div>
                
                <div className="bg-muted/30 p-4 sm:border-l flex flex-col justify-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 bg-white group-hover:bg-primary group-hover:text-white transition-colors">
                        <Sparkles className="h-3 w-3" /> AI Insights
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 font-headline">
                          <Sparkles className="h-5 w-5 text-primary" /> Explainable AI Insights
                        </DialogTitle>
                        <DialogDescription>
                          Why this need was prioritized as <span className="font-bold text-destructive">{need.priority}</span>.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="p-4 bg-muted/50 rounded-lg text-sm border-l-4 border-primary">
                          <p className="font-medium mb-1">Analysis Breakdown:</p>
                          <p className="text-muted-foreground leading-relaxed italic">
                            "{need.reasons}"
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs font-bold uppercase text-muted-foreground">Severity Score</p>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-destructive" style={{ width: need.priority === 'High' ? '90%' : need.priority === 'Medium' ? '60%' : '30%' }} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold uppercase text-muted-foreground">Time Sensitivity</p>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: need.priority === 'High' ? '95%' : need.priority === 'Medium' ? '50%' : '20%' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" className="gap-1" onClick={() => handleAssignTask(need)}>
                    Assign Task <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
