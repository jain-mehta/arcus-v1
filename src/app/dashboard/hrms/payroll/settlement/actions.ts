
'use server';

import { getStaff as getStaffFromHrmsActions, getAllStores } from '../../../hrms/actions';
import type { User, Store } from '@/lib/mock-data/types';

export async function getPageData(): Promise<{
    staffList: User[];
    stores: Store[];
}> {
    const [staffList, stores] = await Promise.all([
        getStaffFromHrmsActions(),
        getAllStores(),
    ]);
    return { staffList, stores };
}


