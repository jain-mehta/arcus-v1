/**
 * GET /api/purchase-orders
 * POST /api/purchase-orders
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
      const status = url.searchParams.get('status');

      try {
        // TODO: Fetch purchase orders from tenant database
        const orders = [
          {
            id: '1',
            tenant_id: context.tenantId,
            po_number: 'PO-2025-001',
            vendor_id: '1',
            status: 'pending_approval',
            total_amount: 5000,
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
          error: `Failed to fetch purchase orders: ${error}`,
        };
      }
    },
    {
      permission: {
        resource: 'purchase_order',
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
        vendor_id,
        po_number,
        items,
        total_amount,
        delivery_date,
        notes,
      } = context.body;

      if (!vendor_id || !po_number || !items || !total_amount) {
        return {
          error: 'Missing required fields: vendor_id, po_number, items, total_amount',
        };
      }

      try {
        // TODO: Create purchase order in tenant database
        const newOrder = {
          id: Math.random().toString(),
          tenant_id: context.tenantId,
          po_number,
          vendor_id,
          items,
          total_amount,
          delivery_date,
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
          error: `Failed to create purchase order: ${error}`,
        };
      }
    },
    {
      permission: {
        resource: 'purchase_order',
        action: 'create',
      },
    }
  );
}
