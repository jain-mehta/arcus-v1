/**
 * GET /api/products/[id]
 * PUT /api/products/[id]
 * DELETE /api/products/[id]
 */

import { NextRequest } from 'next/server';
import { protectedApiHandler } from '@/lib/api-helpers';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  return protectedApiHandler(
    req,
    async (context) => {
      try {
        // TODO: Fetch product from tenant database
        const product = {
          id,
          tenant_id: context.tenantId,
          sku: 'SKU001',
          name: 'Product Alpha',
          category: 'Electronics',
          unit_price: 99.99,
          tax_rate: 18,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
        };

        return {
          data: product,
        };
      } catch (error) {
        return {
          error: `Failed to fetch product: ${error}`,
        };
      }
    },
    {
      permission: {
        resource: 'product',
        action: 'read',
      },
    }
  );
}

export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  return protectedApiHandler(
    req,
    async (context) => {
      const updates = context.body;

      try {
        // TODO: Update product in tenant database
        const updatedProduct = {
          id,
          tenant_id: context.tenantId,
          ...updates,
          updated_at: new Date(),
        };

        return {
          data: updatedProduct,
        };
      } catch (error) {
        return {
          error: `Failed to update product: ${error}`,
        };
      }
    },
    {
      permission: {
        resource: 'product',
        action: 'update',
      },
    }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  return protectedApiHandler(
    req,
    async (context) => {
      try {
        // TODO: Delete product from tenant database
        return {
          data: {
            id,
            deleted: true,
          },
        };
      } catch (error) {
        return {
          error: `Failed to delete product: ${error}`,
        };
      }
    },
    {
      permission: {
        resource: 'product',
        action: 'delete',
      },
    }
  );
}
