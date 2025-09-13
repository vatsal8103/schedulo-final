'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { EnrollmentRequest } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

interface EnrollmentContextType {
  requests: EnrollmentRequest[];
  addEnrollmentRequest: (program: string, department: string) => Promise<void>;
  handleRequestStatusChange: (requestId: number, newStatus: 'Approved' | 'Rejected') => Promise<void>;
  getEnrollmentStatus: (program: string) => 'Approved' | 'Pending' | 'Rejected' | null;
  loading: boolean;
}

const EnrollmentContext = createContext<EnrollmentContextType | undefined>(undefined);

export const EnrollmentProvider = ({ children }: { children: ReactNode }) => {
  const { user, refreshUser } = useAuth();
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('enrollment_requests').select('*');

    if (error) {
      console.error('Error fetching enrollment requests:', error);
      setRequests([]);
    } else {
      setRequests(data as EnrollmentRequest[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
    // Set up a listener for real-time updates
    const channel = supabase
      .channel('realtime-enrollments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enrollment_requests' },
        (payload) => {
          fetchRequests(); // Refetch all data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests]);

  const addEnrollmentRequest = async (program: string, department: string) => {
    if (!user) return;
    
    // Check for student profile first
    const { data: student, error: studentError } = await supabase.from('students').select('id, name').eq('id', user.id).single();
    
    if(studentError || !student) {
        console.error("Enrollment error: Could not find student profile for user ID:", user.id, "Error:", studentError?.message);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find your student profile. Please sign out and sign back in. If the problem persists, contact an administrator.' });
        return;
    }

    const existing = requests.find(r => r.student_id === user.id && r.program === program && r.department === department);
    if (existing) {
        toast({
            variant: 'destructive',
            title: 'Request already exists',
            description: `You have already applied to the ${program} - ${department} department.`
        });
        return;
    }

    const newRequest = {
      student_id: student.id,
      student_name: student.name,
      program: program,
      department: department,
      status: 'Pending' as const,
    };

    const { data, error } = await supabase
      .from('enrollment_requests')
      .insert([newRequest])
      .select();

    if (error) {
      toast({ variant: 'destructive', title: 'Error Creating Request', description: error.message });
    } else if (data) {
      setRequests(prev => [...prev, data[0] as EnrollmentRequest]); 
      toast({
        title: 'Request Sent',
        description: `Your enrollment request for the ${program} - ${department} department has been sent for approval.`,
    });
    }
  };

  const handleRequestStatusChange = async (requestId: number, newStatus: 'Approved' | 'Rejected') => {
    const originalRequest = requests.find(r => r.id === requestId);
    if (!originalRequest) return;

    // 1. Update the status in the enrollment_requests table
    const { data: requestData, error: requestError } = await supabase
      .from('enrollment_requests')
      .update({ status: newStatus })
      .eq('id', requestId)
      .select()
      .single();
      
    if (requestError) {
        toast({ variant: 'destructive', title: 'Error updating status', description: requestError.message });
        return;
    } 

    if (requestData) {
      let studentUpdate;
      if (newStatus === 'Approved') {
        studentUpdate = { department: requestData.department, major: requestData.program };
      } else { // 'Rejected' or removed
        studentUpdate = { department: null, major: null };
      }

      const { error: studentUpdateError } = await supabase
        .from('students')
        .update(studentUpdate)
        .eq('id', requestData.student_id);

      if (studentUpdateError) {
        toast({ variant: 'destructive', title: 'Error updating student record', description: studentUpdateError.message });
        // Revert the status change on failure
        await supabase.from('enrollment_requests').update({ status: originalRequest.status }).eq('id', requestId);
        return;
      }
    }
    
     toast({ title: 'Success', description: `Enrollment status for ${originalRequest.student_name} updated to ${newStatus}.` });
     
     // Manually update the state to force UI refresh
     setRequests(prevRequests => prevRequests.map(req => 
        req.id === requestId ? { ...req, status: newStatus } : req
     ));

     // If the current user is a student, refresh their session to get new major/dept
     if (user?.id === originalRequest.student_id) {
        await refreshUser();
     }
  };
  
  const getEnrollmentStatus = (program: string) => {
    if (!user) return null;
    const studentRequests = requests.filter(r => r.student_id === user.id && r.program === program);

    if (studentRequests.some(r => r.status === 'Approved')) return 'Approved';
    if (studentRequests.some(r => r.status === 'Pending')) return 'Pending';
    // If there are requests, and ALL of them for this program are rejected, show 'Rejected'
    if (studentRequests.length > 0 && studentRequests.every(r => r.status === 'Rejected')) return 'Rejected';
    
    return null;
  }

  return (
    <EnrollmentContext.Provider value={{ requests, addEnrollmentRequest, handleRequestStatusChange, getEnrollmentStatus, loading }}>
      {children}
    </EnrollmentContext.Provider>
  );
};

export const useEnrollment = () => {
  const context = useContext(EnrollmentContext);
  if (context === undefined) {
    throw new Error('useEnrollment must be used within an EnrollmentProvider');
  }
  return context;
};
