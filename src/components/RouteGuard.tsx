"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";

// Define exactly which routes each role is allowed to visit
const ROLE_HOME: Record<string, string> = {
  Admin: "/dashboard",
  NGO: "/dashboard",
  Volunteer: "/dashboard/missions",
};

const ADMIN_ROUTES = [
  "/dashboard", "/dashboard/ngos", "/dashboard/analytics",
  "/dashboard/settings", "/seed", "/dashboard/admin"
];
const NGO_ROUTES = [
  "/dashboard", "/dashboard/tasks", "/dashboard/heatmap",
  "/dashboard/analytics", "/dashboard/settings",
  "/dashboard/my-volunteers", "/dashboard/leads",
];
const VOLUNTEER_ROUTES = [
  "/dashboard/missions", "/dashboard/available-tasks",
  "/dashboard/heatmap", "/dashboard/settings", "/dashboard/report"
];

function isAllowed(role: string | null, pathname: string): boolean {
  if (!role) return false;
  if (role === "Admin") return ADMIN_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"));
  if (role === "NGO") return NGO_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"));
  if (role === "Volunteer") return VOLUNTEER_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"));
  return false;
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, approvalStatus, userRole, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // No user → login
    if (!user) {
      router.replace("/login");
      return;
    }

    // Email not verified
    const emailVerified = auth?.currentUser?.emailVerified ?? user.emailVerified;
    if (!emailVerified && pathname !== "/verify-email") {
      router.replace(`/verify-email?email=${encodeURIComponent(user.email ?? "")}`);
      return;
    }

    // Onboarding incomplete — force to role-specific onboarding
    if (approvalStatus === "Incomplete") {
      if (userRole === "Volunteer" && pathname !== "/onboarding") {
        router.replace("/onboarding");
        return;
      }
      if (userRole === "NGO" && pathname !== "/ngo-onboarding") {
        router.replace("/ngo-onboarding");
        return;
      }
    }

    // Pending/Rejected — force to /status
    if (
      (approvalStatus === "Pending" || approvalStatus === "Rejected") &&
      pathname !== "/status"
    ) {
      router.replace("/status");
      return;
    }

    // Approved users accessing dashboard — enforce role-based routes
    if (pathname.startsWith("/dashboard") && approvalStatus === "Approved") {
      if (!isAllowed(userRole, pathname)) {
        router.replace(ROLE_HOME[userRole ?? ""] ?? "/dashboard");
        return;
      }
    }
  }, [user, approvalStatus, userRole, loading, router, pathname]);

  // ── Render guards (prevent flash of unauthorized content) ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const emailVerified = auth?.currentUser?.emailVerified ?? user.emailVerified;
  if (!emailVerified && pathname !== "/verify-email") return null;

  if (approvalStatus === "Incomplete") {
    if (userRole === "Volunteer" && pathname !== "/onboarding") return null;
    if (userRole === "NGO" && pathname !== "/ngo-onboarding") return null;
  }

  if ((approvalStatus === "Pending" || approvalStatus === "Rejected") && pathname !== "/status") return null;

  if (pathname.startsWith("/dashboard") && approvalStatus === "Approved") {
    if (!isAllowed(userRole, pathname)) return null;
  }

  return <>{children}</>;
}
