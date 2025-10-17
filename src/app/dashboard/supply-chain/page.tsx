import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function SupplyChainPage() {
  return (
    <div className="flex justify-center items-start pt-16 h-full">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4">Supply Chain Management</CardTitle>
          <CardDescription>This module is under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Features for procurement, logistics, and shipment tracking will be available here soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
