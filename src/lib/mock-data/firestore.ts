import type {
  Module,
  Organization,
  User,
  Role,
  Permission,
  Lead,
  UserContext,
  Customer,
  Opportunity,
  Order,
  Quotation,
  CommunicationLog,
  Product,
  Vendor,
  PurchaseOrder,
  MaterialMapping,
  VolumeDiscount,
  VendorRatingCriteria,
  VendorRatingHistory,
  SalesSnapshot,
  Invoice,
  VendorDocument,
  Visit,
  Store,
  LeavePolicy,
  LeaveRequest,
  JobOpening,
  Applicant,
  SalaryStructure,
  Payslip,
  AuditLog,
} from "./types";
import { z } from "zod";
import type { PayslipLayout } from "@/app/dashboard/hrms/payroll/formats/actions";

// =================================================================
// MOCK DATABASE
// This section simulates a Firestore database with placeholder data
// for development and verification purposes. It will be removed as
// we build the real database interactions.
// =================================================================

export const MOCK_ORGANIZATION_ID = "bobs-org";

export let MOCK_VENDORS: Vendor[] = [];
export let MOCK_VENDOR_DOCUMENTS: VendorDocument[] = [];
export let MOCK_RATING_CRITERIA: VendorRatingCriteria[] = [];
export let MOCK_RATING_HISTORY: VendorRatingHistory[] = [];
export let MOCK_INVOICES: Invoice[] = [];
export let MOCK_SALES_TARGETS: any[] = [];
export let MOCK_SALES_SNAPSHOTS: SalesSnapshot[] = [];
export let MOCK_MATERIAL_MAPPINGS: MaterialMapping[] = [];
export let MOCK_VOLUME_DISCOUNTS: VolumeDiscount[] = [];
export let MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [];
export let MOCK_COMMUNICATION_LOGS: CommunicationLog[] = [];

export let MOCK_STORES: Store[] = [
  {
    id: "store-1",
    name: "Delhi Store",
    city: "Delhi",
    state: "Delhi",
    region: "North",
    pincode: "110001",
    address: "123 Main St, Delhi",
    cashInHand: 50000,
    cashAlertThreshold: 20000,
    managerId: "user-suresh",
    invoiceTemplate: "A4",
  },
  {
    id: "store-2",
    name: "Mumbai Store",
    city: "Mumbai",
    state: "Maharashtra",
    region: "West",
    pincode: "400001",
    address: "456 Sea Link Rd, Mumbai",
    cashInHand: 75000,
    cashAlertThreshold: 25000,
    invoiceTemplate: "thermal",
  },
];
export let MOCK_SHIFT_LOGS: any[] = [];
export let MOCK_SHIPMENTS: any[] = [];
export let MOCK_LEAVE_POLICIES: LeavePolicy[] = [
  { id: "policy-1", leaveType: "Casual Leave", daysAllowed: 12 },
  { id: "policy-2", leaveType: "Sick Leave", daysAllowed: 10 },
  { id: "policy-3", leaveType: "Paid Leave", daysAllowed: 15 },
  { id: "policy-4", leaveType: "Loss of Pay", daysAllowed: 99 },
];
export let MOCK_LEAVE_REQUESTS: LeaveRequest[] = [];
export let MOCK_JOB_OPENINGS: JobOpening[] = [];
export let MOCK_APPLICANTS: Applicant[] = [];
export let MOCK_COMPLIANCE_DOCS: any[] = [];
export let MOCK_PERFORMANCE_CYCLES: any[] = [];
export let MOCK_EMPLOYEE_REVIEWS: any[] = [];
export let MOCK_SALARY_STRUCTURES: SalaryStructure[] = [];
export let MOCK_PAYSLIPS: Payslip[] = [];
export let MOCK_PAYROLL_FORMATS: PayslipLayout[] = [];
export let MOCK_ANNOUNCEMENTS: any[] = [];
export let MOCK_POLICY_DOCS: any[] = [];

export let MOCK_SETTLEMENTS: any[] = [];

export const MOCK_PERMISSIONS: Permission[] = [
  {
    id: "view-dashboard",
    name: "View Dashboard",
    description: "Can view the main dashboard.",
  },
  {
    id: "manage-users",
    name: "Manage Users",
    description: "Can add, edit, and remove users.",
  },
  {
    id: "manage-roles",
    name: "Manage Roles",
    description: "Can define and assign roles and permissions.",
  },
  {
    id: "create-lead",
    name: "Create Lead",
    description: "Can create new sales leads.",
  },
  {
    id: "view-all-leads",
    name: "View All Leads",
    description: "Can view all leads within the organization.",
  },
  {
    id: "view-regional-leads",
    name: "View Regional Leads",
    description: "Can view leads in their region and for their subordinates.",
  },
  {
    id: "view-own-leads",
    name: "View Own Leads",
    description: "Can only view leads they own.",
  },
  {
    id: "view-all-opportunities",
    name: "View All Opportunities",
    description: "Can view all opportunities.",
  },
  {
    id: "manage-factory-inventory",
    name: "Manage Factory Inventory",
    description: "Can manage main factory inventory.",
  },
  {
    id: "manage-store-inventory",
    name: "Manage Store Inventory",
    description: "Can manage inventory for their assigned store.",
  },
  {
    id: "view-all-inventory",
    name: "View Both Factory and Store Inventories",
    description: "Can view both factory and all store inventories.",
  },
  {
    id: "view-store-inventory",
    name: "View Store Inventory",
    description: "Can view inventory for their assigned store.",
  },
  {
    id: "manage-stores",
    name: "Manage Stores",
    description: "Can add, edit, and view all stores.",
  },
  {
    id: "manage-purchase-orders",
    name: "Manage Purchase Orders",
    description: "Can create and manage purchase orders.",
  },
  {
    id: "manage-orders",
    name: "Manage Orders",
    description: "Can create and manage orders and POS transactions.",
  },
  {
    id: "create-quotation",
    name: "Create Quotation",
    description: "Can create sales quotations.",
  },
  {
    id: "manage-payroll",
    name: "Manage Payroll",
    description: "Can generate and manage payroll.",
  },
  {
    id: "approve-leave",
    name: "Approve Leave Requests",
    description: "Can approve or reject leave requests.",
  },
  {
    id: "manage-employees",
    name: "Manage Employees",
    description: "Can add/update/delete employees and their records.",
  },
  {
    id: "manage-payslip-formats",
    name: "Manage Payslip Formats",
    description: "Can create and manage payslip formats.",
  },
  {
    id: "manage-settlements",
    name: "Manage Settlements",
    description: "Can process full & final settlements.",
  },
];

