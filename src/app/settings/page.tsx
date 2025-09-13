import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Manage application settings and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
            <span>Dark Mode</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Enable or disable dark mode for the application.
            </span>
          </Label>
          <Switch id="dark-mode" aria-label="Toggle dark mode" />
        </div>
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <Label
            htmlFor="email-notifications"
            className="flex flex-col space-y-1"
          >
            <span>Email Notifications</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Receive email notifications for important events.
            </span>
          </Label>
          <Switch
            id="email-notifications"
            defaultChecked
            aria-label="Toggle email notifications"
          />
        </div>
      </CardContent>
    </Card>
  );
}
