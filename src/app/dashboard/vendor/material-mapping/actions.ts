
'use server';

import {
  MOCK_MATERIAL_MAPPINGS,
  MOCK_VOLUME_DISCOUNTS,
} from '@/lib/firebase/firestore';
import type { MaterialMapping, VolumeDiscount } from '@/lib/firebase/types';
import { revalidatePath } from 'next/cache';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

export async function getMaterialMappings(
  vendorId: string
): Promise<MaterialMapping[]> {
  return MOCK_MATERIAL_MAPPINGS.filter((m) => m.vendorId === vendorId);
}

export async function getVolumeDiscounts(
  mappingId: string
): Promise<VolumeDiscount[]> {
  return MOCK_VOLUME_DISCOUNTS.filter((d) => d.mappingId === mappingId);
}

export async function addMaterialMapping(
  vendorId: string,
  data: Omit<MaterialMapping, 'id' | 'vendorId' | 'active'>
): Promise<string> {
  const newMapping: MaterialMapping = {
    id: `map-${Date.now()}`,
    vendorId,
    active: true,
    ...data,
  };
  MOCK_MATERIAL_MAPPINGS.push(newMapping);
  revalidatePath('/dashboard/vendor/material-mapping');
  return newMapping.id;
}

export async function updateMaterialMappings(mappings: Partial<MaterialMapping>[]) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

  mappings.forEach((update) => {
    const index = MOCK_MATERIAL_MAPPINGS.findIndex((m) => m.id === update.id);
    if (index > -1) {
      MOCK_MATERIAL_MAPPINGS[index] = {
        ...MOCK_MATERIAL_MAPPINGS[index],
        ...update,
      };
    }
  });
  revalidatePath('/dashboard/vendor/material-mapping');
  return { success: true };
}

export async function deleteMaterialMapping(mappingId: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

  const index = MOCK_MATERIAL_MAPPINGS.findIndex((m) => m.id === mappingId);
  if (index > -1) {
    MOCK_MATERIAL_MAPPINGS.splice(index, 1);
    revalidatePath('/dashboard/vendor/material-mapping');
    return { success: true };
  }
  return { success: false, message: 'Mapping not found.' };
}

export async function addVolumeDiscount(
  data: Omit<VolumeDiscount, 'id'>
): Promise<string> {
  const newDiscount: VolumeDiscount = {
    id: `disc-${Date.now()}`,
    ...data,
  };
  MOCK_VOLUME_DISCOUNTS.push(newDiscount);
  revalidatePath('/dashboard/vendor/material-mapping');
  return newDiscount.id;
}

export async function updateVolumeDiscounts(discounts: Partial<VolumeDiscount>[]) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

  discounts.forEach((update) => {
    const index = MOCK_VOLUME_DISCOUNTS.findIndex((d) => d.id === update.id);
    if (index > -1) {
      MOCK_VOLUME_DISCOUNTS[index] = {
        ...MOCK_VOLUME_DISCOUNTS[index],
        ...update,
      };
    }
  });
  revalidatePath('/dashboard/vendor/material-mapping');
  return { success: true };
}

export async function deleteVolumeDiscount(discountId: string) {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'vendor', 'viewAll');

  const index = MOCK_VOLUME_DISCOUNTS.findIndex((d) => d.id === discountId);
  if (index > -1) {
    MOCK_VOLUME_DISCOUNTS.splice(index, 1);
    revalidatePath('/dashboard/vendor/material-mapping');
    return { success: true };
  }
  return { success: false, message: 'Discount not found.' };
}