export const MOCK_ROLES: Role[] = [
  {
    id: "admin",
    name: "Admin",
    orgId: MOCK_ORGANIZATION_ID,
    permissions:{
      dashboard: { 
        view: true, 
        viewAnalytics: true, 
        viewReports: true, 
        exportData: true 
      },
      sales: {
        leads: {
          view: true, viewOwn: true, viewTeam: true, viewAll: true, create: true, edit: true, editOwn: true, 
          delete: true, deleteOwn: true, assign: true, export: true, import: true
        },
        opportunities: {
          view: true, viewOwn: true, viewTeam: true, viewAll: true, create: true, edit: true, editOwn: true,
          delete: true, updateStage: true, assign: true, export: true
        },
        quotations: {
          view: true, viewOwn: true, viewTeam: true, viewAll: true, create: true, edit: true, editOwn: true,
          delete: true, approve: true, send: true, export: true, viewPricing: true
        },
        invoices: {
          view: true, viewOwn: true, viewAll: true, create: true, edit: true, delete: true,
          approve: true, send: true, export: true, viewPayments: true
        }
      },
      inventory: {
        
        viewAll: true,
        products: {
          view: true, viewAll: true, create: true, edit: true, delete: true, viewCost: true,
          editCost: true, viewStock: true, manageVariants: true, managePricing: true, export: true, import: true
        },
        stock: {
          view: true, viewAll: true, addStock: true, removeStock: true, transferStock: true,
          adjustStock: true, viewStockValue: true, viewLowStock: true, manageWarehouses: true, viewStockHistory: true, export: true
        },
        categories: { 
          view: true, create: true, edit: true, delete: true, manageHierarchy: true 
        },
        stockAlerts: { 
          view: true, configure: true, receiveNotifications: true, manageReorderPoints: true 
        },
        pricing: {
          view: true, edit: true, viewMargins: true, createDiscounts: true, approveDiscounts: true
        },
        barcodes: {
          view: true, generate: true, print: true, scan: true
        }
      },
      store: {
        bills: {
          view: true, viewOwn: true, viewAll: true, create: true, edit: true, editOwn: true,
          delete: true, viewPayments: true, processPayment: true, processRefund: true, export: true
        },
        invoices: {
          view: true, viewPastBills: true, viewAll: true, create: true, edit: true, delete: true, sendEmail: true, export: true
        },
        pos: {
          access: true, viewSales: true, processSale: true, processReturn: true, applyDiscount: true, viewDailySummary: true,
          openCashDrawer: true, voidTransaction: true
        },
        customers: {
          view: true, create: true, edit: true, delete: true, viewPurchaseHistory: true, manageLoyalty: true
        }
      },
      supply: {
        vendors: {
          view: true, viewAll: true, create: true, edit: true, delete: true, viewPayments: true, 
          viewPerformance: true, manageContracts: true, export: true
        },
        purchaseOrders: {
          view: true, viewAll: true, create: true, edit: true, delete: true, approve: true, send: true, 
          receiveGoods: true, viewPricing: true, export: true
        },
        bills: {
          view: true, viewAll: true, create: true, edit: true, delete: true, approve: true, 
          processPayment: true, viewPaymentStatus: true, export: true
        },
        grn: {
          view: true, create: true, edit: true, approve: true, reject: true
        }
      },
      hrms: {
        employees: {
          view: true, viewAll: true, viewOwn: true, create: true, edit: true, delete: true, 
          viewSalary: true, editSalary: true, viewDocuments: true, manageDocuments: true, export: true
        },
        payroll: {
          view: true, viewAll: true, process: true, approve: true, viewReports: true, generatePayslips: true, export: true
        },
        attendance: {
          view: true, viewAll: true, viewOwn: true, mark: true, edit: true, approve: true, 
          viewReports: true, manageShifts: true, export: true
        },
        settlement: {
          view: true, viewAll: true, create: true, process: true, approve: true, viewDocuments: true, export: true
        },
        leaves: {
          view: true, viewAll: true, viewOwn: true, apply: true, approve: true, reject: true, 
          viewBalance: true, managePolicy: true, cancelLeave: true
        },
        recruitment: {
          view: true, createJob: true, viewCandidates: true, scheduleInterview: true, updateStatus: true, makeOffer: true
        }
      },
      vendor: { 
        viewAll: true, viewAssigned: true, create: true, edit: true, delete: true, 
        communicate: true, viewPayments: true, viewPerformance: true, grantPortalAccess: true, export: true 
      },
      users: { 
        viewAll: true, create: true, edit: true, delete: true, resetPassword: true, 
        assignRoles: true, deactivate: true, viewAuditLog: true 
      },
      settings: { 
        view: true, manageRoles: true, manageUsers: true, manageOrganization: true, 
        viewAuditLog: true, manageIntegrations: true, manageBilling: true, manageNotifications: true 
      }
    },
  }
];

export let MOCK_USERS: User[] = [
  {
    id: "user-admin",
    name: "Admin User",
    email: "admin@bobssale.com",
    orgId: MOCK_ORGANIZATION_ID,
    roleIds: ["admin"],
    dateOfBirth: "1985-01-01",
    hireDate: "2022-01-01",
    status: "Active",
  }
];

export let MOCK_LEADS: Lead[] = [
  {
    id: "lead-1",
    name: "Amit Lead 1",
    company: "Innovate Solutions",
    orgId: MOCK_ORGANIZATION_ID,
    ownerId: "user-amit",
    created: new Date("2024-07-20").toISOString(),
    stage: "New",
    assignedTo: "Amit Patel",
    lastActivity: "Yesterday",
  },
  {
    id: "lead-2",
    name: "Priya Lead 1",
    company: "Sunrise Builders",
    orgId: MOCK_ORGANIZATION_ID,
    ownerId: "user-priya",
    created: new Date("2024-07-21").toISOString(),
    stage: "Contacted",
    assignedTo: "Priya Sharma",
    lastActivity: "Today",
  },
  {
    id: "lead-3",
    name: "Amit Lead 2",
    company: "Apex Constructions",
    orgId: MOCK_ORGANIZATION_ID,
    ownerId: "user-amit",
    created: new Date("2024-07-18").toISOString(),
    stage: "Qualified",
    assignedTo: "Amit Patel",
    lastActivity: "3 days ago",
  },
  {
    id: "lead-4",
    name: "Unassigned Lead",
    company: "Global Corp",
    orgId: MOCK_ORGANIZATION_ID,
    ownerId: "user-admin",
    created: new Date("2024-07-15").toISOString(),
    stage: "New",
    assignedTo: "Admin User",
    lastActivity: "Last week",
  },
];
export let MOCK_CUSTOMERS: Customer[] = [];

export let MOCK_OPPORTUNITIES: Opportunity[] = [];
export let MOCK_AUDIT_LOGS: AuditLog[] = [];
// Sessions are managed in a separate module (src/lib/mock-sessions.ts)
export let MOCK_ORDERS: Order[] = [];
export let MOCK_QUOTATIONS: Quotation[] = [];
export let MOCK_VISITS: Visit[] = [];
export let MOCK_PRODUCTS: Product[] = [];

// =================================================================
// DATA ACCESS LAYER
// =================================================================

/**
 * Retrieves a single organization document from Firestore.
 * This demonstrates the safe data access pattern using getFirebaseAdmin().
 * @param orgId The ID of the organization to fetch.
 * @returns A promise that resolves to the Organization object or null if not found.
 */
export async function getOrganization(
  orgId: string
): Promise<Organization | null> {
  // Client-safe mock implementation to avoid importing firebase-admin in shared module
  return Promise.resolve({
    id: orgId,
    name: "Bobs Bath Fittings Pvt Ltd",
  } as unknown as Organization);
}

/**
 * Fetches the list of accessible modules for the application.
 *
 * NOTE: This is currently returning a hardcoded array of modules to ensure
 * the UI remains functional while the backend is being rebuilt. In a future
 * batch, this will be replaced with a database call that respects user permissions.
 *
 * @returns A promise that resolves to an array of Module objects.
 */
export function getModules(): Promise<Module[]> {
  // This is mock data to keep the UI running. It will be replaced later.
  return Promise.resolve([
    {
      id: "1",
      name: "Dashboard",
      path: "/dashboard",
      description: "Main overview dashboard",
    },
    {
      id: "2",
      name: "Vendor Management",
      path: "/dashboard/vendor",
      description: "Manage vendor relations",
    },
    {
      id: "3",
      name: "Inventory Management",
      path: "/dashboard/inventory",
      description: "Track stock and products",
    },
    {
      id: "4",
      name: "Sales Management",
      path: "/dashboard/sales",
      description: "Manage leads, opportunities, and sales",
    },
    {
      id: "8",
      name: "Store Management",
      path: "/dashboard/store",
      description: "Manage store operations",
    },
    {
      id: "5",
      name: "HRMS",
      path: "/dashboard/hrms",
      description: "Human Resource Management",
    },
    {
      id: "6",
      name: "User Management",
      path: "/dashboard/users",
      description: "Manage users and permissions",
    },
    {
      id: "7",
      name: "Supply Chain",
      path: "/dashboard/supply-chain",
      description: "Manage supply chain logistics",
    },
  ]);
}

