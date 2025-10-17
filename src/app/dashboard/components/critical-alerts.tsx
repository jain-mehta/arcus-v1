import { AlertTriangle, BellOff } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface CriticalAlertsProps {
  alerts: { message: string; time: string }[];
}

export function CriticalAlerts({ alerts }: CriticalAlertsProps) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Critical Alerts</h2>
      <Card>
        <CardContent className="p-4 space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg"
              >
                <div className="p-2 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground p-8 flex flex-col items-center gap-4">
              <BellOff className="h-10 w-10" />
              <div>
                <h3 className="font-semibold">All Clear</h3>
                <p className="text-sm">No critical alerts at the moment.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
