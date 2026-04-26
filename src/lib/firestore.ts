import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  where,
  increment,
  collectionGroup,
} from "firebase/firestore";

// ─── User ──────────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid?: string;
  email: string;
  name: string;
  role: "Admin" | "NGO" | "Volunteer";
  approvalStatus: "Incomplete" | "Pending" | "Approved" | "Rejected";
  rejectionCount: number;
  createdAt: Timestamp | null;
  ngoId?: string;
  approved?: boolean;
}

// ─── NGO ──────────────────────────────────────────────────────────────────────

export interface NGOProfile {
  uid: string;
  orgName: string;
  orgType: "Trust" | "Society" | "Section8" | "INGO" | "Government" | "Other";
  yearEstablished: string;
  missionStatement: string;
  registrationNumber: string;
  panNumber: string;
  ngo12AStatus: boolean;
  ngo80GStatus: boolean;
  fcraRegistered: boolean;
  ngoDarpanId: string;
  officialAddress: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  website: string;
  focusAreas: string[];
  geographicScope: "Local" | "State" | "National" | "International";
  operationalStates: string[];
  activeVolunteers: string;
  annualBudgetRange: string;
  providesAccommodation: boolean;
  hasVehicles: boolean;
  hasMedicalFacilities: boolean;
  languagesSupported: string[];
  createdAt?: Timestamp | null;
}

// ─── Volunteer ────────────────────────────────────────────────────────────────

