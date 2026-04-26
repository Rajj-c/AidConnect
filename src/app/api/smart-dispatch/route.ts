import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;


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

    Rank the top 3 volunteers for this task. Return ONLY a JSON array.`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.1, 
          maxOutputTokens: 800, 
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                rank: { type: "INTEGER" },
                volunteerIndex: { type: "INTEGER", description: "1-based index of the volunteer in the provided list" },
                reasons: { type: "ARRAY", items: { type: "STRING" } },
                dispatchMessage: { type: "STRING", description: "Personal 1-sentence message to this volunteer" }
              },
              required: ["rank", "volunteerIndex", "reasons", "dispatchMessage"]
            }
          }
        }
      })
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      try {
        return JSON.parse(text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      } catch (parseErr) {
        if (attempt === 3) throw parseErr;
      }
    } else {
      if (res.status === 429) {
        if (attempt === 3) throw new Error(`Gemini rate limit exceeded: ${res.status}`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1500));
        continue;
      }
      throw new Error(`Gemini API error: ${res.status}`);
    }
  }
  return [];
}


export async function POST(req: NextRequest) {
  try {
    const { task, volunteers } = await req.json();

    if (!volunteers?.length) {
      return NextResponse.json({ recommendations: [], message: "No volunteers available for this NGO." });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });
    }

    const available = volunteers.filter((v: any) => v.status === "Available");
    const pool = available.length >= 1 ? available : volunteers; // use all if none are "Available"

    let recommendations: any[] = [];
    const geminiRanking = await geminiDispatch(task, pool);

    if (geminiRanking?.length > 0) {
      // Map Gemini ranking (by index) to actual volunteers
      recommendations = geminiRanking
        .map((g: any) => {
          const idx = (g.volunteerIndex || 1) - 1;
          const vol = pool[idx];
          if (!vol) return null;
          return {
            volunteerId: vol.userId || vol.id,
            volunteerName: vol.name || "Volunteer",
            score: g.rank === 1 ? 95 : g.rank === 2 ? 85 : 75,
            reasons: g.reasons || ["Great match for this task"],
            dispatchMessage: g.dispatchMessage || `${vol.name || "Volunteer"}, you're a great match for this task.`,
            aiPowered: true,
          };
        })
        .filter(Boolean);
    }

    return NextResponse.json({
      recommendations: recommendations.slice(0, 3),
      totalPoolSize: pool.length,
      availableCount: available.length,
      aiPowered: true,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
