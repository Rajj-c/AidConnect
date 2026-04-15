'use server';
/**
 * @fileOverview An AI agent that intelligently matches available volunteers with specific tasks and locations.
 *
 * - matchVolunteers - A function that handles the volunteer matching process.
 * - MatchVolunteersInput - The input type for the matchVolunteers function.
 * - MatchVolunteersOutput - The return type for the matchVolunteers function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TaskSchema = z.object({
  id: z.string().describe('Unique identifier for the task.'),
  description: z.string().describe('Detailed description of the task.'),
  requiredSkills: z.array(z.string()).describe('Skills required to complete the task (e.g., medical, teaching, driving).'),
  location: z.object({
    latitude: z.number().describe('Latitude of the task location.'),
    longitude: z.number().describe('Longitude of the task location.'),
  }).describe('Geographical coordinates of the task.'),
  priority: z.enum(['High', 'Medium', 'Low']).describe('Priority level of the task.'),
  urgencyScore: z.number().describe('A numeric score indicating the urgency of the task (higher is more urgent).'),
}).describe('Details of a high-priority task needing a volunteer.');

const VolunteerSchema = z.object({
  id: z.string().describe('Unique identifier for the volunteer.'),
  name: z.string().describe('Name of the volunteer.'),
  skills: z.array(z.string()).describe('Skills possessed by the volunteer.'),
  availability: z.string().describe('Description of the volunteer\'s availability (e.g., "available today from 9 AM to 5 PM", "weekends only").'),
  currentLocation: z.object({
    latitude: z.number().describe('Latitude of the volunteer\'s current location.'),
    longitude: z.number().describe('Longitude of the volunteer\'s current location.'),
  }).describe('Geographical coordinates of the volunteer\'s current location.'),
}).describe('Details of an available volunteer.');

const MatchVolunteersInputSchema = z.object({
  tasks: z.array(TaskSchema).describe('A list of high-priority tasks that need volunteers.'),
  volunteers: z.array(VolunteerSchema).describe('A list of available volunteers.'),
}).describe('Input for matching volunteers to tasks.');

export type MatchVolunteersInput = z.infer<typeof MatchVolunteersInputSchema>;

const MatchSchema = z.object({
  taskId: z.string().describe('The ID of the task that was matched.'),
  volunteerId: z.string().describe('The ID of the volunteer assigned to the task.'),
  reason: z.string().describe('A detailed explanation of why this volunteer was matched to this task, considering skills, proximity, availability, and task priority.'),
}).describe('A matched task and volunteer pair with the reasoning.');

const MatchVolunteersOutputSchema = z.object({
  matches: z.array(MatchSchema).describe('A list of recommended volunteer-to-task matches.'),
}).describe('Output containing the recommended volunteer-to-task matches.');

export type MatchVolunteersOutput = z.infer<typeof MatchVolunteersOutputSchema>;

export async function matchVolunteers(input: MatchVolunteersInput): Promise<MatchVolunteersOutput> {
  return matchVolunteersFlow(input);
}

const matchVolunteersPrompt = ai.definePrompt({
  name: 'matchVolunteersPrompt',
  input: { schema: MatchVolunteersInputSchema },
  output: { schema: MatchVolunteersOutputSchema },
  prompt: `You are an intelligent volunteer coordination system designed to efficiently match available volunteers with high-priority tasks. Your primary goal is to maximize the impact of aid efforts by considering all relevant factors to assign the right volunteer to the right task at the right location and time.

Here are the high-priority tasks that need volunteers:
{{{JSON.stringify tasks}}}

Here are the available volunteers and their details:
{{{JSON.stringify volunteers}}}

Analyze these tasks and volunteers carefully. For each task, identify the most suitable volunteer(s) based on the following criteria:
1.  **Required Skills**: Does the volunteer possess all or most of the skills needed for the task?
2.  **Geographical Proximity**: Is the volunteer's current location reasonably close to the task's location? (Consider the provided latitude and longitude for an estimate of closeness. Closer is better, especially for high-priority tasks).
3.  **Availability**: Is the volunteer available during the time the task needs to be performed, or is their general availability suitable for the task's urgency?
4.  **Task Priority and Urgency**: High priority and urgent tasks should be prioritized for matching with the best-fit volunteers.

Your output MUST be a JSON array of matches, where each match includes the 'taskId', 'volunteerId', and a detailed 'reason' field. The 'reason' field should clearly articulate why that specific volunteer is a good match for the task, explicitly referencing their skills, proximity, availability, and the task's priority and urgency. Aim to provide the most optimal matches possible to maximize efficiency and impact.`,
});

const matchVolunteersFlow = ai.defineFlow(
  {
    name: 'matchVolunteersFlow',
    inputSchema: MatchVolunteersInputSchema,
    outputSchema: MatchVolunteersOutputSchema,
  },
  async (input) => {
    const { output } = await matchVolunteersPrompt(input);
    return output!;
  },
);
