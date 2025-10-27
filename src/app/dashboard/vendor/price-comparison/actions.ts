
'use server';

import {
  MOCK_MATERIAL_MAPPINGS,
  MOCK_VENDORS,
} from '@/lib/mock-data/firestore';
import type { MaterialMapping } from '@/lib/mock-data/types';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

async function getVendor(id: string) {
  return MOCK_VENDORS.find((v) => v.id === id) || null;
}

export async function getAllMaterials(): Promise<string[]> {
  const materials = new Set(MOCK_MATERIAL_MAPPINGS.map((m) => m.material));
  return Array.from(materials);
}

async function getPriceComparisonData(material: string) {
  return MOCK_MATERIAL_MAPPINGS.filter((m) => m.material === material);
}

export async function fetchPriceComparisonData(material: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

  if (!material) return [];

  const data = await getPriceComparisonData(material);

  const enrichedData = await Promise.all(
    data.map(async (mapping: MaterialMapping) => {
      const vendor = await getVendor(mapping.vendorId);
      return {
        vendorName: vendor?.name || 'Unknown Vendor',
        unitPrice: mapping.unitPrice,
        qualityScore: vendor?.qualityScore || 0,
      };
    })
  );

  return enrichedData;
}


