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
import { BookCopy, CalendarClock, Megaphone, Bell } from 'lucide-react';

const schedule = [
  { course: 'CS101', time: 'Mon 10:00-11:30', room: 'R101' },
  { course: 'CS501', time: 'Tue 13:00-14:30', room: 'R102' },
  { course: 'CS101', time: 'Wed 10:00-11:30', room: 'R101' },
  { course: 'MA201', time: 'Thu 08:30-10:00', room: 'R201' },
];

const announcements = [
    { id: 1, message: 'Faculty meeting on Friday at 2 PM in the main conference room.'},
    { id: 2, message: 'Mid-term grade submissions are due next week.'},
];

export default function FacultyDashboard() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              For today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              This semester
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Room</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.slice(0, 2).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.course}</TableCell>
                    <TableCell>{item.time}</TableCell>
                    <TableCell>{item.room}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
                <Megaphone className="h-5 w-5" />
                Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
          <ul className="space-y-4">
              {announcements.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                    <Bell className="h-4 w-4 mt-1 text-muted-foreground"/>
                    <span className="text-sm text-muted-foreground">{item.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
