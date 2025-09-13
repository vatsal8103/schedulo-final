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
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, BookCheck } from 'lucide-react';

const upcomingClasses = [
    { course: 'CS101', time: 'Mon 10:00-11:30', room: 'R101', faculty: 'Dr. Alan Turing' },
    { course: 'PY101', time: 'Mon 13:00-14:30', room: 'R205', faculty: 'Dr. Marie Curie' },
];

const assignments = [
    { course: 'CS101', title: 'Algorithm Analysis', due: 'Oct 25', status: 'Pending' },
    { course: 'PY101', title: 'Lab Report 1', due: 'Oct 28', status: 'Pending' },
];

  export default function StudentDashboard() {
    return (
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Assignments</CardTitle>
              <BookCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Due this week
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Upcoming Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Faculty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingClasses.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.course}</TableCell>
                      <TableCell>{item.time}</TableCell>
                      <TableCell>{item.faculty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
              <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {assignments.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell><Badge variant="outline">{item.course}</Badge></TableCell>
                            <TableCell>{item.title}</TableCell>
                            <TableCell>{item.due}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  