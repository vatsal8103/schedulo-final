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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Loader2, X, UserX } from 'lucide-react';
import { useEnrollment } from '@/hooks/use-enrollment';
import { useState } from 'react';
import type { EnrollmentRequest } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';


function ApprovalsView() {
  const { requests, handleRequestStatusChange, loading } = useEnrollment();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EnrollmentRequest | null>(null);

  const openConfirmationDialog = (request: EnrollmentRequest) => {
    setSelectedRequest(request);
    setIsAlertOpen(true);
  };

  const confirmRemoveEnrollment = () => {
    if (selectedRequest) {
      handleRequestStatusChange(selectedRequest.id, 'Rejected');
    }
    setIsAlertOpen(false);
    setSelectedRequest(null);
  }

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Enrollment Approvals</CardTitle>
                <CardDescription>
                Manage student enrollment requests for programs.
                </CardDescription>
            </CardHeader>
            <CardContent className='flex justify-center items-center py-10'>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
        </Card>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Enrollment Approvals</CardTitle>
        <CardDescription>
          Manage student enrollment requests for programs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.student_id}</TableCell>
                <TableCell className="font-medium">{request.student_name}</TableCell>
                <TableCell>{request.program}</TableCell>
                <TableCell>{request.department}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      request.status === 'Pending'
                        ? 'secondary'
                        : request.status === 'Approved'
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {request.status === 'Pending' && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRequestStatusChange(request.id, 'Approved')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRequestStatusChange(request.id, 'Rejected')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {request.status === 'Approved' && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openConfirmationDialog(request)}
                      >
                        <UserX className='mr-2 h-4 w-4' />
                        Remove Enrollment
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will remove the student <span className='font-bold'>{selectedRequest?.student_name}</span> from the <span className='font-bold'>{selectedRequest?.program} - {selectedRequest?.department}</span> program. Their status will be set to 'Rejected' and they will lose access to the program's timetable.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmRemoveEnrollment}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            Confirm Removal
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}


export default function ApprovalsPage() {
  const { user } = useAuth();
  
  if (user?.role === 'admin' || user?.role === 'faculty') {
    return <ApprovalsView />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approvals</CardTitle>
        <CardDescription>You do not have access to this page.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This page is restricted to administrators and faculty.</p>
      </CardContent>
    </Card>
  )
}
