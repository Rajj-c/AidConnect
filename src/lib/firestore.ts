import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  where,
  increment
} from "firebase/firestore";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid?: string;
  email: string;
  name: string;
  role: "Admin" | "NGO" | "Volunteer";
  approvalStatus: "Pending" | "Approved" | "Rejected";
  rejectionCount: number;
  createdAt: Timestamp | null;
}

export interface NeedDoc {
  id?: string;
  description: string;
  category: "Food" | "Health" | "Education" | "Shelter" | "Water" | "Other";
  priority: "High" | "Medium" | "Low";
  reasons: string;
  location: string;
  lat?: number;
  lng?: number;
  peopleAffected?: number;
  status: "Open" | "Assigned" | "Resolved";
  createdAt: Timestamp | null;
  createdBy: string;
}

export interface TaskDoc {
  id?: string;
  needId: string;
  title: string;
  assignedVolunteerId: string;
  assignedVolunteerName: string;
  status: "Pending" | "In Progress" | "Completed" | "Failed";
  priority: "High" | "Medium" | "Low";
  location: string;
  lat?: number;
  lng?: number;
  progress: number;
  eta?: string;
  createdAt: Timestamp | null;
  completedAt?: Timestamp | null;
  feedback?: {
    rating: number;
    success: boolean;
    note: string;
  };
}

export interface VolunteerDoc {
  id?: string;
  userId: string;
  name: string;
  role: string;
  skills: string[];
  location: string;
  availability: string;
  status: "Available" | "Busy";
  tasksCompleted: number;
  rating: number;
  distance?: string;
  lat?: number;
  lng?: number;
}

export interface NotificationDoc {
  id?: string;
  title: string;
  description: string;
  type: "alert" | "success" | "info";
  read: boolean;
  createdAt: Timestamp | null;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersCollection = () => collection(db!, "users");

export async function createUserProfile(uid: string, profile: Omit<UserProfile, "uid" | "createdAt">) {
  return setDoc(doc(db!, "users", uid), { ...profile, uid, createdAt: serverTimestamp() });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db!, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function updateUserApprovalStatus(uid: string, status: UserProfile["approvalStatus"], incrementRejection = false) {
  const updates: any = { approvalStatus: status };
  if (incrementRejection) {
    updates.rejectionCount = increment(1);
  }
  return updateDoc(doc(db!, "users", uid), updates);
}

export function subscribeToPendingUsers(callback: (users: UserProfile[]) => void) {
  const q = query(usersCollection(), where("approvalStatus", "==", "Pending"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile)));
  });
}

// ─── Needs ───────────────────────────────────────────────────────────────────

export const needsCollection = () => collection(db!, "needs");

export async function addNeed(need: Omit<NeedDoc, "id" | "createdAt">) {
  return addDoc(needsCollection(), { ...need, createdAt: serverTimestamp() });
}

export function subscribeToNeeds(callback: (needs: NeedDoc[]) => void, maxCount = 50) {
  const q = query(needsCollection(), orderBy("createdAt", "desc"), limit(maxCount));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as NeedDoc)));
  });
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const tasksCollection = () => collection(db!, "tasks");

export async function addTask(task: Omit<TaskDoc, "id" | "createdAt">) {
  return addDoc(tasksCollection(), { ...task, createdAt: serverTimestamp() });
}

export function subscribeToTasks(callback: (tasks: TaskDoc[]) => void, maxCount = 50) {
  const q = query(tasksCollection(), orderBy("createdAt", "desc"), limit(maxCount));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaskDoc)));
  });
}

export async function updateTaskStatus(taskId: string, status: TaskDoc["status"]) {
  return updateDoc(doc(db!, "tasks", taskId), { status });
}

export async function submitTaskFeedback(taskId: string, feedback: TaskDoc["feedback"]) {
  return updateDoc(doc(db!, "tasks", taskId), {
    feedback,
    status: feedback?.success ? "Completed" : "Failed",
    completedAt: serverTimestamp(),
  });
}

// ─── Volunteers ──────────────────────────────────────────────────────────────

export const volunteersCollection = () => collection(db!, "volunteers");

export function subscribeToVolunteers(callback: (volunteers: VolunteerDoc[]) => void, maxCount = 50) {
  const q = query(volunteersCollection(), orderBy("rating", "desc"), limit(maxCount));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as VolunteerDoc)));
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsCollection = () => collection(db!, "notifications");

export function subscribeToNotifications(callback: (notifs: NotificationDoc[]) => void, maxCount = 20) {
  const q = query(notificationsCollection(), orderBy("createdAt", "desc"), limit(maxCount));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationDoc)));
  });
}

export async function markNotificationRead(notifId: string) {
  return updateDoc(doc(db!, "notifications", notifId), { read: true });
}

export async function addNotification(notif: Omit<NotificationDoc, "id" | "createdAt">) {
  return addDoc(notificationsCollection(), { ...notif, createdAt: serverTimestamp() });
}
