"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Zap, X } from "lucide-react";
import {
  LayoutDashboard, FileText, Target, Users, BarChart3,
  Settings, TrendingUp, Building2, DatabaseZap, ShieldAlert, Flame, ScanLine,
  ClipboardList, Plus, Search
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const adminNavItems = [
  { href: "/dashboard", label: "Command Centre", icon: LayoutDashboard, tooltip: "Platform Overview" },
  { href: "/dashboard/ngos", label: "Verifications", icon: ShieldAlert, tooltip: "Approve NGOs & Volunteers" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, tooltip: "Platform Analytics" },
  { href: "/seed", label: "Seed Demo Data", icon: DatabaseZap, tooltip: "Inject Demo DB Records" },
];

const ngoNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, tooltip: "Operations Overview" },
  { href: "/dashboard/tasks", label: "Tasks", icon: ClipboardList, tooltip: "Manage Tasks" },
  { href: "/dashboard/tasks/new", label: "Post Task", icon: Plus, tooltip: "Create New Task" },
  { href: "/dashboard/my-volunteers", label: "My Volunteers", icon: Users, tooltip: "Your Team" },
  { href: "/dashboard/heatmap", label: "Urgency Heatmap", icon: Flame, tooltip: "Live Heatmap" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, tooltip: "Impact Analytics" },
];

const volunteerNavItems = [
  { href: "/dashboard/missions", label: "My Missions", icon: Target, tooltip: "Active Tasks" },
  { href: "/dashboard/available-tasks", label: "Available Tasks", icon: Search, tooltip: "Browse Open Tasks" },
  { href: "/dashboard/heatmap", label: "Heatmap", icon: Flame, tooltip: "Urgency Heatmap" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { userRole } = useAuth();

  let filteredNavItems = ngoNavItems;
  if (userRole === "Admin") filteredNavItems = adminNavItems;
  if (userRole === "Volunteer") filteredNavItems = volunteerNavItems;

  return (
    <SidebarMenu className="px-2">
      {filteredNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton asChild tooltip={item.tooltip} isActive={pathname === item.href}>
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="Settings" isActive={pathname === "/dashboard/settings"}>
          <Link href="/dashboard/settings">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function EmergencyBanner() {
  const [active, setActive] = useState(false);
  const [info, setInfo] = useState({ type: "", region: "" });

  useEffect(() => {
    if (localStorage.getItem("emergencyActive") === "true") {
      setActive(true);
      const stored = localStorage.getItem("emergencyInfo");
      if (stored) setInfo(JSON.parse(stored));
    }
    const handler = (e: CustomEvent) => {
      setActive(true);
      setInfo(e.detail);
    };
    window.addEventListener("emergencyActivated", handler as EventListener);
    return () => window.removeEventListener("emergencyActivated", handler as EventListener);
  }, []);

  if (!active) return null;

  return (
    <div className="w-full bg-destructive text-destructive-foreground flex items-center justify-between px-4 py-2 text-sm font-medium z-50">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 animate-pulse" />
        <span>
          <strong>⚡ EMERGENCY MODE ACTIVE</strong> — {info.type} in{" "}
          <strong>{info.region}</strong>. Life-critical needs prioritized.
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-destructive-foreground/20"
        onClick={() => {
          setActive(false);
          localStorage.removeItem("emergencyActive");
          localStorage.removeItem("emergencyInfo");
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
