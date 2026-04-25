import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

const NGOs = [
  { name: "Food Rescue Trichy", category: "Food", location: "Trichy", prefix: "ngo_trichy" },
  { name: "HealthNet Chennai", category: "Health", location: "Chennai", prefix: "ngo_chennai" },
  { name: "EduCare Coimbatore", category: "Education", location: "Coimbatore", prefix: "ngo_coimbatore" },
  { name: "Shelter Hope Madurai", category: "Shelter", location: "Madurai", prefix: "ngo_madurai" },
  { name: "CleanWater Salem", category: "Water", location: "Salem", prefix: "ngo_salem" },
  { name: "AllRelief Erode", category: "Other", location: "Erode", prefix: "ngo_erode" },
  { name: "Food for All Tirunelveli", category: "Food", location: "Tirunelveli", prefix: "ngo_tirunelveli" },
  { name: "MedAssist Vellore", category: "Health", location: "Vellore", prefix: "ngo_vellore" },
  { name: "BrightFuture Thoothukudi", category: "Education", location: "Thoothukudi", prefix: "ngo_thoothukudi" },
  { name: "SafeHome Dindigul", category: "Shelter", location: "Dindigul", prefix: "ngo_dindigul" },
];

const VOLUNTEER_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya",
  "Saanvi", "Aanya", "Aadhya", "Aaradhya", "Ananya", "Pari", "Diya", "Navya", "Manya", "Aliya",
  "Rohan", "Rahul", "Karan", "Karthik", "Ravi", "Sneha", "Priya", "Kavya", "Neha", "Pooja",
];

async function createAuthUser(email: string, password: string):Promise<{uid: string, token: string}> {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (data.error) {
    if (data.error.message === "EMAIL_EXISTS") {
      const loginRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      });
      const loginData = await loginRes.json();
      return { uid: loginData.localId, token: loginData.idToken };
    }
    throw new Error(data.error.message);
  }
  return { uid: data.localId, token: data.idToken };
}

// Helper to convert JS object to Firestore Document format
function toFirestoreDoc(obj: any): any {
  const fields: any = {};
  for (const key in obj) {
    if (obj[key] === undefined) continue;
    if (typeof obj[key] === "string") fields[key] = { stringValue: obj[key] };
    else if (typeof obj[key] === "number") {
      if (Number.isInteger(obj[key])) fields[key] = { integerValue: obj[key] };
      else fields[key] = { doubleValue: obj[key] };
    }
    else if (typeof obj[key] === "boolean") fields[key] = { booleanValue: obj[key] };
    else if (Array.isArray(obj[key])) fields[key] = { arrayValue: { values: obj[key].map((v: string) => ({ stringValue: v })) } };
    else if (obj[key] && obj[key].isServerTimestamp) fields[key] = { timestampValue: new Date().toISOString() };
  }
  return { fields };
}

async function writeDoc(collection: string, docId: string, data: any, token: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toFirestoreDoc({ ...data, createdAt: { isServerTimestamp: true } })),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Error writing to ${collection}/${docId}:`, errorText);
  }
}

export async function POST() {
  try {
    let logs: string[] = [];
    
    for (let i = 0; i < NGOs.length; i++) {
      const ngo = NGOs[i];
      const email = `${ngo.prefix}@test.com`;
      const password = "password123";
      
      const { uid, token } = await createAuthUser(email, password);
      logs.push(`Created Auth User for ${ngo.name}: ${uid}`);

      // Seed Users collection
      await writeDoc("users", uid, {
        email,
        role: "NGO",
        displayName: ngo.name,
        approved: false
      }, token);

      // Seed NGOs collection
      await writeDoc("ngos", uid, {
        orgName: ngo.name,
        regNumber: `REG-${1000 + i}`,
        phone: `+91-90000${1000 + i}`,
        address: ngo.location,
        category: ngo.category,
        description: `Dedicated to ${ngo.category.toLowerCase()} relief operations in ${ngo.location}.`,
        status: "pending"
      }, token);

      logs.push(`Seeded Firestore for ${ngo.name}`);

      // Create 12 volunteers for this NGO
      for (let j = 1; j <= 12; j++) {
        const volEmail = `${ngo.prefix}_vol${j}@test.com`;
        const { uid: vUid, token: vToken } = await createAuthUser(volEmail, password);
        
        const volName = `${VOLUNTEER_NAMES[(i * 12 + j) % VOLUNTEER_NAMES.length]} ${ngo.location.charAt(0)}`;

        await writeDoc("users", vUid, {
          email: volEmail,
          role: "Volunteer",
          displayName: volName,
          approved: true,
          ngoId: uid,
        }, vToken);

        await writeDoc("volunteers", vUid, {
          name: volName,
          gender: j % 2 === 0 ? "female" : "male",
          phone: `+91-98000${1000 + i * 12 + j}`,
          address: `${ngo.location} Zone ${j % 4 + 1}`,
          role: "Field Volunteer",
          skills: [ngo.category, "Logistics", "First Aid"].slice(0, (j % 3) + 1),
          availability: j % 2 === 0 ? "Immediate" : "Weekends",
          ngoId: uid,
          status: "Available",
          rating: 4.0 + (j % 10) / 10,
          tasksCompleted: j % 5,
        }, vToken);

        logs.push(`  Created Volunteer ${volName} for ${ngo.name}`);
      }
    }

    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
