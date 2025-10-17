
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User } from "lucide-react";

export default function ApplicantDetailPage({ params }: any) {

  return (
    <div className="flex justify-center items-start pt-16 h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <User className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4">Applicant Profile</CardTitle>
          <CardDescription>Applicant ID: {params.id}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page is under construction. A detailed applicant profile with resume, history, and feedback will be available here soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
