
import { getSalesSnapshots } from '@/lib/mock-data/firestore';
import { SalesReportsClient } from './client';
import { getReportData } from './actions';

export default async function SalesReportsPage() {
  const [reportData, snapshots] = await Promise.all([
    getReportData(),
    getSalesSnapshots(),
  ]);

  return <SalesReportsClient reportData={reportData} snapshots={snapshots} />;
}


