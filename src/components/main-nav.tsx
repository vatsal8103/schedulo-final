'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  CalendarPlus,
  BookOpen,
  Users,
  Building,
  ClipboardCheck,
  Settings,
  Bot,
  GraduationCap,
  CalendarDays,
  PenSquare,
  BadgeCheck,
  BookUser,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

const adminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard size={18} />,
  },
  {
    title: 'Timetable Generator',
    href: '/timetable-generator',
    icon: <CalendarPlus size={18} />,
  },
  {
    title: 'Approvals',
    href: '/approvals',
    icon: <BadgeCheck size={18} />,
  },
  {
    title: 'Courses',
    href: '/courses',
    icon: <BookOpen size={18} />,
  },
  {
    title: 'Faculty',
    href: '/faculty',
    icon: <Users size={18} />,
  },
  {
    title: 'Assignments',
    href: '/assignments',
    icon: <BookUser size={18} />,
  },
  {
    title: 'Students',
    href: '/students',
    icon: <GraduationCap size={18} />,
  },
  {
    title: 'Rooms',
    href: '/rooms',
    icon: <Building size={18} />,
  },
  {
    title: 'Attendance',
    href: '/attendance',
    icon: <ClipboardCheck size={18} />,
  },
];

const facultyNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard size={18} />,
  },
  {
    title: 'Timetable Generator',
    href: '/timetable-generator',
    icon: <CalendarPlus size={18} />,
  },
  {
    title: 'Approvals',
    href: '/approvals',
    icon: <BadgeCheck size={18} />,
  },
  {
    title: 'My Schedule',
    href: '/schedule',
    icon: <CalendarDays size={18} />,
  },
  {
    title: 'Mark Attendance',
    href: '/attendance',
    icon: <ClipboardCheck size={18} />,
  },
  {
    title: 'My Courses',
    href: '/courses',
    icon: <BookOpen size={18} />,
  },
];

const studentNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard size={18} />,
  },
  {
    title: 'My Timetable',
    href: '/schedule',
    icon: <CalendarDays size={18} />,
  },
  {
    title: 'My Attendance',
    href: '/attendance',
    icon: <ClipboardCheck size={18} />,
  },
  {
    title: 'Course Registration',
    href: '/courses',
    icon: <PenSquare size={18} />,
  },
];

const getNavItems = (role: string | undefined): NavItem[] => {
  switch (role) {
    case 'admin':
      return adminNavItems;
    case 'faculty':
      return facultyNavItems;
    case 'student':
      return studentNavItems;
    default:
      return [];
  }
};

export function MainNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const navItems = getNavItems(user?.role);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Bot className="h-6 w-6 text-primary" />
          <span className="text-lg">Schedulo</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.title}
                >
                  <a>
                    {item.icon}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/settings" legacyBehavior passHref>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/settings'}
                tooltip="Settings"
              >
                <a>
                  <Settings size={18} />
                  <span>Settings</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
