"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToPendingUsers, updateUserApprovalStatus, UserProfile } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, XCircle, ShieldAlert, Loader2, RefreshCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function AdminManageUsersPage() {
  const { userRole } = useAuth();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (userRole === "Volunteer" || userRole === "NGO") {
      router.replace("/dashboard");
    }
  }, [userRole, router]);

  useEffect(() => {
    if (userRole !== "Admin") return;
    const unsub = subscribeToPendingUsers(setPendingUsers);
    return () => unsub();
  }, [userRole]);

  if (userRole !== "Admin") return null;

  async function handleDecision(userTarget: UserProfile, isApproved: boolean) {
    if (!userTarget.uid) return;
    setProcessingId(userTarget.uid);
    try {
      const newStatus = isApproved ? "Approved" : "Rejected";
      
      // Update UserProfile status
      await updateUserApprovalStatus(userTarget.uid, newStatus);
      
      // If approved and is a Volunteer, initialize their VolunteerDoc
      if (isApproved && userTarget.role === "Volunteer") {
        await setDoc(doc(db!, "volunteers", userTarget.uid), {
          userId: userTarget.uid,
          name: userTarget.name,
          role: "General Support", // Default role
          skills: ["General"],
          location: "Location TBD",
          availability: "Flexible",
          status: "Available",
          tasksCompleted: 0,
          rating: 5.0
        });
      }

      toast({ 
        title: `User ${newStatus}`, 
        description: `${userTarget.name} has been ${isApproved ? "granted access" : "rejected"}.` 
      });
    } catch {
      toast({ title: "Error", description: "Failed to update user status.", variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-primary" /> User Verification Console
        </h1>
        <p className="text-muted-foreground mt-1">Review and approve pending NGO and Volunteer applications.</p>
      </div>

      {pendingUsers.length === 0 ? (
        <Card className="border-none shadow-sm bg-gray-50/50 py-12 text-center">
          <CardContent>
            <CheckCircle2 className="h-12 w-12 text-green-500/50 mx-auto mb-4" />
            <h3 className="text-lg font-bold">Queue is Empty</h3>
            <p className="text-sm text-muted-foreground">There are no pending registrations waiting for approval.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingUsers.map(u => (
            <Card key={u.uid} className="border-none shadow-md overflow-hidden flex flex-col">
              <div className={`h-1.5 w-full ${u.role === "NGO" ? "bg-primary" : "bg-accent"}`} />
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <Avatar className="h-10 w-10 border-2 border-muted">
                    <AvatarFallback className="font-bold text-primary">{u.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Badge variant={u.role === "NGO" ? "default" : "secondary"}>
                    {u.role} Account
                  </Badge>
                </div>
                
                <div className="space-y-1 mb-6 flex-1">
                  <h3 className="font-bold text-lg leading-tight truncate" title={u.name}>{u.name}</h3>
                  <p className="text-sm text-muted-foreground truncate" title={u.email}>{u.email}</p>
                  {u.rejectionCount > 0 && (
                     <Badge variant="destructive" className="mt-2 text-[10px] bg-red-100 text-red-800 border-none hover:bg-red-100">
                       <RefreshCcw className="h-3 w-3 mr-1" /> Re-applied ({u.rejectionCount} prior rejections)
                     </Badge>
                  )}
                </div>

                <div className="flex gap-2 mt-auto">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={processingId === u.uid}
                    onClick={() => handleDecision(u, false)}
                  >
                    {processingId === u.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />} Reject
                  </Button>
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={processingId === u.uid}
                    onClick={() => handleDecision(u, true)}
                  >
                    {processingId === u.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />} Approve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
