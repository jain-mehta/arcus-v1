
import { VendorList } from './vendor-list';
import { getVendors } from './actions';

export default async function VendorListPage() {
  const vendorsResult = await getVendors();
  const initialVendors = vendorsResult.success ? ((vendorsResult.data as any) || []) : [];

  return (
    <div className="space-y-8">
        <VendorList initialVendors={initialVendors} />
    </div>
  );
}


