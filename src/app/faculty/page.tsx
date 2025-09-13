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
import type { Faculty } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Partial<Faculty>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchFaculty = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('faculty').select('*');
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching faculty',
          description: error.message,
        });
      } else {
        setFaculty(data as Faculty[]);
      }
      setLoading(false);
    };
    fetchFaculty();
  }, [toast]);

  const openAddDialog = () => {
    setSelectedFaculty({});
    setIsEditing(false);
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (member: Faculty) => {
    setSelectedFaculty({ ...member });
    setIsEditing(true);
    setIsFormDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!selectedFaculty || !selectedFaculty.name || !selectedFaculty.id || !selectedFaculty.email || !selectedFaculty.department) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all fields.',
      });
      return;
    }

    let error, data;
    const facultyData = {
        id: selectedFaculty.id,
        name: selectedFaculty.name,
        email: selectedFaculty.email,
        department: selectedFaculty.department,
    };

    if (isEditing) {
        const { data: updateData, error: updateError } = await supabase.from('faculty').update(facultyData).eq('id', facultyData.id!).select();
        data = updateData;
        error = updateError;
    } else {
        const { data: insertData, error: insertError } = await supabase.from('faculty').insert([facultyData]).select();
        data = insertData;
        error = insertError;
    }

    if (error) {
      toast({
        variant: 'destructive',
        title: `Error ${isEditing ? 'updating' : 'adding'} faculty`,
        description: error.message,
      });
    } else if (data && data.length > 0) {
      toast({
        title: `Faculty ${isEditing ? 'updated' : 'added'} successfully`,
      });
      if (isEditing) {
        setFaculty(
          faculty.map((f) => (f.id === selectedFaculty!.id ? data![0] : f))
        );
      } else {
        setFaculty(prev => [...prev, data[0]]);
      }
      setIsFormDialogOpen(false);
      setSelectedFaculty({});
    }
  };

  const handleFieldChange = (field: keyof Faculty, value: string) => {
    setSelectedFaculty(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Faculty</CardTitle>
          <CardDescription>
            Manage your institution's faculty members.
          </CardDescription>
        </div>
        <Button size="sm" className="gap-1" onClick={openAddDialog}>
          <PlusCircle className="h-4 w-4" />
          Add Faculty
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
                <TableHead>Faculty ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faculty.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.id}</TableCell>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.department}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(member)}
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
            <DialogTitle>{isEditing ? 'Edit Faculty' : 'Add Faculty'}</DialogTitle>
             <DialogDescription>
              {isEditing ? 'Update the details for this faculty member.' : 'Enter the details for the new faculty member.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             {!isEditing && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="id" className="text-right">
                  Faculty ID
                </Label>
                <Input
                  id="id"
                  value={selectedFaculty?.id || ''}
                  onChange={(e) => handleFieldChange('id', e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., F001"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={selectedFaculty?.name || ''}
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
                value={selectedFaculty?.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Input
                id="department"
                value={selectedFaculty?.department || ''}
                onChange={(e) =>
                  handleFieldChange('department', e.target.value)
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
              {isEditing ? 'Save Changes' : 'Add Faculty'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

    