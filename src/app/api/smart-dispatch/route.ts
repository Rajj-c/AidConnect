import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
  const volSkills: string[] = volunteer.skills || [];
  const directMatches = taskSkills.filter((s: string) => volSkills.includes(s));
  if (directMatches.length > 0) {
    score += Math.min(directMatches.length * 15, 40);
    reasons.push(`Skill match: ${directMatches.slice(0, 2).join(", ")}`);
  }

  // Category-based skill match fallback
  if (directMatches.length === 0) {
    const catMatches = volSkills.filter((s: string) => (SKILL_CATEGORY_MAP[s] || []).includes(task.category));
    if (catMatches.length > 0) {
      score += 20;
      reasons.push(`Relevant skills: ${catMatches[0]}`);
    }
  }

  // If no skills at all, give base score for availability
  if (volSkills.length === 0) {
    score += 10;
    reasons.push("General volunteer");
  }

  // 3. Rating (max 20)
  const rating = Math.min(volunteer.rating || 3, 5);
  score += Math.round(rating * 4);
  if (rating >= 4.5) reasons.push("Top-rated volunteer");
  else if (rating >= 4) reasons.push("High-rated volunteer");

  // 4. Experience (max 15)
  const done = volunteer.tasksCompleted || 0;
  if (done >= 10) { score += 15; reasons.push(`${done} tasks completed`); }
  else if (done >= 5) { score += 10; reasons.push(`${done} tasks completed`); }
  else if (done >= 1) { score += 5; reasons.push(`${done} tasks completed`); }
  else reasons.push("New volunteer — eager to help");

  // Priority boost
  if (task.priority === "High" && volunteer.status === "Available") score += 5;

  return { score: Math.min(score, 100), reasons };
}

async function geminiDispatch(task: any, volunteers: any[]): Promise<any[]> {
  const prompt = `
You are an AI volunteer dispatch coordinator for AidConnect.

URGENT TASK:
- Category: ${task.category}
- Priority: ${task.priority}
- Skills Required: ${(task.skillsRequired || []).join(", ") || "None specified"}
- Location: ${task.location}
- Description: ${task.description}

VOLUNTEER POOL (${volunteers.length} volunteers):
${volunteers.map((v, i) => `${i + 1}. ${v.name} | Skills: ${(v.skills || []).join(", ") || "General"} | Status: ${v.status} | Rating: ${v.rating || 3}/5 | Tasks done: ${v.tasksCompleted || 0}`).join("\n")}

Rank the top 3 volunteers for this task. Return ONLY a JSON array:
[
  {"rank": 1, "volunteerIndex": <1-based index>, "reasons": ["reason1", "reason2"], "dispatchMessage": "Personal 1-sentence message to this volunteer"},
  {"rank": 2, "volunteerIndex": <index>, "reasons": ["reason1"], "dispatchMessage": "..."},
  {"rank": 3, "volunteerIndex": <index>, "reasons": ["reason1"], "dispatchMessage": "..."}
]
Raw JSON only, no markdown.`;

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 800 }
    })
  });

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  return JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
}

function localDispatch(task: any, volunteers: any[]) {
  return volunteers.map((v: any) => {
    const { score, reasons } = localScore(task, v);
    return {
      volunteerId: v.userId || v.id || "unknown",
      volunteerName: v.name || "Volunteer",
      score,
      reasons: reasons.length > 0 ? reasons : ["Available volunteer", "Community support"],
      dispatchMessage: `${v.name || "Volunteer"}, you are a great match for this urgent ${task.category} need in ${task.location}.`,
      aiPowered: false,
    };
  }).sort((a: any, b: any) => b.score - a.score);
}

export async function POST(req: NextRequest) {
  try {
    const { task, volunteers } = await req.json();

    if (!volunteers?.length) {
      return NextResponse.json({ recommendations: [], message: "No volunteers available for this NGO." });
    }

    const available = volunteers.filter((v: any) => v.status === "Available");
    const pool = available.length >= 1 ? available : volunteers; // use all if none are "Available"

    // ALWAYS compute local scores first — guaranteed to return results
    const localResults = localDispatch(task, pool);
    let recommendations = localResults;
    let aiPowered = false;

    // Then try Gemini to enrich with better reasoning
    if (GEMINI_API_KEY && pool.length > 0) {
      try {
        const geminiRanking = await geminiDispatch(task, pool);
        if (geminiRanking?.length > 0) {
          // Map Gemini ranking (by index) to actual volunteers
          const enriched = geminiRanking
            .map((g: any) => {
              const idx = (g.volunteerIndex || 1) - 1;
              const vol = pool[idx];
              if (!vol) return null;
              const local = localResults.find((lr: any) => lr.volunteerId === (vol.userId || vol.id));
              return {
                volunteerId: vol.userId || vol.id,
                volunteerName: vol.name || "Volunteer",
                score: local?.score || 50,
                reasons: g.reasons?.length ? g.reasons : (local?.reasons || []),
                dispatchMessage: g.dispatchMessage || local?.dispatchMessage || "",
                aiPowered: true,
              };
            })
            .filter(Boolean);

          if (enriched.length > 0) {
            recommendations = enriched;
            aiPowered = true;
          }
        }
      } catch (e) {
        console.warn("Gemini dispatch failed, using local scores:", e);
      }
    }

    return NextResponse.json({
      recommendations: recommendations.slice(0, 3),
      totalPoolSize: pool.length,
      availableCount: available.length,
      aiPowered,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
