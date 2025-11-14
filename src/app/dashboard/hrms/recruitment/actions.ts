'use server';

import { revalidatePath } from 'next/cache';
import {
  checkActionPermission,
  createSuccessResponse,
  createErrorResponse,
  getCurrentUserFromSession,
  logUserAction,
  type ActionResponse
} from '@/lib/actions-utils';

// Database types for Recruitment module
export interface JobOpening {
  id: string;
  title: string;
  department: string;
  location?: string;
  description?: string;
  required_skills?: string[];
  salary_min?: number;
  salary_max?: number;
  status: string; // 'open', 'closed', 'on_hold'
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  organization_id?: string;
}

export interface Applicant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  job_opening_id: string;
  stage: string; // 'applied', 'screening', 'interview', 'offer', 'hired', 'rejected'
  rating?: number;
  notes?: string;
  applied_at?: string;
  organization_id?: string;
}

export type ApplicantStageName = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected' | 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export async function getJobOpenings(): Promise<ActionResponse<JobOpening[]>> {
  const authCheck = await checkActionPermission('hrms', 'recruitment', 'view');
  if ('error' in authCheck) {
    return createErrorResponse(authCheck.error);
  }

  const { user } = authCheck;

  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return createErrorResponse('Database connection failed');
    }

    const { data: openings, error } = await supabase
      .from('job_openings')
      .select('*')
      .eq('organization_id', user.orgId || 'default-org')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getJobOpenings] Error:', error);
      return createErrorResponse('Failed to fetch job openings');
    }

    await logUserAction(user, 'view', 'job_openings', undefined, { count: openings?.length });
    return createSuccessResponse(openings || [], 'Job openings retrieved successfully');
  } catch (error: any) {
    return createErrorResponse(`Failed to fetch job openings: ${error.message}`);
  }
}

export async function getApplicants(jobOpeningId?: string): Promise<ActionResponse<Applicant[]>> {
  const authCheck = await checkActionPermission('hrms', 'recruitment', 'view');
  if ('error' in authCheck) {
    return createErrorResponse(authCheck.error);
  }

  const { user } = authCheck;

  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return createErrorResponse('Database connection failed');
    }

    let query = supabase
      .from('applicants')
      .select('*')
      .eq('organization_id', user.orgId || 'default-org');

    if (jobOpeningId) {
      query = query.eq('job_opening_id', jobOpeningId);
    }

    const { data: applicants, error } = await query.order('applied_at', { ascending: false });

    if (error) {
      console.error('[getApplicants] Error:', error);
      return createErrorResponse('Failed to fetch applicants');
    }

    await logUserAction(user, 'view', 'applicants', undefined, { count: applicants?.length });
    return createSuccessResponse(applicants || [], 'Applicants retrieved successfully');
  } catch (error: any) {
    return createErrorResponse(`Failed to fetch applicants: ${error.message}`);
  }
}

export async function createJobOpening(data: Omit<JobOpening, 'id' | 'created_at' | 'updated_at' | 'organization_id'>): Promise<ActionResponse<JobOpening>> {
  const authCheck = await checkActionPermission('hrms', 'recruitment', 'create');
  if ('error' in authCheck) {
    return createErrorResponse(authCheck.error);
  }

  const { user } = authCheck;

  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return createErrorResponse('Database connection failed');
    }

    const { data: newOpening, error } = await supabase
      .from('job_openings')
      .insert({
        ...data,
        status: data.status || 'open',
        created_by: user.id,
        organization_id: user.orgId || 'default-org'
      })
      .select()
      .single();

    if (error) {
      console.error('[createJobOpening] Error:', error);
      return createErrorResponse('Failed to create job opening');
    }

    await logUserAction(user, 'create', 'job_opening', newOpening.id, { data });
    revalidatePath('/dashboard/hrms/recruitment');
    return createSuccessResponse(newOpening, 'Job opening created successfully');
  } catch (error: any) {
    return createErrorResponse(`Failed to create job opening: ${error.message}`);
  }
}

export async function updateJobOpening(id: string, data: Partial<JobOpening>): Promise<ActionResponse<JobOpening>> {
  const authCheck = await checkActionPermission('hrms', 'recruitment', 'update');
  if ('error' in authCheck) {
    return createErrorResponse(authCheck.error);
  }

  const { user } = authCheck;

  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return createErrorResponse('Database connection failed');
    }

    const { data: updated, error } = await supabase
      .from('job_openings')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[updateJobOpening] Error:', error);
      return createErrorResponse('Failed to update job opening');
    }

    await logUserAction(user, 'update', 'job_opening', id, { data });
    revalidatePath('/dashboard/hrms/recruitment');
    return createSuccessResponse(updated, 'Job opening updated successfully');
  } catch (error: any) {
    return createErrorResponse(`Failed to update job opening: ${error.message}`);
  }
}

export async function addApplicant(data: Omit<Applicant, 'id' | 'applied_at' | 'organization_id'>): Promise<ActionResponse<Applicant>> {
  const authCheck = await checkActionPermission('hrms', 'recruitment', 'create');
  if ('error' in authCheck) {
    return createErrorResponse(authCheck.error);
  }

  const { user } = authCheck;

  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return createErrorResponse('Database connection failed');
    }

    const { data: newApplicant, error } = await supabase
      .from('applicants')
      .insert({
        ...data,
        stage: data.stage || 'applied',
        organization_id: user.orgId || 'default-org'
      })
      .select()
      .single();

    if (error) {
      console.error('[addApplicant] Error:', error);
      return createErrorResponse('Failed to add applicant');
    }

    await logUserAction(user, 'create', 'applicant', newApplicant.id, { data });
    revalidatePath('/dashboard/hrms/recruitment');
    return createSuccessResponse(newApplicant, 'Applicant added successfully');
  } catch (error: any) {
    return createErrorResponse(`Failed to add applicant: ${error.message}`);
  }
}

export async function updateApplicantStage(id: string, stage: string): Promise<ActionResponse<Applicant>> {
  const authCheck = await checkActionPermission('hrms', 'recruitment', 'update');
  if ('error' in authCheck) {
    return createErrorResponse(authCheck.error);
  }

  const { user } = authCheck;

  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return createErrorResponse('Database connection failed');
    }

    const { data: updated, error } = await supabase
      .from('applicants')
      .update({ stage })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[updateApplicantStage] Error:', error);
      return createErrorResponse('Failed to update applicant stage');
    }

    await logUserAction(user, 'update', 'applicant_stage', id, { stage });
    revalidatePath('/dashboard/hrms/recruitment');
    return createSuccessResponse(updated, 'Applicant stage updated successfully');
  } catch (error: any) {
    return createErrorResponse(`Failed to update applicant stage: ${error.message}`);
  }
}
