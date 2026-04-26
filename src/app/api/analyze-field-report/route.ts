import { NextRequest, NextResponse } from "next/server";

// Severity scoring based on AI-extracted keywords and data
function analyzeSeverity(text: string): { level: "Critical" | "High" | "Medium" | "Low"; score: number; reasoning: string } {
  const lower = text.toLowerCase();
  
  const criticalKeywords = ["death", "died", "dead", "critical", "emergency", "sos", "urgent", "severe", "collapse", "outbreak", "epidemic", "starvation", "flood", "fire", "disaster", "medical", "hospital", "unconscious"];
  const highKeywords = ["sick", "ill", "injured", "homeless", "shelter", "hunger", "malnourished", "no water", "no food", "electricity", "alone", "elderly", "disabled", "pregnant", "danger", "unsafe"];
  const mediumKeywords = ["need", "require", "help", "lack", "shortage", "problem", "issue", "support", "assist", "care", "poor", "vulnerable"];

  let score = 0;
  const matched: string[] = [];

  criticalKeywords.forEach(kw => { if (lower.includes(kw)) { score += 20; matched.push(kw); } });
  highKeywords.forEach(kw => { if (lower.includes(kw)) { score += 10; matched.push(kw); } });
  mediumKeywords.forEach(kw => { if (lower.includes(kw)) { score += 5; matched.push(kw); } });

  score = Math.min(score, 100);

  let level: "Critical" | "High" | "Medium" | "Low";
  if (score >= 60) level = "Critical";
  else if (score >= 35) level = "High";
  else if (score >= 15) level = "Medium";
  else level = "Low";

  return {
    level,
    score,
    reasoning: matched.length > 0
      ? `Detected ${matched.length} concern indicator(s): ${matched.slice(0, 5).join(", ")}.`
      : "No specific distress indicators found. Routine data."
  };
}

// AI-powered text structuring
function structureReport(rawText: string, fileType: string): {
  summary: string;
  keyFindings: string[];
  affectedGroups: string[];
  location: string;
  estimatedPeopleAffected: number;
  categories: string[];
  actionRecommendations: string[];
} {
  const lines = rawText.split(/[\n,;|]+/).map(l => l.trim()).filter(l => l.length > 5);
  const lower = rawText.toLowerCase();

  // Extract location hints
  const locationPatterns = ["at ", "in ", "near ", "from ", "location:", "area:", "place:"];
  let location = "Not specified";
  for (const pat of locationPatterns) {
    const idx = lower.indexOf(pat);
    if (idx !== -1) {
      const extracted = rawText.substring(idx + pat.length, idx + pat.length + 40).split(/[,\n]/)[0].trim();
      if (extracted.length > 2) { location = extracted; break; }
    }
  }

  // Category detection
  const categories: string[] = [];
  if (lower.includes("food") || lower.includes("hungry") || lower.includes("meal") || lower.includes("ration")) categories.push("Food Security");
  if (lower.includes("health") || lower.includes("medical") || lower.includes("sick") || lower.includes("doctor") || lower.includes("hospital")) categories.push("Healthcare");
  if (lower.includes("water") || lower.includes("drinking") || lower.includes("sanitation") || lower.includes("toilet")) categories.push("Water & Sanitation");
  if (lower.includes("shelter") || lower.includes("home") || lower.includes("house") || lower.includes("tent") || lower.includes("homeless")) categories.push("Shelter");
  if (lower.includes("school") || lower.includes("education") || lower.includes("student") || lower.includes("children") || lower.includes("kids")) categories.push("Education");
  if (lower.includes("elder") || lower.includes("old") || lower.includes("widow") || lower.includes("disabled") || lower.includes("pregnant")) categories.push("Vulnerable Groups");
  if (categories.length === 0) categories.push("General Aid");

  // Estimate people affected
  const numberMatches = rawText.match(/\b(\d+)\s*(people|persons|families|households|individuals|beneficiaries|children|adults|elderly|members)/gi);
  let totalPeople = 0;
  if (numberMatches) {
    numberMatches.forEach(m => {
      const n = parseInt(m.match(/\d+/)?.[0] || "0");
      totalPeople += n;
    });
  }
  if (totalPeople === 0) totalPeople = Math.max(1, Math.floor(lines.length * 1.5));

  // Affected groups
  const groups: string[] = [];
  if (lower.includes("child") || lower.includes("kid")) groups.push("Children");
  if (lower.includes("elder") || lower.includes("old")) groups.push("Elderly");
  if (lower.includes("woman") || lower.includes("women") || lower.includes("female")) groups.push("Women");
  if (lower.includes("disabled") || lower.includes("handicap")) groups.push("Differently-abled");
  if (lower.includes("pregnant")) groups.push("Pregnant women");
  if (groups.length === 0) groups.push("General population");

  // Generate key findings from distinct lines
  const keyFindings = lines
    .filter(l => l.length > 10 && l.length < 200)
    .slice(0, 6)
    .map(l => l.charAt(0).toUpperCase() + l.slice(1));

  // Action recommendations based on categories
  const actionRecommendations: string[] = [];
  if (categories.includes("Food Security")) actionRecommendations.push("Dispatch food distribution team immediately");
  if (categories.includes("Healthcare")) actionRecommendations.push("Coordinate with medical volunteers or health facilities");
  if (categories.includes("Water & Sanitation")) actionRecommendations.push("Arrange water tankers or purification tablets");
  if (categories.includes("Shelter")) actionRecommendations.push("Identify temporary shelter or contact housing NGOs");
  if (categories.includes("Education")) actionRecommendations.push("Connect with education-focused NGOs for materials");
  if (actionRecommendations.length === 0) actionRecommendations.push("Review report and assign appropriate volunteer team");

  const summary = `Field report from ${fileType === "text" ? "manual notes" : `uploaded ${fileType} file`}. ${lines.length} data points collected covering ${categories.join(", ")}. Approximately ${totalPeople} individuals identified as potentially affected in the area of ${location}. Key concerns: ${categories.slice(0, 2).join(" and ")}.`;

  return {
    summary,
    keyFindings,
    affectedGroups: groups,
    location,
    estimatedPeopleAffected: totalPeople,
    categories,
    actionRecommendations,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { rawText, fileType, volunteerName, ngoId } = await req.json();

    if (!rawText || rawText.trim().length < 5) {
      return NextResponse.json({ error: "No content to analyze." }, { status: 400 });
    }

    const structured = structureReport(rawText, fileType || "text");
    const severity = analyzeSeverity(rawText);

    return NextResponse.json({
      ...structured,
      severity,
      analyzedAt: new Date().toISOString(),
      volunteerName,
      ngoId,
      rawTextPreview: rawText.substring(0, 500),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
