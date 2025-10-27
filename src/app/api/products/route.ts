/**
 * GET /api/products
 * POST /api/products
 * 
 * Product management endpoints
 */

import { NextRequest } from 'next/server';
import { protectedApiHandler } from '@/lib/api-helpers';

/**
 * GET /api/products
 * List all products for current tenant
 */
export async function GET(req: NextRequest) {
  return protectedApiHandler(
    req,
    async (context) => {
      const url = new URL(req.url);
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
      const offset = parseInt(url.searchParams.get('offset') || '0');
      const category = url.searchParams.get('category');

      try {
        // TODO: Fetch products from tenant database
        const products = [
          {
            id: '1',
            tenant_id: context.tenantId,
            sku: 'SKU001',
            name: 'Product Alpha',
            category: 'Electronics',
            description: 'High-quality electronic component',
            unit_price: 99.99,
            tax_rate: 18,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
          },
          {
            id: '2',
            tenant_id: context.tenantId,
            sku: 'SKU002',
            name: 'Product Beta',
            category: 'Hardware',
            description: 'Industrial hardware kit',
            unit_price: 249.99,
            tax_rate: 12,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ];

        return {
          data: {
            products: products.slice(offset, offset + limit),
            total: products.length,
            limit,
            offset,
          },
        };
      } catch (error) {
        return {
          error: `Failed to fetch products: ${error}`,
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

/**
 * POST /api/products
 * Create a new product
 */
export async function POST(req: NextRequest) {
  return protectedApiHandler(
    req,
    async (context) => {
      const {
        sku,
        name,
        description,
        category,
        unit_price,
        tax_rate = 0,
        reorder_level = 10,
        status = 'active',
      } = context.body;

      if (!sku || !name || !unit_price) {
        return {
          error: 'Missing required fields: sku, name, unit_price',
        };
      }

      try {
        // TODO: Create product in tenant database
        const newProduct = {
          id: Math.random().toString(),
          tenant_id: context.tenantId,
          sku,
          name,
          description,
          category,
          unit_price,
          tax_rate,
          reorder_level,
          status,
          created_at: new Date(),
          updated_at: new Date(),
        };

        return {
          data: newProduct,
        };
      } catch (error) {
        return {
          error: `Failed to create product: ${error}`,
        };
      }
    },
    {
      permission: {
        resource: 'product',
        action: 'create',
      },
    }
  );
}

