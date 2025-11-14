import { NextRequest } from 'next/server';
import { protectedApiHandler } from '@/lib/api-helpers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  return protectedApiHandler(request, async (context) => {
    try {
      const { tenantId, query } = context;
      
      const limit = parseInt(((query?.limit) as string) || '10');
      const offset = parseInt(((query?.offset) as string) || '0');
      const department = (query?.department) as string;

      // Query real employees from database
      let employeeQuery = supabase
        .from('employees')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('name', { ascending: true });

      // Add department filter if provided
      if (department) {
        employeeQuery = employeeQuery.eq('department', department);
      }

      // Add pagination
      const { data: employees, error, count } = await employeeQuery.range(
        offset,
        offset + limit - 1
      );

      if (error) {
        console.error('[API] Error fetching employees:', error);
        return { error: `Failed to fetch employees: ${error.message}` };
      }

      return {
        data: {
          employees: employees || [],
          pagination: {
            limit,
            offset,
            total: count || 0
          }
        }
      };
    } catch (error) {
      console.error('[API] Exception fetching employees:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch employees'
      };
    }
  });
}

