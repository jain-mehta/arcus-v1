
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface KeyMetricsProps {
    data: {
        activeVendors: number;
        outstandingBalance: number;
        ytdSpend: number;
    }
}

export function KeyMetrics({ data }: KeyMetricsProps) {
  const { activeVendors, outstandingBalance, ytdSpend } = data;
  
  return (
    <div>
        <h2 className="text-2xl font-semibold mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
            <CardHeader>
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            </CardHeader>
            <CardContent>
            <p className="text-3xl font-bold">{activeVendors}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            </CardHeader>
            <CardContent>
            <p className="text-3xl font-bold">₹{outstandingBalance.toLocaleString('en-IN')}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle className="text-sm font-medium">Total Spend (YTD)</CardTitle>
            </CardHeader>
            <CardContent>
            <p className="text-3xl font-bold">₹{ytdSpend.toLocaleString('en-IN')}</p>
            </CardContent>
        </Card>
        </div>
    </div>
  );
}

