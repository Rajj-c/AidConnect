"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfile, getUserProfile, UserProfile } from "@/lib/firestore";

interface AuthContextValue {
  user: User | null;
  userRole: UserProfile["role"] | null;
  approvalStatus: UserProfile["approvalStatus"] | null;
  rejectionCount: number;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: UserProfile["role"]) => Promise<void>;
  logIn: (email: string, password: string) => Promise<"ok" | "unverified">;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  isFirebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserProfile["role"] | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<UserProfile["approvalStatus"] | null>(null);
  const [rejectionCount, setRejectionCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const isFirebaseConfigured = auth !== null;

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const { onAuthStateChanged } = require("firebase/auth");
    const unsub = onAuthStateChanged(auth, async (u: User | null) => {
      setUser(u);
      if (u) {
        const profile = await getUserProfile(u.uid);
        if (profile) {
          setUserRole(profile.role);
          setApprovalStatus(profile.approvalStatus || "Pending");
          setRejectionCount(profile.rejectionCount || 0);
        }
      } else {
        setUserRole(null);
        setApprovalStatus(null);
        setRejectionCount(0);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signUp(
    email: string,
    password: string,
    name: string,
    role: UserProfile["role"]
  ) {
    if (!auth) throw new Error("Firebase not configured");
    const { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } =
      await import("firebase/auth");

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    // Send verification email — user stays signed in so verify-email page can poll
    await sendEmailVerification(cred.user);

    // Save profile to Firestore — both NGO and Volunteer must complete onboarding
    const initialStatus = role === "Admin" ? "Approved" : "Incomplete";
    await createUserProfile(cred.user.uid, {
      email,
      name,
      role,
      approvalStatus: initialStatus,
      rejectionCount: 0,
    });

    // Keep user signed in — RouteGuard handles blocking unverified access
    setUser(cred.user);
    setUserRole(role);
    setApprovalStatus(initialStatus);
    setRejectionCount(0);
  }

  /**
   * Returns "ok" if login succeeds, "unverified" if email is not verified yet.
   * The user is kept signed in on "unverified" so the verify-email page can poll.
   */
  async function logIn(email: string, password: string): Promise<"ok" | "unverified"> {
    if (!auth) throw new Error("Firebase not configured");
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    const cred = await signInWithEmailAndPassword(auth, email, password);

    if (!cred.user.emailVerified) {
      // Stay signed in so verify-email page works — caller redirects there
      return "unverified";
    }
    return "ok";
  }

  async function logOut() {
    if (!auth) return;
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
    setUser(null);
  }

  async function resetPassword(email: string) {
    if (!auth) throw new Error("Firebase not configured");
    const { sendPasswordResetEmail } = await import("firebase/auth");
    await sendPasswordResetEmail(auth, email);
  }

  async function resendVerificationEmail() {
    if (!auth?.currentUser) throw new Error("No signed-in user");
    const { sendEmailVerification } = await import("firebase/auth");
    await sendEmailVerification(auth.currentUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        approvalStatus,
        rejectionCount,
        loading,
        signUp,
        logIn,
        logOut,
        resetPassword,
        resendVerificationEmail,
        isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
