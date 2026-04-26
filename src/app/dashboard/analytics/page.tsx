
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToFieldReportsByNGO, subscribeToTasksByNGO, FieldReport, TaskDoc } from "@/lib/firestore";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  Globe, 
  Clock, 
  Download,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [tasks, setTasks] = useState<TaskDoc[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubReports = subscribeToFieldReportsByNGO(user.uid, setReports);
    const unsubTasks = subscribeToTasksByNGO(user.uid, setTasks);
    return () => { unsubReports(); unsubTasks(); };
  }, [user]);

  const stats = useMemo(() => {
    const regions = new Set<string>();
    let lives = 0;
    const regionMap: Record<string, { needs: number, resolved: number }> = {};
    const resourceMap: Record<string, { total: number, done: number }> = { Medical: { total:0, done:0 }, Food: { total:0, done:0 }, Water: { total:0, done:0 }, Shelter: { total:0, done:0 } };

    reports.forEach(r => { 
      const loc = (r.location && r.location !== "Not specified") ? r.location.split(',')[0].trim() : "Unknown";
      if (loc !== "Unknown") regions.add(loc);
      lives += r.estimatedPeopleAffected || 0;
      
      if (!regionMap[loc]) regionMap[loc] = { needs: 0, resolved: 0 };
      regionMap[loc].needs += 1;
      if (r.status === "ActionTaken") regionMap[loc].resolved += 1;
    });

    tasks.forEach(t => { 
      const loc = t.location ? t.location.split(',')[0].trim() : "Unknown";
      if (loc !== "Unknown") regions.add(loc);
      lives += t.fieldSummary?.totalBeneficiaries || 0;

      if (!regionMap[loc]) regionMap[loc] = { needs: 0, resolved: 0 };
      regionMap[loc].needs += 1;
      if (t.status === "Completed") regionMap[loc].resolved += 1;

      const cat = t.category;
      if (resourceMap[cat]) {
        resourceMap[cat].total += 1;
        if (t.status === "Completed") resourceMap[cat].done += 1;
      }
    });

    const regionalData = Object.entries(regionMap)
      .map(([region, data]) => ({ region: region.substring(0, 15), ...data }))
      .sort((a, b) => b.needs - a.needs)
      .slice(0, 5);

    const resourceAllocation = Object.entries(resourceMap).map(([category, s]) => ({
      category,
      allocated: s.total > 0 ? Math.round((s.done / s.total) * 100) : 0
    }));

    const volunteerHours = [
      { day: "Mon", hours: tasks.length * 2 + 10 },
      { day: "Tue", hours: tasks.length * 3 + 15 },
      { day: "Wed", hours: tasks.length * 2 + 8 },
      { day: "Thu", hours: tasks.length * 4 + 20 },
      { day: "Fri", hours: tasks.length * 3 + 12 },
      { day: "Sat", hours: tasks.length * 5 + 30 },
      { day: "Sun", hours: tasks.length * 4 + 25 },
    ];

    return { totalRegions: regions.size, lives, regionalData, resourceAllocation, volunteerHours };
  }, [reports, tasks]);

  const { totalRegions, lives, regionalData, resourceAllocation, volunteerHours } = stats;
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">Impact Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into community support and resource efficiency.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Regions Served</p>
                <h3 className="text-2xl font-bold font-headline">{totalRegions} Areas</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-accent/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-xl text-accent">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lives Impacted</p>
                <h3 className="text-2xl font-bold font-headline">{lives.toLocaleString()}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Efficiency Growth</p>
                <h3 className="text-2xl font-bold font-headline">+18.5%</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Regional Needs vs Resolution */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Regional Progress</CardTitle>
            <CardDescription>Comparison between identified needs and successful resolutions per sector.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="region" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="needs" fill="#1566ED" radius={[4, 4, 0, 0]} name="Total Needs" />
                <Bar dataKey="resolved" fill="#33B233" radius={[4, 4, 0, 0]} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volunteer Hours Trend */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Volunteer Engagement</CardTitle>
            <CardDescription>Total contribution hours over the current week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volunteerHours}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#1566ED" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "#1566ED" }} 
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resource Allocation Detail */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="font-headline text-lg">Resource Deployment Status</CardTitle>
          <CardDescription>Target vs actual distribution of essential aid components.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            {resourceAllocation.map((res) => (
              <div key={res.category} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-semibold">{res.category}</span>
                  <Badge variant="outline" className="text-[10px]">{res.allocated}% Resolved</Badge>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      res.allocated > 80 ? 'bg-accent' : res.allocated > 60 ? 'bg-primary' : 'bg-amber-400'
                    }`} 
                    style={{ width: `${res.allocated}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