export interface VolunteerDoc {
  id?: string;
  userId: string;
  name: string;
  role: string;
  gender?: "male" | "female" | "other";
  skills: string[];
  languages?: string[];
  phone?: string;
  location: string;
  availability: string;
  bio?: string;
  status: "Available" | "Busy";
  tasksCompleted: number;
  rating: number;
  distance?: string;
  lat?: number;
  lng?: number;
  // Set by Admin
  ngoId?: string;
  ngoName?: string;
  assignedAt?: Timestamp | null;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export type TaskType = "Collection" | "Distribution" | "Service";

export type TaskStatus =
  | "Open"
  | "Assigned"
  | "In Progress"
  | "Completed"
  | "Verified";

export interface TaskDoc {
  id?: string;
  ngoId: string;
  ngoName: string;
  title: string;
  description: string;
  taskType: TaskType;
  category: "Food" | "Health" | "Education" | "Shelter" | "Water" | "Other";
  skillsRequired: string[];
  location: string;
  lat?: number;
  lng?: number;
  priority: "High" | "Medium" | "Low";
  deadline?: Timestamp | null;
  status: TaskStatus;
  // Volunteer assignment
  assignedVolunteerId?: string;
  assignedVolunteerName?: string;
  // Auto-computed from field entries
  fieldSummary?: {
    totalEntries: number;
    totalItems: number;
    totalBeneficiaries: number;
    lastUpdated: Timestamp | null;
  };
  // Final proof (on completion)
  feedback?: {
    rating: number;
    success: boolean;
    note: string;
    imageUrl?: string;
  };
  createdAt: Timestamp | null;
  completedAt?: Timestamp | null;
}

// ─── Field Entries (subcollection under tasks) ────────────────────────────────

export type ItemType = "Clothes" | "Food" | "Medicine" | "Books" | "Other";
export type ServiceType =
  | "Medical Consultation"
  | "Teaching Session"
  | "Counselling"
  | "Skills Training"
  | "Other";

/** Collection task entry — one per donor */
export interface CollectionEntry {
  id?: string;
  entryType: "Collection";
  donorName: string;
  donorPhone?: string;
  donorAddress?: string;
  itemType: ItemType;
  quantity: number;
  beneficiaryCount: number;
  condition?: "Good" | "Fair";
  notes?: string;
  photo?: string;
  loggedBy: string;
  loggedByName: string;
  loggedAt: Timestamp | null;
}

/** Distribution task entry — one per recipient/batch */
export interface DistributionEntry {
  id?: string;
  entryType: "Distribution";
  recipientName: string;
  recipientArea?: string;
  itemType: ItemType;
  quantityGiven: number;
  beneficiaryCount: number;
  notes?: string;
  photo?: string;
  loggedBy: string;
  loggedByName: string;
  loggedAt: Timestamp | null;
}

/** Service task entry — one per session/venue */
export interface ServiceEntry {
  id?: string;
  entryType: "Service";
  venue: string;
  serviceType: ServiceType;
  peopleServedCount: number;
  durationMinutes?: number;
  notes?: string;
  photo?: string;
  loggedBy: string;
  loggedByName: string;
  loggedAt: Timestamp | null;
}

export type FieldEntry = CollectionEntry | DistributionEntry | ServiceEntry;

// ─── Messaging (subcollection under tasks) ────────────────────────────────────

export interface TaskMessage {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole: "NGO" | "Volunteer" | "Admin";
  text: string;
  timestamp: Timestamp | null;
  read: boolean;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationDoc {
  id?: string;
  title: string;
  description: string;
  type: "alert" | "success" | "info";
  read: boolean;
  createdAt: Timestamp | null;
}

// ─── Legacy (kept for backward compat with older pages) ──────────────────────

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

// ═══════════════════════════════════════════════════════════════════════════════
// Collection helpers
// ═══════════════════════════════════════════════════════════════════════════════

const usersRef = () => collection(db!, "users");
const ngosRef = () => collection(db!, "ngos");
const volunteersRef = () => collection(db!, "volunteers");
const tasksRef = () => collection(db!, "tasks");
const needsRef = () => collection(db!, "needs");
const notificationsRef = () => collection(db!, "notifications");
const fieldEntriesRef = (taskId: string) =>
  collection(db!, "tasks", taskId, "fieldEntries");
const messagesRef = (taskId: string) =>
  collection(db!, "tasks", taskId, "messages");

// ═══════════════════════════════════════════════════════════════════════════════
// Users
// ═══════════════════════════════════════════════════════════════════════════════

export const usersCollection = usersRef;

export async function createUserProfile(
  uid: string,
  profile: Omit<UserProfile, "uid" | "createdAt">
) {
  return setDoc(doc(db!, "users", uid), {
    ...profile,
    uid,
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db!, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function updateUserApprovalStatus(
  uid: string,
  status: UserProfile["approvalStatus"],
  incrementRejection = false
) {
  const updates: Record<string, unknown> = { approvalStatus: status };
  if (incrementRejection) updates.rejectionCount = increment(1);
  return updateDoc(doc(db!, "users", uid), updates);
}

export function subscribeToPendingUsers(
  callback: (users: UserProfile[]) => void
) {
  // We fetch all users and filter client-side to avoid requiring complex composite indexes in Firebase
  return onSnapshot(usersRef(), (snap) => {
    const allUsers = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
    
    const pendingUsers = allUsers.filter(u => {
      // Show NGOs/users explicitly marked as Pending
      if (u.approvalStatus === "Pending") return true;
      
      // Show Volunteers who lack an NGO assignment
      if (u.role === "Volunteer" && !u.ngoId) return true;

      return false;
    });

    callback(pendingUsers);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// NGOs
// ═══════════════════════════════════════════════════════════════════════════════

export async function createNGOProfile(
  uid: string,
  data: Omit<NGOProfile, "uid" | "createdAt">
) {
  await setDoc(doc(db!, "ngos", uid), {
    ...data,
    uid,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToApprovedNGOs(
  callback: (ngos: NGOProfile[]) => void
) {
  return onSnapshot(ngosRef(), (snap) => {
    callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as NGOProfile)));
  });
}

export async function getNGOProfile(uid: string): Promise<NGOProfile | null> {
  const snap = await getDoc(doc(db!, "ngos", uid));
  if (!snap.exists()) return null;
  return snap.data() as NGOProfile;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Volunteers
// ═══════════════════════════════════════════════════════════════════════════════

export const volunteersCollection = volunteersRef;

export async function createVolunteerProfile(
  uid: string,
  data: Omit<
    VolunteerDoc,
    "id" | "userId" | "tasksCompleted" | "rating" | "status" | "role"
  >
) {
  await setDoc(doc(db!, "volunteers", uid), {
    ...data,
    userId: uid,
    role: "General Support",
    status: "Available",
    tasksCompleted: 0,
    rating: 5,
  });
}

/** All volunteers (Admin use) */
export function subscribeToVolunteers(
  callback: (volunteers: VolunteerDoc[]) => void,
  maxCount = 100
) {
  const q = query(volunteersRef(), orderBy("rating", "desc"), limit(maxCount));
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() } as VolunteerDoc))
    );
  });
}

/** Volunteers belonging to a specific NGO */
export function subscribeToVolunteersByNGO(
  ngoId: string,
  callback: (volunteers: VolunteerDoc[]) => void
) {
  const q = query(volunteersRef(), where("ngoId", "==", ngoId));
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() } as VolunteerDoc))
    );
  });
}

