'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VolunteerAssistantInputSchema = z.object({
  message: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })).optional()
});

const VolunteerAssistantOutputSchema = z.object({
  reply: z.string()
});

export const volunteerAssistant = ai.defineFlow(
  {
    name: 'volunteerAssistant',
    inputSchema: VolunteerAssistantInputSchema,
    outputSchema: VolunteerAssistantOutputSchema,
  },
  async (input) => {
    const systemPrompt = `You are AidConnect's AI Field Operations Assistant. You are advising a disaster relief volunteer who is currently out in the field.
Provide highly practical, safe, and concise advice. 
If they ask about medical emergencies, prioritize safety and advise contacting professionals if severe.
If they ask about logistics or dealing with specific situations (e.g., floods, fire, uncooperative crowds), provide structured, clear steps.
Always be encouraging, calm, and professional. Keep answers relatively short (2-4 sentences max unless they ask for a detailed list) because they are reading this on a mobile device in the field.`;

    let prompt = `${systemPrompt}\n\n`;
    if (input.history) {
      for (const msg of input.history) {
        prompt += `${msg.role === 'user' ? 'Volunteer' : 'Assistant'}: ${msg.content}\n`;
      }
    }
    prompt += `Volunteer: ${input.message}\nAssistant:`;

    try {
      const response = await ai.generate({
        prompt
      });

      return { reply: response.text };
    } catch (err: any) {
      console.error("AI Assistant Error:", err.message);
      
      // Smart Fallback for Hackathon Demo when API Quota is exceeded
      const msg = input.message.toLowerCase();
      if (msg.includes("flood") || msg.includes("water") || msg.includes("road")) {
        return { reply: "If roads are flooded, do not attempt to cross moving water. Find higher ground and ping the Command Centre for an alternate safe route." };
      }
      if (msg.includes("medical") || msg.includes("hurt") || msg.includes("blood") || msg.includes("injury")) {
        return { reply: "For medical emergencies, prioritize stabilizing the patient. Ensure scene safety and use your first-aid kit. If severe, hit the SOS button immediately." };
      }
      if (msg.includes("food") || msg.includes("supply") || msg.includes("distribute")) {
        return { reply: "When distributing supplies, ensure you form an orderly line first to prevent crowding. Hand out items only to verified families." };
      }
      
      return { reply: "Understood. Please proceed with caution and follow standard operating procedures. Let me know if you encounter specific logistical or medical issues." };
    }
  }
);
