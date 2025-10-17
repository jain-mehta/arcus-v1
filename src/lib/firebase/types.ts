

export interface Organization {
    id: string;
    name: string;
}

export interface Permission {
    id: string;
    name: string;
    description: string;
}

export interface Role {
    id: string;
    orgId: string;
    name: string;
    permissions: {
        [module: string]: {
            [submodule: string]: boolean | {
                [action: string]: boolean;
            };
        };
    };
    reportsToRoleId?: string; // Reports to another role
}


export interface Vendor {
    id: string;
    name: string;
    category: string;
    status: 'Active' | 'Inactive' | 'Pending Approval' | 'Rejected';
    onTimeDelivery: number;
    qualityScore: number;
    avgResponseTime: string;
    operationalRegion: string;
    paymentTerms: 'Net 30' | 'Net 60' | 'Upon Receipt';
    preferredPaymentMethod: 'Bank Transfer' | 'Credit Card' | 'Cheque';
    contact: {
        name: string;
        email: string;
        phone: string;
    };
    address: string;
    website?: string;
    // Sensitive data - should be masked for certain roles
    tax: {
        gstin: string;
        panNumber: string;
    };
    // Sensitive data - should be masked for certain roles
    banking: {
        bankName: string;
        accountHolderName: string;
        accountNumber: string;
        ifscCode: string;
    };
}

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    vendorId: string;
    vendorName: string;
    orderDate: string;
    deliveryDate: string;
    totalAmount: number;
    status: 'Draft' | 'Pending Approval' | 'Approved' | 'In Transit' | 'Delivered' | 'Billed' | 'Closed' | 'Canceled';
    billed: boolean;
    paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
    amountGiven: number;
    notes?: string;
    lineItems: {
        material: string;
        sku: string;
        quantity: number;
        unitPrice: number;
    }[];
    shippingAddress: string;
}


export interface MaterialMapping {
    id: string;
    vendorId: string;
    material: string;
    sku: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    reorderLevel: number;
    safetyStock: number;
    active: boolean;
}

export interface VolumeDiscount {
    id: string;
    mappingId: string;
    minQuantity: number;
    discount: number; // Stored as a percentage, e.g., 10 for 10%
}


export interface VendorDocument {
    id: string;
    vendorId: string;
    name: string;
    type: 'Contract' | 'License' | 'Certification' | 'NDA' | 'Other';
    uploadDate: string;
    expiryDate?: string;
    status: 'Active' | 'Expires Soon' | 'Expired';
    fileUrl: string;
    filePath: string;
    description?: string;
}

export interface VendorRatingCriteria {
    id: string;
    vendorId: string;
    criteria: string;
    weight: number;
    autoScore: number;
    manualScore?: number;
    comments?: string;
}

export interface VendorRatingHistory {
    id: string;
    vendorId: string;
    date: string; // ISO string
    score: number;
}


export interface Invoice {
    id: string;
    vendorId: string;
    poNumber: string;
    invoiceDate: string;
    uploadDate: string;
    amount: number;
    status: 'Paid' | 'Unpaid' | 'Overdue' | 'Disputed';
    fileName: string;
    fileUrl: string;
    filePath: string;
    discrepancy?: string;
}

export interface CommunicationLog {
    id: string;
    vendorId?: string;
    customerId?: string;
    date: string;
    user: string;
    type: 'Email' | 'Call' | 'Meeting';
    summary: string;
    associatedWith?: string; // Optional: Link to a PO, Lead, etc.
}

// --- Inventory Management ---
export interface Product {
    id: string;
    orgId: string;
    name: string;
    sku: string;
    brand: 'Bobs' | 'Buick';
    series: 'Solo' | 'Galaxy' | 'Cubix-B' | 'Other';
    category: string;
    subcategory?: string;
    unit: string; // e.g., 'kg', 'piece', 'liter'
    price: number;
    inventoryType: 'Factory' | 'Store';
    storeId?: string; // Which store it belongs to, if inventoryType is 'Store'
    imageUrl?: string;
    reorderLevel?: number;
    safetyStock?: number;
    quantity: number;
}


export interface Inventory {
    id: string;
    productId: string;
    sku: string;
    location: 'Factory' | 'Store';
    quantity: number;
}

// --- RBAC Types ---
export interface User {
  id: string;
  name: string;
  email: string;
  orgId: string;
  roleIds: string[];
  customPermissions?: string[];
  reportsTo?: string;
  storeId?: string;
  region?: string;
  designation?: string;
  status?: 'Active' | 'Inactive';
  // Sensitive fields - should be masked in some API responses
  phone?: string; 
  address?: string; 
  dateOfBirth?: string; // ISO string e.g., '1990-05-15'
  hireDate?: string; // ISO string e.g., '2020-08-01'
  mustChangePassword?: boolean;
}

export interface UserContext {
    user: User;
    permissions: string[];
    subordinates: string[];
    orgId: string;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  path: string;
}

export interface UserModule {
  id: string;
  userId: string;
  moduleId: string;
}

// --- Sales Module Types ---
export interface Lead {
    id: string;
    orgId: string;
    ownerId: string;
    name: string;
    company: string;
    source?: string;
    stage: 'New' | 'Contacted' | 'Qualified' | 'Lost';
    assignedTo: string;
    created: string; // ISO Date
    lastActivity: string;
    leadScore?: 'High' | 'Medium' | 'Low';
    leadScoreReasoning?: string;
    isDeleted?: boolean;
}

export interface Customer {
    id: string;
    orgId: string;
    ownerId: string;
    name: string;
    contact: string;
    email: string;
    phone: string;
    totalSpend: number;
    source?: string;
    address?: string;
}

