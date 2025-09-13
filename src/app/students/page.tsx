'use client';

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
import { Loader2, PlusCircle, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Partial<Student>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('students').select('*');
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching students',
          description: error.message,
        });
      } else {
        setStudents(data as Student[]);
      }
      setLoading(false);
    };
    fetchStudents();
  }, [toast]);

  const openAddDialog = () => {
    setSelectedStudent({});
    setIsEditing(false);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setSelectedStudent({ ...student });
    setIsEditing(true);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    // Only basic fields are required for creation. Major/dept are optional.
    if (!selectedStudent || !selectedStudent.id || !selectedStudent.name || !selectedStudent.email) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out ID, Name, and Email fields.',
      });
      return;
    }

    let error, data;
    const studentData = {
        id: selectedStudent.id,
        name: selectedStudent.name,
        email: selectedStudent.email,
        major: selectedStudent.major || null,
        department: selectedStudent.department || null,
    };

    if (isEditing) {
        const { data: updateData, error: updateError } = await supabase.from('students').update(studentData).eq('id', studentData.id!).select();
        data = updateData;
        error = updateError;
    } else {
        // This is for manual creation by admin. We assume the user already exists in auth.users
        const { data: insertData, error: insertError } = await supabase.from('students').insert([studentData]).select();
        data = insertData;
        error = insertError;
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: `Error ${isEditing ? 'updating' : 'adding'} student`,
        description: error.message,
      });
    } else if (data && data.length > 0) {
      toast({
        title: `Student ${isEditing ? 'updated' : 'added'} successfully`,
      });
      if (isEditing) {
        setStudents(
          students.map((s) => (s.id === selectedStudent!.id ? data![0] : s))
        );
      } else {
        setStudents(prev => [...prev, data[0]]);
      }
      setIsFormDialogOpen(false);
      setSelectedStudent({});
    }
  };

  const handleFieldChange = (field: keyof Student, value: string) => {
    setSelectedStudent(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            Manage your institution's student records.
          </CardDescription>
        </div>
        <Button size="sm" className="gap-1" onClick={openAddDialog}>
          <PlusCircle className="h-4 w-4" />
          Add Student
        </Button>
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
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Major</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.id}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>
                    {student.major ? <Badge variant="outline">{student.major}</Badge> : <span className="text-muted-foreground">N/A</span>}
                  </TableCell>
                  <TableCell>
                    {student.department ? <Badge variant="secondary">{student.department}</Badge> : <span className="text-muted-foreground">N/A</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(student)}
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
            <DialogTitle>{isEditing ? 'Edit Student' : 'Add Student'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the details for this student.' : 'Enter the details for the new student.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!isEditing && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="id" className="text-right">
                  Student ID
                </Label>
                <Input
                  id="id"
                  value={selectedStudent?.id || ''}
                  onChange={(e) => handleFieldChange('id', e.target.value)}
                  className="col-span-3"
                  placeholder="The user's Auth ID"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={selectedStudent?.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={selectedStudent?.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="major" className="text-right">
                Major
              </Label>
              <Input
                id="major"
                value={selectedStudent?.major || ''}
                onChange={(e) => handleFieldChange('major', e.target.value)}
                className="col-span-3"
                placeholder="(Optional)"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Input
                id="department"
                value={selectedStudent?.department || ''}
                onChange={(e) => handleFieldChange('department', e.target.value)}
                className="col-span-3"
                placeholder="(Optional)"
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
              {isEditing ? 'Save Changes' : 'Add Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
