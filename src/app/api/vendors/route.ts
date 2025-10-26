/**
 * GET /api/vendors
 * 
 * List all vendors for the current tenant
 * Requires: authenticated user, vendor:read permission
 * Query params:
 *   - limit: number (default: 50, max: 100)
 *   - offset: number (default: 0)
 *   - search: string (search in name/code)
 *   - status: string (active|inactive)
 */

import { NextRequest } from 'next/server';
import { protectedApiHandler } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  return protectedApiHandler(
    req,
    async (context) => {
      // Parse query parameters
      const url = new URL(req.url);
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const search = url.searchParams.get('search');
      const status = url.searchParams.get('status') || 'active';

      try {
        // TODO: Get tenant DataSource and query vendors
        // For now, return mock data
        const vendors = [
          {
            id: '1',
            tenant_id: context.tenantId,
            vendor_code: 'VEND001',
            name: 'Acme Supplies',
            email: 'contact@acme.com',
            phone: '+1-555-0123',
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: '2',
            tenant_id: context.tenantId,
            vendor_code: 'VEND002',
            name: 'Global Distributors',
            email: 'info@global.com',
            phone: '+1-555-0456',
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ];

        return {
          data: {
            vendors: vendors.slice(offset, offset + limit),
            total: vendors.length,
            limit,
            offset,
          },
        };
      } catch (error) {
        return {
          error: `Failed to fetch vendors: ${error}`,
        };
      }
    },
    {
      permission: {
        resource: 'vendor',
        action: 'read',
      },
    }
  );
}

/**
 * POST /api/vendors
 * 
 * Create a new vendor
 * Requires: authenticated user, vendor:create permission
 * Body:
 *   - name: string (required)
 *   - vendor_code: string (required)
 *   - email: string (required)
 *   - phone: string (optional)
 *   - address: string (optional)
 *   - city: string (optional)
 *   - state: string (optional)
 *   - country: string (optional)
 *   - tax_id: string (optional)
 *   - bank_details: object (optional)
 *   - status: 'active' | 'inactive' (default: active)
 */
export async function POST(req: NextRequest) {
  return protectedApiHandler(
    req,
    async (context) => {
      const { name, vendor_code, email, phone, status = 'active' } = context.body;

      // Validate required fields
      if (!name || !vendor_code || !email) {
        return {
          error: 'Missing required fields: name, vendor_code, email',
        };
      }

      try {
        // TODO: Create vendor in tenant database
        const newVendor = {
          id: Math.random().toString(),
          tenant_id: context.tenantId,
          vendor_code,
          name,
          email,
          phone,
          status,
          created_at: new Date(),
          updated_at: new Date(),
        };

        return {
          data: newVendor,
        };
      } catch (error) {
        return {
          error: `Failed to create vendor: ${error}`,
        };
      }
    },
    {
      permission: {
        resource: 'vendor',
        action: 'create',
      },
    }
  );
}
