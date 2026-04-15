"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, approvalStatus, userRole, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    
    // If not logged in, let the other logic (if any) handle it, or force login
    if (!user) {
      router.replace("/login");
      return;
    }

    // Guard /dashboard routes
    if (pathname.startsWith("/dashboard")) {
      // 1. Pending/Rejected Gateway
      if (approvalStatus === "Pending" || approvalStatus === "Rejected") {
        router.replace("/status");
        return;
      }
      
      // 2. Strict Role-Based Restrictions
      if (userRole === "Volunteer" && pathname !== "/dashboard/missions" && pathname !== "/dashboard/settings") {
        router.replace("/dashboard/missions");
        return;
      }
      
      if (userRole === "NGO" && (pathname === "/dashboard/ngos" || pathname === "/dashboard/missions")) {
        router.replace("/dashboard");
        return;
      }

      if (userRole === "Admin" && pathname !== "/dashboard" && pathname !== "/dashboard/ngos" && pathname !== "/dashboard/settings") {
        router.replace("/dashboard");
        return;
      }
    }
  }, [user, approvalStatus, userRole, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  // Prevent flash of unauthorized content before redirect fires
  if (pathname.startsWith("/dashboard")) {
    if (approvalStatus === "Pending" || approvalStatus === "Rejected") return null;
    if (userRole === "Volunteer" && pathname !== "/dashboard/missions" && pathname !== "/dashboard/settings") return null;
    if (userRole === "NGO" && (pathname === "/dashboard/ngos" || pathname === "/dashboard/missions")) return null;
    if (userRole === "Admin" && pathname !== "/dashboard" && pathname !== "/dashboard/ngos" && pathname !== "/dashboard/settings") return null;
  }

  return <>{children}</>;
}
