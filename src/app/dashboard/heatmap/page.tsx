"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { subscribeToNeeds, subscribeToVolunteers, NeedDoc, VolunteerDoc } from "@/lib/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, AlertTriangle, Flame, Activity } from "lucide-react";

const DynamicHeatmap = dynamic(() => import("@/components/MapComponent").then(m => ({ default: m.HeatmapComponent })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50/50 text-muted-foreground gap-2 min-h-[500px]">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      <p className="text-xs">Loading Urgency Heatmap…</p>
    </div>
  ),
});

export default function HeatmapPage() {
  const [needs, setNeeds] = useState<NeedDoc[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerDoc[]>([]);

  useEffect(() => {
    const u1 = subscribeToNeeds(setNeeds);
    const u2 = subscribeToVolunteers(setVolunteers);
    return () => { u1(); u2(); };
  }, []);

  const highNeeds = needs.filter(n => n.priority === "High" && n.status === "Open");
  const medNeeds = needs.filter(n => n.priority === "Medium" && n.status === "Open");
  const lowNeeds = needs.filter(n => n.priority === "Low" && n.status === "Open");
  const availVols = volunteers.filter(v => v.status === "Available");

  // Category breakdown
  const categories = ["Food", "Health", "Education", "Shelter", "Water", "Other"] as const;
  const catCounts = categories.map(cat => ({
    cat,
    count: needs.filter(n => n.category === cat && n.status === "Open").length,
  })).filter(c => c.count > 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-destructive/10 rounded-xl">
            <Flame className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold font-headline text-foreground">Urgency Heatmap</h1>
        </div>
        <p className="text-muted-foreground">
          Live geospatial view of community need intensity. Red zones = critical. Click any circle for details.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="border-none shadow-sm bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold font-headline text-destructive">{highNeeds.length}</p>
              <p className="text-xs text-muted-foreground">Critical zones</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold font-headline text-amber-600">{medNeeds.length}</p>
              <p className="text-xs text-muted-foreground">Medium zones</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold font-headline text-emerald-600">{availVols.length}</p>
              <p className="text-xs text-muted-foreground">Available volunteers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold font-headline text-primary">{needs.filter(n => n.status === "Open").length}</p>
              <p className="text-xs text-muted-foreground">Open needs total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        {/* Map — takes up most of the space */}
        <Card className="lg:col-span-3 border-none shadow-lg overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-base flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-destructive animate-pulse" />
                Live Urgency Map
              </CardTitle>
              <CardDescription className="text-xs">Circles = need intensity · Dots = volunteer positions</CardDescription>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider">
              {[
                { color: "bg-destructive", label: "Critical" },
                { color: "bg-amber-400", label: "Medium" },
                { color: "bg-emerald-500", label: "Low" },
                { color: "bg-emerald-400 border border-white", label: "Volunteer" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  {label}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[520px]">
            <DynamicHeatmap />
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Category breakdown */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-headline">Need Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {catCounts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No open needs</p>
              ) : catCounts.map(({ cat, count }) => {
                const maxCount = Math.max(...catCounts.map(c => c.count));
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{cat}</span>
                      <span className="text-muted-foreground font-bold">{count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Critical needs list */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-headline flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                Critical Zones ({highNeeds.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[280px] overflow-y-auto">
              {highNeeds.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No critical needs 🎉</p>
              ) : highNeeds.map(n => (
                <div key={n.id} className="p-2.5 bg-destructive/5 border border-destructive/10 rounded-lg">
                  <p className="text-xs font-semibold leading-tight">{n.description}</p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-3 w-3 text-destructive" />
                    {n.location}
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    <Badge variant="outline" className="text-[9px] py-0 border-destructive/30 text-destructive">{n.category}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
