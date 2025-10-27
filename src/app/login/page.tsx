import { Suspense } from 'react';
import { LoginClient } from './login-client';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}

