'use server';

/**
 * @fileOverview Generates an optimized timetable using AI, considering course requirements, faculty availability, and room capacities for a specific program.
 *
 * - generateOptimizedTimetable - A function that generates an optimized timetable.
 * - GenerateOptimizedTimetableInput - The input type for the generateOptimizedTimetable function.
 * - GenerateOptimizedTimetableOutput - The return type for the generateOptimizedTimetable function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateOptimizedTimetableInputSchema = z.object({
  courseRequirements: z
    .string()
    .describe('JSON array of all available courses for the specified program, including duration, frequency, and prerequisites.'),
  facultyAvailability: z
    .string()
    .describe('JSON array of faculty-to-course assignments. Each object represents a valid assignment of a faculty member to a specific course.'),
  roomCapacities: z.string().describe('JSON array of all available rooms with their capacities and features.'),
  existingTimetable: z.string().optional().describe('The existing timetable to use as a baseline.'),
  days: z.number().describe('The number of days to generate the timetable for.'),
  periodsPerDay: z.number().describe('The number of periods to schedule per day.'),
  program: z.string().describe('The specific program (e.g., B.Tech, B.Sc) for which to generate the timetable.'),
  department: z.string().describe('The specific department within the program for which to generate the timetable.'),
});

export type GenerateOptimizedTimetableInput = z.infer<
  typeof GenerateOptimizedTimetableInputSchema
>;

const GenerateOptimizedTimetableOutputSchema = z.object({
  optimizedTimetable: z.string().describe('The generated optimized timetable in JSON array format. Each entry should have a "day" property (e.g., "Day 1", "Day 2").'),
  scheduleSummary: z.string().describe('A summary of the timetable generation process and decisions made.'),
});

export type GenerateOptimizedTimetableOutput = z.infer<
  typeof GenerateOptimizedTimetableOutputSchema
>;

export async function generateOptimizedTimetable(
  input: GenerateOptimizedTimetableInput
): Promise<GenerateOptimizedTimetableOutput> {
  return generateOptimizedTimetableFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateOptimizedTimetablePrompt',
  input: {
    schema: GenerateOptimizedTimetableInputSchema,
  },
  output: {
    schema: GenerateOptimizedTimetableOutputSchema,
  },
  prompt: `You are an AI timetable generator. Your primary task is to create an optimized, conflict-free timetable for the **{{department}}** department within the **{{program}}** program.

  **Primary Constraints (These are your most important rules):**
  1.  **No Conflicts:** You MUST NOT schedule the same faculty member, the same room, or the same student group (program/department) for two different classes at the same time on the same day.
  2.  **Strict Day and Period Count:** You MUST generate a schedule for exactly **{{days}}** days. For each of those days, you MUST generate exactly **{{periodsPerDay}}** periods. This is a non-negotiable requirement. Do not deviate from this number.
  3.  **No Subject Repetition on the Same Day:** You MUST NOT schedule the same course (subject) more than once on the same day. Each course should appear at most once per day.

  **Instructions:**
  1.  **Analyze Course & Faculty Assignments:** You will be given a list of courses for the '{{program}}' program and '{{department}}' department, and a list of valid faculty-to-course assignments. A faculty member can only be assigned to a course if they are explicitly linked in the provided assignments data.
  2.  **Course & Faculty Assignment:** For each scheduled class, you MUST select a faculty member who is explicitly assigned to that course in the 'facultyAvailability' data. Do not assign faculty based on department alone.
  3.  **Room Allocation:** Assign a suitable room for each class from the list of all available rooms, considering room capacity.
  4.  **Handle Unfilled Periods:** Your goal is to schedule all courses. If a course cannot be scheduled on a particular day due to a conflict, you MUST attempt to schedule it on a subsequent day. If a period slot remains empty on one day, the AI should try to fill it with a course that needs to be scheduled, effectively carrying it over.
  5.  **Time Slots:** Use standard 1.5-hour time slots (e.g., 9:00-10:30, 11:00-12:30, 13:30-15:00, 15:30-17:00, 17:30-19:00, 19:30-21:00). Adhere strictly to the "No Conflicts" primary constraint. If more periods are requested, continue this pattern.
  6.  **Output Format:** The final timetable must be a JSON array of scheduled classes. Each object in the array must include 'day', 'time', 'courseName', 'faculty', 'room', and 'credits'. **Crucially, also include a 'program' field with the value '{{program}}' and a 'department' field with the value '{{department}}' in each object.**
  7.  **Summary:** Provide a brief 'scheduleSummary' explaining the high-level decisions made (e.g., how you balanced course distribution and adhered to all primary constraints).

  **Input Data:**
  - Program to schedule for: {{program}}
  - Department to schedule for: {{department}}
  - Courses for this program/department: {{{courseRequirements}}}
  - Valid Faculty-to-Course Assignments: {{{facultyAvailability}}}
  - All Available Rooms: {{{roomCapacities}}}
  - Existing Timetable (optional, for context): {{{existingTimetable}}}

  Generate the conflict-free timetable for the '{{department}}' department of the '{{program}}' program that strictly follows all primary constraints, and provide the summary.
  `,
});

const generateOptimizedTimetableFlow = ai.defineFlow(
  {
    name: 'generateOptimizedTimetableFlow',
    inputSchema: GenerateOptimizedTimetableInputSchema,
    outputSchema: GenerateOptimizedTimetableOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
