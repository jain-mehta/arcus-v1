

'use server';

import {
  getCustomersFromDb,
  getOrdersDb,
  getOpportunitiesFromDb,
  getSalesSnapshots,
  MOCK_OPPORTUNITIES,
} from '@/lib/mock-data/firestore';
import type { Opportunity, SalesSnapshot } from '@/lib/mock-data/types';
import { assertPermission } from '@/lib/rbac';
import { getSessionClaims } from '@/lib/session';

export async function getReportData() {
    const sessionClaims = await getSessionClaims();
    if (!sessionClaims) {
        throw new Error('Unauthorized');
    }
    await assertPermission(sessionClaims, 'sales', 'viewAll');

  const [opportunities, { customers }, { orders }] = await Promise.all([
    Promise.resolve(MOCK_OPPORTUNITIES),
    getCustomersFromDb(),
    getOrdersDb(),
  ]);

  const customerMap = new Map(customers.map((c) => [c.id, c.name]));

  // --- KPI Calculations ---
  const pipelineValue = opportunities
    .filter((opp) => opp.stage !== 'Closed Won' && opp.stage !== 'Closed Lost')
    .reduce((sum, opp) => sum + opp.value, 0);

  const closedWonCount = opportunities.filter(
    (opp) => opp.stage === 'Closed Won'
  ).length;
  const closedLostCount = opportunities.filter(
    (opp) => opp.stage === 'Closed Lost'
  ).length;
  const totalClosed = closedWonCount + closedLostCount;
  const winRate = totalClosed > 0 ? (closedWonCount / totalClosed) * 100 : 0;

  const closedWonOpportunities = opportunities.filter(
    (opp) => opp.stage === 'Closed Won'
  );
  const totalWonValue = closedWonOpportunities.reduce(
    (sum, opp) => sum + opp.value,
    0
  );
  const avgDealSize =
    closedWonCount > 0 ? totalWonValue / closedWonCount : 0;

  let totalCycleDays = 0;
  closedWonOpportunities.forEach((opp) => {
    const closeDate = new Date(opp.closeDate);
    const createdDate = new Date(opp.stageLastChanged || closeDate);
    createdDate.setDate(closeDate.getDate() - (opp.value % 60));

    const diffTime = Math.abs(closeDate.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    totalCycleDays += diffDays;
  });
  const salesCycleDays =
    closedWonCount > 0 ? Math.round(totalCycleDays / closedWonCount) : 0;

  const kpiData = [
    {
      title: 'Pipeline Value',
      value: `?${pipelineValue.toLocaleString('en-IN')}`,
      icon: 'HandCoins',
    },
    {
      title: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      icon: 'CheckCircle',
    },
    {
      title: 'Average Deal Size',
      value: `?${avgDealSize.toLocaleString('en-IN', {
        maximumFractionDigits: 0,
      })}`,
      icon: 'Target',
    },
    {
      title: 'Sales Cycle',
      value: `${salesCycleDays} Days`,
      icon: 'TrendingUp',
    },
  ];

  // --- Chart & Table Calculations ---
  const funnelStages = [
    'Qualification',
    'Needs Analysis',
    'Proposal',
    'Negotiation',
    'Closed Won',
  ];
  const funnelColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const funnelData = funnelStages.map((stage, index) => ({
    name: stage,
    value: opportunities.filter((opp) => opp.stage === stage).length,
    color: funnelColors[index],
  }));

  const topOpportunities = opportunities
    .filter((opp) => opp.stage !== 'Closed Won' && opp.stage !== 'Closed Lost')
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((opp) => ({
      ...opp,
      customerName: customerMap.get(opp.customerId) || 'Unknown Customer',
    }));

  const customerSourceMap = new Map(
    customers.map((c) => [c.id, c.source || 'Unknown'])
  );
  const revenueBySource: { [key: string]: number } = {};

  orders.forEach((order) => {
    const source = customerSourceMap.get(order.customerId) || 'Unknown';
    if (!revenueBySource[source]) {
      revenueBySource[source] = 0;
    }
    revenueBySource[source] += order.totalAmount;
  });

  const sourceData = Object.entries(revenueBySource).map(([name, value]) => ({
    name,
    value,
  }));

  return {
    kpiData,
    funnelData,
    topOpportunities,
    sourceData,
  };
}

export async function generateMonthlySnapshot(): Promise<{
  success: boolean;
  newSnapshot?: SalesSnapshot;
  message?: string;
}> {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0'
  )}`;

  const existingSnapshots = await getSalesSnapshots();

  // Check if a snapshot for the current period already exists
  if (existingSnapshots.some((s) => s.period === period)) {
    return {
      success: false,
      message: `A snapshot for ${period} already exists.`,
    };
  }

  const opportunities = await getOpportunitiesFromDb();

  // --- KPI Calculations (copied from page.tsx logic) ---

  // 1. Pipeline Value
  const pipelineValue = opportunities
    .filter((opp) => opp.stage !== 'Closed Won' && opp.stage !== 'Closed Lost')
    .reduce((sum, opp) => sum + opp.value, 0);

  // 2. Win Rate
  const closedWonCount = opportunities.filter(
    (opp) => opp.stage === 'Closed Won'
  ).length;
  const closedLostCount = opportunities.filter(
    (opp) => opp.stage === 'Closed Lost'
  ).length;
  const totalClosed = closedWonCount + closedLostCount;
  const winRate = totalClosed > 0 ? (closedWonCount / totalClosed) * 100 : 0;

  // 3. Average Deal Size
  const closedWonOpportunities = opportunities.filter(
    (opp) => opp.stage === 'Closed Won'
  );
  const totalWonValue = closedWonOpportunities.reduce(
    (sum, opp) => sum + opp.value,
    0
  );
  const avgDealSize =
    closedWonCount > 0 ? totalWonValue / closedWonCount : 0;

  // 4. Sales Cycle
  let totalCycleDays = 0;
  closedWonOpportunities.forEach((opp) => {
    const closeDate = new Date(opp.closeDate);
    // Fake created date for demo. In a real app, you'd have a `createdAt` field.
    const createdDate = new Date(opp.stageLastChanged || closeDate);
    createdDate.setDate(closeDate.getDate() - (opp.value % 60)); // Further randomize for demo

    const diffTime = Math.abs(closeDate.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    totalCycleDays += diffDays;
  });
  const salesCycleDays =
    closedWonCount > 0 ? Math.round(totalCycleDays / closedWonCount) : 0;

  // Create and save the new snapshot
  const newSnapshot: SalesSnapshot = {
    id: `snap-${Date.now()}`,
    period,
    createdAt: new Date().toISOString(),
    pipelineValue,
    winRate,
    avgDealSize,
    salesCycleDays,
  };

  // MOCK: In a real DB, you'd insert this record.
  // MOCK_SALES_SNAPSHOTS.push(newSnapshot);
  // MOCK_SALES_SNAPSHOTS.sort((a,b) => a.period.localeCompare(b.period));

  return { success: true, newSnapshot };
}