export interface Opportunity {
    id: string;
    orgId: string;
    ownerId: string;
    title: string;
    customerId: string;
    value: number;
    stage: 'Qualification' | 'Needs Analysis' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
    stageLastChanged?: string; // ISO Date string
    closeDate: string; // ISO Date string
    isDeleted?: boolean;
    priority?: number;
    source?: string;
    region?: string;
    storeId?: string;
}

export interface Quotation {
    id?: string; // Optional because it's not present on creation
    ownerId: string;
    quoteNumber: string;
    customerId: string;
    quoteDate: string;
    expiryDate: string;
    status: 'Draft' | 'Awaiting Approval' | 'Approved' | 'Rejected' | 'Expired';
    lineItems: {
        productId: string;
        name: string;
        sku: string;
        quantity: number;
        unitPrice: number;
    }[];
    totalAmount: number;
    discountPercentage?: number;
}

export interface Order {
    id: string;
    ownerId: string;
    orderNumber: string;
    customerId: string;
    customerDetails?: {
        name?: string;
        address?: string;
        email?: string;
        phone?: string;
    };
    orderDate: string; // ISO Date
    status: 'Draft' | 'Confirmed' | 'Picked' | 'Shipped' | 'Delivered' | 'Canceled';
    lineItems: {
        productId: string;
        name: string;
        sku: string;
        quantity: number;
        unitPrice: number;
    }[];
    totalAmount: number;
    quoteId?: string;
    storeId?: string;
    discountPercentage?: number;
}

export interface Visit {
    id: string;
    orgId: string;
    ownerId: string;
    dealerId: string; // Corresponds to a Lead/Customer ID
    dealerName: string;
    visitDate: string; // ISO Date string
    purpose: 'Relationship' | 'New Business' | 'Complaint' | 'Payment Collection' | 'Other';
    outcome: string;
    feedback?: string;
    nextFollowUpDate?: string; // ISO Date string
}

export interface SalesTarget {
    id: string;
    type: 'Revenue' | 'Leads' | 'Deals';
    value: number;
    month: string; // e.g., "July 2024"
}

export interface SalesTargetWithProgress extends SalesTarget {
    progress: number;
    currentValue: number;
}

export interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    action: 'create_lead' | 'update_opportunity_stage' | 'create_product' | 'update_product' | 'delete_product' | 'add_stock' | 'dispatch_stock' | 'transfer_stock' | 'create_order' | 'update_user_roles' | 'deactivate_user' | 'change_user_password' | 'create_user' | 'update_purchase_order';
    entityType: 'lead' | 'customer' | 'opportunity' | 'order' | 'product' | 'purchase_order' | 'user';
    entityId: string;
    timestamp: string; // ISO string
    details: Record<string, any>;
    ipAddress?: string;
}

export interface SalesSnapshot {
    id: string;
    period: string; // "YYYY-MM"
    createdAt: string; // ISO String
    pipelineValue: number;
    winRate: number;
    avgDealSize: number;
    salesCycleDays: number;
}

// --- HRMS Module Types ---
export type LeaveType = 'Casual Leave' | 'Sick Leave' | 'Paid Leave' | 'Loss of Pay';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
    id: string;
    staffId: string;
    staffName: string;
    type: LeaveType;
    startDate: string; // ISO string
    endDate: string; // ISO string
    reason: string;
    status: LeaveStatus;
    appliedOn: string; // ISO string
    managerComments?: string;
}

export interface LeavePolicy {
    id: string;
    leaveType: LeaveType;
    daysAllowed: number;
}

export type ApplicantStage = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';

export interface JobOpening {
    id: string;
    title: string;
    department: string;
    location: string;
    status: 'Open' | 'Closed' | 'Draft';
    description: string;
    responsibilities: string[];
    qualifications: string[];
    datePosted: string; // ISO string
}

export interface Applicant {
    id: string;
    jobId: string;
    name: string;
    email: string;
    phone: string;
    resumeUrl: string;
    stage: ApplicantStage;
}

export type SalaryComponent = {
    type: 'Earning' | 'Deduction';
    name: string;
    calculationType: 'Fixed' | 'Percentage';
    value: number;
};

export interface Payslip {
    id: string;
    staffId: string;
    staffName: string;
    month: string; // e.g. "July 2024"
    grossSalary: number;
    deductions: number;
    netSalary: number;
    status: 'Paid' | 'Pending' | 'Canceled';
    components: SalaryComponent[];
}

export interface SalaryStructure {
    id: string;
    name: string;
    description?: string;
    components: SalaryComponent[];
}

// --- Store Module Types ---
export type InvoiceTemplate = 'A4' | 'thermal' | 'Packing Slip' | 'Delivery Challan';

export interface Store {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    contact?: string;
    email?: string;
    gstin?: string;
    region: string;
    managerId?: string; // User ID of the store manager
    cashInHand: number;
    cashAlertThreshold: number;
    // Template-specific settings
    invoiceTemplate?: InvoiceTemplate;
    receiptHeader?: string;
    receiptFooter?: string;
}

// NOTE: This type is obsolete and has been merged into the main `User` type.
// It is kept here temporarily to avoid breaking changes but should be removed.
export interface Staff {
    id: string;
    name: string;
    email: string;
    phone: string;
    storeId: string;
    role: string;
    status: 'Clocked In' | 'Clocked Out' | 'On Break';
}

export interface ShiftLog {
    id: string;
    staffId: string;
    timestamp: string; // ISO Date string
    type: 'Clock In' | 'Clock Out' | 'On Break' | 'End Break';
}

export type Shift = {
    id: string;
    employeeId: string;
    employeeName: string;
    day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
    shift: 'Morning' | 'Evening' | 'Night';
};
