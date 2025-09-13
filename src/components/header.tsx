'use client';

import { UserNav } from '@/components/user-nav';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Notifications } from '@/components/notifications';
import { useAuth } from '@/hooks/use-auth';


export function Header() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="sm:hidden" />
      <div className="flex-1" />
      {user?.role === 'student' && <Notifications />}
      <UserNav />
    </header>
  );
}