/** Admin assigns a volunteer to an NGO */
export async function assignVolunteerToNGO(
  volunteerId: string,
  ngoId: string,
  ngoName: string
) {
  await updateDoc(doc(db!, "volunteers", volunteerId), {
    ngoId,
    ngoName,
    assignedAt: serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tasks
// ═══════════════════════════════════════════════════════════════════════════════

export const tasksCollection = tasksRef;

/** Create a new task (NGO) */
export async function createTask(
  task: Omit<TaskDoc, "id" | "createdAt" | "fieldSummary">
) {
  return addDoc(tasksRef(), {
    ...task,
    createdAt: serverTimestamp(),
    fieldSummary: {
      totalEntries: 0,
      totalItems: 0,
      totalBeneficiaries: 0,
      lastUpdated: null,
    },
  });
}

/** All tasks for a specific NGO */
export function subscribeToTasksByNGO(
  ngoId: string,
  callback: (tasks: TaskDoc[]) => void
) {
  const q = query(
    tasksRef(),
    where("ngoId", "==", ngoId)
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaskDoc));
    data.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return timeB - timeA;
    });
    callback(data);
  });
}

/** Open tasks for a specific NGO (for volunteer to browse & self-assign) */
export function subscribeToOpenTasksByNGO(
  ngoId: string,
  callback: (tasks: TaskDoc[]) => void
) {
  const q = query(
    tasksRef(),
    where("ngoId", "==", ngoId),
    where("status", "==", "Open")
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaskDoc));
    data.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return timeB - timeA;
    });
    callback(data);
  });
}

/** Tasks assigned to a specific volunteer (volunteer's missions) */
export function subscribeToMyTasks(
  volunteerId: string,
  callback: (tasks: TaskDoc[]) => void
) {
  const q = query(
    tasksRef(),
    where("assignedVolunteerId", "==", volunteerId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaskDoc)));
  });
}

/** All tasks globally (Admin use) */
export function subscribeToTasks(
  callback: (tasks: TaskDoc[]) => void,
  maxCount = 100
) {
  const q = query(tasksRef(), orderBy("createdAt", "desc"), limit(maxCount));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaskDoc)));
  });
}

/** Volunteer self-assigns an open task */
export async function selfAssignTask(
  taskId: string,
  volunteerId: string,
  volunteerName: string
) {
  await updateDoc(doc(db!, "tasks", taskId), {
    status: "Assigned",
    assignedVolunteerId: volunteerId,
    assignedVolunteerName: volunteerName,
  });
  // Mark volunteer as Busy
  await updateDoc(doc(db!, "volunteers", volunteerId), { status: "Busy" });
}

/** NGO directly assigns a task to a volunteer */
export async function assignTaskToVolunteer(
  taskId: string,
  volunteerId: string,
  volunteerName: string
) {
  await updateDoc(doc(db!, "tasks", taskId), {
    status: "Assigned",
    assignedVolunteerId: volunteerId,
    assignedVolunteerName: volunteerName,
  });
  await updateDoc(doc(db!, "volunteers", volunteerId), { status: "Busy" });
}

/** Update task status */
export async function updateTaskStatus(
  taskId: string,
  status: TaskDoc["status"]
) {
  return updateDoc(doc(db!, "tasks", taskId), { status });
}

/** Volunteer submits final proof & marks completed */
export async function submitTaskFeedback(
  taskId: string,
  feedback: TaskDoc["feedback"]
) {
  return updateDoc(doc(db!, "tasks", taskId), {
    feedback,
    status: feedback?.success ? "Completed" : "In Progress",
    completedAt: serverTimestamp(),
  });
}

/** NGO verifies a completed task */
export async function verifyTask(taskId: string, volunteerId: string) {
  await updateDoc(doc(db!, "tasks", taskId), { status: "Verified" });
  const volRef = doc(db!, "volunteers", volunteerId);
  const volSnap = await getDoc(volRef);
  if (volSnap.exists()) {
    await updateDoc(volRef, {
      tasksCompleted: increment(1),
      status: "Available", // Free up the volunteer
    });
  }
}

