
'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSessionClaims } from '@/lib/session';
import { getRolePermissions } from '@/lib/rbac';
import type { PermissionMap } from '@/lib/rbac';

// Navigation configuration - static data
function getNavConfig() {
  return {
    main: [
      { href: "/dashboard", label: "Dashboard", permission: "dashboard:view" },
      { href: "/dashboard/vendor", label: "Vendor", permission: "vendor:viewAll" },
      { href: "/dashboard/inventory", label: "Inventory", permission: "inventory:viewAll" },
      { href: "/dashboard/sales", label: "Sales", permission: "sales:leads:view" },
      { href: "/dashboard/store", label: "Stores", permission: "store:bills:view" },
      { href: "/dashboard/hrms", label: "HRMS", permission: "hrms:employees:view" },
      { href: "/dashboard/users", label: "User Management", permission: "users:viewAll" },
    ],
    subNavigation: {
      "/dashboard/sales": [
        { href: "/dashboard/sales/dashboard", label: "Dashboard", icon: "dashboard", permission: "dashboard:view" },
        { href: "/dashboard/sales/leads", label: "Leads", icon: "logo", permission: "sales:leads:view" },
        { href: "/dashboard/sales/opportunities", label: "Opportunities", icon: "folderKanban", permission: "sales:opportunities:view" },
        { href: "/dashboard/sales/quotations", label: "Quotations", icon: "fileText", permission: "sales:quotations:view" },
        { href: "/dashboard/sales/orders", label: "Orders", icon: "shoppingCart", permission: "sales:orders:view" },
        { href: "/dashboard/sales/customers", label: "Customers", icon: "users", permission: "sales:customers:view" },
        { href: "/dashboard/sales/reports", label: "Reports", icon: "barChart", permission: "sales:reports:view" },
        { href: "/dashboard/sales/settings", label: "Settings", icon: "settings", permission: "sales:settings:edit" },
      ],
      "/dashboard/vendor": [
        { href: "/dashboard/vendor", label: "Dashboard", icon: "dashboard", permission: "vendor:dashboard:view" },
        { href: "/dashboard/vendor/list", label: "Vendor List", icon: "users", permission: "vendor:viewAll" },
        { href: "/dashboard/vendor/onboarding", label: "Onboarding", icon: "userPlus", permission: "vendor:onboard" },
        { href: "/dashboard/vendor/purchase-orders", label: "Purchase Orders", icon: "shoppingCart", permission: "vendor:purchaseOrders:view" },
        { href: "/dashboard/vendor/invoices", label: "Invoices", icon: "fileText", permission: "vendor:invoices:view" },
        { href: "/dashboard/vendor/material-mapping", label: "Material Mapping", icon: "layers", permission: "vendor:mapping:view" },
        { href: "/dashboard/vendor/price-comparison", label: "Price Comparison", icon: "barChart3", permission: "vendor:pricing:view" },
        { href: "/dashboard/vendor/documents", label: "Documents", icon: "folder", permission: "vendor:documents:view" },
        { href: "/dashboard/vendor/rating", label: "Rating", icon: "star", permission: "vendor:rating:view" },
      ],
      "/dashboard/inventory": [
        { href: "/dashboard/inventory", label: "Overview", icon: "package", permission: "inventory:overview:view" },
        { href: "/dashboard/inventory/product-master", label: "Product Master", icon: "database", permission: "inventory:products:view" },
        { href: "/dashboard/inventory/goods-inward", label: "Goods Inward", icon: "arrowDownToLine", permission: "inventory:goodsInward:view" },
        { href: "/dashboard/inventory/goods-outward", label: "Goods Outward", icon: "arrowUpFromLine", permission: "inventory:goodsOutward:view" },
        { href: "/dashboard/inventory/stock-transfers", label: "Stock Transfers", icon: "arrowRightLeft", permission: "inventory:transfers:view" },
        { href: "/dashboard/inventory/cycle-counting", label: "Cycle Counting", icon: "calculator", permission: "inventory:counting:view" },
        { href: "/dashboard/inventory/qr-code-generator", label: "QR Code Generator", icon: "qrCode", permission: "inventory:qr:generate" },
      ],
      "/dashboard/store": [
        { href: "/dashboard/store", label: "Overview", icon: "store", permission: "store:overview:view" },
        { href: "/dashboard/store/manage", label: "Store Management", icon: "settings", permission: "store:manage" },
        { href: "/dashboard/store/billing", label: "Billing/POS", icon: "calculator", permission: "store:bills:view" },
        { href: "/dashboard/store/inventory", label: "Inventory", icon: "package", permission: "store:inventory:view" },
        { href: "/dashboard/store/receiving", label: "Receiving", icon: "packageOpen", permission: "store:receiving:view" },
        { href: "/dashboard/store/reports", label: "Reports", icon: "barChart", permission: "store:reports:view" },
      ],
      "/dashboard/hrms": [
        { href: "/dashboard/hrms", label: "Overview", icon: "users", permission: "hrms:overview:view" },
        { href: "/dashboard/hrms/employees", label: "Employees", icon: "user", permission: "hrms:employees:view" },
        { href: "/dashboard/hrms/attendance", label: "Attendance", icon: "clock", permission: "hrms:attendance:view" },
        { href: "/dashboard/hrms/leaves", label: "Leaves", icon: "calendar", permission: "hrms:leaves:view" },
        { href: "/dashboard/hrms/payroll", label: "Payroll", icon: "creditCard", permission: "hrms:payroll:view" },
        { href: "/dashboard/hrms/performance", label: "Performance", icon: "target", permission: "hrms:performance:view" },
        { href: "/dashboard/hrms/recruitment", label: "Recruitment", icon: "userPlus", permission: "hrms:recruitment:view" },
        { href: "/dashboard/hrms/compliance", label: "Compliance", icon: "shield", permission: "hrms:compliance:view" },
        { href: "/dashboard/hrms/reports", label: "Reports", icon: "barChart", permission: "hrms:reports:view" },
      ],
      "/dashboard/users": [
        { href: "/dashboard/users", label: "Users", icon: "users", permission: "users:viewAll" },
        { href: "/dashboard/users/roles", label: "Roles", icon: "userCog", permission: "users:roles:viewAll" },
      ],
    }
  };
}

