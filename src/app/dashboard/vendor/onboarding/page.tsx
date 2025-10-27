
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { OnboardingForm } from './onboarding-form';


export default function VendorOnboardingPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Vendor Onboarding Form</h1>
        <p className="text-muted-foreground">Fields marked with <span className="text-destructive">*</span> are required.</p>
      </div>

      <OnboardingForm />
      
    </div>
  );
}
    

    

    

    

