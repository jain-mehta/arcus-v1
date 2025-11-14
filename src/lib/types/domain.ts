/**
 * Domain Entity Types
 * 
 * Central location for all domain entity types used across the application.
 * These types are derived from the database schema in COMPLETE_DATABASE_SCHEMA.sql
 */

// ===== VENDOR DOMAIN =====
export interface Vendor {
  id: string;
  tenant_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  country?: string;
  quality_score?: number;
  rating?: number;
  status?: 'active' | 'inactive' | 'suspended';
  created_at?: string;
  updated_at?: string;
}

export interface VolumeDiscount {
  id: string;
  vendor_id: string;
  min_quantity: number;
  max_quantity?: number;
  discount_percentage: number;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  vendor_id: string;
  order_number: string;
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  total_amount: number;
  status: 'draft' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  items?: PurchaseOrderItem[];
  created_at?: string;
  updated_at?: string;
  
  // Camel case aliases
  poNumber?: string;
  vendorId?: string;
  orderDate?: string;
  totalAmount?: number;
  lineItems?: Array<{ material: string; unitPrice: number; quantity: number; [key: string]: any }>;
  amountGiven?: number;
  paymentStatus?: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

// ===== STORE DOMAIN =====
export interface Store {
  id: string;
  tenant_id: string;
  name: string;
  code?: string;
  location?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  status: 'active' | 'inactive' | 'closed';
  default_payslip_format_id?: string;
  created_at?: string;
  updated_at?: string;
  
  // Aliases for camelCase support
  invoiceTemplate?: string;
  address?: string;
  contact?: string;
  gstin?: string;
  receiptFooter?: string;
  receiptHeader?: string;
  region?: string;
  pincode?: string;
  managerId?: string;
  cashAlertThreshold?: number;
  cashInHand?: number;
}

export interface Order {
  id: string;
  tenant_id: string;
  store_id: string;
  customer_id: string;
  order_number: string;
  order_date: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Draft' | 'Confirmed' | 'Picked';
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
  
  // Aliases for camelCase support
  customerId?: string;
  orderNumber?: string;
  orderDate?: string;
  totalAmount?: number;
  customerDetails?: { name: string; address?: string };
  lineItems?: Array<{ unitPrice: number; quantity: number; [key: string]: any }>;
  discountPercentage?: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  country?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

// ===== SALES DOMAIN =====
export interface Visit {
  id: string;
  tenant_id?: string;
  salesperson_id?: string;
  customer_id?: string;
  visit_date?: string;
  visit_purpose?: string;
  duration_minutes?: number;
  notes?: string;
  status?: 'planned' | 'completed' | 'cancelled' | 'scheduled';
  created_at?: string;
  updated_at?: string;
  
  // Additional fields for sales visits
  dealer_id?: string;
  purpose?: string;
  outcome?: string;
  next_follow_up_date?: string;
  feedback?: string;
  user_id?: string;
  organization_id?: string;
  applied_at?: string;
  rating?: number;
  
  // Camel case aliases
  visitDate?: string;
  dealerName?: string;
  nextFollowUpDate?: string;
}

// ===== EMPLOYEE/HRMS DOMAIN =====
export interface User {
  roleIds: any;
  id: string;
  tenant_id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
  
  // Camel case aliases
  name?: string;
  designation?: string;
}

export interface Employee {
  id: string;
  tenant_id: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  role?: string;
  salary?: number;
  status: 'active' | 'inactive' | 'on-leave';
  joining_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Payslip {
  id: string;
  tenant_id: string;
  store_id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  gross_salary: number;
  deductions: number;
  net_salary: number;
  status: 'draft' | 'finalized' | 'paid';
  created_at?: string;
  updated_at?: string;
  
  // Aliases for camelCase support
  grossSalary?: number;
  netSalary?: number;
  month?: string;
  staffId?: string;
  staffName?: string;
  components?: Array<{ name: string; type: string; value: number; [key: string]: any }>;
}

// ===== RECRUITMENT DOMAIN =====
export interface JobOpening {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  department?: string;
  status: 'open' | 'closed' | 'on-hold';
  posted_date: string;
  closing_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Applicant {
  id: string;
  tenant_id: string;
  job_opening_id: string;
  name: string;
  email: string;
  phone?: string;
  resume_url?: string;
  status: 'applied' | 'shortlisted' | 'interview' | 'offered' | 'rejected' | 'hired';
  created_at?: string;
  updated_at?: string;
}

export interface ApplicantStage {
  id: string;
  tenant_id: string;
  applicant_id: string;
  stage_name: string;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Type alias for applicant pipeline stages
export type ApplicantStageName = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected' | 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';

// ===== VENDOR RATING DOMAIN =====
export interface VendorRatingCriteria {
  id: string;
  vendor_id: string;
  criteria_name: string;
  weight: number;
  target_score?: number;
  manual_score?: number;
  auto_score?: number;
  created_at?: string;
  updated_at?: string;
}

export interface VendorRatingHistory {
  id: string;
  vendor_id: string;
  criteria_id?: string;
  score: number;
  date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// ===== PRODUCT DOMAIN =====
export interface Product {
  id: string;
  tenant_id?: string;
  name: string;
  code?: string;
  sku?: string;
  description?: string;
  category?: string;
  price?: number;
  unit_price?: number;
  quantity?: number;
  stock_quantity?: number;
  cost?: number;
  unit?: string;
  dimensions?: string;
  weight?: number;
  image_url?: string;
  imageUrl?: string;
  organization_id?: string;
  orgId?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  inventoryType?: 'Factory' | 'Store';
}

// ===== PAYROLL FORMAT DOMAIN =====
export interface PayslipLayout {
  id?: string;
  name?: string;
  header?: {
    companyName: string;
    companyAddress: string;
    title: string;
    period: string;
  };
  body?: {
    gridColumns: number;
    sections: Array<{
      title: string;
      columns: number;
      fields: Array<{
        label: string;
        exampleValue: string;
      }>;
    }>;
  };
  footer?: {
    summary: Array<{
      label: string;
      exampleValue: string;
      isTotal: boolean;
    }>;
    notes?: string;
  };
}

// ===== QUOTATION DOMAIN =====
export interface Quotation {
  id: string;
  tenant_id?: string;
  owner_id: string;
  customer_id: string;
  quote_number: string;
  quote_date: string;
  expiry_date: string;
  total_amount: number;
  status: 'Draft' | 'Awaiting Approval' | 'Approved' | 'Rejected' | 'Expired';
  discount_percentage?: number;
  lineItems?: QuotationLineItem[];
  line_items?: QuotationLineItem[];
  created_at?: string;
  updated_at?: string;
  
  // Camel case aliases
  ownerId?: string;
  customerId?: string;
  quoteNumber?: string;
  quoteDate?: string;
  expiryDate?: string;
  totalAmount?: number;
  discountPercentage?: number;
}

export interface QuotationLineItem {
  id?: string;
  quotation_id?: string;
  product_id: string;
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
  created_at?: string;
  updated_at?: string;
  
  // Camel case aliases
  productId?: string;
  quotationId?: string;
  unitPrice?: number;
  totalPrice?: number;
}
