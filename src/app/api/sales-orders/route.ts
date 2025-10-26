/**
 * GET /api/sales-orders
 * POST /api/sales-orders
 */

import { NextRequest } from 'next/server';
import { protectedApiHandler } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  return protectedApiHandler(
    req,
    async (context) => {
      const url = new URL(req.url);
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
      const offset = parseInt(url.searchParams.get('offset') || '0');

      try {
        // TODO: Fetch sales orders from tenant database
        const orders = [
          {
            id: '1',
            tenant_id: context.tenantId,
            so_number: 'SO-2025-001',
            customer_name: 'ABC Corp',
            status: 'pending_fulfillment',
            total_amount: 3500,
            created_by: context.userId,
            created_at: new Date(),
          },
        ];

        return {
          data: {
            orders: orders.slice(offset, offset + limit),
            total: orders.length,
          },
        };
      } catch (error) {
        return {
          error: `Failed to fetch sales orders: ${error}`,
        };
      }
    },
    {
      permission: {
        resource: 'sales_order',
        action: 'read',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  return protectedApiHandler(
    req,
    async (context) => {
      const {
        so_number,
        customer_name,
        items,
        total_amount,
        delivery_address,
        notes,
      } = context.body;

      if (!so_number || !customer_name || !items || !total_amount) {
        return {
          error: 'Missing required fields: so_number, customer_name, items, total_amount',
        };
      }

      try {
        // TODO: Create sales order in tenant database
        const newOrder = {
          id: Math.random().toString(),
          tenant_id: context.tenantId,
          so_number,
          customer_name,
          items,
          total_amount,
          delivery_address,
          notes,
          status: 'draft',
          created_by: context.userId,
          created_at: new Date(),
          updated_at: new Date(),
        };

        return {
          data: newOrder,
        };
      } catch (error) {
        return {
          error: `Failed to create sales order: ${error}`,
        };
      }
    },
    {
      permission: {
        resource: 'sales_order',
        action: 'create',
      },
    }
  );
}