/** NGO manually marks a task as Completed (even if volunteer hasn't reported yet) */
export async function markTaskCompleted(taskId: string, volunteerId?: string) {
  await updateDoc(doc(db!, "tasks", taskId), { status: "Completed", completedByNGO: true });
  if (volunteerId) {
    const volRef = doc(db!, "volunteers", volunteerId);
    const volSnap = await getDoc(volRef);
    if (volSnap.exists()) {
      await updateDoc(volRef, { status: "Available" });
    }
  }
}

/** NGO permanently deletes a task and frees up any assigned volunteer */
export async function deleteTask(taskId: string, volunteerId?: string) {
  await deleteDoc(doc(db!, "tasks", taskId));
  if (volunteerId) {
    const volRef = doc(db!, "volunteers", volunteerId);
    const volSnap = await getDoc(volRef);
    if (volSnap.exists() && volSnap.data()?.status === "Busy") {
      await updateDoc(volRef, { status: "Available" });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Field Entries (subcollection: tasks/{taskId}/fieldEntries)
// ═══════════════════════════════════════════════════════════════════════════════

/** Add a field entry and update the task's fieldSummary */
export async function addFieldEntry(taskId: string, entry: Omit<FieldEntry, "id">) {
  // Add the entry document
  await addDoc(fieldEntriesRef(taskId), {
    ...entry,
    loggedAt: serverTimestamp(),
  });

  // Update the task's summary counts
  const summaryUpdate: Record<string, unknown> = {
    "fieldSummary.totalEntries": increment(1),
    "fieldSummary.lastUpdated": serverTimestamp(),
  };

  if (entry.entryType === "Collection") {
    const col = entry as CollectionEntry;
    summaryUpdate["fieldSummary.totalItems"] = increment(col.quantity);
    summaryUpdate["fieldSummary.totalBeneficiaries"] = increment(col.beneficiaryCount);
  } else if (entry.entryType === "Distribution") {
    const dis = entry as DistributionEntry;
    summaryUpdate["fieldSummary.totalItems"] = increment(dis.quantityGiven);
    summaryUpdate["fieldSummary.totalBeneficiaries"] = increment(dis.beneficiaryCount);
  } else if (entry.entryType === "Service") {
    const svc = entry as ServiceEntry;
    summaryUpdate["fieldSummary.totalBeneficiaries"] = increment(svc.peopleServedCount);
  }

  await updateDoc(doc(db!, "tasks", taskId), summaryUpdate);
}

/** Subscribe to all field entries for a task */
export function subscribeToFieldEntries(
  taskId: string,
  callback: (entries: FieldEntry[]) => void
) {
  const q = query(fieldEntriesRef(taskId), orderBy("loggedAt", "asc"));
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() } as FieldEntry))
    );
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Messaging (subcollection: tasks/{taskId}/messages)
// ═══════════════════════════════════════════════════════════════════════════════

/** Send a message in a task thread */
export async function sendTaskMessage(
  taskId: string,
  message: Omit<TaskMessage, "id" | "timestamp">
) {
  return addDoc(messagesRef(taskId), {
    ...message,
    timestamp: serverTimestamp(),
    read: false,
  });
}

/** Subscribe to real-time messages for a task */
export function subscribeToTaskMessages(
  taskId: string,
  callback: (messages: TaskMessage[]) => void
) {
  const q = query(messagesRef(taskId), orderBy("timestamp", "asc"));
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() } as TaskMessage))
    );
  });
}

/** Count unread messages for a given task (from the other party's perspective) */
export function subscribeToUnreadCount(
  taskId: string,
  currentUserId: string,
  callback: (count: number) => void
) {
  const q = query(
    messagesRef(taskId),
    where("senderId", "!=", currentUserId),
    where("read", "==", false)
  );
  return onSnapshot(q, (snap) => callback(snap.size));
}

// ─── Direct Messaging (NGO ↔ Volunteer) ────────────────────────────────────────

export interface DirectMessage {
  id?: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp | null;
}

const directMessagesRef = (ngoId: string, volunteerId: string) =>
  collection(db!, "chats", `${ngoId}_${volunteerId}`, "messages");

export async function sendDirectMessage(
  ngoId: string,
  volunteerId: string,
  senderId: string,
  senderName: string,
  text: string
) {
  return addDoc(directMessagesRef(ngoId, volunteerId), {
    senderId,
    senderName,
    text,
    timestamp: serverTimestamp(),
  });
}

