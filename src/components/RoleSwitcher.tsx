"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, LogOut, ShieldCheck, Users, Building2 } from "lucide-react";

const ROLE_CONFIG = {
  Admin: { icon: ShieldCheck, color: "text-primary", bg: "bg-primary/10" },
  NGO: { icon: Building2, color: "text-accent-foreground", bg: "bg-accent/20" },
  Volunteer: { icon: Users, color: "text-green-700", bg: "bg-green-50" },
} as const;

export function RoleSwitcher() {
  const { userRole, user, logOut } = useAuth();

  if (!userRole || !user) return null;

  const config = ROLE_CONFIG[userRole] ?? { icon: UserCircle, color: "text-muted-foreground", bg: "bg-muted" };
  const RoleIcon = config.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 border-transparent ${config.bg} ${config.color} font-semibold hover:opacity-80`}
        >
          <RoleIcon className="h-4 w-4" />
          <span>{userRole}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold text-sm">{user.displayName || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <p className={`text-xs font-bold uppercase tracking-wide mt-1 ${config.color}`}>{userRole}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive focus:bg-destructive/10 gap-2"
          onClick={() => logOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
