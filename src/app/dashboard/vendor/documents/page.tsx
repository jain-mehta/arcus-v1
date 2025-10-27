
import { getVendors } from '@/lib/mock-data/firestore';
import { getDocumentsForVendor } from './actions';
import { DocumentManagementClient } from './client';

export default async function DocumentManagementPage() {
    const vendors = await getVendors();
    const initialDocuments = vendors.length > 0 ? await getDocumentsForVendor(vendors[0].id) : [];
    
    return (
        <DocumentManagementClient vendors={vendors} initialDocuments={initialDocuments} />
    );
}


