
import { getVendors, getVendorRatingCriteria, getVendorRatingHistory } from './actions';
import { RatingClient } from './client';

export default async function VendorRatingPage() {
    const vendors = await getVendors();
    // Fetch initial data for the first vendor on the server
    const initialVendorId = vendors[0]?.id || null;
    const [initialCriteria, initialHistory] = initialVendorId ? await Promise.all([
        getVendorRatingCriteria(initialVendorId),
        getVendorRatingHistory(initialVendorId),
    ]) : [[], []];
    
    return (
       <RatingClient 
            vendors={vendors} 
            initialCriteria={initialCriteria} 
            initialHistory={initialHistory} 
        />
    );
}

    

