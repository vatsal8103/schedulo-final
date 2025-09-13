'use client';

import { useFormStatus } from 'react-dom';
import { useActionState, useEffect, useRef, useState, useMemo } from 'react';
import { onGenerate, onPublish, type FormState } from './actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2, Sparkles, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TimetableEntry, Course } from '@/lib/types';
import { supabase } from '@/lib/supabase';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Timetable
        </>
      )}
    </Button>
  );
}

export function TimetableForm() {
  const initialState: FormState = { message: '' };
  const [state, formAction] = useActionState(onGenerate, initialState);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [existingTimetable, setExistingTimetable] = useState<TimetableEntry[] | null>(null);
  const [existingSummary, setExistingSummary] = useState<string | null>(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from('courses').select('program, department');
      if (error) {
        console.error('Error fetching courses:', error);
      } else if (data) {
        setCourses(data as Course[]);
      }
    };
    fetchCourses();
  }, []);
  
  useEffect(() => {
    const fetchExistingTimetable = async () => {
        if (selectedProgram && selectedDepartment) {
            setIsLoadingExisting(true);
            const {data, error} = await supabase
                .from('timetable')
                .select('*')
                .eq('program', selectedProgram)
                .eq('department', selectedDepartment)
                .order('day').order('time');
            
            if (error) {
                console.error("Error fetching existing timetable", error);
                setExistingTimetable(null);
            } else {
                const formattedData = data.map(item => ({...item, courseName: item.course_name}));
                setExistingTimetable(formattedData.length > 0 ? formattedData : null);
                if (formattedData.length > 0) {
                    setExistingSummary(`This is the currently active timetable for ${selectedProgram} - ${selectedDepartment}. You can generate a new one to replace it.`);
                } else {
                    setExistingSummary(null);
                }
            }
            setIsLoadingExisting(false);
        } else {
            setExistingTimetable(null);
            setExistingSummary(null);
        }
    };

    fetchExistingTimetable();
  }, [selectedProgram, selectedDepartment]);


  const programs = useMemo(() => {
    return [...new Set(courses.map((c) => c.program))];
  }, [courses]);

  const departments = useMemo(() => {
    if (!selectedProgram) return [];
    const depts = courses
      .filter(c => c.program === selectedProgram)
      .map(c => c.department);
    return [...new Set(depts)];
  }, [courses, selectedProgram]);


  useEffect(() => {
    if (state.message) {
      toast({
        variant: state.data ? 'default' : 'destructive',
        title: state.data ? 'Success' : 'Error',
        description: state.message,
      });
      // If a new schedule was generated successfully, clear the old "existing" one from view
      if (state.data) {
          setExistingTimetable(null);
          setExistingSummary(null);
      }
    }
  }, [state, toast]);

  const handlePublish = async () => {
    const dataToPublish = state.data || { program: selectedProgram, department: selectedDepartment };
    if (!dataToPublish.program || !dataToPublish.department) return;
    
    setPublishing(true);
    const { program, department } = dataToPublish;
    const result = await onPublish(program, department);
    toast({
      variant: result.error ? 'destructive' : 'default',
      title: result.error ? 'Error' : 'Success',
      description: result.message,
    });
    setPublishing(false);
  };
  
  const activeTimetable = state.data?.optimizedTimetable || existingTimetable;
  const activeSummary = state.data?.scheduleSummary || existingSummary;
  const activeProgram = state.data?.program || selectedProgram;
  const activeDepartment = state.data?.department || selectedDepartment;

  const timetableByDay: Record<string, TimetableEntry[]> =
    activeTimetable?.reduce(
      (acc: Record<string, TimetableEntry[]>, entry: TimetableEntry) => {
        const day = entry.day || 'Day 1';
        if (!acc[day]) {
          acc[day] = [];
        }
        acc[day].push(entry);
        return acc;
      },
      {}
    ) || {};

  return (
    <div className="space-y-6">
      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="program">Program</Label>
            <Select name="program" required onValueChange={setSelectedProgram} value={selectedProgram}>
              <SelectTrigger>
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {programs.length > 0 ? (
                  programs.map((prog) => (
                    <SelectItem key={prog} value={prog}>
                      {prog}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    Loading programs...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select name="department" required disabled={!selectedProgram} onValueChange={setSelectedDepartment} value={selectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {departments.length > 0 ? (
                  departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading" disabled>
                    {selectedProgram ? 'No departments found' : 'Select a program first'}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="days">Number of Days</Label>
            <Select name="days" required defaultValue="1">
              <SelectTrigger>
                <SelectValue placeholder="Select number of days" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    {day} Day{day > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="periods">Periods per Day</Label>
            <Input
              id="periods"
              name="periods"
              type="number"
              placeholder="e.g., 4"
              required
              defaultValue={4}
              min="1"
              max="10"
            />
          </div>
        </div>
        <input type="hidden" name="existingTimetable" value={JSON.stringify(existingTimetable || [])} />
        <SubmitButton />
      </form>

      {isLoadingExisting ? (
         <div className='flex justify-center items-center py-10'>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         </div>
      ) : activeTimetable && (
        <div className="space-y-6">
          {activeSummary && (
              <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-accent" />
                    Schedule Summary
                </CardTitle>
                </CardHeader>
                <CardContent>
                <Alert>
                    <AlertDescription>
                    {activeSummary}
                    </AlertDescription>
                </Alert>
                </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Timetable for {activeProgram} - {activeDepartment}</CardTitle>
                  <CardDescription>
                    Review the AI-optimized schedule below.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                   <Button onClick={handlePublish} disabled={publishing}>
                    {publishing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Publish & Notify
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(timetableByDay).sort(([dayA], [dayB]) => parseInt(dayA.split(' ')[1]) - parseInt(dayB.split(' ')[1])).map(([day, entries]) => (
                <div key={day}>
                  <h3 className="mb-2 text-lg font-semibold">{day}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Faculty</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead className="text-right">Credits</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map(
                        (entry: TimetableEntry, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {entry.time}
                            </TableCell>
                            <TableCell>{entry.courseName}</TableCell>
                            <TableCell>{entry.faculty}</TableCell>
                            <TableCell>{entry.room}</TableCell>
                            <TableCell className="text-right">
                              {entry.credits}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
