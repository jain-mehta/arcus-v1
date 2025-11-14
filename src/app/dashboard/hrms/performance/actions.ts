
'use server';

import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

// Mock data
const MOCK_EMPLOYEE_REVIEWS = [
    {
        id: 'review-1',
        employeeId: 'emp-1',
        employeeName: 'John Doe',
        status: 'Self Assessment',
        selfAssessment: null,
        managerReview: null,
    },
    {
        id: 'review-2',
        employeeId: 'emp-2',
        employeeName: 'Jane Smith',
        status: 'Manager Review',
        selfAssessment: null,
        managerReview: null,
    },
];

const MOCK_PERFORMANCE_CYCLES = [
    {
        id: 'cycle-1',
        name: 'Annual Review 2024',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'Active',
        totalEmployees: 2,
        completedReviews: 0,
    },
    {
        id: 'cycle-2',
        name: 'Mid-Year Review 2024',
        startDate: '2024-06-01',
        endDate: '2024-06-30',
        status: 'Completed',
        totalEmployees: 2,
        completedReviews: 2,
    },
];

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


import { getSupabaseServerClient } from '@/lib/supabase/client';
// Database types for Supabase tables
interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  unit?: string;
  image_url?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name?: string;
  po_date: string;
  delivery_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'delivered' | 'completed';
  total_amount: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Employee {
  id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  status: 'active' | 'inactive';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Store {
  id: string;
  name: string;
  location?: string;
  address?: string;
  manager_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}
