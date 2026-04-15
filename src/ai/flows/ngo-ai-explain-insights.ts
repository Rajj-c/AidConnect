'use server';
/**
 * @fileOverview This file implements a Genkit flow to provide transparent explanations
 * for AI decisions regarding community need prioritization and volunteer matching.
 *
 * - explainInsights - A function that takes input about a prioritized need and matched volunteers
 *   and returns detailed explanations from the AI.
 * - ExplainInsightsInput - The input type for the explainInsights function.
 * - ExplainInsightsOutput - The return type for the explainInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * Schema for the input to the explainInsights flow.
 * Contains details about the community need, the associated task, and the matched volunteers.
 */
const ExplainInsightsInputSchema = z.object({
  need: z.object({
    id: z.string().describe('Unique identifier for the community need.').optional(),
    description: z.string().describe('Detailed description of the community need.'),
    category: z.string().describe('Category of the need (e.g., Food, Health, Education).'),
    severityScore: z.number().describe('A numerical score indicating the severity of the need (e.g., 1-10, higher is more severe).'),
    peopleAffectedCount: z.number().describe('The number of people affected by this need.'),
    timeSensitivity: z.string().describe('Indicates how time-sensitive the need is (e.g., "urgent", "medium", "low").'),
    priorityLevel: z.string().describe('The assigned priority level (e.g., "High", "Medium", "Low").'),
  }).describe('Details of the prioritized community need.'),
  task: z.object({
    id: z.string().describe('Unique identifier for the task related to the need.').optional(),
    description: z.string().describe('Description of the task to address the need.'),
    requiredSkills: z.array(z.string()).describe('Skills required to perform this task (e.g., "medical", "logistics", "teaching").'),
    requiredLocation: z.string().describe('Location where the task needs to be performed.'),
  }).describe('Details of the task associated with the need.'),
  matchedVolunteers: z.array(z.object({
    id: z.string().describe('Unique identifier for the volunteer.').optional(),
    name: z.string().describe('Name of the volunteer.'),
    skills: z.array(z.string()).describe('Skills possessed by the volunteer.'),
    location: z.string().describe('Current or preferred location of the volunteer.'),
    availability: z.string().describe('Availability status of the volunteer (e.g., "available", "on-leave", "busy").'),
  })).describe('List of volunteers recommended for the task.'),
});
export type ExplainInsightsInput = z.infer<typeof ExplainInsightsInputSchema>;

/**
 * Schema for the output of the explainInsights flow.
 * Contains separate explanations for priority and volunteer matching.
 */
const ExplainInsightsOutputSchema = z.object({
  priorityExplanation: z.string().describe('A detailed explanation of why the community need was assigned its specific priority level.'),
  matchingExplanation: z.string().describe('A detailed explanation of why the specific volunteers were recommended for the task.'),
});
export type ExplainInsightsOutput = z.infer<typeof ExplainInsightsOutputSchema>;

/**
 * Defines the Genkit prompt for generating explanations for priority and matching.
 * It takes structured input about a need, task, and volunteers and requests two distinct explanations.
 */
const explainPriorityAndMatchingPrompt = ai.definePrompt({
  name: 'explainPriorityAndMatchingPrompt',
  input: { schema: ExplainInsightsInputSchema },
  output: { schema: ExplainInsightsOutputSchema },
  prompt: `You are an AI system designed to provide transparent explanations for decisions made in a volunteer coordination platform. Your goal is to help NGO administrators understand why certain priorities were assigned and why specific volunteers were matched to tasks. You need to sound professional and trustworthy.

Provide a clear and concise explanation for the given community need's priority level and the volunteer matching decision.

Community Need Details:
- Description: {{{need.description}}}
- Category: {{{need.category}}}
- Severity Score: {{{need.severityScore}}} (on a scale where higher is more severe)
- People Affected: {{{need.peopleAffectedCount}}}
- Time Sensitivity: {{{need.timeSensitivity}}}
- Assigned Priority: {{{need.priorityLevel}}}

Task Details:
- Description: {{{task.description}}}
- Required Skills: {{#each task.requiredSkills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Required Location: {{{task.requiredLocation}}}

Matched Volunteers:
{{#if matchedVolunteers.length}}
{{#each matchedVolunteers}}
- Name: {{{this.name}}}
- Skills: {{#each this.skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Location: {{{this.location}}}
- Availability: {{{this.availability}}}
{{/each}}
{{else}}
No volunteers were matched for this task.
{{/if}}

Based on the information provided, generate two separate explanations:

1.  **Priority Explanation**: Explain why the community need "{{{need.description}}}" was assigned a priority level of "{{{need.priorityLevel}}}". Highlight the key factors that led to this prioritization, such as severity, number of people affected, and time sensitivity.
2.  **Matching Explanation**: Explain why the listed volunteers were recommended for the task "{{{task.description}}}" at "{{{task.requiredLocation}}}". Focus on how their skills, location, and availability align with the task requirements. If no volunteers were matched, explain why (e.g., no suitable volunteers found, or current volunteer profiles do not meet the criteria).`,
});

/**
 * Defines the Genkit flow named 'explainPriorityAndMatchingFlow'.
 * This flow takes the structured input, calls the prompt to generate explanations,
 * and returns the AI-generated explanations.
 */
const explainPriorityAndMatchingFlow = ai.defineFlow(
  {
    name: 'explainPriorityAndMatchingFlow',
    inputSchema: ExplainInsightsInputSchema,
    outputSchema: ExplainInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await explainPriorityAndMatchingPrompt(input);
    return output!;
  }
);

/**
 * Wrapper function to call the explainPriorityAndMatchingFlow.
 * This function provides a clean API for external Next.js components to interact with the Genkit flow.
 * @param input - An object containing details about the community need, task, and matched volunteers.
 * @returns A Promise that resolves to an object containing detailed explanations for priority and matching.
 */
export async function explainInsights(input: ExplainInsightsInput): Promise<ExplainInsightsOutput> {
  return explainPriorityAndMatchingFlow(input);
}
