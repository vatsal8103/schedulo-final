'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Course } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useEnrollment } from '@/hooks/use-enrollment';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

function AdminCoursesView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Partial<Course>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('courses').select('*');
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching courses',
          description: error.message,
        });
      } else {
        setCourses(data as Course[]);
      }
      setLoading(false);
    };
    fetchCourses();
  }, [toast]);

  const openAddDialog = () => {
    setSelectedCourse({});
    setIsEditing(false);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setSelectedCourse({ ...course });
    setIsEditing(true);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!selectedCourse || !selectedCourse.id || !selectedCourse.name || !selectedCourse.credits || !selectedCourse.department || !selectedCourse.program) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all fields.',
      });
      return;
    }
    
    let error, data;
    
    const courseData = {
        id: selectedCourse.id,
        name: selectedCourse.name,
        credits: selectedCourse.credits,
        department: selectedCourse.department,
        program: selectedCourse.program,
    };

    if (isEditing) {
        const { data: updateData, error: updateError } = await supabase.from('courses').update(courseData).eq('id', courseData.id!).select();
        data = updateData;
        error = updateError;
    } else {
        const { data: insertData, error: insertError } = await supabase.from('courses').insert([courseData]).select();
        data = insertData;
        error = insertError;
    }


    if (error) {
      toast({
        variant: 'destructive',
        title: `Error ${isEditing ? 'updating' : 'adding'} course`,
        description: error.message,
      });
    } else if (data && data.length > 0) {
      toast({
        title: `Course ${isEditing ? 'updated' : 'added'} successfully`,
      });
      if (isEditing) {
        setCourses(courses.map((c) => (c.id === selectedCourse!.id ? data![0] : c)));
      } else {
        setCourses(prev => [...prev, data[0]]);
      }
      setIsFormDialogOpen(false);
      setSelectedCourse({});
    }
  };

  const handleFieldChange = (field: keyof Course, value: string | number) => {
    setSelectedCourse(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Courses</CardTitle>
          <CardDescription>Manage your institution's courses.</CardDescription>
        </div>
        <Button size="sm" className="gap-1" onClick={openAddDialog}>
          <PlusCircle className="h-4 w-4" />
          Add Course
        </Button>
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
                <TableHead>Course ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.id}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{course.program}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{course.department}</Badge>
                  </TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(course)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Course' : 'Add Course'}</DialogTitle>
             <DialogDescription>
              {isEditing ? 'Update the details for this course.' : 'Enter the details for the new course.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             {!isEditing && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="id" className="text-right">
                  Course ID
                </Label>
                <Input
                  id="id"
                  value={selectedCourse?.id || ''}
                  onChange={(e) => handleFieldChange('id', e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., CS101"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={selectedCourse?.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="program" className="text-right">
                Program
              </Label>
              <Input
                id="program"
                value={selectedCourse?.program || ''}
                onChange={(e) => handleFieldChange('program', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Input
                id="department"
                value={selectedCourse?.department || ''}
                onChange={(e) =>
                  handleFieldChange('department', e.target.value)
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="credits" className="text-right">
                Credits
              </Label>
              <Input
                id="credits"
                type="number"
                value={selectedCourse?.credits || ''}
                onChange={(e) =>
                  handleFieldChange('credits', parseInt(e.target.value, 10) || 0)
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" onClick={handleFormSubmit}>
              {isEditing ? 'Save Changes' : 'Add Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function StudentCoursesView() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const { toast } = useToast();
  const { getEnrollmentStatus, addEnrollmentRequest, loading: enrollmentLoading } = useEnrollment();

   useEffect(() => {
    const fetchCourses = async () => {
      setDbLoading(true);
      const { data, error } = await supabase.from('courses').select('*').order('department');
      if (error) {
        console.error('Error fetching courses:', error);
      } else {
        setCourses(data as Course[]);
      }
      setDbLoading(false);
    };
    fetchCourses();
  }, []);
  
  const coursesByProgram = useMemo(() => {
    return courses.reduce((acc, course) => {
      const program = course.program;
      if (!acc[program]) {
        acc[program] = { departments: new Set(), courses: [] };
      }
      acc[program].departments.add(course.department);
      acc[program].courses.push(course);
      return acc;
    }, {} as Record<string, { departments: Set<string>, courses: Course[] }>);
  }, [courses]);


  const openEnrollDialog = (program: string) => {
    setSelectedProgram(program);
    setSelectedDepartment(null);
    setIsEnrollDialogOpen(true);
  }

  const handleEnrollConfirm = async () => {
    if (!selectedProgram || !selectedDepartment) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a department.' });
        return;
    }
    await addEnrollmentRequest(selectedProgram, selectedDepartment);
    setIsEnrollDialogOpen(false);
  };

  const loading = dbLoading || enrollmentLoading;

  const departmentsForSelectedProgram = selectedProgram ? Array.from(coursesByProgram[selectedProgram]?.departments || []) : [];

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Course Registration</CardTitle>
        <CardDescription>
          Enroll in a department to access course materials and schedules.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className='flex justify-center items-center py-10'>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : (
        <Accordion type="multiple" className="w-full">
          {Object.entries(coursesByProgram).map(([program, {courses: programCourses}]) => {
            const status = getEnrollmentStatus(program);

            const coursesByDept = programCourses.reduce((acc, course) => {
                const dept = course.department;
                if (!acc[dept]) acc[dept] = [];
                acc[dept].push(course);
                return acc;
            }, {} as Record<string, Course[]>);

            return (
                <AccordionItem value={program} key={program}>
                <AccordionTrigger>
                    <div className="flex w-full items-center justify-between pr-4">
                    <span className="text-lg font-semibold">{program}</span>
                    {status === 'Pending' ? (
                        <Button size="sm" disabled variant="secondary">
                        <Clock className="mr-2 h-4 w-4" />
                        Applied
                        </Button>
                    ) : status === 'Approved' ? (
                        <Button size="sm" disabled variant="secondary">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Enrolled
                        </Button>
                    ) : status === 'Rejected' ? (
                        <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            openEnrollDialog(program);
                        }}
                        >
                        Re-apply for Enrollment
                        </Button>
                    ) : (
                        <Button
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            openEnrollDialog(program);
                        }}
                        >
                        Enroll in Program
                        </Button>
                    )}
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    {status === 'Approved' ? (
                        <div className='space-y-4 p-1'>
                         {Object.entries(coursesByDept).map(([dept, coursesInDept]) => (
                            <div key={dept}>
                                <h4 className="mb-2 font-semibold text-md">{dept}</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Course ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Credits</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {coursesInDept.map(course => (
                                            <TableRow key={course.id}>
                                                <TableCell>{course.id}</TableCell>
                                                <TableCell>{course.name}</TableCell>
                                                <TableCell>{course.credits}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                         ))}
                         </div>
                    ) : (
                        <div className="p-4 text-center text-muted-foreground">
                            <p>You must be enrolled in this program to view the courses.</p>
                             {status === 'Pending' && <p>Your access will be granted once your enrollment is approved by an administrator.</p>}
                             {status === 'Rejected' && <p>Your enrollment request for this program was rejected. You can re-apply.</p>}
                        </div>
                    )}
                </AccordionContent>
                </AccordionItem>
            )
          })}
        </Accordion>
        )}
      </CardContent>
    </Card>

    <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enroll in {selectedProgram}</DialogTitle>
          <DialogDescription>
            Please select your department to continue with the enrollment.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="department-select">Department</Label>
           <Select onValueChange={setSelectedDepartment} value={selectedDepartment ?? ''}>
                <SelectTrigger id="department-select">
                    <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                    {departmentsForSelectedProgram.map(dept => (
                        <SelectItem key={dept} value={dept}>
                            {dept}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEnrollConfirm} disabled={!selectedDepartment}>Confirm Enrollment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

export default function CoursesPage() {
  const { user } = useAuth();

  if (user?.role === 'admin' || user?.role === 'faculty') {
    return <AdminCoursesView />;
  }

  if (user?.role === 'student') {
    return <StudentCoursesView />;
  }

  return (
     <Card>
      <CardHeader>
        <CardTitle>My Courses</CardTitle>
        <CardDescription>View the courses you are teaching.</CardDescription>
      </CardHeader>
       <CardContent>
         <p>You do not have access to this page.</p>
      </CardContent>
    </Card>
  )
}
