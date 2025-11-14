
import { getAnnouncements, getPolicies, getCurrentUser, getUserPermissions } from './actions';
import { AnnouncementsClient } from './client';
import { getSupabaseServerClient } from '@/lib/supabase/client';


export default async function HrmsAnnouncementsPage() {
    const [announcementsResponse, policiesResponse, userResponse] = await Promise.all([
        getAnnouncements(),
        getPolicies(),
        getCurrentUser()
    ]);

    const announcements = announcementsResponse.success && announcementsResponse.data ? announcementsResponse.data : [];
    const policies = policiesResponse.success && policiesResponse.data ? policiesResponse.data : [];
    const user = userResponse.success && userResponse.data ? userResponse.data : null;

    const permissionsResponse = user ? await getUserPermissions() : { success: false, data: [] };
    const permissions = permissionsResponse.success && permissionsResponse.data ? (permissionsResponse.data as any[]) : [];
    const isAdmin = permissions.includes?.('manage-users') || false;

    return (
        <AnnouncementsClient 
            initialAnnouncements={announcements} 
            initialPolicies={policies} 
            isAdmin={isAdmin} 
        />
    );
}

