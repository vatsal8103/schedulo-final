'use client';
import { useAuth } from '@/hooks/use-auth';
import AdminDashboard from '@/components/dashboards/admin-dashboard';
import FacultyDashboard from '@/components/dashboards/faculty-dashboard';
import StudentDashboard from '@/components/dashboards/student-dashboard';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Dashboard() {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'faculty':
        return <FacultyDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>
                Your dashboard is loading or your role is not defined.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Please wait or contact support if this persists.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <MainNav />
        <SidebarInset className="min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {renderDashboard()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
