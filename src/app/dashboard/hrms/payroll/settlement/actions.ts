
'use server';

import { getStaff as getStaffFromHrmsActions, getAllStores } from '../../../hrms/actions';
import type { User, Store } from '@/lib/firebase/types';

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
