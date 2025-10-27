
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Target } from "lucide-react";
// import { MOCK_EMPLOYEE_REVIEWS, MOCK_USERS } from "@/lib/mock-data/firestore-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
import { saveSelfAssessment, saveManagerReview } from '../../actions';
import { Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

// Temporary mock data until we refactor to use server actions
const MOCK_EMPLOYEE_REVIEWS: any[] = [];
const MOCK_USERS: any[] = [];

const selfAssessmentSchema = z.object({
  achievements: z.string().min(10, "Please describe your key achievements."),
  challenges: z.string().min(10, "Please describe the challenges you faced."),
});

const managerReviewSchema = z.object({
  feedback: z.string().min(10, "Please provide overall feedback."),
  goals: z.string().min(10, "Please set goals for the next period."),
  rating: z.array(z.number()).min(1).max(1),
});

type SelfAssessmentFormValues = z.infer<typeof selfAssessmentSchema>;
type ManagerReviewFormValues = z.infer<typeof managerReviewSchema>;

export default function AppraisalDetailPage() {
  const params = useParams();
  const reviewId = params.reviewId as string;
  const { toast } = useToast();
  
  const [isEmployeeSubmitting, startEmployeeTransition] = useTransition();
  const [isManagerSubmitting, startManagerTransition] = useTransition();

  const review = MOCK_EMPLOYEE_REVIEWS.find(r => r.id === reviewId);
  const employee = review ? MOCK_USERS.find(u => u.id === review.employeeId) : null;

  const selfAssessmentForm = useForm<SelfAssessmentFormValues>({
    resolver: zodResolver(selfAssessmentSchema),
  });

  const managerReviewForm = useForm<ManagerReviewFormValues>({
    resolver: zodResolver(managerReviewSchema),
    defaultValues: { rating: [3] }
  });

  const onSelfAssessmentSubmit = (data: SelfAssessmentFormValues) => {
    startEmployeeTransition(async () => {
      try {
        await saveSelfAssessment(reviewId, data);
        toast({ title: "Self-Assessment Submitted", description: "Your feedback has been recorded." });
      } catch (e) {
        toast({ variant: 'destructive', title: "Error", description: "Failed to submit assessment." });
      }
    });
  }

  const onManagerReviewSubmit = (data: ManagerReviewFormValues) => {
    startManagerTransition(async () => {
        try {
            await saveManagerReview(reviewId, { ...data, rating: data.rating[0] });
            toast({ title: "Manager Review Submitted", description: "Your review has been finalized." });
        } catch (e) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to submit review." });
        }
    });
  }

  if (!review || !employee) {
    return (
       <div className="flex justify-center items-start pt-16 h-full">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
              <User className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="mt-4">Review Not Found</CardTitle>
            <CardDescription>The requested performance review could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Performance Appraisal</h1>
        <p className="text-muted-foreground">A detailed review for the Q3 2024 cycle.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
           <Avatar className="h-16 w-16">
              <AvatarImage src={`https://picsum.photos/seed/${employee.id}/64/64`} data-ai-hint="person" />
              <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{employee.name}</CardTitle>
              <CardDescription>{employee.email}</CardDescription>
            </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Employee Self-Assessment</CardTitle>
            <CardDescription>To be completed by the employee.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...selfAssessmentForm}>
                <form onSubmit={selfAssessmentForm.handleSubmit(onSelfAssessmentSubmit)} className="space-y-6">
                    <FormField control={selfAssessmentForm.control} name="achievements" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Key Achievements</FormLabel>
                          <FormControl><Textarea placeholder="Describe your key achievements during this review period..." {...field} rows={5} /></FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={selfAssessmentForm.control} name="challenges" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Challenges Faced</FormLabel>
                          <FormControl><Textarea placeholder="Describe any challenges you encountered and how you handled them..." {...field} rows={5} /></FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={isEmployeeSubmitting}>
                        {isEmployeeSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Self-Assessment
                    </Button>
                </form>
            </Form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Manager's Review</CardTitle>
            <CardDescription>To be completed by the reporting manager.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...managerReviewForm}>
                <form onSubmit={managerReviewForm.handleSubmit(onManagerReviewSubmit)} className="space-y-6">
                     <FormField control={managerReviewForm.control} name="feedback" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Overall Feedback</FormLabel>
                          <FormControl><Textarea placeholder="Provide overall feedback on the employee's performance..." {...field} rows={5} /></FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={managerReviewForm.control} name="goals" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Goals for Next Period</FormLabel>
                          <FormControl><Textarea placeholder="Outline key goals and areas for development for the next review period..." {...field} rows={5} /></FormControl>
                          <FormMessage />
                      </FormItem>
                    )} />
                    <Separator />
                     <FormField control={managerReviewForm.control} name="rating" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Overall Rating: {field.value}/5</FormLabel>
                          <FormControl>
                            <Slider
                                defaultValue={field.value}
                                onValueChange={(value) => field.onChange(value)}
                                max={5}
                                min={1}
                                step={1}
                             />
                          </FormControl>
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={isManagerSubmitting}>
                        {isManagerSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Finalize Review
                    </Button>
                </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
