
"use client";

import { useState } from "react";
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
  Filter
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

const mockNeeds = [
  {
    id: "N1",
    category: "Health",
    description: "Urgent medical supplies needed for children's clinic at Sector 4.",
    priority: "High",
    location: "Sector 4, Gachibowli",
    peopleAffected: 45,
    timestamp: "20m ago",
    reasons: "High severity due to vulnerable population (children). Immediate risk of infection spread without sanitizers and masks."
  },
  {
    id: "N2",
    category: "Food",
    description: "50 families in the western block reported zero food stock since morning.",
    priority: "High",
    location: "Western Block, Madhapur",
    peopleAffected: 200,
    timestamp: "45m ago",
    reasons: "Severe food insecurity for a large group. Time sensitivity is critical as they have missed two meals already."
  },
  {
    id: "N3",
    category: "Water",
    description: "Main community well reported contaminated. Residents need clean drinking water.",
    priority: "Medium",
    location: "Old Village Road",
    peopleAffected: 80,
    timestamp: "2h ago",
    reasons: "While urgent, bottled water is partially available from nearby shops, mitigating immediate crisis but requiring mid-term fix."
  },
  {
    id: "N4",
    category: "Education",
    description: "School supplies (books, stationery) needed for returning students.",
    priority: "Low",
    location: "Zilla Parishad School",
    peopleAffected: 120,
    timestamp: "5h ago",
    reasons: "Not life-critical. Can be managed over the next few weeks as classes haven't fully resumed."
  }
];

export default function NeedsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">Prioritized Community Needs</h1>
          <p className="text-muted-foreground">AI-ranked list of issues based on severity and urgency.</p>
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

      <div className="grid gap-4">
        {mockNeeds.filter(n => n.description.toLowerCase().includes(searchTerm.toLowerCase())).map((need) => (
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
                    <Clock className="h-3 w-3" /> {need.timestamp}
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
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    ~{need.peopleAffected} people affected
                  </div>
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
                <Button size="sm" className="gap-1">
                  Assign Task <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
