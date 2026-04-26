import { NextRequest, NextResponse } from "next/server";

// Allow up to 8MB body (compressed images are <1MB but raw text can be large)
export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

const PROMPT_TEMPLATE = (rawText: string, fileType: string, locationHint?: string) => `
You are an expert community data analyst for an NGO platform called AidConnect. A volunteer has uploaded field data collected from the community (surveys, WhatsApp messages, Google Forms, interviews, Excel data, etc.).

Analyze this data and return a structured response.

Rules:
- ${locationHint ? `IMPORTANT: The volunteer manually specified the location as '${locationHint}'. Use this as the exact location for 'location' unless the data strongly contradicts it.` : "If location is not found in the data, output 'Not specified'"}
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

async function analyzeWithGemini(rawText: string, fileType: string, imageBase64?: string, locationHint?: string) {
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

${PROMPT_TEMPLATE("(Extract from image above)", fileType, locationHint)}`
    });
  } else {
    parts.push({ text: PROMPT_TEMPLATE(rawText, fileType, locationHint) });
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { 
          temperature: 0.2, 
          maxOutputTokens: 2048, 
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              summary: { type: "STRING" },
              keyFindings: { type: "ARRAY", items: { type: "STRING" } },
              affectedGroups: { type: "ARRAY", items: { type: "STRING" } },
              location: { type: "STRING" },
              estimatedPeopleAffected: { type: "INTEGER" },
              categories: { type: "ARRAY", items: { type: "STRING" } },
              actionRecommendations: { type: "ARRAY", items: { type: "STRING" } },
              severity: {
                type: "OBJECT",
                properties: {
                  level: { type: "STRING", enum: ["Critical", "High", "Medium", "Low"] },
                  score: { type: "INTEGER" },
                  reasoning: { type: "STRING" }
                },
                required: ["level", "score", "reasoning"]
              }
            },
            required: ["summary", "keyFindings", "affectedGroups", "location", "estimatedPeopleAffected", "categories", "actionRecommendations", "severity"]
          }
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const text = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      if (!text) {
        console.error("Gemini returned empty text response:", JSON.stringify(data, null, 2));
        if (attempt === 3) throw new Error("Gemini returned an empty response");
        await new Promise(resolve => setTimeout(resolve, attempt * 1500));
        continue;
      }

      try {
        return JSON.parse(text);
      } catch (parseErr) {
        console.error("Gemini JSON parse error. Raw text:", text);
        if (attempt === 3) throw parseErr;
      }
    } else {
      if (response.status === 429) {
        if (attempt === 3) throw new Error(`Gemini rate limit exceeded: ${response.status}`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1500));
        continue;
      }
      throw new Error(`Gemini API error: ${response.status}`);
    }
  }
}


export async function POST(req: NextRequest) {
  try {
    const { rawText, fileType, volunteerName, ngoId, imageBase64, locationHint } = await req.json();

    if (!rawText?.trim() && !imageBase64) {
      return NextResponse.json({ error: "No content to analyze." }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured on the server." }, { status: 500 });
    }

    const result = await analyzeWithGemini(rawText || "", fileType || "text", imageBase64, locationHint);

    // Attempt to automatically geocode the extracted location if the user didn't provide a map pin
    if (result.location && result.location !== "Not specified") {
      try {
        // Appending 'India' or the region to help Nominatim locate it accurately
        const query = encodeURIComponent(result.location + (result.location.toLowerCase().includes("hyderabad") ? "" : ", Hyderabad, India"));
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
          headers: { 'User-Agent': 'AidConnect/1.0' }
        });
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          result.lat = parseFloat(geoData[0].lat);
          result.lng = parseFloat(geoData[0].lon);
        }
      } catch (err) {
        console.warn("Geocoding failed during analysis:", err);
      }
    }

    return NextResponse.json({
      ...result,
      analyzedAt: new Date().toISOString(),
      volunteerName,
      ngoId,
      rawTextPreview: (rawText || "").substring(0, 500),
      aiPowered: true,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
