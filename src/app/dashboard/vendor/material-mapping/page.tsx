

import { getVendors } from '@/lib/firebase/firestore';
import { MaterialMappingClient } from './client';
import { getMaterialMappings, getVolumeDiscounts } from './actions';

export default async function MaterialMappingPage() {
    const vendors = await getVendors();
    
    // Fetch initial data for the first vendor to avoid client-side loading on first paint
    const initialVendorId = vendors[0]?.id || null;
    const [initialMappings, initialDiscounts] = initialVendorId ? await Promise.all([
        getMaterialMappings(initialVendorId),
        // If there's a mapping, fetch discounts for the first one.
        getMaterialMappings(initialVendorId).then(maps => maps.length > 0 ? getVolumeDiscounts(maps[0].id) : [])
    ]) : [[], []];

    return (
        <MaterialMappingClient 
            vendors={vendors}
            initialMappings={initialMappings}
            initialDiscounts={initialDiscounts}
            initialSelectedVendorId={initialVendorId}
        />
    );
}
