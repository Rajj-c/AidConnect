"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Mail, RefreshCw, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RESEND_COOLDOWN = 60; // seconds

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const { resendVerificationEmail } = useAuth();

  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState("");
  const [dots, setDots] = useState(".");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animated waiting dots
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 600);
    return () => clearInterval(id);
  }, []);

  const checkVerification = useCallback(async (): Promise<boolean> => {
    const currentUser = auth?.currentUser;
    if (!currentUser) return false;
    // Force a fresh token/profile reload from Firebase servers
    await currentUser.reload();
    return currentUser.emailVerified;
  }, []);

  const handleVerified = useCallback(() => {
    setVerified(true);
    if (pollRef.current) clearInterval(pollRef.current);
    // Short delay so the success animation is visible, then go to login
    setTimeout(() => router.replace("/login"), 2500);
  }, [router]);

  // Auto-poll every 5 seconds
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      const isVerified = await checkVerification();
      if (isVerified) handleVerified();
    }, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [checkVerification, handleVerified]);

  // Also check immediately on mount (handles the case where the user clicked
  // the verification link and was redirected back to this page)
  useEffect(() => {
    checkVerification().then((isVerified) => {
      if (isVerified) handleVerified();
    });
  }, [checkVerification, handleVerified]);

  async function handleCheckNow() {
    setChecking(true);
    try {
      const isVerified = await checkVerification();
      if (isVerified) {
        handleVerified();
      }
    } finally {
      setChecking(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setResendError("");
    setResendDone(false);
    try {
      await resendVerificationEmail();
      setResendDone(true);
      // Start cooldown
      setResendCooldown(RESEND_COOLDOWN);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      cooldownRef.current = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch {
      setResendError("Failed to resend. Please wait a moment and try again.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-background to-accent/10 px-4">
      {/* Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-primary rounded-xl p-2.5 shadow-lg shadow-primary/30">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="font-headline font-bold text-2xl text-primary">AidConnect</span>
        </div>

        <Card className="border-none shadow-2xl shadow-primary/10 overflow-hidden">
          {/* Animated top bar */}
          <div
            className={`h-1.5 w-full transition-colors duration-700 ${
              verified ? "bg-emerald-500" : "bg-primary animate-pulse"
            }`}
          />

          <CardHeader className="text-center pb-2 pt-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div
                className={`relative rounded-full p-5 transition-colors duration-700 ${
                  verified ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-primary/10"
                }`}
              >
                {verified ? (
                  <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75 duration-500" />
                ) : (
                  <>
                    <Mail className="h-10 w-10 text-primary" />
                    <span className="absolute inset-0 rounded-full ring-2 ring-primary/30 animate-ping" />
                  </>
                )}
              </div>
            </div>

            <CardTitle className="font-headline text-2xl">
              {verified ? "Email Verified! 🎉" : "Verify your email"}
            </CardTitle>
            <CardDescription className="mt-1">
              {verified ? (
                "Taking you to sign in…"
              ) : (
                <>
                  We sent a link to{" "}
                  <span className="font-semibold text-foreground">
                    {email || "your email"}
                  </span>
                  .<br />
                  Click the link in the email to continue.
                </>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-6 space-y-4">
            {!verified && (
              <>
                {/* Waiting indicator */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-1">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Checking automatically{dots}</span>
                </div>

                {/* Manual check */}
                <Button
                  id="check-verification-btn"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleCheckNow}
                  disabled={checking}
                >
                  {checking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {checking ? "Checking…" : "I've verified — check now"}
                </Button>

                {/* Resend */}
                <div className="text-center space-y-1">
                  {resendDone && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      ✓ Verification email resent successfully!
                    </p>
                  )}
                  {resendError && (
                    <p className="text-xs text-destructive">{resendError}</p>
                  )}
                  <button
                    type="button"
                    id="resend-verification-btn"
                    onClick={handleResend}
                    disabled={resendLoading || resendCooldown > 0 || !auth?.currentUser}
                    className="text-xs text-primary font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  >
                    {resendLoading
                      ? "Sending…"
                      : resendCooldown > 0
                      ? `Resend available in ${resendCooldown}s`
                      : "Didn't receive it? Resend email"}
                  </button>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    Check your <strong>spam / junk</strong> folder too.
                    The link expires in <strong>24 hours</strong>.
                  </p>
                  <div className="text-center">
                    <Link
                      href="/signup"
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to sign up with a different email
                    </Link>
                  </div>
                </div>
              </>
            )}

            {verified && (
              <div className="text-center space-y-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                <p className="text-xs text-muted-foreground">Redirecting to login…</p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 AidConnect Platform · Secure &amp; Encrypted
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
