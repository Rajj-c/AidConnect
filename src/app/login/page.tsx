"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Mail, Lock, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { logIn, resetPassword } = useAuth();
  const router = useRouter();

  // --- Sign-in state ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false); // email not yet verified

  // --- Forgot-password state ---
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setLoading(true);
    try {
      const result = await logIn(email, password);
      if (result === "unverified") {
        // Redirect to verify-email — user is kept signed in so polling works
        router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        router.replace("/dashboard");
      }
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("user-not-found") || msg.includes("USER_NOT_FOUND")) {
        setResetError("No account found with that email address.");
      } else {
        setResetError("Failed to send reset email. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  }

  function openForgot() {
    setResetEmail(email); // pre-fill from sign-in form if typed
    setResetError("");
    setResetSuccess(false);
    setShowForgot(true);
  }

  function closeForgot() {
    setShowForgot(false);
    setResetSuccess(false);
    setResetError("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-background to-accent/10 px-4">
      {/* Decorative blobs */}
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

        {/* ── SIGN-IN CARD ─────────────────────────────────────── */}
        <div
          className="transition-all duration-500"
          style={{
            opacity: showForgot ? 0 : 1,
            transform: showForgot ? "translateY(-12px) scale(0.98)" : "translateY(0) scale(1)",
            pointerEvents: showForgot ? "none" : "auto",
            position: showForgot ? "absolute" : "relative",
            inset: showForgot ? 0 : "auto",
          }}
        >
          <Card className="border-none shadow-2xl shadow-primary/10">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-headline text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your AidConnect account</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@ngo.org"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      id="forgot-password-btn"
                      onClick={openForgot}
                      className="text-xs text-primary font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {unverified && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3 space-y-2">
                    <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                      <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        <strong>Email not verified.</strong> Please click the link we sent to{" "}
                        <span className="font-medium">{email}</span> before signing in.
                      </span>
                    </div>
                    <Link
                      href={`/verify-email?email=${encodeURIComponent(email)}`}
                      className="block text-center text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      Go to verification page →
                    </Link>
                  </div>
                )}

                <Button type="submit" className="w-full gap-2 h-11" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary font-semibold hover:underline">
                  Sign up
                </Link>
              </div>

              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground text-center">
                <strong>Demo roles:</strong> Admin, NGO, or Volunteer — use the role switcher after login.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── FORGOT PASSWORD CARD ──────────────────────────────── */}
        <div
          className="transition-all duration-500"
          style={{
            opacity: showForgot ? 1 : 0,
            transform: showForgot ? "translateY(0) scale(1)" : "translateY(12px) scale(0.98)",
            pointerEvents: showForgot ? "auto" : "none",
            position: showForgot ? "relative" : "absolute",
            inset: showForgot ? "auto" : 0,
          }}
        >
          <Card className="border-none shadow-2xl shadow-primary/10">
            <CardHeader className="pb-2">
              <button
                type="button"
                onClick={closeForgot}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors focus:outline-none"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </button>
              <CardTitle className="font-headline text-2xl">Reset password</CardTitle>
              <CardDescription>
                Enter your account email and we&apos;ll send you a reset link.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {resetSuccess ? (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="bg-emerald-100 dark:bg-emerald-900/40 rounded-full p-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Check your inbox!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      A password reset link has been sent to{" "}
                      <span className="font-medium text-foreground">{resetEmail}</span>.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={closeForgot}
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@ngo.org"
                        className="pl-10"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {resetError && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {resetError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    id="send-reset-btn"
                    className="w-full gap-2 h-11"
                    disabled={resetLoading}
                  >
                    {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    {resetLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 AidConnect Platform · Secure &amp; Encrypted
        </p>
      </div>
    </div>
  );
}
