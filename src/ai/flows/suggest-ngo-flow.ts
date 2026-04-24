import { ai } from "@/ai/genkit";
import { z } from "zod";

const VolunteerInputSchema = z.object({
  name: z.string(),
  skills: z.array(z.string()),
  location: z.string(),
  languages: z.array(z.string()).optional(),
  availability: z.string(),
});

const NGOInputSchema = z.object({
  uid: z.string(),
  orgName: z.string(),
  focusAreas: z.array(z.string()),
  city: z.string(),
  state: z.string(),
  operationalStates: z.array(z.string()),
  languagesSupported: z.array(z.string()).optional(),
  geographicScope: z.string(),
});

const SuggestionOutputSchema = z.object({
  suggestedNgoId: z.string(),
  suggestedNgoName: z.string(),
  reason: z.string(),
  confidenceScore: z.number(),
  rankings: z.array(z.object({
    ngoId: z.string(),
    ngoName: z.string(),
    score: z.number(),
    reason: z.string(),
  })),
});

export type SuggestNGOOutput = z.infer<typeof SuggestionOutputSchema>;

// Smart local fallback — no API needed
function localSuggest(
  volunteer: z.infer<typeof VolunteerInputSchema>,
  ngos: z.infer<typeof NGOInputSchema>[]
): SuggestNGOOutput {
  if (ngos.length === 0) {
    return {
      suggestedNgoId: "",
      suggestedNgoName: "No NGOs available",
      reason: "No approved NGOs found to match against.",
      confidenceScore: 0,
      rankings: [],
    };
  }

  const SKILL_TO_FOCUS: Record<string, string[]> = {
    "First Aid": ["Healthcare & Medical", "Disaster Relief"],
    "CPR Certified": ["Healthcare & Medical", "Disaster Relief"],
    "Medical Professional": ["Healthcare & Medical"],
    "Mental Health Support": ["Mental Health Support", "Healthcare & Medical"],
    "Food Preparation": ["Food Security"],
    "Water Purification": ["Clean Water & Sanitation"],
    "Childcare": ["Child Welfare", "Education & Literacy"],
    "Legal Aid": ["Livelihood & Skills", "Women Empowerment"],
    "Construction": ["Housing & Shelter"],
    "Animal Rescue": ["Animal Welfare"],
    "Search & Rescue": ["Disaster Relief"],
    "Logistics/Supply Chain": ["Disaster Relief", "Food Security"],
  };

  const scored = ngos.map((ngo) => {
    let score = 0;
    const reasons: string[] = [];

    // Location match (highest weight)
    const volState = volunteer.location.split(",").pop()?.trim() ?? "";
    if (ngo.operationalStates.includes(volState) || ngo.state === volState) {
      score += 40;
      reasons.push(`operates in ${volState}`);
    } else if (ngo.geographicScope === "National" || ngo.geographicScope === "International") {
      score += 20;
      reasons.push(`has ${ngo.geographicScope.toLowerCase()} reach`);
    }

    // Skill-to-focus match
    volunteer.skills.forEach((skill) => {
      const matchedFocus = SKILL_TO_FOCUS[skill] ?? [];
      matchedFocus.forEach((focus) => {
        if (ngo.focusAreas.includes(focus)) {
          score += 15;
          reasons.push(`${skill} aligns with ${focus}`);
        }
      });
    });

    // Language overlap
    const volLangs = volunteer.languages ?? [];
    const ngoLangs = ngo.languagesSupported ?? [];
    const langOverlap = volLangs.filter(l => ngoLangs.includes(l));
    if (langOverlap.length > 0) {
      score += 10;
      reasons.push(`shares ${langOverlap[0]} language`);
    }

    return {
      ngoId: ngo.uid,
      ngoName: ngo.orgName,
      score: Math.min(score, 100),
      reason: reasons.slice(0, 2).join("; ") || "General volunteer match",
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  return {
    suggestedNgoId: best.ngoId,
    suggestedNgoName: best.ngoName,
    reason: `${best.ngoName} is the best match because the volunteer's ${best.reason}.`,
    confidenceScore: best.score,
    rankings: scored,
  };
}

export const suggestNGOForVolunteer = ai.defineFlow(
  {
    name: "suggestNGOForVolunteer",
    inputSchema: z.object({
      volunteer: VolunteerInputSchema,
      ngos: z.array(NGOInputSchema),
    }),
    outputSchema: SuggestionOutputSchema,
  },
  async ({ volunteer, ngos }) => {
    if (ngos.length === 0) return localSuggest(volunteer, ngos);

    try {
      const prompt = `You are an NGO volunteer matching system for India.

A volunteer has just been approved. Based on their profile, suggest the BEST matching NGO from the list provided.

VOLUNTEER PROFILE:
- Name: ${volunteer.name}
- Location: ${volunteer.location}
- Skills: ${volunteer.skills.join(", ")}
- Languages: ${(volunteer.languages ?? []).join(", ")}
- Availability: ${volunteer.availability}

AVAILABLE NGOs:
${ngos.map((n, i) => `${i + 1}. ID: ${n.uid}
   Name: ${n.orgName}
   Location: ${n.city}, ${n.state}
   Operates in: ${n.operationalStates.join(", ")}
   Focus Areas: ${n.focusAreas.join(", ")}
   Languages: ${(n.languagesSupported ?? []).join(", ")}
   Scope: ${n.geographicScope}`).join("\n\n")}

Return a JSON object with these exact fields:
{
  "suggestedNgoId": "<uid of the best NGO>",
  "suggestedNgoName": "<name of the best NGO>",
  "reason": "<2-3 sentence explanation of why this NGO is best for the volunteer>",
  "confidenceScore": <0-100 integer>,
  "rankings": [
    { "ngoId": "<uid>", "ngoName": "<name>", "score": <0-100>, "reason": "<brief reason>" }
  ]
}

Rankings should include ALL NGOs ordered by score. Return ONLY valid JSON.`;

      const { text } = await ai.generate(prompt);
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return SuggestionOutputSchema.parse(parsed);
    } catch {
      // Fallback to local algorithm if AI fails
      return localSuggest(volunteer, ngos);
    }
  }
);
