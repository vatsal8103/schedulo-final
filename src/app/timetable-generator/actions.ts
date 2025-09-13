'use server';

import { z } from 'zod';
import { generateOptimizedTimetable } from '@/ai/flows/generate-optimized-timetable';
import { supabase } from '@/lib/supabase';
import type { TimetableEntry } from '@/lib/types';

const generationSchema = z.object({
  days: z.coerce.number().min(1),
  periods: z.coerce.number().min(1),
  program: z.string().min(1, 'Program is required'),
  department: z.string().min(1, 'Department is required'),
  existingTimetable: z.string().optional(),
});

export type FormState = {
  message: string;
  fields?: Record<string, string>;
  issues?: string[];
  data?: {
    optimizedTimetable: any;
    scheduleSummary: string;
    program: string;
    department: string;
  };
};

export async function onGenerate(
  prevState: FormState,
  data: FormData
): Promise<FormState> {
  const formData = Object.fromEntries(data);
  const parsed = generationSchema.safeParse(formData);

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString();
    }
    return {
      message: 'Invalid form data',
      fields,
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  try {
    const { program, department } = parsed.data;

    const [coursesRes, facultyRes, roomsRes, assignmentsRes] = await Promise.all([
      supabase.from('courses').select('*').eq('program', program).eq('department', department),
      supabase.from('faculty').select('*'),
      supabase.from('rooms').select('*'),
      supabase.from('faculty_assignments').select('*, faculty(*), courses(*)'),
    ]);

    if (coursesRes.error || facultyRes.error || roomsRes.error || assignmentsRes.error) {
        throw new Error('Failed to fetch data from database.');
    }
    
    const programCourseIds = coursesRes.data.map(c => c.id);
    const relevantAssignments = assignmentsRes.data.filter(a => programCourseIds.includes(a.course_id));

    const result = await generateOptimizedTimetable({
      courseRequirements: JSON.stringify(coursesRes.data),
      facultyAvailability: JSON.stringify(relevantAssignments),
      roomCapacities: JSON.stringify(roomsRes.data),
      existingTimetable: parsed.data.existingTimetable,
      days: parsed.data.days,
      periodsPerDay: parsed.data.periods,
      program: program,
      department: department,
    });
    
    let timetableJson: TimetableEntry[];
    try {
        const jsonMatch = result.optimizedTimetable.match(/```json\n([\s\S]*?)\n```/);
        const jsonString = jsonMatch ? jsonMatch[1] : result.optimizedTimetable;
        const parsedJson = JSON.parse(jsonString);
        
        if (parsedJson && typeof parsedJson === 'object' && 'optimizedTimetable' in parsedJson && Array.isArray(parsedJson.optimizedTimetable)) {
            timetableJson = parsedJson.optimizedTimetable;
        } else if (Array.isArray(parsedJson)) {
            timetableJson = parsedJson;
        } else {
             throw new Error("The AI returned a response that was not a valid timetable array or object with an 'optimizedTimetable' property.");
        }

    } catch (e: any) {
        console.error("Failed to parse timetable JSON:", e.message);
        console.error("Received string:", result.optimizedTimetable);
        return {
            message: `The AI returned an invalid timetable format. Details: ${e.message || 'Unknown error.'}`,
        };
    }

    // Clear the existing timetable for the specific program and department
    const { error: deleteError } = await supabase.from('timetable').delete().eq('program', program).eq('department', department);
    if (deleteError) {
        console.error(`Error clearing timetable for ${program} / ${department}:`, deleteError);
        return { message: 'Failed to clear the old timetable. Please try again.' };
    }

    // Insert the new timetable
    const timetableToInsert = timetableJson.map(entry => ({
        day: entry.day,
        time: entry.time,
        course_name: entry.courseName,
        faculty: entry.faculty,
        room: entry.room,
        credits: entry.credits,
        program: entry.program || program,
        department: entry.department || department,
    }));
    
    const { error: insertError } = await supabase.from('timetable').insert(timetableToInsert);
    if (insertError) {
        console.error('Error saving timetable:', insertError);
        return { message: 'Failed to save the new timetable to the database.' };
    }
    
    return {
      message: `Timetable for ${program} - ${department} generated and saved successfully. You can now publish it to notify students.`,
      data: {
        optimizedTimetable: timetableJson,
        scheduleSummary: result.scheduleSummary,
        program,
        department
      },
    };
  } catch (error: any) {
    console.error(error);
    return {
      message: `An unexpected error occurred while generating the timetable: ${error.message || 'Please try again later.'}`,
    };
  }
}

const notifySchema = z.object({
  program: z.string(),
  department: z.string(),
});

export async function onPublish(program: string, department: string): Promise<{ message: string, error?: boolean }> {
  const parsed = notifySchema.safeParse({ program, department });
  if (!parsed.success) {
    return { message: 'Invalid data for notification.', error: true };
  }

  try {
    // 1. Get all students (including their IDs) in the specified department and program
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('major', program)
      .eq('department', department);

    if (studentError) throw studentError;
    if (!students || students.length === 0) {
      return { message: 'No students found in this department to notify.' };
    }

    const userIds = students.map(s => s.id);

    // 2. Create notifications
    const notificationMessage = `A new timetable has been published for ${program} - ${department}.`;
    const notificationsToInsert = userIds.map(userId => ({
      user_id: userId,
      message: notificationMessage,
    }));

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationsToInsert);

    if (notificationError) throw notificationError;

    return { message: `Successfully notified ${userIds.length} students.` };

  } catch (error: any) {
    console.error('Error publishing notifications:', error);
    return { message: `Failed to publish notifications: ${error.message}`, error: true };
  }
}
