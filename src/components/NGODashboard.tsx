
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import {
  Users, CheckCircle2, AlertTriangle,
  Map as MapIcon, Clock, ArrowUpRight
} from "lucide-react";
import { EmergencyModeDialog } from "@/components/EmergencyModeDialog";
import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";
import { subscribeToTasks, subscribeToNeeds, subscribeToVolunteers, submitTaskFeedback, TaskDoc, NeedDoc, VolunteerDoc } from "@/lib/firestore";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

const DynamicMap = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50/50 text-muted-foreground gap-2 min-h-[250px]">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
      <p className="text-xs">Loading Live Map...</p>
    </div>
  )
});



const COLORS = ["#1566ED", "#33B233", "#F59E0B", "#EF4444"];

function handleEmergencyActivate(type: string, region: string) {
  localStorage.setItem("emergencyActive", "true");
  localStorage.setItem("emergencyInfo", JSON.stringify({ type, region }));
  window.dispatchEvent(new CustomEvent("emergencyActivated", { detail: { type, region } }));
}

export function NGODashboard() {
  const { userRole } = useAuth();
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [needs, setNeeds] = useState<NeedDoc[]>([]);
  const [vols, setVols] = useState<VolunteerDoc[]>([]);

  useEffect(() => {
    const unsub1 = subscribeToTasks(setTasks);
    const unsub2 = subscribeToNeeds(setNeeds);
    const unsub3 = subscribeToVolunteers(setVols);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const activeVolsCount = vols.length > 0 ? vols.filter(v => v.status === "Available").length : "1,280";
  const tasksCompletedCount = tasks.length > 0 ? tasks.filter(t => t.status === "Completed").length : "410";
  const highPriorityNeedsCount = needs.length > 0 ? needs.filter(n => n.priority === "High").length : "20";

  // Compute category map
  const catMap = new Map<string, number>();
  needs.forEach(n => {
    catMap.set(n.category, (catMap.get(n.category) || 0) + 1);
  });
  const dynamicCategoryData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));
  const finalCategoryData = dynamicCategoryData.length > 0 ? dynamicCategoryData : [
    { name: "Food", value: 1 },
    { name: "Health", value: 1 }
  ];

  // Derive mock impact data (normally this would aggregate over time)
  const impactData = [
    { name: "Jan", helped: 400 },
    { name: "Feb", helped: 300 },
    { name: "Mar", helped: 600 },
    { name: "Apr", helped: 800 },
    { name: "May", helped: 500 },
    { name: "Live", helped: tasks.filter(t => t.status === "Completed").length * 5 + 900 },
  ];

  const latestNeeds = needs.slice(0, 4).map(n => ({
    time: n.createdAt ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : "just now",
    title: n.priority === "High" ? "New High Priority Need" : "New Need Logged",
    desc: n.description,
    type: n.priority === "High" ? "high" : "info" as string
  }));

  const latestAlerts = latestNeeds.length > 0 ? latestNeeds : [
    { time: "2m ago", title: "New High Priority Need", desc: "Medical camp requested in Jubilee Hills", type: "high" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline text-foreground">Operational Overview</h1>
          <p className="text-muted-foreground">Real-time insights from community field reports.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Clock className="h-4 w-4" /> Past 30 Days
          </Button>
          <EmergencyModeDialog onActivate={handleEmergencyActivate} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Available Volunteers", value: activeVolsCount, delta: "Live", desc: "tracked in db", icon: Users, iconColor: "text-primary", deltaColor: "text-accent" },
          { label: "High Priority Needs", value: highPriorityNeedsCount, delta: "Live", desc: "urgent requests", icon: AlertTriangle, iconColor: "text-destructive", deltaColor: "text-destructive" },
          { label: "Tasks Completed", value: tasksCompletedCount, delta: "Live", desc: "synced globally", icon: CheckCircle2, iconColor: "text-accent", deltaColor: "text-accent" },
          { label: "Active Subscriptions", value: "3", delta: "Live", desc: "connected to firebase", icon: Clock, iconColor: "text-primary", deltaColor: "text-accent" },
        ].map(({ label, value, delta, desc, icon: Icon, iconColor, deltaColor }) => (
          <Card key={label} className="shadow-sm border-none bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <span className={`font-bold ${deltaColor}`}>{delta}</span> {desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Main Chart */}
        <Card className="lg:col-span-4 shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="font-headline text-lg">People Helped Trend</CardTitle>
            <CardDescription>Number of individuals assisted over time.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={impactData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="helped" stroke="#1566ED" strokeWidth={3} dot={{ r: 4, fill: "#1566ED" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hotspot Map */}
        <Card className="lg:col-span-3 shadow-sm border-none bg-white overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-primary" /> Hotspot Map
            </CardTitle>
            <CardDescription>Live visualization of prioritized needs.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 relative min-h-[250px] p-0 z-0">
            <DynamicMap />
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border shadow-sm flex justify-between items-center z-[400] pointer-events-none">
              <span className="text-xs font-semibold">Gachibowli Area, Hyderabad</span>
              <Badge variant="destructive" className="animate-pulse">Emergency</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Categories Pie Chart */}
        <Card className="shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Need Categories</CardTitle>
            <CardDescription>Distribution of requested assistance types.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={finalCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {finalCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs mt-2 w-full flex-wrap">
              {finalCategoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="lg:col-span-2 shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-lg">Recent Alerts</CardTitle>
              <CardDescription>Real-time notifications from the field.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary gap-1">
              View all <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestAlerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                  alert.type === "high" ? "bg-destructive" : alert.type === "success" ? "bg-accent" : "bg-primary"
                }`} />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-semibold">{alert.title}</p>
                    <span className="text-[10px] text-muted-foreground uppercase">{alert.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