export function subscribeToDirectMessages(
  ngoId: string,
  volunteerId: string,
  callback: (messages: DirectMessage[]) => void
) {
  const q = query(directMessagesRef(ngoId, volunteerId), orderBy("timestamp", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DirectMessage)));
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Notifications
// ═══════════════════════════════════════════════════════════════════════════════

export const notificationsCollection = notificationsRef;

export function subscribeToNotifications(
  callback: (notifs: NotificationDoc[]) => void,
  maxCount = 20
) {
  const q = query(
    notificationsRef(),
    orderBy("createdAt", "desc"),
    limit(maxCount)
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationDoc))
    );
  });
}

export async function markNotificationRead(notifId: string) {
  return updateDoc(doc(db!, "notifications", notifId), { read: true });
}

export async function addNotification(
  notif: Omit<NotificationDoc, "id" | "createdAt">
) {
  return addDoc(notificationsRef(), {
    ...notif,
    createdAt: serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Needs (legacy — keep for backward compat)
// ═══════════════════════════════════════════════════════════════════════════════

export const needsCollection = needsRef;

export async function addNeed(need: Omit<NeedDoc, "id" | "createdAt">) {
  return addDoc(needsRef(), { ...need, createdAt: serverTimestamp() });
}

export function subscribeToNeeds(
  callback: (needs: NeedDoc[]) => void,
  maxCount = 50
) {
  const q = query(needsRef(), orderBy("createdAt", "desc"), limit(maxCount));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as NeedDoc)));
  });
}

/** @deprecated Use createTask() instead. Kept for legacy pages. */
export async function addTask(task: Omit<TaskDoc, "id" | "createdAt" | "fieldSummary">) {
  return createTask(task);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Community Intelligence — Donation Leads & Need Reports
// ═══════════════════════════════════════════════════════════════════════════════

export type LeadStatus = "New" | "Reviewed" | "TaskCreated" | "Rejected";

/** A volunteer reports that someone in the community wants to donate */
export interface DonationLead {
  id?: string;
  ngoId: string;
  reportedBy: string;
  reportedByName: string;
  donorName: string;
  donorPhone?: string;
  donorAddress: string;
  itemType: "Clothes" | "Food" | "Medicine" | "Books" | "Other";
  estimatedQuantity: string;
  availability: string; // "anytime" | "weekends" | specific date
  notes?: string;
  status: LeadStatus;
  createdAt: Timestamp | null;
}

/** A volunteer reports that someone in the community is in need */
export interface NeedReport {
  id?: string;
  ngoId: string;
  reportedBy: string;
  reportedByName: string;
  contactName: string;
  contactPhone?: string;
  address: string;
  category: "Food" | "Health" | "Education" | "Shelter" | "Water" | "Other";
  description: string;
  urgency: "High" | "Medium" | "Low";
  numberOfPeople: number;
  notes?: string;
  status: LeadStatus;
  createdAt: Timestamp | null;
}

const donationLeadsRef = () => collection(db!, "donationLeads");
const needReportsRef = () => collection(db!, "needReports");

/** Volunteer submits a donation lead */
export async function createDonationLead(
  lead: Omit<DonationLead, "id" | "createdAt" | "status">
) {
  return addDoc(donationLeadsRef(), {
    ...lead,
    status: "New",
    createdAt: serverTimestamp(),
  });
}

/** Volunteer submits a need report */
export async function createNeedReport(
  report: Omit<NeedReport, "id" | "createdAt" | "status">
) {
  return addDoc(needReportsRef(), {
    ...report,
    status: "New",
    createdAt: serverTimestamp(),
  });
}

/** NGO subscribes to all donation leads for their org */
export function subscribeToDonationLeads(
  ngoId: string,
  callback: (leads: DonationLead[]) => void
) {
  const q = query(
    donationLeadsRef(),
    where("ngoId", "==", ngoId)
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DonationLead));
    data.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return timeB - timeA;
    });
    callback(data);
  });
}

/** NGO subscribes to all need reports for their org */
export function subscribeToNeedReports(
  ngoId: string,
  callback: (reports: NeedReport[]) => void
) {
  const q = query(
    needReportsRef(),
    where("ngoId", "==", ngoId)
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as NeedReport));
    data.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return timeB - timeA;
    });
    callback(data);
  });
}

