/**
 * GET /api/inventory
 * POST /api/inventory/[id]/adjust
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
      const warehouseId = url.searchParams.get('warehouse_id');

      try {
        // TODO: Fetch inventory levels from tenant database
        const inventory = [
          {
            id: '1',
            tenant_id: context.tenantId,
            product_id: '1',
            warehouse_id: warehouseId || 'WH-001',
            quantity_on_hand: 150,
            quantity_reserved: 30,
            quantity_available: 120,
            unit_cost: 75.5,
            last_updated: new Date(),
          },
          {
            id: '2',
            tenant_id: context.tenantId,
            product_id: '2',
            warehouse_id: warehouseId || 'WH-001',
            quantity_on_hand: 85,
            quantity_reserved: 10,
            quantity_available: 75,
            unit_cost: 225.0,
            last_updated: new Date(),
          },
        ];

        return {
          data: {
            inventory: inventory.slice(offset, offset + limit),
            total: inventory.length,
          },
        };
      } catch (error) {
        return {
          error: `Failed to fetch inventory: ${error}`,
        };
      }
    },
    {
      permission: {
        resource: 'inventory',
        action: 'read',
      },
    }
  );
}
