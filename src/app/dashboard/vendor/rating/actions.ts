
'use server';

import {
  MOCK_VENDORS,
  MOCK_RATING_CRITERIA,
  MOCK_RATING_HISTORY,
} from '@/lib/firebase/firestore';
import type {
  Vendor,
  VendorRatingCriteria,
  VendorRatingHistory,
} from '@/lib/firebase/types';
import { revalidatePath } from 'next/cache';

export async function getVendors(): Promise<Vendor[]> {
  return MOCK_VENDORS;
}

export async function getVendorRatingCriteria(
  vendorId: string
): Promise<VendorRatingCriteria[]> {
  return MOCK_RATING_CRITERIA.filter((c) => c.vendorId === vendorId);
}

export async function getVendorRatingHistory(
  vendorId: string
): Promise<VendorRatingHistory[]> {
  return MOCK_RATING_HISTORY.filter((h) => h.vendorId === vendorId);
}

export async function calculateAndUpdateVendorScores(
  vendorId: string,
  updatedCriteria: Partial<VendorRatingCriteria>[]
): Promise<{ success: boolean; message?: string }> {
  // 1. Update the individual criteria in the mock DB
  updatedCriteria.forEach(update => {
    const index = MOCK_RATING_CRITERIA.findIndex(c => c.id === update.id);
    if (index > -1) {
      MOCK_RATING_CRITERIA[index] = { ...MOCK_RATING_CRITERIA[index], ...update };
    }
  });

  // 2. Recalculate the overall score for the vendor
  const allVendorCriteria = MOCK_RATING_CRITERIA.filter(c => c.vendorId === vendorId);
  const totalWeight = allVendorCriteria.reduce((sum, c) => sum + c.weight, 0);
  
  if (totalWeight === 0) {
    return { success: false, message: "Cannot calculate score with zero total weight." };
  }

  const weightedScoreSum = allVendorCriteria.reduce((sum, c) => {
    // Prioritize manual score over auto score
    const score = c.manualScore !== undefined ? c.manualScore : c.autoScore;
    return sum + (score * c.weight);
  }, 0);

  const newOverallScore = weightedScoreSum / totalWeight;

  // 3. Update the vendor's main qualityScore
  const vendorIndex = MOCK_VENDORS.findIndex(v => v.id === vendorId);
  if (vendorIndex > -1) {
    MOCK_VENDORS[vendorIndex].qualityScore = newOverallScore;
  } else {
    return { success: false, message: "Vendor not found to update score." };
  }

  // 4. Add an entry to the rating history
  const newHistoryEntry: VendorRatingHistory = {
    id: `hist-${Date.now()}`,
    vendorId: vendorId,
    date: new Date().toISOString(),
    score: newOverallScore,
  };
  MOCK_RATING_HISTORY.push(newHistoryEntry);

  // 5. Revalidate paths to ensure UI updates
  revalidatePath('/dashboard/vendor/rating');
  revalidatePath(`/dashboard/vendor/profile/${vendorId}`);
  revalidatePath('/dashboard/vendor/dashboard');

  return { success: true };
}
