'use server';
/**
 * @fileOverview An AI agent for analyzing ground-level data to identify and prioritize community needs.
 *
 * - prioritizeNeeds - A function that handles the prioritization process.
 * - PrioritizeNeedsInput - The input type for the prioritizeNeeds function.
 * - PrioritizeNeedsOutput - The return type for the prioritizeNeeds function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PrioritizeNeedsInputSchema = z.object({
  collectedData: z
    .string()
    .describe(
      'A comprehensive string containing all ground-level data, including OCRd text from reports, surveys, and feedback.'
    ),
  location: z
    .string()
    .optional()
    .describe('Optional: The geographical location where the data was collected.'),
  imageUrl: z
    .string()
    .optional()
    .describe('Optional: Base64 data URI of a handwritten paper survey or field image.')
});
export type PrioritizeNeedsInput = z.infer<typeof PrioritizeNeedsInputSchema>;

const PrioritizeNeedsOutputSchema = z.object({
  identifiedNeeds: z
    .array(
      z.object({
        description: z
          .string()
          .describe('A concise description of the identified need.'),
        category: z
          .enum(['Food', 'Health', 'Education', 'Shelter', 'Water', 'Other'])
          .describe(
            'The category of the need (Food, Health, Education, Shelter, Water, or Other).'
          ),
        priority: z
          .enum(['High', 'Medium', 'Low'])
          .describe('The assigned priority level (High, Medium, or Low).'),
        reasons: z
          .string()
          .describe(
            'Explanation for why this need was identified and assigned its specific priority.'
          ),
      })
    )
    .describe('A list of identified community needs with their details.'),
  overallSummary: z
    .string()
    .describe('An overall summary of the most urgent needs and their implications.'),
});
export type PrioritizeNeedsOutput = z.infer<typeof PrioritizeNeedsOutputSchema>;

export async function prioritizeNeeds(
  input: PrioritizeNeedsInput
): Promise<PrioritizeNeedsOutput> {
  return prioritizeNeedsFlow(input);
}

const prioritizeNeedsFlow = ai.defineFlow(
  {
    name: 'prioritizeNeedsFlow',
    inputSchema: PrioritizeNeedsInputSchema,
    outputSchema: PrioritizeNeedsOutputSchema,
  },
  async (input) => {
    const systemInstructions = `You are an expert humanitarian aid analyst. Your task is to analyze raw ground-level data (and optionally an image of a handwritten paper survey/field report) to identify urgent community needs, categorize them, and assign appropriate priority levels. Think step-by-step to evaluate each piece of information.

Consider the following criteria for prioritization:
-   **Severity**: How critical is the impact of the issue on the community?
-   **Number of people affected**: How many individuals are impacted?
-   **Time sensitivity**: How quickly does this need to be addressed to prevent further harm or deterioration?

Based on the provided collected data and image, perform the following:
1.  Identify all distinct community needs.
2.  For each identified need, assign a category: 'Food', 'Health', 'Education', 'Shelter', 'Water', or 'Other'.
3.  Assign a priority level to each need: 'High', 'Medium', or 'Low', justifying your reasoning.
4.  Provide an overall summary highlighting the most critical issues.

Collected Data (if any):
${input.collectedData}

Location (if any):
${input.location || 'N/A'}
`;

    // Dynamic prompt array supporting Multimodal Vision
    const promptArray: any[] = [{ text: systemInstructions }];
    
    if (input.imageUrl) {
      promptArray.push({ media: { url: input.imageUrl } });
    }

    const response = await ai.generate({
      prompt: promptArray,
      output: { schema: PrioritizeNeedsOutputSchema }
    });

    return response.output!;
  }
);
