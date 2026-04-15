"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, LineChart, Line
} from "recharts";
import { Users, CheckCircle2, Clock, TrendingUp, Award, Heart } from "lucide-react";

const monthlyImpact = [
  { month: "Nov", people: 520, tasks: 38 },
  { month: "Dec", people: 710, tasks: 52 },
  { month: "Jan", people: 640, tasks: 45 },
  { month: "Feb", people: 870, tasks: 61 },
  { month: "Mar", people: 1020, tasks: 74 },
  { month: "Apr", people: 1240, tasks: 89 },
];

const responseTimeTrend = [
  { month: "Nov", hours: 7.2 },
  { month: "Dec", hours: 6.1 },
  { month: "Jan", hours: 5.8 },
  { month: "Feb", hours: 5.2 },
  { month: "Mar", hours: 4.7 },
  { month: "Apr", hours: 4.2 },
];

const volunteerLeaderboard = [
  { name: "Dr. Ananya Sharma", tasks: 24, rating: 4.9, badge: "Top Performer" },
  { name: "Rajesh Kumar", tasks: 45, rating: 4.7, badge: "Most Tasks" },
  { name: "Sarah Jenkins", tasks: 12, rating: 4.8, badge: "" },
  { name: "Priya Nair", tasks: 19, rating: 4.6, badge: "" },
  { name: "Mohammed Ali", tasks: 31, rating: 4.5, badge: "" },
];

const ngoPerformance = [
  { ngo: "Hyderabad Aid Foundation", tasks: 89, resolved: 81, efficiency: 91 },
  { ngo: "Green Hands NGO", tasks: 52, resolved: 44, efficiency: 85 },
  { ngo: "Sankalp Volunteers", tasks: 34, resolved: 28, efficiency: 82 },
];

export default function ImpactPage() {
  const totalPeople = monthlyImpact.reduce((s, d) => s + d.people, 0);
  const totalTasks = monthlyImpact.reduce((s, d) => s + d.tasks, 0);
  const latestResponseTime = responseTimeTrend[responseTimeTrend.length - 1].hours;
  const improvement = (
    ((responseTimeTrend[0].hours - latestResponseTime) / responseTimeTrend[0].hours) * 100
  ).toFixed(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Impact Metrics</h1>
        <p className="text-muted-foreground">Measuring the difference we make — people helped, tasks completed, response times.</p>
      </div>

      {/* Top counters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "People Helped", value: totalPeople.toLocaleString(),
            sub: "All-time across regions", icon: Heart, color: "text-destructive", bg: "bg-destructive/10"
          },
          {
            label: "Tasks Completed", value: totalTasks.toString(),
            sub: "Last 6 months", icon: CheckCircle2, color: "text-accent", bg: "bg-accent/10"
          },
          {
            label: "Avg Response Time", value: `${latestResponseTime}h`,
            sub: `${improvement}% faster than 6 months ago`, icon: Clock, color: "text-primary", bg: "bg-primary/10"
          },
          {
            label: "Active Volunteers", value: "1,284",
            sub: "+12% this month", icon: Users, color: "text-amber-600", bg: "bg-amber-100"
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <Card key={label} className="border-none shadow-sm bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
              </div>
              <p className="text-3xl font-bold font-headline tracking-tight">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* People Helped Chart */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Community Reach</CardTitle>
            <CardDescription>Monthly count of individuals supported.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyImpact}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="people" fill="#1566ED" radius={[6, 6, 0, 0]} name="People Helped" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Time Chart */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" /> Response Time Improvement
            </CardTitle>
            <CardDescription>Average hours from report to volunteer assignment.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} domain={[3, 8]} />
                <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                <Line type="monotone" dataKey="hours" stroke="#33B233" strokeWidth={3} dot={{ r: 4, fill: "#33B233" }} activeDot={{ r: 6 }} name="Avg Hours" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Volunteer Leaderboard */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" /> Volunteer Leaderboard
            </CardTitle>
            <CardDescription>Top contributors ranked by tasks and ratings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {volunteerLeaderboard.map((v, i) => (
                <div key={v.name} className="flex items-center gap-3 py-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-amber-700/30 text-amber-800" : "bg-muted text-muted-foreground"
                  }`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{v.name}</p>
                      {v.badge && <Badge variant="secondary" className="text-[9px] py-0">{v.badge}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{v.tasks} tasks · ★ {v.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* NGO Performance */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="font-headline text-lg">NGO Performance</CardTitle>
            <CardDescription>Resolution rates across partner organizations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {ngoPerformance.map((ngo) => (
                <div key={ngo.ngo} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <p className="text-sm font-semibold">{ngo.ngo}</p>
                    <span className="text-xs font-bold text-accent">{ngo.efficiency}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                      style={{ width: `${ngo.efficiency}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{ngo.resolved}/{ngo.tasks} tasks resolved</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
