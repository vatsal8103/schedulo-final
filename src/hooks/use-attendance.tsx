'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { AttendanceStat, Course } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

interface AttendanceContextType {
  attendanceStats: AttendanceStat[];
  loading: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

// This is a mock function to generate fake attendance data.
// In a real application, this would come from your database.
const generateMockAttendance = (courses: Course[]): AttendanceStat[] => {
  return courses.map(course => {
    const totalClasses = Math.floor(Math.random() * 10) + 15; // 15-24 classes
    const percentages = Array.from({ length: totalClasses }, () => Math.random() * 30 + 70); // 70-100%
    const sum = percentages.reduce((a, b) => a + b, 0);
    
    return {
      courseId: course.id,
      courseName: course.name,
      average: sum / totalClasses,
      totalClasses: totalClasses,
      highest: Math.max(...percentages),
      lowest: Math.min(...percentages),
    };
  });
};

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendanceStats = useCallback(async () => {
    if (user?.role !== 'admin') {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { data: courses, error } = await supabase.from('courses').select('*');

    if (error) {
      console.error('Error fetching courses for attendance stats:', error);
      setAttendanceStats([]);
    } else {
      const mockStats = generateMockAttendance(courses as Course[]);
      setAttendanceStats(mockStats);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAttendanceStats();
  }, [fetchAttendanceStats]);

  return (
    <AttendanceContext.Provider value={{ attendanceStats, loading }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
