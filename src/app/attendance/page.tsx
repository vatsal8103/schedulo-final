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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useAttendance } from '@/hooks/use-attendance';
import type { TimetableEntry, Student as StudentType } from '@/lib/types';

const getCurrentDay = () => {
  const dayIndex = new Date().getDay(); // Sunday is 0, Monday is 1, etc.
  // We'll map Sunday (0) and Saturday (6) to Day 1 for demo purposes, as timetables are usually for weekdays.
  const dayMap = [1, 1, 2, 3, 4, 5, 1];
  return `Day ${dayMap[dayIndex]}`;
};


function FacultyAttendanceView() {
  const [schedule, setSchedule] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      const today = getCurrentDay();
      const { data, error } = await supabase
        .from('timetable')
        .select('*')
        .eq('day', today);
      
      if (error) {
        console.error(error);
      } else {
        setSchedule(data.map(item => ({...item, courseName: item.course_name})));
      }
      setLoading(false);
    };
    fetchSchedule();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Attendance</CardTitle>
        <CardDescription>
          Mark attendance for your classes scheduled today.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : schedule.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Program</TableHead>
                <TableHead className='text-center'>Mark All Present</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.time}</TableCell>
                  <TableCell className="font-medium">{item.courseName}</TableCell>
                  <TableCell>{item.room}</TableCell>
                  <TableCell><Badge variant="outline">{item.program}</Badge></TableCell>
                  <TableCell className='text-center'>
                    <Checkbox
                      aria-label={`Mark all students present for ${item.courseName}`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
             <div className="text-center text-muted-foreground py-10">
                No classes scheduled for today.
             </div>
        )}
      </CardContent>
    </Card>
  );
}

function StudentAttendanceView() {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<StudentType | null>(null);
  const [todaysClasses, setTodaysClasses] = useState<any[]>([]);
  const [overallAttendance, setOverallAttendance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [randomSeed, setRandomSeed] = useState<number | null>(null);

  useEffect(() => {
    // This runs only on the client, after hydration, to avoid server/client mismatch
    setRandomSeed(Math.random());
  }, []);


  useEffect(() => {
    const fetchStudentAndSchedule = async () => {
        if (!user || randomSeed === null) return;
        setLoading(true);

        // 1. Fetch student's major/program
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('major')
            .eq('email', user.email)
            .single();

        if (studentError || !student) {
            console.error('Error fetching student data:', studentError);
            setLoading(false);
            setTodaysClasses([]);
            return;
        }

        const studentProgram = student.major;
        setStudentData(student as StudentType);
        
        // 2. Fetch today's schedule for that program
        const today = getCurrentDay();
        const { data, error } = await supabase
            .from('timetable')
            .select('*')
            .eq('day', today)
            .eq('program', studentProgram);

        if (error) {
            console.error(`Error fetching timetable for program ${studentProgram}:`, error);
            setTodaysClasses([]);
        } else {
            // In a real app, attendance would be recorded. For now, simulate it.
            let pseudoRandom = randomSeed;
            const nextPseudoRandom = () => {
              const x = Math.sin(pseudoRandom++) * 10000;
              return x - Math.floor(x);
            };

            const studentClasses = data.map(c => ({
                ...c,
                courseName: c.course_name,
                status: nextPseudoRandom() > 0.15 ? 'Present' : 'Absent',
            }));
            setTodaysClasses(studentClasses);

            if (studentClasses.length > 0) {
              const presentCount = studentClasses.filter(d => d.status === 'Present').length;
              setOverallAttendance(Math.round((presentCount / studentClasses.length) * 100));
            } else {
              setOverallAttendance(100); // No classes, so 100%
            }
        }
        setLoading(false);
    };
    
    fetchStudentAndSchedule();
  }, [user, randomSeed]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Daily Attendance</CardTitle>
        <CardDescription>
          Your attendance record for classes scheduled today for the {studentData?.major} program.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Overall Attendance Today</Label>
                <span
                  className={`text-xl font-bold ${
                    overallAttendance >= 85 ? 'text-green-600' : 'text-destructive'
                  }`}
                >
                  {overallAttendance}%
                </span>
              </div>
              <Progress value={overallAttendance} />
            </div>

            {todaysClasses.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {todaysClasses.map((record) => (
                    <TableRow key={record.id}>
                        <TableCell>{record.time}</TableCell>
                        <TableCell>{record.courseName}</TableCell>
                        <TableCell>
                        <Badge
                            variant={
                            record.status === 'Present'
                                ? 'secondary'
                                : 'destructive'
                            }
                        >
                            {record.status}
                        </Badge>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="text-center text-muted-foreground py-10">
                    You have no classes scheduled for today in your program.
                </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AdminAttendanceView() {
    const { attendanceStats, loading } = useAttendance();
    
    return (
        <div className="grid gap-6">
             <Card>
                <CardHeader>
                    <CardTitle>Overall Attendance Visualization</CardTitle>
                    <CardDescription>A summary of attendance across all courses.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className='flex justify-center items-center py-10 h-[300px]'>
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                    <ChartContainer config={{}} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={attendanceStats} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="courseId"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} unit="%" />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="average" fill="var(--color-primary)" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Attendance by Course</CardTitle>
                    <CardDescription>Detailed attendance statistics for each course.</CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? (
                         <div className='flex justify-center items-center py-10'>
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Course</TableHead>
                                <TableHead>Average Attendance</TableHead>
                                <TableHead>Total Classes</TableHead>
                                <TableHead>Highest Attendance</TableHead>
                                <TableHead>Lowest Attendance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendanceStats.map(stat => (
                                <TableRow key={stat.courseId}>
                                    <TableCell className='font-medium'>{stat.courseName} ({stat.courseId})</TableCell>
                                    <TableCell>
                                        <Badge variant={stat.average < 85 ? 'destructive' : 'default'}>{stat.average.toFixed(1)}%</Badge>
                                    </TableCell>
                                    <TableCell>{stat.totalClasses}</TableCell>
                                    <TableCell>{stat.highest.toFixed(1)}%</TableCell>
                                    <TableCell>{stat.lowest.toFixed(1)}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}


export default function AttendancePage() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminAttendanceView />;
  }
  
  if (user?.role === 'faculty') {
    return <FacultyAttendanceView />;
  }

  if (user?.role === 'student') {
    return <StudentAttendanceView />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <p>You do not have access to this page.</p>
      </CardContent>
    </Card>
  );
}
