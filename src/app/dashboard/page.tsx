
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Users, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  Map as MapIcon, 
  Clock,
  ArrowUpRight,
  Zap
} from "lucide-react";

const impactData = [
  { name: "Jan", helped: 400 },
  { name: "Feb", helped: 300 },
  { name: "Mar", helped: 600 },
  { name: "Apr", helped: 800 },
  { name: "May", helped: 500 },
  { name: "Jun", helped: 900 },
];

const categoryData = [
  { name: "Food", value: 45 },
  { name: "Health", value: 30 },
  { name: "Education", value: 15 },
  { name: "Shelter", value: 10 },
];

const COLORS = ["#1566ED", "#33B233", "#F59E0B", "#EF4444"];

export default function DashboardPage() {
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
          <Button className="bg-destructive hover:bg-destructive/90 gap-2">
            <Zap className="h-4 w-4" /> Emergency Mode
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Volunteers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">1,284</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-accent font-bold">+12%</span> from last week
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Priority Needs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">24</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-destructive font-bold">+2</span> since morning
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">412</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-accent font-bold">+85%</span> target achieved
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">4.2h</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-accent font-bold">-15%</span> reduction in delay
            </p>
          </CardContent>
        </Card>
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

        {/* Map Placeholder */}
        <Card className="lg:col-span-3 shadow-sm border-none bg-white overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-primary" /> Hotspot Map
            </CardTitle>
            <CardDescription>Live visualization of prioritized needs.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 relative min-h-[250px] p-0">
            <div className="absolute inset-0 bg-blue-50 flex items-center justify-center">
              {/* Simulated Map */}
              <div className="w-full h-full bg-[url('https://picsum.photos/seed/map/800/600')] bg-cover opacity-60 mix-blend-multiply" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                   <div className="absolute -top-12 -left-8 animate-bounce"><MapPinIcon color="red" /></div>
                   <div className="absolute top-8 left-12 animate-pulse"><MapPinIcon color="orange" /></div>
                   <div className="absolute -bottom-16 -right-16 animate-bounce delay-75"><MapPinIcon color="red" /></div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border shadow-sm flex justify-between items-center">
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
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs mt-2">
              {categoryData.map((entry, index) => (
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
            {[
              { time: "2m ago", title: "New High Priority Need", desc: "Medical camp requested in Jubilee Hills", type: "high" },
              { time: "15m ago", title: "Task Completed", desc: "Food distribution successful in Kondapur", type: "success" },
              { time: "1h ago", title: "Volunteer Matched", desc: "Dr. Sharma assigned to Gachibowli medical task", type: "info" }
            ].map((alert, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                  alert.type === 'high' ? 'bg-destructive' : alert.type === 'success' ? 'bg-accent' : 'bg-primary'
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

function MapPinIcon({ color }: { color: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      width="32" 
      height="32" 
      stroke={color === 'red' ? '#EF4444' : color === 'orange' ? '#F59E0B' : '#3B82F6'} 
      strokeWidth="2" 
      fill={color === 'red' ? '#FEE2E2' : color === 'orange' ? '#FEF3C7' : '#DBEAFE'}
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
