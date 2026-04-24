import { NextRequest, NextResponse } from "next/server";

// Simple local scoring algorithm (no AI API needed — always works)
function localSuggest(volunteer: any, ngos: any[]) {
  if (!ngos || ngos.length === 0) {
    return { suggestedNgoId: "", suggestedNgoName: "None", reason: "No NGOs available.", confidenceScore: 0, rankings: [] };
  }

  const SKILL_TO_FOCUS: Record<string, string[]> = {
    "First Aid": ["Healthcare & Medical", "Disaster Relief"],
    "CPR Certified": ["Healthcare & Medical", "Disaster Relief"],
    "Medical Professional": ["Healthcare & Medical"],
    "Mental Health Support": ["Mental Health Support"],
    "Food Preparation": ["Food Security"],
    "Water Purification": ["Clean Water & Sanitation"],
    "Childcare": ["Child Welfare", "Education & Literacy"],
    "Legal Aid": ["Livelihood & Skills", "Women Empowerment"],
    "Search & Rescue": ["Disaster Relief"],
    "Logistics/Supply Chain": ["Disaster Relief", "Food Security"],
    "Animal Rescue": ["Animal Welfare"],
    "IT/Tech Support": ["Livelihood & Skills"],
    "Driving (Light Vehicle)": ["Disaster Relief", "Food Security"],
    "Driving (Heavy Vehicle)": ["Disaster Relief"],
  };

  const scored = ngos.map((ngo: any) => {
    let score = 0;
    const reasons: string[] = [];

    const volState = (volunteer.location || "").split(",").pop()?.trim() ?? "";
    if (ngo.operationalStates?.includes(volState) || ngo.state === volState) {
      score += 40; reasons.push(`operates in ${volState}`);
    } else if (ngo.geographicScope === "National" || ngo.geographicScope === "International") {
      score += 20; reasons.push(`${ngo.geographicScope.toLowerCase()} reach`);
    }

    (volunteer.skills || []).forEach((skill: string) => {
      (SKILL_TO_FOCUS[skill] || []).forEach((focus: string) => {
        if (ngo.focusAreas?.includes(focus)) { score += 15; reasons.push(`${skill} ↔ ${focus}`); }
      });
    });

    const langOverlap = (volunteer.languages || []).filter((l: string) => (ngo.languagesSupported || []).includes(l));
    if (langOverlap.length > 0) { score += 10; reasons.push(`shared language: ${langOverlap[0]}`); }

    return { ngoId: ngo.uid, ngoName: ngo.orgName, score: Math.min(score, 100), reason: reasons.slice(0, 2).join("; ") || "General match" };
  });

  scored.sort((a: any, b: any) => b.score - a.score);
  const best = scored[0];

  return {
    suggestedNgoId: best.ngoId,
    suggestedNgoName: best.ngoName,
    reason: `${best.ngoName} is the best fit because the volunteer ${best.reason}.`,
    confidenceScore: best.score,
    rankings: scored,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { volunteer, ngos } = await req.json();
    const result = localSuggest(volunteer, ngos);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
