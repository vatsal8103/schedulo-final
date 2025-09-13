'use client';

import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import type { TimetableEntry, Student, Faculty, User } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

function StudentScheduleView({ user }: { user: User }) {
  const [schedule, setSchedule] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      
      const program = user.major;
      const department = user.department;
      
      if (!program || !department) {
        setSchedule([]);
        setLoading(false);
        return;
      }

      // Fetch the timetable for that specific program and department
      const { data, error } = await supabase
        .from('timetable')
        .select('*')
        .eq('program', program)
        .eq('department', department)
        .order('day')
        .order('time');

      if (error) {
        console.error('Error fetching timetable:', error);
      } else {
        setSchedule(data.map(item => ({...item, courseName: item.course_name})));
      }
      setLoading(false);
    };

    if (user) {
        fetchSchedule();
    }
  }, [user]);
  
  const scheduleByDay = schedule.reduce((acc, entry) => {
    const day = entry.day;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(entry);
    return acc;
  }, {} as Record<string, TimetableEntry[]>);


  return (
    <Card>
      <CardHeader>
        <CardTitle>My Weekly Timetable</CardTitle>
        <CardDescription>
            {user.major && user.department 
                ? `Your schedule for the ${user.department} department of the ${user.major} program.`
                : 'Your schedule will appear here once you are enrolled in a department.'
            }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : Object.keys(scheduleByDay).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(scheduleByDay).sort(([dayA], [dayB]) => parseInt(dayA.split(' ')[1]) - parseInt(dayB.split(' ')[1])).map(([day, entries]) => (
                <div key={day}>
                    <h3 className="mb-2 text-lg font-semibold">{day}</h3>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Faculty</TableHead>
                            <TableHead>Room</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {entries.map((entry: TimetableEntry, index: number) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{entry.time}</TableCell>
                                <TableCell>{entry.courseName}</TableCell>
                                <TableCell>{entry.faculty}</TableCell>
                                <TableCell>{entry.room}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            No schedule has been generated for your department yet. Please check back later.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FacultyScheduleView({ user }: { user: Faculty }) {
  const [schedule, setSchedule] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('timetable')
        .select('*')
        .eq('faculty', user.name)
        .order('day')
        .order('time');
        
      if (error) {
        console.error('Error fetching timetable:', error);
      } else {
        setSchedule(data.map(item => ({...item, courseName: item.course_name})));
      }
      setLoading(false);
    };

    fetchSchedule();
  }, [user]);

  const scheduleByDay = schedule.reduce((acc, entry) => {
    const day = entry.day;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(entry);
    return acc;
  }, {} as Record<string, TimetableEntry[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Teaching Schedule</CardTitle>
        <CardDescription>Your assigned classes for the week.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : Object.keys(scheduleByDay).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(scheduleByDay).sort(([dayA], [dayB]) => parseInt(dayA.split(' ')[1]) - parseInt(dayB.split(' ')[1])).map(([day, entries]) => (
                <div key={day}>
                    <h3 className="mb-2 text-lg font-semibold">{day}</h3>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Program</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Room</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {entries.map((entry: TimetableEntry, index: number) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{entry.time}</TableCell>
                                <TableCell>{entry.courseName}</TableCell>
                                <TableCell><Badge variant="outline">{entry.program}</Badge></TableCell>
                                <TableCell><Badge variant="secondary">{entry.department}</Badge></TableCell>
                                <TableCell>{entry.room}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            You do not have any classes scheduled.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SchedulePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (user.role === 'student') {
    return <StudentScheduleView user={user} />;
  }

  if (user.role === 'faculty') {
    return <FacultyScheduleView user={user as any} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <p>You do not have a schedule view.</p>
      </CardContent>
    </Card>
  );
}
