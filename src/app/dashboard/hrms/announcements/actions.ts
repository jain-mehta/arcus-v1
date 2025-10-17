
'use server';

import { MOCK_ANNOUNCEMENTS, MOCK_POLICY_DOCS } from '@/lib/firebase/firestore';
import { revalidatePath } from 'next/cache';
import { getCurrentUser as getCurrentUserFromDb } from '@/lib/firebase/firestore';
import { getUserPermissions as getUserPermissionsFromDb } from '@/lib/firebase/rbac';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';


// --- Data Fetching ---

export async function getAnnouncements() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'hrms', 'attendance');

    return MOCK_ANNOUNCEMENTS.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPolicies() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'hrms', 'attendance');

    return MOCK_POLICY_DOCS.sort((a,b) => a.name.localeCompare(b.name));
}

export async function getCurrentUser() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'hrms', 'attendance');

    return getCurrentUserFromDb();
}

export async function getUserPermissions(userId: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'hrms', 'attendance');

    return getUserPermissionsFromDb(userId);
}


// --- Admin Actions ---

export async function createAnnouncement(data: { title: string; content: string; }): Promise<{ success: boolean; message?: string; newAnnouncement?: any }> {
    const user = await getCurrentUserFromDb();
    if (!user) return { success: false, message: 'Permission denied.' };
    const permissions = await getUserPermissionsFromDb(user.id);
    if (!permissions.includes('manage-users')) {
        return { success: false, message: 'Permission denied.' };
    }
    
    const newAnnouncement = {
        id: `ann-${Date.now()}`,
        title: data.title,
        content: data.content,
        date: new Date().toISOString(),
        author: user.name,
    };
    MOCK_ANNOUNCEMENTS.push(newAnnouncement);
    revalidatePath('/dashboard/hrms/announcements');
    return { success: true, newAnnouncement };
}

export async function deleteAnnouncement(id: string): Promise<{ success: boolean; message?: string; }> {
     const user = await getCurrentUserFromDb();
    if (!user) return { success: false, message: 'Permission denied.' };
    const permissions = await getUserPermissionsFromDb(user.id);
    if (!permissions.includes('manage-users')) {
        return { success: false, message: 'Permission denied.' };
    }

    const index = MOCK_ANNOUNCEMENTS.findIndex(a => a.id === id);
    if (index > -1) {
        MOCK_ANNOUNCEMENTS.splice(index, 1);
        revalidatePath('/dashboard/hrms/announcements');
        return { success: true };
    }
    return { success: false, message: 'Announcement not found.' };
}

export async function uploadPolicy(data: { name: string; version: string; }, file: File): Promise<{ success: boolean; message?: string; newPolicy?: any; }> {
     const user = await getCurrentUserFromDb();
    if (!user) return { success: false, message: 'Permission denied.' };
    const permissions = await getUserPermissionsFromDb(user.id);
    if (!permissions.includes('manage-users')) {
        return { success: false, message: 'Permission denied.' };
    }

    // In a real app, you would upload the file to Firebase Storage here.
    // For this mock, we just add it to the array.
    const newPolicy = {
        id: `pol-${Date.now()}`,
        name: data.name,
        version: data.version,
        fileName: file.name,
        fileUrl: '#', // Placeholder URL
    };
    MOCK_POLICY_DOCS.push(newPolicy);
    revalidatePath('/dashboard/hrms/announcements');
    return { success: true, newPolicy };
}

export async function deletePolicy(id: string): Promise<{ success: boolean; message?: string; }> {
    const user = await getCurrentUserFromDb();
    if (!user) return { success: false, message: 'Permission denied.' };
    const permissions = await getUserPermissionsFromDb(user.id);
    if (!permissions.includes('manage-users')) {
        return { success: false, message: 'Permission denied.' };
    }
    
    const index = MOCK_POLICY_DOCS.findIndex(p => p.id === id);
    if (index > -1) {
        MOCK_POLICY_DOCS.splice(index, 1);
        revalidatePath('/dashboard/hrms/announcements');
        return { success: true };
    }
    return { success: false, message: 'Policy not found.' };
}
