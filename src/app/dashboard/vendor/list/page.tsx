
import { VendorList } from './vendor-list';
import { getVendors } from './actions';

export default async function VendorListPage() {
  const initialVendors = await getVendors();

  return (
    <div className="space-y-8">
        <VendorList initialVendors={initialVendors} />
    </div>
  );
}


