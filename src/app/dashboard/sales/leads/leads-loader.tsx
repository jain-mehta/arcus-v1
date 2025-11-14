
import { getLeads } from '../actions';
import { LeadsClient } from './client';

export async function LeadsLoader({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const response = await getLeads();
    const { leads, users } = (response?.success && response.data) ? { leads: response.data, users: [] } : { leads: [], users: [] };
  
    return <LeadsClient initialLeads={leads} users={users} />;
}

