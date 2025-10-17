
import * as React from 'react';
import { DashboardClientLayout } from './client-layout';
import { getLayoutData } from './actions';

export const dynamic = 'force-dynamic';

// The root layout for the dashboard is now simplified.
// It calls a dedicated server action to fetch all necessary data.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {

  const { navConfig, userPermissions, currentUser, loading } = await getLayoutData();
  
  return (
    <DashboardClientLayout
      loading={loading}
      navConfig={navConfig}
      userPermissions={userPermissions}
      currentUser={currentUser}
    >
      {children}
    </DashboardClientLayout>
  );
}
