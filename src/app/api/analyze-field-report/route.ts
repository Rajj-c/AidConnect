import { NextRequest, NextResponse } from "next/server";

// Allow up to 8MB body (compressed images are <1MB but raw text can be large)
export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const PROMPT_TEMPLATE = (rawText: string, fileType: string) => `
You are an expert community data analyst for an NGO platform called AidConnect. A volunteer has uploaded field data collected from the community (surveys, WhatsApp messages, Google Forms, interviews, Excel data, etc.).

Analyze this data and return a structured JSON response with EXACTLY this format (no extra keys, no markdown, raw JSON only):
{
  "summary": "A 2-3 sentence plain-language summary of what this data tells us about the community situation",
  "keyFindings": ["finding 1", "finding 2", "finding 3", "...up to 6 key findings extracted from the data"],
  "affectedGroups": ["Children", "Elderly", "Women", "etc — only groups clearly mentioned"],
  "location": "best guess at location from the data, or 'Not specified'",
  "estimatedPeopleAffected": <integer number, estimate from the data>,
  "categories": ["Food Security", "Healthcare", "Water & Sanitation", "Shelter", "Education", "Vulnerable Groups", "General Aid" — pick all that apply],
  "actionRecommendations": ["specific action 1 for the NGO", "action 2", "...up to 4 actions"],
  "severity": {
    "level": "<one of: Critical, High, Medium, Low>",
    "score": <integer 0-100>,
    "reasoning": "1-2 sentences explaining why this severity level was chosen"
  }
}

Rules:
- severity score: 80-100 = Critical (deaths, epidemics, starvation), 50-79 = High (urgent medical/food needs), 25-49 = Medium (clear needs, not life-threatening), 0-24 = Low (general community requests)
- keyFindings must be SPECIFIC observations from the actual data, not generic statements
- If numbers of people are mentioned, use them for estimatedPeopleAffected
- Be concise but specific

File type hint: ${fileType}

RAW DATA TO ANALYZE:
---
${rawText.substring(0, 8000)}
---

Return ONLY valid JSON. No explanation, no markdown code blocks.
`;

async function analyzeWithGemini(rawText: string, fileType: string, imageBase64?: string) {
  const parts: any[] = [];

  if (imageBase64) {
    // Canvas compression always outputs JPEG
    parts.push({
      inlineData: { mimeType: "image/jpeg", data: imageBase64 }
    });
    parts.push({
      text: `This image is a photo of a community field document — it could be a handwritten survey on paper, a printed complaint letter, a scanned form, or a phone screenshot.

Your task:
1. First, carefully read and extract ALL visible text from the image (even if handwritten or partially blurry)
2. Then analyze that extracted content as community field data

${PROMPT_TEMPLATE("(Extract from image above)", fileType)}`
    });
  } else {
    parts.push({ text: PROMPT_TEMPLATE(rawText, fileType) });
  }

  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Clean and parse JSON
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}

// Fallback local analysis if Gemini fails
function localAnalyze(rawText: string, fileType: string) {
  const lower = rawText.toLowerCase();
  const lines = rawText.split(/[\n,;|]+/).map(l => l.trim()).filter(l => l.length > 5);

  const criticalKw = ["death", "died", "dead", "critical", "emergency", "sos", "severe", "collapse", "outbreak", "epidemic", "starvation", "flood", "fire", "medical", "unconscious"];
  const highKw = ["sick", "ill", "injured", "homeless", "hunger", "no water", "no food", "danger", "unsafe", "malnourished"];
  const medKw = ["need", "require", "help", "lack", "shortage", "poor", "vulnerable"];

  let score = 0;
  const matched: string[] = [];
  criticalKw.forEach(kw => { if (lower.includes(kw)) { score += 20; matched.push(kw); } });
  highKw.forEach(kw => { if (lower.includes(kw)) { score += 10; matched.push(kw); } });
  medKw.forEach(kw => { if (lower.includes(kw)) { score += 5; matched.push(kw); } });
  score = Math.min(score, 100);

  const level = score >= 60 ? "Critical" : score >= 35 ? "High" : score >= 15 ? "Medium" : "Low";

  const categories: string[] = [];
  if (lower.match(/food|hunger|meal|ration|eat/)) categories.push("Food Security");
  if (lower.match(/health|medical|sick|doctor|hospital|medicine/)) categories.push("Healthcare");
  if (lower.match(/water|drinking|sanitation|toilet/)) categories.push("Water & Sanitation");
  if (lower.match(/shelter|home|house|tent|homeless/)) categories.push("Shelter");
  if (lower.match(/school|education|student|children|kids/)) categories.push("Education");
  if (categories.length === 0) categories.push("General Aid");

  const numMatches = rawText.match(/\b(\d+)\s*(people|persons|families|households|individuals|beneficiaries|children|adults)/gi);
  let people = 0;
  numMatches?.forEach(m => { people += parseInt(m.match(/\d+/)?.[0] || "0"); });
  if (people === 0) people = Math.max(1, lines.length * 2);

  const groups: string[] = [];
  if (lower.match(/child|kid/)) groups.push("Children");
  if (lower.match(/elder|old/)) groups.push("Elderly");
  if (lower.match(/woman|women|female/)) groups.push("Women");
  if (groups.length === 0) groups.push("General population");

  let location = "Not specified";
  ["at ", "in ", "near ", "location:", "area:"].forEach(pat => {
    const idx = lower.indexOf(pat);
    if (idx !== -1 && location === "Not specified") {
      location = rawText.substring(idx + pat.length, idx + pat.length + 40).split(/[,\n]/)[0].trim();
    }
  });

  return {
    summary: `Field data collected via ${fileType}. ${lines.length} data points spanning ${categories.join(", ")}. Approximately ${people} individuals identified as potentially affected.`,
    keyFindings: lines.slice(0, 5).map(l => l.charAt(0).toUpperCase() + l.slice(1)),
    affectedGroups: groups,
    location,
    estimatedPeopleAffected: people,
    categories,
    actionRecommendations: [
      categories.includes("Food Security") ? "Deploy food distribution team" : null,
      categories.includes("Healthcare") ? "Coordinate with medical volunteers" : null,
      categories.includes("Water & Sanitation") ? "Arrange water supply" : null,
      "Review full report and assign appropriate volunteer team",
    ].filter(Boolean) as string[],
    severity: {
      level,
      score,
      reasoning: matched.length > 0
        ? `Detected concern indicators: ${matched.slice(0, 4).join(", ")}.`
        : "No specific distress indicators. Routine community data."
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const { rawText, fileType, volunteerName, ngoId, imageBase64 } = await req.json();

    if (!rawText?.trim() && !imageBase64) {
      return NextResponse.json({ error: "No content to analyze." }, { status: 400 });
    }

    let result;
    if (GEMINI_API_KEY) {
      try {
        result = await analyzeWithGemini(rawText || "", fileType || "text", imageBase64);
      } catch (aiErr) {
        console.warn("Gemini failed, falling back to local:", aiErr);
        result = localAnalyze(rawText || "", fileType || "text");
      }
    } else {
      result = localAnalyze(rawText || "", fileType || "text");
    }

    return NextResponse.json({
      ...result,
      analyzedAt: new Date().toISOString(),
      volunteerName,
      ngoId,
      rawTextPreview: (rawText || "").substring(0, 500),
      aiPowered: !!GEMINI_API_KEY,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
