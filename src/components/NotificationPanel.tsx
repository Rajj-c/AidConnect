"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, CheckCheck, Megaphone, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  description: string;
  type: "alert" | "success" | "info";
  time: string;
  read: boolean;
}

const defaultNotifications: Notification[] = [
  { id: "1", title: "High Priority Need Detected", description: "Medical supplies urgently needed at Sector 4 children's clinic.", type: "alert", time: "2m ago", read: false },
  { id: "2", title: "Task Completed", description: "Food distribution in Kondapur marked complete by Rajesh Kumar.", type: "success", time: "15m ago", read: false },
  { id: "3", title: "AI Match Ready", description: "Dr. Ananya Sharma matched for Gachibowli medical task.", type: "info", time: "1h ago", read: false },
  { id: "4", title: "New Report Submitted", description: "Field report from Miyapur water contamination zone uploaded.", type: "alert", time: "2h ago", read: true },
  { id: "5", title: "Volunteer Joined", description: "Sarah Jenkins registered as a Support Specialist.", type: "info", time: "3h ago", read: true },
];

const typeConfig = {
  alert: { icon: Megaphone, color: "text-destructive", bg: "bg-destructive/10" },
  success: { icon: CheckCircle2, color: "text-accent", bg: "bg-accent/10" },
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
};

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>(defaultNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96 p-0 flex flex-col">
        <SheetHeader className="px-4 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-headline text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] h-5">{unreadCount} new</Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={markAllRead}>
                <CheckCheck className="h-3 w-3" /> Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const cfg = typeConfig[n.type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/40 transition-colors",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div className={cn("rounded-full p-1.5 shrink-0 mt-0.5", cfg.bg)}>
                      <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-sm font-semibold truncate", !n.read && "text-foreground")}>{n.title}</p>
                        {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.description}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1 uppercase tracking-wider">{n.time}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-3 bg-muted/30 text-xs text-center text-muted-foreground">
          Showing last {notifications.length} notifications
        </div>
      </SheetContent>
    </Sheet>
  );
}
