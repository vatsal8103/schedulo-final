
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, BookUser, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { Course, Faculty, FacultyAssignment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AssignmentsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allFaculty, setAllFaculty] = useState<Faculty[]>([]);
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [coursesRes, facultyRes, assignmentsRes] = await Promise.all([
      supabase.from('courses').select('*').order('name'),
      supabase.from('faculty').select('*'),
      supabase.from('faculty_assignments').select('*'),
    ]);

    if (coursesRes.error || facultyRes.error || assignmentsRes.error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching data',
        description:
          coursesRes.error?.message ||
          facultyRes.error?.message ||
          assignmentsRes.error?.message,
      });
    } else {
      setCourses(coursesRes.data as Course[]);
      setAllFaculty(facultyRes.data as Faculty[]);
      setAssignments(assignmentsRes.data as FacultyAssignment[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const assignmentsByCourse = useMemo(() => {
    const map = new Map<string, Faculty[]>();
    courses.forEach(course => {
      const courseAssignments = assignments.filter(a => a.course_id === course.id);
      const facultyForCourse = courseAssignments.map(ca => allFaculty.find(f => f.id === ca.faculty_id)).filter(Boolean) as Faculty[];
      map.set(course.id, facultyForCourse);
    });
    return map;
  }, [courses, assignments, allFaculty]);

  const handleManageClick = (course: Course) => {
    setSelectedCourse(course);
    const currentFacultyIds = assignments
      .filter(a => a.course_id === course.id)
      .map(a => a.faculty_id);
    setSelectedFacultyIds(new Set(currentFacultyIds));
    setIsDialogOpen(true);
  };

  const handleFacultySelectionChange = (facultyId: string, isSelected: boolean | 'indeterminate') => {
    setSelectedFacultyIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(facultyId);
      } else {
        newSet.delete(facultyId);
      }
      return newSet;
    });
  };
  
  const handleSaveChanges = async () => {
    if (!selectedCourse) return;

    const currentAssignments = assignments
      .filter(a => a.course_id === selectedCourse.id)
      .map(a => a.faculty_id);
    
    const toAdd = [...selectedFacultyIds].filter(id => !currentAssignments.includes(id));
    const toRemove = currentAssignments.filter(id => !selectedFacultyIds.has(id));

    let hasError = false;

    if (toRemove.length > 0) {
      const { error } = await supabase
        .from('faculty_assignments')
        .delete()
        .eq('course_id', selectedCourse.id)
        .in('faculty_id', toRemove);
      
      if (error) {
        hasError = true;
        toast({ variant: 'destructive', title: 'Error removing assignments', description: error.message });
      }
    }

    if (toAdd.length > 0) {
      const newAssignments = toAdd.map(faculty_id => ({
        course_id: selectedCourse.id,
        faculty_id: faculty_id,
      }));
      const { error } = await supabase.from('faculty_assignments').insert(newAssignments);
      
      if (error) {
        hasError = true;
        toast({ variant: 'destructive', title: 'Error adding assignments', description: error.message });
      }
    }
    
    if (!hasError) {
      toast({ title: 'Assignments updated successfully!' });
      setIsDialogOpen(false);
      fetchData(); // Re-fetch all data to ensure UI is consistent
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookUser className="h-6 w-6" />
          Faculty Course Assignments
        </CardTitle>
        <CardDescription>
          Assign faculty members to the courses they are qualified to teach.
          This will be used by the AI to generate timetables.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Assigned Faculty</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => {
                const assignedFaculty = assignmentsByCourse.get(course.id) || [];
                return (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      <div className='flex flex-col'>
                        <span>{course.name}</span>
                        <span className='text-sm text-muted-foreground'>{course.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {assignedFaculty.length > 0 ? (
                          assignedFaculty.map(faculty => (
                            <Badge key={faculty.id} variant="secondary">
                              {faculty.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">No faculty assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageClick(course)}
                      >
                        Manage Assignments
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Assignments for {selectedCourse?.name}</DialogTitle>
            <DialogDescription>
              Select the faculty members who can teach this course.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <div className="space-y-4 p-1">
              {allFaculty.map(faculty => (
                <div key={faculty.id} className="flex items-center space-x-2">
                   <Checkbox
                    id={`faculty-${faculty.id}`}
                    checked={selectedFacultyIds.has(faculty.id)}
                    onCheckedChange={(checked) => handleFacultySelectionChange(faculty.id, checked)}
                  />
                  <Label htmlFor={`faculty-${faculty.id}`} className='flex flex-col'>
                    <span>{faculty.name}</span>
                    <span className='text-xs text-muted-foreground'>{faculty.department}</span>
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
             <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveChanges}>
              <UserCheck className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