/**
 * Retrieves the centralized navigation configuration for the entire application.
 * This configuration drives the main navigation bar and the module-specific sidebars.
 * Each navigation item is associated with a permission key, which is used to
 * dynamically show or hide the link based on the current user's effective permissions.
 *
 * @returns A structured navigation configuration object.
 */
export function getNavConfig() {
  return {
    main: [
      { href: "/dashboard", label: "Dashboard", permission: "dashboard:view" },
      {
        href: "/dashboard/vendor",
        label: "Vendor",
        permission: "vendor:viewAll",
      },
      {
        href: "/dashboard/inventory",
        label: "Inventory",
        permission: "inventory:viewAll",
      },
      {
        href: "/dashboard/sales",
        label: "Sales",
        permission: "sales:leads:view",
      },
      {
        href: "/dashboard/store",
        label: "Stores",
        permission: "store:bills:view",
      },
      { href: "/dashboard/hrms", label: "HRMS", permission: "hrms:employees:view" },
      /* Supply Chain main nav removed per request */
      {
        href: "/dashboard/users",
        label: "User Management",
        permission: "users:viewAll",
      },
    ],
    subNavigation: {
      "/dashboard/sales": [
        {
          href: "/dashboard/sales/dashboard",
          label: "Dashboard",
          icon: "dashboard",
          permission: "dashboard:view",
        },
        {
          href: "/dashboard/sales/leads",
          label: "Leads",
          icon: "logo",
          permission: "sales:leads:view",
        },
        {
          href: "/dashboard/sales/opportunities",
          label: "Opportunities",
          icon: "folderKanban",
          permission: "sales:opportunities:view",
        },
        {
          href: "/dashboard/sales/quotations",
          label: "Quotations",
          icon: "fileText",
          permission: "sales:quotations:view",
        },
        {
          href: "/dashboard/sales/orders",
          label: "Orders",
          icon: "shoppingCart",
          permission: "sales:invoices:view",
        },
        {
          href: "/dashboard/sales/customers",
          label: "Customers",
          icon: "users",
          permission: "store:customers:view",
        },
        {
          href: "/dashboard/sales/activities",
          label: "Activities",
          icon: "history",
          permission: "sales:leads:view",
        },
        {
          href: "/dashboard/sales/visits",
          label: "Visit Logs",
          icon: "mapPin",
          permission: "sales:leads:create",
        },
        {
          href: "/dashboard/sales/leaderboard",
          label: "Leaderboard",
          icon: "trophy",
          permission: "sales:leads:viewAll",
        },
        {
          href: "/dashboard/sales/reports",
          label: "Reports & KPIs",
          icon: "barChart2",
          permission: "sales:leads:viewAll",
        },
        {
          href: "/dashboard/sales/settings",
          label: "Settings",
          icon: "settings",
          permission: "settings:view",
        },
      ],
      "/dashboard/hrms": [
        {
          href: "/dashboard/hrms",
          label: "Dashboard",
          icon: "dashboard",
          permission: "hrms:employees:view",
        },
        {
          href: "/dashboard/hrms/employees",
          label: "Employee Directory",
          icon: "users",
          permission: "hrms:employees:view",
        },
        {
          href: "/dashboard/hrms/attendance",
          label: "Attendance & Shifts",
          icon: "calendar",
          permission: "hrms:attendance:view",
        },
        {
          href: "/dashboard/hrms/leaves",
          label: "Leave Management",
          icon: "briefcase",
          permission: "hrms:leaves:view",
        },
        {
          href: "/dashboard/hrms/payroll",
          label: "Payroll",
          icon: "banknote",
          permission: "hrms:payroll:view",
        },
        {
          href: "/dashboard/hrms/performance",
          label: "Performance",
          icon: "trendingUp",
          permission: "hrms:employees:view",
        },
        {
          href: "/dashboard/hrms/recruitment",
          label: "Recruitment",
          icon: "user",
          permission: "hrms:recruitment:view",
        },
        {
          href: "/dashboard/hrms/announcements",
          label: "Announcements",
          icon: "megaphone",
          permission: "hrms:employees:view",
        },
        {
          href: "/dashboard/hrms/compliance",
          label: "Compliance",
          icon: "file",
          permission: "hrms:employees:view",
        },
        {
          href: "/dashboard/hrms/reports",
          label: "Reports & Analytics",
          icon: "barChart2",
          permission: "hrms:employees:view",
        },
      ],
      "/dashboard/users": [
        {
          href: "/dashboard/users",
          label: "User Management",
          icon: "users",
          permission: "users:viewAll",
        },
        {
          href: "/dashboard/users/roles",
          label: "Roles & Hierarchy",
          icon: "keyRound",
          permission: "settings:manageRoles",
        },
        {
          href: "/dashboard/users/sessions",
          label: "Active Sessions",
          icon: "monitor",
          permission: "users:viewAll",
        },
      ],
      "/dashboard/vendor": [
        {
          href: "/dashboard/vendor/dashboard",
          label: "Vendor Dashboard",
          icon: "dashboard",
          permission: "vendor:viewAll",
        },
        {
          href: "/dashboard/vendor/list",
          label: "Vendor Profiles",
          icon: "users",
          permission: "vendor:viewAll",
        },
        {
          href: "/dashboard/vendor/onboarding",
          label: "Vendor Onboarding",
          icon: "plusCircle",
          permission: "vendor:create",
        },
        {
          href: "/dashboard/vendor/material-mapping",
          label: "Raw Material Catalog",
          icon: "slidersHorizontal",
          permission: "vendor:viewAll",
        },
        {
          href: "/dashboard/vendor/rating",
          label: "Vendor Rating",
          icon: "star",
          permission: "vendor:viewPerformance",
        },
        {
          href: "/dashboard/vendor/documents",
          label: "Contract Documents",
          icon: "file",
          permission: "vendor:viewAll",
        },
        {
          href: "/dashboard/vendor/history",
          label: "Purchase History",
          icon: "history",
          permission: "vendor:viewAll",
        },
        {
          href: "/dashboard/vendor/purchase-orders",
          label: "Purchase Orders & Bills",
          icon: "shoppingCart",
          permission: "supply:purchaseOrders:view",
        },
        {
          href: "/dashboard/vendor/invoices",
          label: "Invoice Management",
          icon: "fileText",
          permission: "supply:bills:view",
        },
        {
          href: "/dashboard/vendor/reorder-management",
          label: "Reorder Management",
          icon: "alertTriangle",
          permission: "inventory:stockAlerts:view",
        },
        {
          href: "/dashboard/vendor/price-comparison",
          label: "Vendor Price Comparison",
          icon: "barChart2",
          permission: "vendor:viewAll",
        },
        {
          href: "/dashboard/vendor/communication-log",
          label: "Communication Log",
          icon: "messageSquare",
          permission: "vendor:communicate",
        },
      ],
      "/dashboard/inventory": [
        {
          href: "/dashboard/inventory",
          label: "Dashboard",
          icon: "dashboard",
          permission: "inventory:products:view",
        },
        {
          href: "/dashboard/inventory/product-master",
          label: "Product Master",
          icon: "boxes",
          permission: "inventory:products:view",
        },
        {
          href: "/dashboard/inventory/ai-catalog-assistant",
          label: "AI Catalog Assistant",
          icon: "wandSparkles",
          permission: "inventory:products:create",
        },
        {
          href: "/dashboard/inventory/factory",
          label: "Factory Inventory",
          icon: "warehouse",
          permission: "inventory:stock:view",
        },
        {
          href: "/dashboard/inventory/store",
          label: "Store Inventory",
          icon: "package",
          permission: "inventory:stock:view",
        },
        {
          href: "/dashboard/inventory/goods-inward",
          label: "Goods Inward (GRN)",
          icon: "truck",
          permission: "inventory:stock:addStock",
        },
        {
          href: "/dashboard/inventory/goods-outward",
          label: "Goods Outward",
          icon: "packageOpen",
          permission: "inventory:stock:removeStock",
        },
        {
          href: "/dashboard/inventory/stock-transfers",
          label: "Stock Transfers",
          icon: "arrowRightLeft",
          permission: "inventory:stock:transferStock",
        },
        {
          href: "/dashboard/inventory/cycle-counting",
          label: "Cycle Counting",
          icon: "listChecks",
          permission: "inventory:stock:adjustStock",
        },
        {
          href: "/dashboard/inventory/valuation-reports",
          label: "Valuation Reports",
          icon: "fileBarChart",
          permission: "inventory:stock:viewStockValue",
        },
        {
          href: "/dashboard/inventory/qr-code-generator",
          label: "QR Code Generator",
          icon: "qrCode",
          permission: "inventory:barcodes:generate",
        },
      ],
      "/dashboard/store": [
        {
          href: "/dashboard/store/dashboard",
          label: "Dashboard",
          icon: "dashboard",
          permission: "store:bills:view",
        },
        {
          href: "/dashboard/store/manage",
          label: "Manage Stores",
          icon: "building2",
          permission: "store:bills:view",
        },
        {
          href: "/dashboard/store/billing",
          label: "POS Billing",
          icon: "handCoins",
          permission: "store:pos:access",
        },
        {
          href: "/dashboard/store/billing-history",
          label: "Billing History",
          icon: "history",
          permission: "store:bills:view",
        },
        {
          href: "/dashboard/store/inventory",
          label: "Store Inventory",
          icon: "package",
          permission: "inventory:stock:view",
        },
        {
          href: "/dashboard/store/returns",
          label: "Returns",
          icon: "arrowRightLeft",
          permission: "store:pos:processReturn",
        },
        {
          href: "/dashboard/store/debit-note",
          label: "Debit Notes",
          icon: "fileText",
          permission: "store:bills:view",
        },
        {
          href: "/dashboard/store/receiving",
          label: "Receive Products",
          icon: "box",
          permission: "store:bills:create",
        },
        {
          href: "/dashboard/store/scanner",
          label: "Product Scanner",
          icon: "scan",
          permission: "store:pos:access",
        },
        {
          href: "/dashboard/store/reports",
          label: "Reports",
          icon: "barChart2",
          permission: "store:bills:viewAll",
        },
        {
          href: "/dashboard/store/staff",
          label: "Staff & Shifts",
          icon: "users2",
          permission: "users:viewAll",
        },
        {
          href: "/dashboard/store/invoice-format",
          label: "Invoice Formats",
          icon: "slidersHorizontal",
          permission: "store:bills:view",
        },
      ],
      // "/dashboard/supply-chain" sub-navigation removed (no header entry)
    },
  };
}

