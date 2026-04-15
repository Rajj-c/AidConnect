
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle } from "lucide-react";

export type UserRole = "Admin" | "NGO" | "Volunteer";

export function RoleSwitcher() {
  const [role, setRole] = useState<UserRole>("NGO");

  // In a real app, this would update a context or session
  useEffect(() => {
    localStorage.setItem("userRole", role);
  }, [role]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCircle className="h-4 w-4" />
          <span>{role}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Switch Role (Demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(["Admin", "NGO", "Volunteer"] as UserRole[]).map((r) => (
          <DropdownMenuItem key={r} onClick={() => setRole(r)}>
            {r}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
