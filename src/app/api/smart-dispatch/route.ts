import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Skill → Task category mapping
const SKILL_CATEGORY_MAP: Record<string, string[]> = {
  "First Aid":              ["Health", "Disaster Relief"],
  "CPR Certified":          ["Health", "Disaster Relief"],
  "Medical Professional":   ["Health"],
  "Mental Health Support":  ["Health"],
  "Food Preparation":       ["Food"],
  "Water Purification":     ["Water"],
  "Childcare":              ["Education", "Shelter"],
  "Search & Rescue":        ["Disaster Relief", "Shelter"],
  "Logistics/Supply Chain": ["Food", "Shelter"],
  "Driving (Light Vehicle)":["Food", "Health"],
  "Driving (Heavy Vehicle)":["Food", "Shelter"],
  "Teaching":               ["Education"],
  "Language Translation":   ["Health", "Education"],
  "Construction/Repair":    ["Shelter"],
  "IT/Tech Support":        ["Other"],
};

function localScore(task: any, volunteer: any): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Availability (max 25)
  if (volunteer.status === "Available") {
    score += 25; reasons.push("Currently available");
  } else if (volunteer.status !== "Busy") {
    score += 10;
  }

  // 2. Skills match (max 40)
  const taskSkills: string[] = task.skillsRequired || [];
  const volSkills: string[]  = volunteer.skills || [];
  const directMatches = taskSkills.filter((s: string) => volSkills.includes(s));
  if (directMatches.length > 0) {
    const pts = Math.min(directMatches.length * 15, 40);
    score += pts;
    reasons.push(`Skill match: ${directMatches.slice(0, 2).join(", ")}`);
  }

  // Category-based skill match (if no direct skill match)
  if (directMatches.length === 0) {
    const catMatches = volSkills.filter((s: string) => {
      const cats = SKILL_CATEGORY_MAP[s] || [];
      return cats.includes(task.category);
    });
    if (catMatches.length > 0) {
      score += 20;
      reasons.push(`Relevant skills: ${catMatches[0]}`);
    }
  }

  // 3. Rating (max 20)
  const rating = Math.min(volunteer.rating || 3, 5);
  score += Math.round(rating * 4);
  if (rating >= 4.5) reasons.push("Top-rated volunteer");
  else if (rating >= 4) reasons.push("High-rated volunteer");

  // 4. Experience (max 15)
  const tasks = volunteer.tasksCompleted || 0;
  if (tasks >= 10) { score += 15; reasons.push(`${tasks} tasks completed`); }
  else if (tasks >= 5) { score += 10; reasons.push(`${tasks} tasks completed`); }
  else if (tasks >= 1) { score += 5; reasons.push(`${tasks} tasks completed`); }
  else reasons.push("New volunteer");

  // Priority boost
  if (task.priority === "High" && volunteer.status === "Available") score += 5;

  return { score: Math.min(score, 100), reasons };
}

async function geminiDispatch(task: any, volunteers: any[]): Promise<any[]> {
  const prompt = `
You are an AI volunteer dispatch coordinator for AidConnect, an NGO platform.

TASK TO FILL:
- Title: ${task.title}
- Category: ${task.category}
- Priority: ${task.priority}
- Skills Required: ${(task.skillsRequired || []).join(", ") || "None specified"}
- Location: ${task.location}
- Description: ${task.description}

AVAILABLE VOLUNTEERS (${volunteers.length} total):
${volunteers.map((v, i) => `
${i + 1}. ${v.name || v.userId}
   - Skills: ${(v.skills || []).join(", ") || "None listed"}
   - Status: ${v.status}
   - Rating: ${v.rating || "N/A"}/5
   - Tasks Completed: ${v.tasksCompleted || 0}
   - Location: ${v.location || "Unknown"}
   - Availability: ${v.availability || "Flexible"}
   - Languages: ${(v.languages || []).join(", ") || "Not specified"}
`).join("")}

Score each volunteer (0-100) for this specific task. Consider:
1. Skills match (most important)
2. Current availability
3. Past performance (rating + tasks completed)
4. Location relevance
5. Priority urgency

Return ONLY valid JSON array with top 3 volunteers:
[
  {
    "volunteerId": "<their userId>",
    "volunteerName": "<name>",
    "score": <0-100>,
    "reasons": ["reason 1", "reason 2", "reason 3"],
    "dispatchMessage": "A 1-sentence personal message to send this volunteer explaining why they were chosen"
  }
]

No markdown, no explanation, raw JSON array only.
`;

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
    })
  });

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean);
}

export async function POST(req: NextRequest) {
  try {
    const { task, volunteers } = await req.json();

    if (!volunteers?.length) {
      return NextResponse.json({ recommendations: [], message: "No volunteers available for this NGO." });
    }

    // Filter only available volunteers (allow Busy for demo fallback)
    const available = volunteers.filter((v: any) => v.status === "Available");
    const pool = available.length >= 3 ? available : volunteers;

    let recommendations: any[];

    if (GEMINI_API_KEY) {
      try {
        const geminiResults = await geminiDispatch(task, pool);
        // Merge AI scores with local scoring as validation
        recommendations = geminiResults.map((r: any) => {
          const vol = pool.find((v: any) => v.userId === r.volunteerId || v.name === r.volunteerName);
          const local = vol ? localScore(task, vol) : { score: r.score, reasons: r.reasons };
          return {
            ...r,
            volunteerId: vol?.userId || r.volunteerId,
            volunteerName: vol?.name || r.volunteerName,
            score: Math.round((r.score + local.score) / 2), // blend AI + local
            aiPowered: true,
          };
        }).filter((r: any) => r.volunteerId);
      } catch (e) {
        console.warn("Gemini dispatch failed, using local:", e);
        recommendations = localDispatch(task, pool);
      }
    } else {
      recommendations = localDispatch(task, pool);
    }

    // Sort by score desc
    recommendations.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      recommendations: recommendations.slice(0, 3),
      totalPoolSize: pool.length,
      availableCount: available.length,
      aiPowered: !!GEMINI_API_KEY,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function localDispatch(task: any, volunteers: any[]) {
  return volunteers.map((v: any) => {
    const { score, reasons } = localScore(task, v);
    return {
      volunteerId: v.userId,
      volunteerName: v.name,
      score,
      reasons,
      dispatchMessage: `${v.name}, your skills in ${(v.skills || []).slice(0, 2).join(" and ") || "community service"} make you a great fit for this ${task.category} task.`,
      aiPowered: false,
    };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
}
