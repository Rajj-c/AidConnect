"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("NGO");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (role === "Admin" && adminCode !== "AIDCONNECT_ADMIN_2026") {
      setError("Invalid Admin Invitation Code. Please contact the developer.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signUp(email, password, name, role as any);
      // Account created — user is signed out, redirect to verify-email page
      router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : (err?.message || "Registration failed.");
      if (msg.includes("email-already-in-use")) {
        setError("This email is already registered. Please log in instead.");
      } else if (msg.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(`Registration failed: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-background to-accent/10 px-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-primary rounded-xl p-2.5 shadow-lg shadow-primary/30">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="font-headline font-bold text-2xl text-primary">AidConnect</span>
        </div>

        <Card className="border-none shadow-2xl shadow-primary/10">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-headline text-2xl">Create your account</CardTitle>
            <CardDescription>Join the network making social work smarter</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="Your name" className="pl-10" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="NGO">NGO Coordinator</SelectItem>
                    <SelectItem value="Volunteer">Volunteer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {role === "Admin" && (
                <div className="space-y-2 animate-in fade-in zoom-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="adminCode">Admin Invitation Code</Label>
                    <span className="text-[10px] text-primary/70 font-bold uppercase tracking-wider">Required for Admins</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input 
                      id="adminCode" 
                      placeholder="Enter the developer code" 
                      className="pl-10 border-primary/40 focus-visible:ring-primary/40 text-primary font-semibold" 
                      value={adminCode} 
                      onChange={(e) => setAdminCode(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@ngo.org" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="Min. 6 characters" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </div>
              )}

              <Button type="submit" className="w-full gap-2 h-11" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 AidConnect Platform · Secure & Encrypted
        </p>
      </div>
    </div>
  );
}
