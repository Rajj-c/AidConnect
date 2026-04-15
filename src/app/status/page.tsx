"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Hourglass, LogOut, RotateCcw, AlertTriangle } from "lucide-react";
import { updateUserApprovalStatus } from "@/lib/firestore";
import { toast } from "@/hooks/use-toast";

export default function StatusPage() {
  const { user, approvalStatus, rejectionCount, logOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If they get approved while on this page
    if (approvalStatus === "Approved") {
      router.replace("/dashboard");
    }
  }, [approvalStatus, router]);

  if (approvalStatus !== "Pending" && approvalStatus !== "Rejected") {
    return null; 
  }

  async function handleReapply() {
    if (!user) return;
    setLoading(true);
    try {
      // Re-apply by setting status back to Pending, and incrementing their rejection count
      await updateUserApprovalStatus(user.uid, "Pending", true);
      toast({ title: "Application Re-submitted ✓", description: "Your profile is back in the review queue." });
    } catch {
      toast({ title: "Error Re-applying", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const isRejected = approvalStatus === "Rejected";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <Card className="max-w-md w-full shadow-lg border-none text-center">
        <CardHeader className="pb-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isRejected ? 'bg-destructive/10' : 'bg-primary/10'}`}>
            {isRejected ? (
              <ShieldAlert className="h-8 w-8 text-destructive" />
            ) : (
              <Hourglass className="h-8 w-8 text-primary animate-pulse" />
            )}
          </div>
          <CardTitle className="text-2xl font-headline">
            {isRejected ? "Application Rejected" : "Application Under Review"}
          </CardTitle>
          <CardDescription className="text-sm mt-2">
            {isRejected 
              ? "Your profile could not be verified by our administrative team at this time."
              : "Thank you for joining AidConnect! Our administrators are quickly verifying your profile to ensure ecosystem security. You will be granted access shortly."}
          </CardDescription>
        </CardHeader>

        {isRejected && (
          <CardContent>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm text-left flex gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Notice of Rejections: {rejectionCount}</p>
                <p>You have been rejected {rejectionCount} time{rejectionCount !== 1 ? 's' : ''}. Before re-applying, please ensure your registration email and name correspond accurately to an authentic volunteer or NGO profile.</p>
              </div>
            </div>
          </CardContent>
        )}

        <CardFooter className="flex flex-col gap-3 pt-2">
          {isRejected && (
            <Button className="w-full gap-2" variant="default" onClick={handleReapply} disabled={loading}>
              <RotateCcw className="h-4 w-4" /> 
              {loading ? "Submitting..." : "Re-apply for Verification"}
            </Button>
          )}
          <Button variant="outline" className="w-full gap-2 text-muted-foreground" onClick={logOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
