
import Link from "next/link";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarHeader,
  SidebarFooter, SidebarTrigger, SidebarInset
} from "@/components/ui/sidebar";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationPanel } from "@/components/NotificationPanel";
import { Input } from "@/components/ui/input";
import { Zap, Search } from "lucide-react";
import { DashboardNav, SettingsNav, EmergencyBanner } from "@/components/DashboardClientComponents";
import { RouteGuard } from "@/components/RouteGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full flex-col">
        <EmergencyBanner />

        <div className="flex flex-1 w-full">
          <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="p-4">
              <Link href="/" className="flex items-center gap-2 px-2">
                <div className="bg-primary rounded-lg p-1.5 shrink-0">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="font-headline font-bold text-xl text-primary group-data-[collapsible=icon]:hidden">
                  AidConnect
                </span>
              </Link>
            </SidebarHeader>

            <SidebarContent>
              <DashboardNav />
            </SidebarContent>

            <SidebarFooter className="p-4">
              <SettingsNav />
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex flex-col">
            <header className="h-16 border-b bg-white flex items-center justify-between px-4 sticky top-0 z-40">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="hidden md:flex items-center relative w-64 lg:w-96">
                  <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search reports, needs or volunteers..." className="pl-9 h-9" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <NotificationPanel />
                <RoleSwitcher />
              </div>
            </header>
            <main className="flex-1 p-4 lg:p-6 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
    </RouteGuard>
  );
}
