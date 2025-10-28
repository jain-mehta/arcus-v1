
'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getNavConfig } from '@/lib/mock-data/firestore';
import { getSessionClaims } from '@/lib/session';
import { getRolePermissions } from '@/lib/rbac';
import type { PermissionMap } from '@/lib/rbac';

/**
 * Server action to fetch all necessary data for the main dashboard layout.
 * This function is the single source of truth for layout data, ensuring a clean
 * separation of server-side logic.
 */
export async function getLayoutData() {
  const hdrs = await headers();
  const pathname = hdrs.get('x-next-pathname') || '';
  
  // Get user from session claims (JWT) instead of Firebase mock data
  const sessionClaims = await getSessionClaims();
  
  console.log('[Dashboard] getLayoutData called');
  console.log('[Dashboard] Session claims:', sessionClaims ? { uid: sessionClaims.uid, email: sessionClaims.email, roleId: sessionClaims.roleId } : 'null');

  // If no session, user is not authenticated
  if (!sessionClaims) {
    console.log('[Dashboard] No session claims - returning null user');
    return {
      navConfig: getNavConfig(),
      userPermissions: null,
      currentUser: null,
      loading: false,
    };
  }

  console.log('[Dashboard] User authenticated:', sessionClaims.email);

  // Enforce forced password change. This is a critical security measure.
  // Note: For now, we don't have mustChangePassword field in Supabase JWT
  // if (currentUser?.mustChangePassword && pathname !== '/dashboard/settings/profile') {
  //   redirect('/dashboard/settings/profile');
  // }

  let userPermissions: PermissionMap | null = null;
  
  // Check if user is admin by email (primary check)
  const adminEmails = ['admin@arcus.local'];
  const isAdminByEmail = sessionClaims.email && adminEmails.includes(sessionClaims.email);
  
  console.log('[Dashboard] Checking permissions for:', { 
    email: sessionClaims.email, 
    roleId: sessionClaims.roleId, 
    isAdminByEmail 
  });
  
  if (isAdminByEmail || sessionClaims.roleId === 'admin') {
    // Admin users should get all permissions
    console.log('[Dashboard] User is admin, fetching admin permissions');
    userPermissions = await getRolePermissions('admin');
    console.log('[Dashboard] Admin permissions retrieved:', userPermissions ? Object.keys(userPermissions) : 'null');
  } else if (sessionClaims?.roleId) {
    console.log('[Dashboard] User has role:', sessionClaims.roleId);
    userPermissions = await getRolePermissions(sessionClaims.roleId);
    console.log('[Dashboard] Role permissions retrieved:', userPermissions ? Object.keys(userPermissions) : 'null');
  } else {
    console.log('[Dashboard] User has no role defined');
  }

  const navConfig = getNavConfig();

  // The client will now be responsible for filtering based on permissions.
  // We pass the full config and the user's permissions.
  
  const userProps = sessionClaims
    ? {
        id: sessionClaims.uid,
        name: sessionClaims.email?.split('@')[0] || 'User', // Fallback name from email
        email: sessionClaims.email,
      }
    : null;

  console.log('[Dashboard] Returning user props:', userProps);
  console.log('[Dashboard] UserPermissions passed to client:', userPermissions ? `${Object.keys(userPermissions).length} modules` : 'null');

  return {
    navConfig,
    userPermissions,
    currentUser: userProps,
    loading: false, // Data is now fully loaded on the server.
  };
}

/**
 * Fetches all necessary data for the main dashboard page.
 */
export async function getDashboardData() {
  const { getVendors, getPurchaseOrders } = await import('@/lib/mock-data/firestore');
  const { assertPermission } = await import('@/lib/rbac');
  const sessionClaims = await getSessionClaims();
  
  if (!sessionClaims) {
    // If there's no session, redirect to the login page instead of throwing.
    // This mirrors the behavior used in permission guards elsewhere in the app.
    redirect('/login');
  }

  // Check permission to view dashboard
  await assertPermission(sessionClaims, 'dashboard', 'view');

  const [{ purchaseOrders }, vendors] = await Promise.all([
    getPurchaseOrders(),
    getVendors()
  ]);
  
  // Key Metrics
  const activeVendors = vendors.filter(v => v.status === 'Active').length;
  const outstandingBalance = purchaseOrders
    .filter(po => po.paymentStatus !== 'Paid')
    .reduce((acc, po) => acc + (po.totalAmount - po.amountGiven), 0);
  const ytdSpend = purchaseOrders.reduce((acc, po) => acc + po.totalAmount, 0);

  // Sales Overview Mock Data
  const salesOverview = {
    totalRevenue: 1250000,
    monthlyChange: "+15.2%",
    topProducts: [
      { name: "Galaxy Shower", sold: 120, progress: 80, storeName: 'Delhi Store' },
      { name: "Solo Faucet", sold: 90, progress: 60, storeName: 'Mumbai Store' },
      { name: "Cubix-B Mixer", sold: 75, progress: 50, storeName: 'Delhi Store' },
    ],
    revenueFigures: [
      { name: "Jan", revenue: 800000 },
      { name: "Feb", revenue: 950000 },
      { name: "Mar", revenue: 1100000 },
      { name: "Apr", revenue: 1250000 },
    ],
  };

  // Pending Payments
  const pendingPayments = purchaseOrders
    .filter(po => po.paymentStatus !== 'Paid')
    .slice(0, 5);
    
  // Critical Alerts Mock Data
  const criticalAlerts = [
    { message: "Inventory for 'Brass Fittings' is critically low at the main factory.", time: "2 hours ago" },
    { message: "Payment of ?5,40,000 to 'Shree Ram Metals' is overdue by 3 days.", time: "1 day ago" },
  ];

  return {
    keyMetrics: { activeVendors, outstandingBalance, ytdSpend },
    salesOverview,
    pendingPayments,
    criticalAlerts,
  };
}


