import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <div className="h-8 w-8 text-primary text-4xl font-bold">?</div>
          </div>
          <CardTitle className="mt-4">404 - Page Not Found</CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or you don't have permission to access it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
