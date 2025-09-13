import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TimetableForm } from './timetable-form';

export default function TimetableGeneratorPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Automated Timetable Generator</CardTitle>
          <CardDescription>
            Use AI to generate an optimized timetable based on your constraints.
            Provide detailed information for the best results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimetableForm />
        </CardContent>
      </Card>
    </div>
  );
}