/** Update status of a donation lead */
export async function updateDonationLeadStatus(id: string, status: LeadStatus) {
  return updateDoc(doc(db!, "donationLeads", id), { status });
}

/** Update status of a need report */
export async function updateNeedReportStatus(id: string, status: LeadStatus) {
  return updateDoc(doc(db!, "needReports", id), { status });
}

/** NGO converts a donation lead into a collection task */
export async function convertDonationLeadToTask(
  lead: DonationLead,
  ngoName: string
) {
  const taskRef = await createTask({
    ngoId: lead.ngoId,
    ngoName,
    title: `Collect ${lead.itemType} from ${lead.donorName}`,
    description: `Donor: ${lead.donorName}${lead.donorPhone ? ` (${lead.donorPhone})` : ""}. Estimated qty: ${lead.estimatedQuantity}. Available: ${lead.availability}.${lead.notes ? ` Note: ${lead.notes}` : ""}`,
    taskType: "Collection",
    category: lead.itemType === "Medicine" ? "Health" : lead.itemType === "Books" ? "Education" : lead.itemType === "Clothes" ? "Shelter" : "Food",
    skillsRequired: [],
    location: lead.donorAddress,
    priority: "Medium",
    deadline: null,
    status: "Open",
  });
  await updateDonationLeadStatus(lead.id!, "TaskCreated");
  return taskRef;
}

/** NGO converts a need report into a distribution/service task */
export async function convertNeedReportToTask(
  report: NeedReport,
  ngoName: string
) {
  const taskRef = await createTask({
    ngoId: report.ngoId,
    ngoName,
    title: `${report.category} assistance — ${report.contactName}`,
    description: `Contact: ${report.contactName}${report.contactPhone ? ` (${report.contactPhone})` : ""}. People: ${report.numberOfPeople}. ${report.description}${report.notes ? ` Note: ${report.notes}` : ""}`,
    taskType: report.category === "Health" ? "Service" : "Distribution",
    category: report.category,
    skillsRequired: report.category === "Health" ? ["First Aid", "Medical"] : [],
    location: report.address,
    lat: report.lat,
    lng: report.lng,
    priority: report.urgency,
    deadline: null,
    status: "Open",
  });
  await updateNeedReportStatus(report.id!, "TaskCreated");
  return taskRef;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Field Reports (Volunteer Uploaded Data → AI Analyzed)
// ═══════════════════════════════════════════════════════════════════════════════

export type ReportSeverity = "Critical" | "High" | "Medium" | "Low";

export interface FieldReport {
  id?: string;
  ngoId: string;
  volunteerId: string;
  volunteerName: string;
  fileName: string;
  fileType: string; // "text" | "csv" | "image" | "whatsapp" | "other"
  rawTextPreview: string;
  // AI-structured output
  summary: string;
  keyFindings: string[];
  affectedGroups: string[];
  location: string;
  lat?: number;
  lng?: number;
  estimatedPeopleAffected: number;
  categories: string[];
  actionRecommendations: string[];
  severity: {
    level: ReportSeverity;
    score: number;
    reasoning: string;
  };
  status: "New" | "Reviewed" | "ActionTaken";
  createdAt: Timestamp | null;
}

const fieldReportsRef = () => collection(db!, "fieldReports");

export async function submitFieldReport(
  report: Omit<FieldReport, "id" | "createdAt">
) {
  return addDoc(fieldReportsRef(), {
    ...report,
    status: "New",
    createdAt: serverTimestamp(),
  });
}

export function subscribeToFieldReportsByNGO(
  ngoId: string,
  callback: (reports: FieldReport[]) => void
) {
  const q = query(fieldReportsRef(), where("ngoId", "==", ngoId));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FieldReport));
    data.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tB - tA;
    });
    callback(data);
  });
}

export function subscribeToMyFieldReports(
  volunteerId: string,
  callback: (reports: FieldReport[]) => void
) {
  const q = query(fieldReportsRef(), where("volunteerId", "==", volunteerId));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FieldReport));
    data.sort((a, b) => {
      const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tB - tA;
    });
    callback(data);
  });
}

export async function updateFieldReportStatus(id: string, status: FieldReport["status"]) {
  return updateDoc(doc(db!, "fieldReports", id), { status });
}
