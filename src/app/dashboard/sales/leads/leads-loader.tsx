
import { getLeads } from '../actions';
import { LeadsClient } from './client';

export async function LeadsLoader({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const { leads, users } = await getLeads(searchParams);
  
    return <LeadsClient initialLeads={leads} users={users} />;
}

