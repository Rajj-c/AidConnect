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
  Settings, TrendingUp, Building2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const adminNavItems = [
  { href: "/dashboard", label: "System Health", icon: LayoutDashboard, tooltip: "Metrics" },
  { href: "/dashboard/ngos", label: "Manage NGOs", icon: Building2, tooltip: "Verification Board" },
];

const ngoNavItems = [
  { href: "/dashboard", label: "Operations Map", icon: LayoutDashboard, tooltip: "Dashboard" },
  { href: "/dashboard/reports", label: "Field Reports", icon: FileText, tooltip: "AI Scanner" },
  { href: "/dashboard/needs", label: "Prioritized Needs", icon: Target, tooltip: "Target Tasks" },
  { href: "/dashboard/volunteers", label: "Volunteer Hub", icon: Users, tooltip: "Dispatch" },
  { href: "/dashboard/analytics", label: "Impact Analytics", icon: BarChart3, tooltip: "Analytics" },
  { href: "/dashboard/impact", label: "Impact Metrics", icon: TrendingUp, tooltip: "Metrics" },
];

const volunteerNavItems = [
  { href: "/dashboard/missions", label: "My Missions", icon: Target, tooltip: "Active Field Operations" },
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