// Export the inferred NavConfig type so other modules can import it directly.
export type NavConfig = ReturnType<typeof getNavConfig>;

// Server-side helper to resolve the current user from the session cookie.

// -----------------------------------------------------------------
// Admin-backed Firestore helpers (server-side). These functions use
// the firebase-admin SDK and should only be called from server code
// (API routes or Next.js server actions). They are incremental
// replacements for the in-memory MOCK_* helpers used by the UI.
// -----------------------------------------------------------------

/**
 * Fetch vendors from Supabase (server-side only).
 */
export async function getVendorsFromDb(orgId: string) {
  // TODO: Implement Supabase query
  return [];
}

/**
 * Fetch a single vendor by id from Supabase (server-side only).
 */
export async function getVendorFromDb(orgId: string, vendorId: string) {
  // TODO: Implement Supabase query
  return null;
}

/**
 * Create a vendor document in Supabase.
 */
export async function createVendorInDb(
  vendor: Partial<Vendor> & { orgId: string }
) {
  // TODO: Implement Supabase insert
  return null;
}

/**
 * Fetch users for an organization (server-side only).
 */
export async function getUsersFromDb(orgId: string) {
  // TODO: Implement Supabase query
  return [];
}

/**
 * Fetch roles for an organization (server-side only).
 */
export async function getRolesFromDb(orgId: string) {
  // TODO: Implement Supabase query
  return [];
}

/**
 * Create or update a role document in Supabase.
 */
export async function upsertRoleInDb(
  role: Partial<Role> & { orgId: string; id?: string }
) {
  // TODO: Implement Supabase upsert
  return null;
}
// This uses the new session cookie system
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { getCurrentUserFromSession } = await import("@/lib/session");
    const decodedClaims = await getCurrentUserFromSession();
    
    if (!decodedClaims) return null;
    
    // TODO: Fetch user data from Supabase
    // For now return basic user from session
    const user = {
      id: decodedClaims.uid,
      email: decodedClaims.email,
      name: '',
      orgId: '',
      roleIds: [],
      createdAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any as User;
    
    return user;
  } catch (e) {
    return null;
  }
}

/**
 * Creates an audit log entry.
 * MOCK IMPLEMENTATION: Adds the log to an in-memory array.
 */
export async function createAuditLog(
  logData: Omit<AuditLog, "id" | "timestamp">
) {
  const logEntry: AuditLog = {
    id: `log-${Date.now()}`,
    ...logData,
    timestamp: new Date().toISOString(),
  };
  MOCK_AUDIT_LOGS.unshift(logEntry); // Add to the top of the list
  console.log("Audit Log Created:", logEntry);
  return Promise.resolve(logEntry);
}

/**
 * Create a settlement record in the (mock) database. Server-side only.
 */