/**
 * Server action to fetch all necessary data for the main dashboard layout.
 * This function is the single source of truth for layout data, ensuring a clean
 * separation of server-side logic.
 */
export async function getLayoutData() {
  const hdrs = await headers();
  const pathname = hdrs.get('x-next-pathname') || '';
  
  // Get user from session claims (JWT)
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
  const { assertPermission } = await import('@/lib/rbac');
  const sessionClaims = await getSessionClaims();

  if (!sessionClaims) {
    // If there's no session, redirect to the login page instead of throwing.
    // This mirrors the behavior used in permission guards elsewhere in the app.
    redirect('/login');
  }

  // Check permission to view dashboard
  await assertPermission(sessionClaims, 'dashboard', 'view');

  try {
    // Import Supabase client
    const { getSupabaseServerClient } = await import('@/lib/supabase/client');
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Fetch vendors and purchase orders from database
    const [vendorsResult, purchaseOrdersResult] = await Promise.all([
      supabase.from('vendors').select('*'),
      supabase.from('purchase_orders').select('*')
    ]);

    const vendors = vendorsResult.data || [];
    const purchaseOrders = purchaseOrdersResult.data || [];

    // Key Metrics from real data
    const activeVendors = vendors.filter(v => v.status === 'Active').length;
    const outstandingBalance = purchaseOrders
      .filter(po => po.payment_status !== 'Paid')
      .reduce((acc, po) => acc + ((po.total_amount || 0) - (po.amount_given || 0)), 0);
    const ytdSpend = purchaseOrders.reduce((acc, po) => acc + (po.total_amount || 0), 0);

    // Sales Overview from real sales data
    const salesResult = await supabase.from('sales_orders').select('*');
    const salesOrders = salesResult.data || [];

    const totalRevenue = salesOrders.reduce((acc, order) => acc + (order.total_amount || 0), 0);
    const salesOverview = {
      totalRevenue,
      monthlyChange: "+15.2%", // TODO: Calculate from actual data
      topProducts: [
        { name: "Galaxy Shower", sold: 120, progress: 80, storeName: 'Delhi Store' },
        { name: "Solo Faucet", sold: 90, progress: 60, storeName: 'Mumbai Store' },
        { name: "Cubix-B Mixer", sold: 75, progress: 50, storeName: 'Delhi Store' },
      ], // TODO: Calculate from actual sales data
      revenueFigures: [
        { name: "Jan", revenue: 800000 },
        { name: "Feb", revenue: 950000 },
        { name: "Mar", revenue: 1100000 },
        { name: "Apr", revenue: totalRevenue },
      ], // TODO: Calculate from actual monthly data
    };

    // Pending Payments from real data
    const pendingPayments = purchaseOrders
      .filter(po => po.payment_status !== 'Paid')
      .slice(0, 5)
      .map(po => ({
        id: po.id,
        vendor: po.vendor_name || 'Unknown Vendor',
        amount: po.total_amount || 0,
        dueDate: po.due_date,
        status: po.payment_status
      }));

    // Critical Alerts from real data
    const alertsResult = await supabase.from('alerts').select('*').eq('status', 'active').limit(5);
    const dbAlerts = alertsResult.data || [];

    const criticalAlerts = dbAlerts.length > 0
      ? dbAlerts.map(alert => ({
          message: alert.message,
          time: alert.created_at
        }))
      : [
          { message: "Inventory for 'Brass Fittings' is critically low at the main factory.", time: "2 hours ago" },
          { message: "Payment of ₹5,40,000 to 'Shree Ram Metals' is overdue by 3 days.", time: "1 day ago" },
        ]; // Fallback to example alerts if no real alerts

    return {
      keyMetrics: { activeVendors, outstandingBalance, ytdSpend },
      salesOverview,
      pendingPayments,
      criticalAlerts,
    };
  } catch (error) {
    console.error('[getDashboardData] Error fetching dashboard data:', error);

    // Fallback to basic data structure with empty values
    return {
      keyMetrics: { activeVendors: 0, outstandingBalance: 0, ytdSpend: 0 },
      salesOverview: {
        totalRevenue: 0,
        monthlyChange: "0%",
        topProducts: [],
        revenueFigures: [],
      },
      pendingPayments: [],
      criticalAlerts: [
        { message: "Dashboard data could not be loaded. Please check your connection.", time: "now" }
      ],
    };
  }
}


