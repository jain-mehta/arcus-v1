

'use server';

import type { SalesTarget, SalesTargetWithProgress } from '@/lib/firebase/types';
import { MOCK_SALES_TARGETS, MOCK_OPPORTUNITIES } from '@/lib/firebase/firestore';

export async function getSalesTargetsWithProgress(): Promise<SalesTargetWithProgress[]> {
  // In a real app, 'currentValue' would be a dynamic query.
  // Here, we simulate it.
  return MOCK_SALES_TARGETS.map((target) => {
    let currentValue = 0;
    if (target.type === 'Deals') {
      currentValue = 12; // Mock value
    } else if (target.type === 'Leads') {
      currentValue = 85; // Mock value
    } else if (target.type === 'Revenue') {
      currentValue = 750000; // Mock value
    }
    return {
      ...target,
      currentValue,
      progress: (currentValue / target.value) * 100,
    };
  });
}

export async function addSalesTarget(data: any): Promise<{ success: boolean }> {
  const newTarget: SalesTarget = {
    id: `target-${Date.now()}`,
    ...data,
  };
  MOCK_SALES_TARGETS.push(newTarget);
  return { success: true };
}

export async function deleteSalesTarget(id: string): Promise<{ success: boolean }> {
  const index = MOCK_SALES_TARGETS.findIndex((t) => t.id === id);
  if (index > -1) {
    MOCK_SALES_TARGETS.splice(index, 1);
    return { success: true };
  }
  return { success: false };
}

export async function archiveOldOpportunities(): Promise<{
  success: boolean;
  count: number;
  message?: string;
}> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  let archivedCount = 0;
  MOCK_OPPORTUNITIES.forEach((opp) => {
    const isClosed =
      opp.stage === 'Closed Won' || opp.stage === 'Closed Lost';
    const closeDate = new Date(opp.closeDate);

    if (isClosed && closeDate < oneYearAgo && !opp.isDeleted) {
      opp.isDeleted = true; // Mark as archived/deleted
      archivedCount++;
    }
  });

  if (archivedCount > 0) {
    return { success: true, count: archivedCount };
  } else {
    return { success: true, count: 0, message: 'No old opportunities to archive.' };
  }
}
