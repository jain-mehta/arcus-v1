
import { getPageData } from './actions';
import { SettlementClient } from './client';

export default async function FullFinalSettlementPage() {
    const { staffList, stores } = await getPageData();
    
    return <SettlementClient stores={stores} staffList={staffList} />;
}
