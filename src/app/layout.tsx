import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { EnrollmentProvider } from '@/hooks/use-enrollment';
import { AttendanceProvider } from '@/hooks/use-attendance';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Schedulo',
  description: 'AI-Powered Timetable Scheduling',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-body antialiased">
        <AuthProvider>
          <EnrollmentProvider>
            <AttendanceProvider>{children}</AttendanceProvider>
          </EnrollmentProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
