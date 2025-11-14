import { getLeads } from '../actions';
import { LeadsClient } from './client';

export const dynamic = 'force-dynamic';

export default async function LeadsPage({ searchParams }: any) {
  
  const response = await getLeads();
  const leads = (response?.success && Array.isArray(response.data)) ? response.data : [];
  const users: any[] = [];
  
  return (
    <div className="space-y-8">
      <LeadsClient initialLeads={leads} users={users} />
    </div>
  );
}

