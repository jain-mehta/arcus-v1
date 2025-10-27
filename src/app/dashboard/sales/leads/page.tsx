import { getLeads } from '../actions';
import { LeadsClient } from './client';

export const dynamic = 'force-dynamic';

export default async function LeadsPage({ searchParams }: any) {
  
  const { leads, users } = await getLeads(searchParams);
  
  return (
    <div className="space-y-8">
      <LeadsClient initialLeads={leads} users={users} />
    </div>
  );
}