export async function createSettlementInDb(orgId: string, settlement: any) {
  const newSettlement = {
    id: `settlement-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orgId,
    createdAt: new Date().toISOString(),
    ...settlement,
  };
  MOCK_SETTLEMENTS.push(newSettlement);
  await createAuditLog({
    userId: settlement.processedBy || "system",
    userName: settlement.processedByName || "System",
    action: "create_settlement" as unknown as any,
    entityType: "settlement" as unknown as any,
    entityId: newSettlement.id,
    details: {
      settlementNumber: newSettlement.settlementNumber,
      employeeId: settlement.employeeId,
    },
    ipAddress: "127.0.0.1",
  });
  return newSettlement;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return Promise.resolve(MOCK_AUDIT_LOGS);
}

// Simple in-memory password store for mock environment. Keys are userId -> plaintext password (mock only).
export const MOCK_PASSWORDS: Record<string, string> = {};

export function setUserPassword(userId: string, password: string) {
  MOCK_PASSWORDS[userId] = password;
}

export function getUserByEmail(email: string) {
  return (
    MOCK_USERS.find(
      (u) => u.email && u.email.toLowerCase() === (email || "").toLowerCase()
    ) || null
  );
}

export function verifyUserCredentials(email: string, password: string) {
  const user = getUserByEmail(email);
  if (!user) return null;
  const stored = MOCK_PASSWORDS[user.id];
  if (!stored) return null;
  return stored === password ? user : null;
}

// seed default admin password after the map exists
MOCK_PASSWORDS["user-admin"] = "AdminPass123!";

// Session management moved to `src/lib/mock-sessions.ts` to allow middleware to import it safely.

// --- SALES MODULE DATA ACCESS ---

/**
 * Fetches leads based on the user's permissions, with filtering and sorting.
 * MOCK IMPLEMENTATION
 */
export async function getLeadsFromDb(
  userContext: UserContext,
  searchParams?: { [key: string]: string | string[] | undefined }
): Promise<{ leads: Lead[]; lastVisible: null }> {
  const { user, permissions, subordinates, orgId } = userContext;

  let leadsResult: Lead[];

  // 1. Initial data fetch based on permissions
  if (permissions.includes("view-all-leads")) {
    leadsResult = MOCK_LEADS.filter((l) => l.orgId === orgId && !l.isDeleted);
  } else if (permissions.includes("view-regional-leads")) {
    const allowedOwnerIds = [user.id, ...subordinates];
    leadsResult = MOCK_LEADS.filter(
      (l) =>
        l.orgId === orgId && allowedOwnerIds.includes(l.ownerId) && !l.isDeleted
    );
  } else {
    leadsResult = MOCK_LEADS.filter(
      (l) => l.orgId === orgId && l.ownerId === user.id && !l.isDeleted
    );
  }

  // 2. Apply filters from searchParams if they exist
  if (searchParams) {
    const { stage, assignedTo, leadScore } = searchParams;
    if (stage && stage !== "all") {
      leadsResult = leadsResult.filter((l) => l.stage === stage);
    }
    if (assignedTo && assignedTo !== "all") {
      leadsResult = leadsResult.filter((l) => l.assignedTo === assignedTo);
    }
    if (leadScore && leadScore !== "all") {
      leadsResult = leadsResult.filter((l) => l.leadScore === leadScore);
    }

    // 3. Apply sorting
    const sortBy = (searchParams.sortBy as keyof Lead) || "created";
    const sortDirection = searchParams.sortDirection || "desc";

    leadsResult.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue === undefined || bValue === undefined) return 0;

      let comparison = 0;
      if (aValue > bValue) {
        comparison = 1;
      } else if (aValue < bValue) {
        comparison = -1;
      }

      return sortDirection === "desc" ? comparison * -1 : comparison;
    });
  }

  return { leads: leadsResult, lastVisible: null };
}

/**
 * Creates a new lead in the database.
 * MOCK IMPLEMENTATION
 */
export async function createLead(
  leadData: Omit<Lead, "id" | "orgId" | "ownerId">,
  userContext: UserContext
): Promise<Lead> {
  const newLead: Lead = {
    id: `lead-${Date.now()}`,
    orgId: userContext.orgId,
    ownerId: userContext.user.id,
    ...leadData,
    created: new Date().toISOString(),
    lastActivity: "Just now",
    assignedTo: userContext.user.name,
  };
  MOCK_LEADS.push(newLead);
  await createAuditLog({
    userId: userContext.user.id,
    userName: userContext.user.name,
    action: "create_lead",
    entityType: "lead",
    entityId: newLead.id,
    details: { name: newLead.name },
    ipAddress: "127.0.0.1", // Mock IP
  });
  return newLead;
}

export async function updateLead(
  id: string,
  data: Partial<Omit<Lead, "id" | "orgId" | "ownerId">>,
  userContext: UserContext
): Promise<{ success: boolean; updatedLead?: Lead; message?: string }> {
  const leadIndex = MOCK_LEADS.findIndex((l) => l.id === id);
  if (leadIndex > -1) {
    // Permission Check: Admin, or owner
    const lead = MOCK_LEADS[leadIndex];
    const canUpdate =
      userContext.permissions.includes("view-all-leads") ||
      lead.ownerId === userContext.user.id;

    if (!canUpdate) {
      return {
        success: false,
        message: "You don't have permission to update this lead.",
      };
    }

    MOCK_LEADS[leadIndex] = { ...MOCK_LEADS[leadIndex], ...data };
    return { success: true, updatedLead: MOCK_LEADS[leadIndex] };
  }
  return { success: false, message: "Lead not found" };
}

export async function deleteLead(
  id: string,
  userContext: UserContext
): Promise<{ success: boolean; message?: string }> {
  const leadIndex = MOCK_LEADS.findIndex((l) => l.id === id);
  if (leadIndex > -1) {
    const lead = MOCK_LEADS[leadIndex];
    const canDelete =
      userContext.permissions.includes("view-all-leads") ||
      lead.ownerId === userContext.user.id;

    if (!canDelete) {
      return {
        success: false,
        message: "You don't have permission to delete this lead.",
      };
    }

    MOCK_LEADS[leadIndex].isDeleted = true; // Soft delete
    return { success: true };
  }
  return { success: false, message: "Lead not found" };
}

export async function convertLeadToCustomer(
  leadId: string,
  opportunityValue: number,
  userContext: UserContext
): Promise<{
  success: boolean;
  customerId?: string;
  opportunityId?: string;
  message?: string;
}> {
  const leadIndex = MOCK_LEADS.findIndex((l) => l.id === leadId);
  if (leadIndex === -1) {
    return { success: false, message: "Lead not found." };
  }
  const lead = MOCK_LEADS[leadIndex];

  // Create a new customer
  const newCustomerData = {
    name: lead.company,
    contact: lead.name,
    email: "tbd@" + lead.company.toLowerCase().replace(/\s/g, "") + ".com",
    phone: "0000000000",
    source: lead.source,
  };
  const { customerId } = await addCustomer(newCustomerData, userContext);

  let opportunityId;
  if (opportunityValue > 0) {
    const newOppData = {
      title: `${lead.company} - New Opportunity`,
      customerId: customerId,
      value: opportunityValue,
      stage: "Qualification" as const,
      closeDate: new Date(new Date().setDate(new Date().getDate() + 30))
        .toISOString()
        .split("T")[0],
    };
    const newOpp = await createOpportunity(newOppData, userContext);
    opportunityId = newOpp.id;
  }

  // Soft delete the lead
  lead.isDeleted = true;

  return { success: true, customerId, opportunityId };
}

export async function getCustomersFromDb(
  userContext?: UserContext
): Promise<{ customers: Customer[]; lastVisible: null }> {
  if (!userContext) {
    return { customers: [], lastVisible: null };
  }
  
  const { user, permissions, subordinates, orgId } = userContext;
  
  let customers: Customer[];
  
  // Apply manager filtering
  if (permissions.includes("view-all-customers")) {
    customers = MOCK_CUSTOMERS.filter((c) => c.orgId === orgId);
  } else if (permissions.includes("view-regional-customers")) {
    const allowedOwnerIds = [user.id, ...subordinates];
    customers = MOCK_CUSTOMERS.filter(
      (c) => c.orgId === orgId && allowedOwnerIds.includes(c.ownerId)
    );
  } else {
    // Default: view own customers only
    customers = MOCK_CUSTOMERS.filter(
      (c) => c.orgId === orgId && c.ownerId === user.id
    );
  }
  
  return { customers, lastVisible: null };
}

export async function addCustomer(
  data: Omit<Customer, "id" | "orgId" | "ownerId" | "totalSpend">,
  userContext: UserContext
): Promise<{ success: boolean; customerId: string }> {
  const newCustomer: Customer = {
    id: `cust-${Date.now()}`,
    orgId: userContext.orgId,
    ownerId: userContext.user.id,
    totalSpend: 0,
    ...data,
  };
  MOCK_CUSTOMERS.push(newCustomer);
  return { success: true, customerId: newCustomer.id };
}

export async function getOpportunitiesFromDb(
  userContext?: UserContext
): Promise<Opportunity[]> {
  if (!userContext) {
    return [];
  }
  const { user, permissions, subordinates, orgId } = userContext;

  if (permissions.includes("view-all-opportunities")) {
    return MOCK_OPPORTUNITIES.filter((o) => o.orgId === orgId && !o.isDeleted);
  }
  if (permissions.includes("view-regional-opportunities")) {
    // A hypothetical permission
    const allowedOwnerIds = [user.id, ...subordinates];
    return MOCK_OPPORTUNITIES.filter(
      (o) =>
        o.orgId === orgId && allowedOwnerIds.includes(o.ownerId) && !o.isDeleted
    );
  }
  // Default: view own
  return MOCK_OPPORTUNITIES.filter(
    (o) => o.orgId === orgId && o.ownerId === user.id && !o.isDeleted
  );
}

export async function createOpportunity(
  opportunityData: Omit<Opportunity, "id" | "orgId" | "ownerId">,
  userContext: UserContext
): Promise<Opportunity> {
  const newOpp: Opportunity = {
    id: `opp-${Date.now()}`,
    orgId: userContext.orgId,
    ownerId: userContext.user.id,
    priority: 99, // Add to end of list
    ...opportunityData,
  };
  MOCK_OPPORTUNITIES.push(newOpp);
  // Audit log would go here
  return newOpp;
}

export async function updateOpportunityStage(
  opportunityId: string,
  stage: Opportunity["stage"],
  userContext: UserContext
): Promise<{ success: boolean }> {
  const oppIndex = MOCK_OPPORTUNITIES.findIndex((o) => o.id === opportunityId);
  if (oppIndex > -1) {
    MOCK_OPPORTUNITIES[oppIndex].stage = stage;
    await createAuditLog({
      userId: userContext.user.id,
      userName: userContext.user.name,
      action: "update_opportunity_stage",
      entityType: "opportunity",
      entityId: opportunityId,
      details: { newStage: stage, title: MOCK_OPPORTUNITIES[oppIndex].title },
      ipAddress: "127.0.0.1", // Mock IP
    });
    return { success: true };
  }
  return { success: false };
}

// --- INVENTORY MODULE DATA ACCESS ---

export async function getProducts(
  userContext?: UserContext
): Promise<Product[]> {
  if (!userContext) {
    return [];
  }
  const { user, permissions, orgId } = userContext;

  if (permissions.includes("view-all-inventory")) {
    return MOCK_PRODUCTS.filter((p) => p.orgId === orgId);
  }

  if (permissions.includes("manage-store-inventory") && user.storeId) {
    return MOCK_PRODUCTS.filter(
      (p) =>
        p.orgId === orgId &&
        p.inventoryType === "Store" &&
        p.storeId === user.storeId
    );
  }

  if (permissions.includes("manage-factory-inventory")) {
    return MOCK_PRODUCTS.filter(
      (p) => p.orgId === orgId && p.inventoryType === "Factory"
    );
  }

  // Default to empty if no specific permission
  return [];
}

export async function addProduct(
  productData: Omit<Product, "id" | "orgId">,
  userContext: UserContext
): Promise<Product> {
  const { user, orgId } = userContext;

  // If a Store Supervisor adds a product, it must be assigned to their store
  if (user.roleIds.includes("shop-owner") && user.storeId) {
    productData.storeId = user.storeId;
    productData.inventoryType = "Store";
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    orgId,
    ...productData,
  };

  MOCK_PRODUCTS.push(newProduct);
  await createAuditLog({
    userId: user.id,
    userName: user.name,
    action: "create_product",
    entityType: "product",
    entityId: newProduct.id,
    details: { name: newProduct.name, sku: newProduct.sku },
    ipAddress: "127.0.0.1", // Mock IP
  });
  return newProduct;
}

export async function updateProduct(
  productId: string,
  productData: Partial<Product>,
  userContext: UserContext
): Promise<{ success: boolean }> {
  const index = MOCK_PRODUCTS.findIndex((p) => p.id === productId);
  if (index === -1) return { success: false };

  // Add permission checks here in a real scenario
  MOCK_PRODUCTS[index] = { ...MOCK_PRODUCTS[index], ...productData };
  await createAuditLog({
    userId: userContext.user.id,
    userName: userContext.user.name,
    action: "update_product",
    entityType: "product",
    entityId: productId,
    details: { changes: Object.keys(productData).join(", ") },
    ipAddress: "127.0.0.1", // Mock IP
  });
  return { success: true };
}

export async function deleteProduct(
  productId: string,
  userContext: UserContext
): Promise<{ success: boolean }> {
  const index = MOCK_PRODUCTS.findIndex((p) => p.id === productId);
  if (index === -1) return { success: false };

  const productName = MOCK_PRODUCTS[index].name;
  MOCK_PRODUCTS.splice(index, 1);

  await createAuditLog({
    userId: userContext.user.id,
    userName: userContext.user.name,
    action: "delete_product",
    entityType: "product",
    entityId: productId,
    details: { name: productName },
    ipAddress: "127.0.0.1", // Mock IP
  });
  return { success: true };
}

export async function addStock(
  productId: string,
  quantity: number,
  userContext: UserContext
): Promise<{ success: boolean }> {
  const index = MOCK_PRODUCTS.findIndex((p) => p.id === productId);
  if (index === -1) return { success: false };

  MOCK_PRODUCTS[index].quantity += quantity;
  await createAuditLog({
    userId: userContext.user.id,
    userName: userContext.user.name,
    action: "add_stock",
    entityType: "product",
    entityId: productId,
    details: {
      quantity,
      newTotal: MOCK_PRODUCTS[index].quantity,
      name: MOCK_PRODUCTS[index].name,
    },
    ipAddress: "127.0.0.1", // Mock IP
  });
  return { success: true };
}

export async function dispatchStock(
  productId: string,
  quantity: number,
  userContext: UserContext
): Promise<{ success: boolean; message?: string }> {
  const index = MOCK_PRODUCTS.findIndex((p) => p.id === productId);
  if (index === -1) return { success: false, message: "Product not found." };

  const product = MOCK_PRODUCTS[index];
  if (product.quantity < quantity) {
    return {
      success: false,
      message: `Not enough stock to dispatch ${quantity} units.`,
    };
  }

  MOCK_PRODUCTS[index].quantity -= quantity;
  await createAuditLog({
    userId: userContext.user.id,
    userName: userContext.user.name,
    action: "dispatch_stock",
    entityType: "product",
    entityId: productId,
    details: {
      quantity,
      newTotal: MOCK_PRODUCTS[index].quantity,
      name: MOCK_PRODUCTS[index].name,
    },
    ipAddress: "127.0.0.1", // Mock IP
  });
  return { success: true };
}

export async function transferStock(
  data: {
    fromLocation: string; // 'Factory' or a storeId
    toLocation: string; // 'Factory' or a storeId
    lineItems: { productId: string; quantity: number }[];
  },
  userContext: UserContext
): Promise<{ success: boolean; message?: string }> {
  for (const item of data.lineItems) {
    // Find source product
    const sourceIndex = MOCK_PRODUCTS.findIndex(
      (p) =>
        p.id === item.productId &&
        (data.fromLocation === "Factory"
          ? p.inventoryType === "Factory"
          : p.storeId === data.fromLocation)
    );

    if (sourceIndex === -1) {
      return {
        success: false,
        message: `Source product with ID ${item.productId} not found in location ${data.fromLocation}.`,
      };
    }

    const sourceProduct = MOCK_PRODUCTS[sourceIndex];
    if (sourceProduct.quantity < item.quantity) {
      return {
        success: false,
        message: `Insufficient stock for ${sourceProduct.name}.`,
      };
    }

    // Decrement source
    MOCK_PRODUCTS[sourceIndex].quantity -= item.quantity;

    // Find or create destination product
    let destProduct: Product | undefined =
      data.toLocation === "Factory"
        ? MOCK_PRODUCTS.find(
            (p) => p.sku === sourceProduct.sku && p.inventoryType === "Factory"
          )
        : MOCK_PRODUCTS.find(
            (p) =>
              p.sku === sourceProduct.sku &&
              p.inventoryType === "Store" &&
              p.storeId === data.toLocation
          );

    if (destProduct) {
      const destIndex = MOCK_PRODUCTS.findIndex(
        (p) => p.id === destProduct!.id
      );
      MOCK_PRODUCTS[destIndex].quantity += item.quantity;
    } else {
      // Create a new product entry for the destination if it doesn't exist
      const newDestProduct = {
        ...sourceProduct,
        id: `prod-${Date.now()}`,
        inventoryType: (data.toLocation === "Factory" ? "Factory" : "Store") as
          | "Factory"
          | "Store",
        storeId: data.toLocation === "Factory" ? undefined : data.toLocation,
        quantity: item.quantity,
      };
      MOCK_PRODUCTS.push(newDestProduct);
    }

    await createAuditLog({
      userId: userContext.user.id,
      userName: userContext.user.name,
      action: "transfer_stock",
      entityType: "product",
      entityId: item.productId,
      details: {
        ...item,
        from: data.fromLocation,
        to: data.toLocation,
        name: sourceProduct.name,
      },
      ipAddress: "127.0.0.1", // Mock IP
    });
  }

  return { success: true };
}

// --- HRMS MODULE DATA ACCESS ---
export async function getPerformanceCycle(cycleId: string) {
  return MOCK_PERFORMANCE_CYCLES.find((c: any) => c.id === cycleId) || null;
}

export async function getEmployeeReviewsForCycle(cycleId: string) {
  return MOCK_EMPLOYEE_REVIEWS.filter((r: any) => r.cycleId === cycleId);
}

export let MOCK_PERMISSION_TEMPLATES: any[] = [
  {
    id: "template-sales-exec",
    name: "Sales Executive Template",
    description: "Standard permissions for a frontline sales executive.",
    permissions: ["view-dashboard", "create-lead", "view-own-leads"],
  },
  {
    id: "template-regional-head",
    name: "Regional Head Template",
    description: "Permissions for a regional sales manager.",
    permissions: ["view-dashboard", "create-lead", "view-regional-leads"],
  },
];

export async function getPermissionTemplates(): Promise<any[]> {
  return Promise.resolve(MOCK_PERMISSION_TEMPLATES);
}

// All other firestore functions from the old backend have been removed.
// New, safe functions that follow the getFirebaseAdmin() pattern will be added
// in subsequent batches as we rebuild each module.

// MOCK DATA and FUNCTIONS to keep the UI from breaking.
// These will be replaced with real implementations in later batches.

export async function getQuotationsDb(userId?: string): Promise<Quotation[]> {
  return MOCK_QUOTATIONS;
}
export async function getOrdersDb(userId?: string, lastVisible?: any) {
  return { orders: MOCK_ORDERS, lastVisible: null };
}

export async function getCommunicationLogs(
  userContext?: UserContext
): Promise<CommunicationLog[]> {
  if (!userContext) return MOCK_COMMUNICATION_LOGS;

  const { user, permissions, subordinates } = userContext;

  if (permissions.includes("view-all-leads")) {
    // Using 'view-all-leads' as a proxy for admin-like view
    return MOCK_COMMUNICATION_LOGS;
  }

  // Fallback for other roles, needs more specific logic based on what logs they should see.
  // For now, let's assume they only see logs related to customers they own.
  const userCustomers = MOCK_CUSTOMERS.filter((c) => c.ownerId === user.id).map(
    (c) => c.id
  );
  return MOCK_COMMUNICATION_LOGS.filter(
    (log) => log.customerId && userCustomers.includes(log.customerId)
  );
}

export async function getVendors() {
  return MOCK_VENDORS;
}

/**
 * Server-side: create a purchase order in Supabase.
 * This will be used by server actions to persist POs instead of using the in-memory MOCK.
 */
export async function createPurchaseOrderInDb(
  po: Partial<PurchaseOrder> & { orgId: string; vendorId: string },
  userContext: UserContext
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    // TODO: Implement Supabase insert for purchase orders
    // Fallback to mock behavior to keep the UI functional.
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      status: "Pending Approval",
      billed: false,
      paymentStatus: "Unpaid",
      amountGiven: 0,
      vendorName: po.vendorId,
      ...po,
    } as PurchaseOrder;
    MOCK_PURCHASE_ORDERS.push(newPO);
    return { success: true, id: newPO.id };
  } catch (err: any) {
    console.error("createPurchaseOrderInDb failed", err);
    return { success: false, message: err.message };
  }
}

export async function getCustomer(id: string): Promise<Customer | null> {
  return MOCK_CUSTOMERS.find((c) => c.id === id) || null;
}

export async function getOpportunitiesByCustomerId(
  id: string
): Promise<Opportunity[]> {
  return MOCK_OPPORTUNITIES.filter((o) => o.customerId === id && !o.isDeleted);
}

export async function getQuotationsByCustomerId(
  id: string
): Promise<Quotation[]> {
  return MOCK_QUOTATIONS.filter((q) => q.customerId === id);
}

export async function getOrdersByCustomerId(id: string): Promise<Order[]> {
  return MOCK_ORDERS.filter((o) => o.customerId === id);
}

export async function getCommunicationLogsByCustomerId(
  id: string
): Promise<CommunicationLog[]> {
  return MOCK_COMMUNICATION_LOGS.filter((log) => log.customerId === id);
}

export async function getSalesSnapshots(): Promise<SalesSnapshot[]> {
  return MOCK_SALES_SNAPSHOTS;
}

export async function getOrder(id: string): Promise<Order | null> {
  return MOCK_ORDERS.find((o) => o.id === id) || null;
}

export async function getQuotation(id: string): Promise<Quotation | null> {
  return MOCK_QUOTATIONS.find((q) => q.id === id) || null;
}

export async function getVendor(id: string): Promise<Vendor | null> {
  return MOCK_VENDORS.find((v) => v.id === id) || null;
}

export async function getVendorDocuments(
  vendorId: string
): Promise<VendorDocument[]> {
  return MOCK_VENDOR_DOCUMENTS.filter((doc) => doc.vendorId === vendorId);
}

export async function getPurchaseOrders(
  vendorId?: string,
  dateRange?: { from?: Date; to?: Date },
  userContext?: UserContext
): Promise<{ purchaseOrders: PurchaseOrder[] }> {
  let results = MOCK_PURCHASE_ORDERS;

  if (vendorId) {
    results = results.filter((po) => po.vendorId === vendorId);
  }

  if (dateRange?.from) {
    results = results.filter((po) => new Date(po.orderDate) >= dateRange.from!);
  }
  if (dateRange?.to) {
    results = results.filter((po) => new Date(po.orderDate) <= dateRange.to!);
  }

  // In a real app, userContext would be used for RBAC filtering
  return { purchaseOrders: results };
}

export async function updatePurchaseOrderInDb(
  poId: string,
  data: Partial<PurchaseOrder>,
  userContext: UserContext
): Promise<{ success: boolean }> {
  const index = MOCK_PURCHASE_ORDERS.findIndex((po) => po.id === poId);
  if (index > -1) {
    MOCK_PURCHASE_ORDERS[index] = { ...MOCK_PURCHASE_ORDERS[index], ...data };
    await createAuditLog({
      userId: userContext.user.id,
      userName: userContext.user.name,
      action: "update_purchase_order",
      entityType: "purchase_order",
      entityId: poId,
      details: { changes: Object.keys(data).join(", ") },
      ipAddress: "127.0.0.1", // Mock IP
    });
    return { success: true };
  }
  return { success: false };
}

export async function getPurchaseOrder(
  id: string
): Promise<PurchaseOrder | null> {
  return MOCK_PURCHASE_ORDERS.find((po) => po.id === id) || null;
}
export async function getCommunicationLogsByVendorId(vendorId: string) {
  return [];
}

export async function getItemsToReorder(): Promise<MaterialMapping[]> {
  // Find all products in the factory inventory
  const factoryInventory = MOCK_PRODUCTS.filter(
    (p) => p.inventoryType === "Factory"
  );
  const factoryInventoryMap = new Map(
    factoryInventory.map((p) => [p.sku, p.quantity])
  );

  // Find material mappings for which the corresponding factory inventory is low
  const items = MOCK_MATERIAL_MAPPINGS.filter((mapping) => {
    const currentStock = factoryInventoryMap.get(mapping.sku) || 0;
    return mapping.reorderLevel > 0 && currentStock <= mapping.reorderLevel;
  });

  return items;
}

export async function getInvoices(): Promise<Invoice[]> {
  return MOCK_INVOICES;
}

export async function addCommunicationLogInDb(
  log: Omit<CommunicationLog, "id" | "user" | "date">,
  userContext: UserContext
): Promise<{ success: boolean; newLog: CommunicationLog }> {
  const newLog: CommunicationLog = {
    id: `log-${Date.now()}`,
    user: userContext.user.name,
    date: new Date().toISOString(),
    ...log,
  };
  MOCK_COMMUNICATION_LOGS.unshift(newLog); // Add to the beginning of the array
  return { success: true, newLog };
}

export async function addQuotation(
  quotationData: Quotation,
  userContext: UserContext
): Promise<{ success: boolean; message?: string }> {
  const newQuote = { id: `quote-${Date.now()}`, ...quotationData };
  MOCK_QUOTATIONS.push(newQuote);
  // Audit log would go here
  return { success: true };
}

export async function updateQuotationStatus(
  id: string,
  status: Quotation["status"],
  userContext: UserContext
): Promise<{ success: boolean; message?: string }> {
  const index = MOCK_QUOTATIONS.findIndex((q) => q.id === id);
  if (index > -1) {
    MOCK_QUOTATIONS[index].status = status;
    // Audit log would go here
    return { success: true };
  }
  return { success: false, message: "Quotation not found." };
}

export async function createOrderFromQuote(
  quote: Quotation,
  userContext: UserContext,
  storeId?: string,
  discountPercentage?: number,
  customerDetails?: Order["customerDetails"]
): Promise<{ success: boolean; orderId?: string; message?: string }> {
  if (!quote.lineItems) {
    return { success: false, message: "Quotation has no line items." };
  }

  // Create new order from quotation details
  const newOrder: Order = {
    id: `order-${Date.now()}`,
    ownerId: userContext.user.id,
    orderNumber: `ORD-${Date.now()}`,
    customerId: quote.customerId,
    customerDetails: customerDetails,
    orderDate: new Date().toISOString(),
    status: "Confirmed",
    lineItems: quote.lineItems,
    totalAmount: quote.totalAmount,
    quoteId: quote.id,
    storeId: storeId,
    discountPercentage: discountPercentage,
  };
  MOCK_ORDERS.push(newOrder);

  // Deduct stock for each line item
  for (const item of newOrder.lineItems) {
    // If it's a store order, deduct from store inventory. Otherwise, deduct from factory.
    const inventoryTypeToDeduct: "Store" | "Factory" = storeId
      ? "Store"
      : "Factory";

    const productIndex = MOCK_PRODUCTS.findIndex(
      (p) =>
        p.id === item.productId &&
        p.inventoryType === inventoryTypeToDeduct &&
        (inventoryTypeToDeduct === "Factory" || p.storeId === storeId)
    );

    if (productIndex > -1) {
      MOCK_PRODUCTS[productIndex].quantity -= item.quantity;
    } else {
      console.warn(
        `Could not find product ${item.productId} in ${inventoryTypeToDeduct} inventory (Store: ${storeId}) to deduct stock.`
      );
    }
  }

  // Update the original quotation's status to Expired if it exists
  if (quote.id) {
    const quoteIndex = MOCK_QUOTATIONS.findIndex((q) => q.id === quote.id);
    if (quoteIndex > -1) {
      MOCK_QUOTATIONS[quoteIndex].status = "Expired";
    }
  }

  await createAuditLog({
    userId: userContext.user.id,
    userName: userContext.user.name,
    action: "create_order",
    entityType: "order",
    entityId: newOrder.id,
    details: { fromQuoteId: quote.id || "POS", total: newOrder.totalAmount },
    ipAddress: "127.0.0.1", // Mock IP
  });

  return { success: true, orderId: newOrder.id };
}

export async function addVisitInDb(
  visitData: Omit<Visit, "id" | "orgId" | "ownerId">,
  userContext: UserContext
): Promise<{ success: boolean; visit: Visit }> {
  const newVisit: Visit = {
    id: `visit-${Date.now()}`,
    orgId: userContext.orgId,
    ownerId: userContext.user.id,
    ...visitData,
  };
  MOCK_VISITS.unshift(newVisit);
  return { success: true, visit: newVisit };
}

// NOTE: getCurrentUser is implemented earlier as a session-aware helper that reads
// the session cookie and resolves the current user. The old static implementation
// was removed to avoid duplicate exports.

export async function deleteAllProducts(
  userContext: UserContext
): Promise<{ success: boolean; count: number }> {
  if (!userContext.permissions.includes("manage-factory-inventory")) {
    return { success: false, count: 0 };
  }
  const count = MOCK_PRODUCTS.length;
  MOCK_PRODUCTS = [];
  return { success: true, count };
}

export async function simulateSale(
  productId: string,
  userContext: UserContext
): Promise<{ success: boolean }> {
  const index = MOCK_PRODUCTS.findIndex((p) => p.id === productId);
  if (index === -1) return { success: false };

  if (MOCK_PRODUCTS[index].quantity > 0) {
    MOCK_PRODUCTS[index].quantity -= 1;
    return { success: true };
  }
  return { success: false };
}

export async function updateOpportunity(
  id: string,
  data: Partial<Omit<Opportunity, "id" | "orgId" | "ownerId">>,
  userContext: UserContext
): Promise<{ success: boolean; opportunity?: Opportunity }> {
  const index = MOCK_OPPORTUNITIES.findIndex((o) => o.id === id);
  if (index > -1) {
    MOCK_OPPORTUNITIES[index] = { ...MOCK_OPPORTUNITIES[index], ...data };
    return { success: true, opportunity: MOCK_OPPORTUNITIES[index] };
  }
  return { success: false };
}

export async function deleteOpportunity(
  id: string,
  userContext: UserContext
): Promise<{ success: boolean }> {
  const index = MOCK_OPPORTUNITIES.findIndex((o) => o.id === id);
  if (index > -1) {
    MOCK_OPPORTUNITIES[index].isDeleted = true; // Soft delete
    return { success: true };
  }
  return { success: false };
}

export async function updateOpportunityPriority(
  updates: { id: string; priority: number }[],
  userContext: UserContext
): Promise<{ success: boolean }> {
  updates.forEach((update) => {
    const index = MOCK_OPPORTUNITIES.findIndex((o) => o.id === update.id);
    if (index > -1) {
      MOCK_OPPORTUNITIES[index].priority = update.priority;
    }
  });
  return { success: true };
}

export async function approveVendor(id: string) {
  const index = MOCK_VENDORS.findIndex((v) => v.id === id);
  if (index > -1) {
    MOCK_VENDORS[index].status = "Active";
    return { success: true };
  }
  return { success: false, message: "Vendor not found." };
}

export async function rejectVendor(id: string) {
  const index = MOCK_VENDORS.findIndex((v) => v.id === id);
  if (index > -1) {
    MOCK_VENDORS[index].status = "Rejected";
    return { success: true };
  }
  return { success: false, message: "Vendor not found." };
}

export async function deleteVendor(id: string) {
  const index = MOCK_VENDORS.findIndex((v) => v.id === id);
  if (index > -1) {
    MOCK_VENDORS.splice(index, 1);
    return { success: true };
  }
  return { success: false, message: "Vendor not found." };
}

export async function deleteAllVendorData() {
  const count = MOCK_VENDORS.length;
  MOCK_VENDORS = [];
  return { success: true, count };
}

export async function getShiftLogsForStaff(staffId: string) {
  return MOCK_SHIFT_LOGS.filter((log) => log.staffId === staffId);
}

export async function getStaffMember(staffId: string): Promise<User | null> {
  return MOCK_USERS.find((u) => u.id === staffId) || null;
}

// Moved MOCK_MASTER_STORE to a client-safe module to avoid importing this server module in client bundles.

// Helper function to get a specific lead for permission checks
export async function getLead(leadId: string): Promise<Lead | null> {
  return MOCK_LEADS.find((l) => l.id === leadId && !l.isDeleted) || null;
}

