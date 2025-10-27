
'use server';

import { MOCK_EMPLOYEE_REVIEWS, MOCK_PERFORMANCE_CYCLES } from "@/lib/mock-data/firestore";
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

export async function saveSelfAssessment(reviewId: string, data: { achievements: string; challenges: string }) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'hrms', 'attendance');

    console.log(`Saving self-assessment for review ${reviewId}:`, data);
    // In a real app, you'd update the Firestore document.
    const review = MOCK_EMPLOYEE_REVIEWS.find(r => r.id === reviewId);
    if(review) {
        // This is a mock update.
        // review.selfAssessment = data;
        review.status = 'Manager Review';
    }
    return { success: true };
}


export async function saveManagerReview(reviewId: string, data: { feedback: string; goals: string; rating: number }) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'hrms', 'attendance');

    console.log(`Saving manager review for review ${reviewId}:`, data);
    // In a real app, you'd update the Firestore document.
    const review = MOCK_EMPLOYEE_REVIEWS.find(r => r.id === reviewId);
    if(review) {
        // This is a mock update.
        // review.managerReview = data;
        review.status = 'Completed';
    }
    return { success: true };
}

export async function getPerformanceCycles() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'hrms', 'attendance');

    return MOCK_PERFORMANCE_CYCLES;
}

export async function startNewPerformanceCycle(newCycle: any) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'hrms', 'attendance');

    MOCK_PERFORMANCE_CYCLES.unshift(newCycle);
    return { success: true };
}


