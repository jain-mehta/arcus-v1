
import { getVendors } from '@/lib/mock-data/firestore';
import { CreatePOForm } from './create-po-form';

export default async function CreatePurchaseOrderPage() {
  const vendors = await getVendors();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Purchase Order</h1>
        <p className="text-muted-foreground">Fill out the form below to create a new PO.</p>
      </div>
      <CreatePOForm vendors={vendors} />
    </div>
  );
}


