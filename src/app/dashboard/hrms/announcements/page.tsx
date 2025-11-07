
import { getAnnouncements, getPolicies, getCurrentUser, getUserPermissions } from './actions';
import { AnnouncementsClient } from './client';


export default async function HrmsAnnouncementsPage() {
    const [announcements, policies, user] = await Promise.all([
        getAnnouncements(),
        getPolicies(),
        getCurrentUser()
    ]);

    const permissions = user ? await getUserPermissions(user.id) : [];
    const isAdmin = permissions.includes('manage-users');

    return (
        <AnnouncementsClient 
            initialAnnouncements={announcements} 
            initialPolicies={policies} 
            isAdmin={isAdmin} 
        />
    );
}

\nimport { getSupabaseServerClient } from '@/lib/supabase/client';