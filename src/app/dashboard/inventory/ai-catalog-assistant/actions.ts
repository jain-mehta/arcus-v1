'use server';

import type { ExtractProductImageFromCatalogInput, ExtractProductImageFromCatalogOutput } from '@/ai/flows/extract-product-image-from-catalog';
import type { SuggestProductsFromCatalogTextOnlyInput, SuggestProductsFromCatalogTextOnlyOutput } from '@/ai/flows/suggest-products-from-catalog-text-only';
import {
  MOCK_ORGANIZATION_ID,
} from '@/lib/mock-data/firestore';
import { getUser, getSubordinates, getUserPermissions } from '@/lib/mock-data/rbac';
import type { UserContext } from '@/lib/mock-data/types';

async function buildUserContext(userId: string): Promise<UserContext> {
    const [user, permissions, subordinates] = await Promise.all([
        getUser(userId),
        getUserPermissions(userId),
        getSubordinates(userId)
    ]);

    if (!user) {
        throw new Error("User not found, cannot build user context.");
    }

    return {
        user,
        permissions,
        subordinates,
        orgId: user.orgId || MOCK_ORGANIZATION_ID,
    };
}

async function getCurrentUserId(): Promise<string> {
    return 'user-admin'; 
}


export async function getProductSuggestionsFromCatalogTextOnly(
  input: SuggestProductsFromCatalogTextOnlyInput
): Promise<SuggestProductsFromCatalogTextOnlyOutput> {
  const userId = await getCurrentUserId();
  const userContext = await buildUserContext(userId);
  if (!userContext.permissions.includes('manage-factory-inventory')) {
      throw new Error('Permission denied.');
  }
  const { suggestProductsFromCatalogTextOnly } = await import('@/ai/flows/suggest-products-from-catalog-text-only');
  return suggestProductsFromCatalogTextOnly(input);
}

export async function extractProductImage(
  input: ExtractProductImageFromCatalogInput
): Promise<ExtractProductImageFromCatalogOutput> {
  const userId = await getCurrentUserId();
  const userContext = await buildUserContext(userId);
  if (!userContext.permissions.includes('manage-factory-inventory')) {
      throw new Error('Permission denied.');
  }
  const { extractProductImageFromCatalog } = await import('@/ai/flows/extract-product-image-from-catalog');
  return extractProductImageFromCatalog(input);
}


