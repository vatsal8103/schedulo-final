import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

export type TimetableEntry = {
  id?: number;
  day: string;
  courseName: string;
  faculty: string;
  room: string;
  time: string;
  credits: number;
  program?: string;
  department?: string;
};

export type UserRole = 'admin' | 'faculty' | 'student';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  major?: string | null;
  department?: string | null;
};

export type Course = {
  id: string;
  name: string;
  credits: number;
  department: string;
  program: string;
};

export type Student = {
    id: string;
    name: string;
    email: string;
    major: string | null;
    department: string | null;
};

export type EnrollmentRequest = {
    id: number;
    student_id: string;
    student_name: string;
    program: string;
    department: string;
    status: 'Pending' | 'Approved' | 'Rejected';
};
    
export type Faculty = {
  id: string;
  name: string;
  email: string;
  department: string;
};

export type FacultyAssignment = {
    id: number;
    faculty_id: string;
    course_id: string;
};

export type Room = {
    id: string;
    name: string;
    capacity: number;
    type: string;
};

export type AttendanceStat = {
    courseId: string;
    courseName: string;
    average: number;
    totalClasses: number;
    highest: number;
    lowest: number;
}
