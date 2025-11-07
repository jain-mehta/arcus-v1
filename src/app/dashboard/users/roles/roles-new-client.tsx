'use client';

import React, { useState, useTransition, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { KeyRound, PlusCircle, Loader2, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PermissionMap } from '@/lib/rbac';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface RolesNewClientProps {
  initialRoles: Role[];
  allUsers: User[];
}

// Define available modules with detailed granular permissions and descriptions
// Each permission has a key, label, and description to help users understand what they're granting
const MODULE_PERMISSIONS = {
  dashboard: {
    label: 'Dashboard & Analytics',
    description: 'Main dashboard and business analytics',
    permissions: {
      view: { label: 'View Dashboard', description: 'Access to main dashboard page' },
      viewAnalytics: { label: 'View Analytics', description: 'View business analytics and charts' },
      viewReports: { label: 'View Reports', description: 'Access to detailed business reports' },
      exportData: { label: 'Export Data', description: 'Download dashboard data as Excel/PDF' }
    }
  },
  sales: {
    label: 'Sales Management',
    description: 'Complete sales operations and customer management',
    submodules: {
      leads: {
        label: 'Leads Management',
        description: 'Manage potential customer leads and inquiries',
        permissions: {
          view: { label: 'View Leads', description: 'See leads list (limited to assigned)' },
          viewOwn: { label: 'View Own Leads', description: 'See only self-created leads' },
          viewTeam: { label: 'View Team Leads', description: 'See leads of team members' },
          viewAll: { label: 'View All Leads', description: 'See all company leads' },
          create: { label: 'Create Leads', description: 'Add new leads to system' },
          edit: { label: 'Edit Leads', description: 'Modify any lead details' },
          editOwn: { label: 'Edit Own Leads', description: 'Modify only self-created leads' },
          delete: { label: 'Delete Leads', description: 'Remove any lead from system' },
          deleteOwn: { label: 'Delete Own Leads', description: 'Remove only self-created leads' },
          assign: { label: 'Assign Leads', description: 'Assign leads to team members' },
          export: { label: 'Export Leads', description: 'Download leads data as Excel/CSV' },
          import: { label: 'Import Leads', description: 'Bulk upload leads from Excel/CSV' }
        }
      },
      opportunities: {
        label: 'Sales Opportunities',
        description: 'Track qualified sales opportunities and deals',
        permissions: {
          view: { label: 'View Opportunities', description: 'See opportunities list' },
          viewOwn: { label: 'View Own Opportunities', description: 'See only self-created opportunities' },
          viewTeam: { label: 'View Team Opportunities', description: 'See team opportunities' },
          viewAll: { label: 'View All Opportunities', description: 'See all company opportunities' },
          create: { label: 'Create Opportunities', description: 'Add new sales opportunities' },
          edit: { label: 'Edit Opportunities', description: 'Modify opportunity details' },
          editOwn: { label: 'Edit Own Opportunities', description: 'Modify only own opportunities' },
          delete: { label: 'Delete Opportunities', description: 'Remove opportunities from system' },
          updateStage: { label: 'Update Sales Stage', description: 'Move opportunities through sales pipeline' },
          assign: { label: 'Assign Opportunities', description: 'Assign opportunities to team members' },
          export: { label: 'Export Opportunities', description: 'Download opportunities data' }
        }
      },
      quotations: {
        label: 'Quotations & Proposals',
        description: 'Create and manage sales quotations',
        permissions: {
          view: { label: 'View Quotations', description: 'See quotations list' },
          viewOwn: { label: 'View Own Quotations', description: 'See only self-created quotations' },
          viewTeam: { label: 'View Team Quotations', description: 'See team quotations' },
          viewAll: { label: 'View All Quotations', description: 'See all company quotations' },
          create: { label: 'Create Quotations', description: 'Generate new quotations for customers' },
          edit: { label: 'Edit Quotations', description: 'Modify quotation details' },
          editOwn: { label: 'Edit Own Quotations', description: 'Modify only own quotations' },
          delete: { label: 'Delete Quotations', description: 'Remove quotations from system' },
          approve: { label: 'Approve Quotations', description: 'Approve quotations before sending to customer' },
          send: { label: 'Send Quotations', description: 'Email quotations to customers' },
          export: { label: 'Export Quotations', description: 'Download quotations as PDF/Excel' },
          viewPricing: { label: 'View Pricing Details', description: 'See cost and margin information' }
        }
      },
      invoices: {
        label: 'Sales Invoices',
        description: 'Manage customer invoices and payments',
        permissions: {
          view: { label: 'View Invoices', description: 'See invoices list' },
          viewOwn: { label: 'View Own Invoices', description: 'See only self-created invoices' },
          viewAll: { label: 'View All Invoices', description: 'See all company invoices' },
          create: { label: 'Create Invoices', description: 'Generate new customer invoices' },
          edit: { label: 'Edit Invoices', description: 'Modify invoice details' },
          delete: { label: 'Delete Invoices', description: 'Remove invoices from system' },
          approve: { label: 'Approve Invoices', description: 'Approve invoices before sending' },
          send: { label: 'Send Invoices', description: 'Email invoices to customers' },
          export: { label: 'Export Invoices', description: 'Download invoices as PDF/Excel' },
          viewPayments: { label: 'View Payment Status', description: 'See invoice payment tracking' }
        }
      }
    }
  },
  inventory: {
    label: 'Inventory Management',
    description: 'Complete inventory and stock control system',
    submodules: {
      products: {
        label: 'Product Catalog',
        description: 'Manage products, SKUs, and pricing',
        permissions: {
          view: { label: 'View Products', description: 'See products list (basic view)' },
          viewAll: { label: 'View All Products', description: 'See complete product catalog' },
          create: { label: 'Create Products', description: 'Add new products to catalog' },
          edit: { label: 'Edit Products', description: 'Modify product details' },
          delete: { label: 'Delete Products', description: 'Remove products from catalog' },
          viewCost: { label: 'View Cost Price', description: 'See product cost and purchase price' },
          editCost: { label: 'Edit Cost Price', description: 'Modify product cost price' },
          viewStock: { label: 'View Stock Levels', description: 'See current stock quantities' },
          manageVariants: { label: 'Manage Variants', description: 'Add/edit product variants (size, color, etc.)' },
          managePricing: { label: 'Manage Pricing', description: 'Set and update product selling prices' },
          export: { label: 'Export Products', description: 'Download product catalog as Excel/CSV' },
          import: { label: 'Import Products', description: 'Bulk upload products from Excel/CSV' }
        }
      },
      stock: {
        label: 'Stock Management',
        description: 'Track and manage inventory stock levels',
        permissions: {
          view: { label: 'View Stock', description: 'See stock levels (basic view)' },
          viewAll: { label: 'View All Stock', description: 'See complete stock across all warehouses' },
          addStock: { label: 'Add Stock', description: 'Increase stock quantities (stock in)' },
          removeStock: { label: 'Remove Stock', description: 'Decrease stock quantities (stock out)' },
          transferStock: { label: 'Transfer Stock', description: 'Move stock between warehouses/stores' },
          adjustStock: { label: 'Adjust Stock', description: 'Make stock adjustments (damage, loss, etc.)' },
          viewStockValue: { label: 'View Stock Value', description: 'See total inventory value in rupees' },
          viewLowStock: { label: 'View Low Stock Alerts', description: 'See products below minimum stock level' },
          manageWarehouses: { label: 'Manage Warehouses', description: 'Add/edit warehouse locations' },
          viewStockHistory: { label: 'View Stock History', description: 'See complete stock movement history' },
          export: { label: 'Export Stock Data', description: 'Download stock reports as Excel' }
        }
      },
      categories: {
        label: 'Product Categories',
        description: 'Organize products into categories and subcategories',
        permissions: {
          view: { label: 'View Categories', description: 'See product category tree' },
          create: { label: 'Create Categories', description: 'Add new product categories' },
          edit: { label: 'Edit Categories', description: 'Modify category names and hierarchy' },
          delete: { label: 'Delete Categories', description: 'Remove categories from system' },
          manageHierarchy: { label: 'Manage Category Tree', description: 'Organize parent-child category structure' }
        }
      },
      stockAlerts: {
        label: 'Stock Alerts & Notifications',
        description: 'Low stock alerts and reorder notifications',
        permissions: {
          view: { label: 'View Alerts', description: 'See low stock alerts' },
          configure: { label: 'Configure Alerts', description: 'Set minimum stock levels for products' },
          receiveNotifications: { label: 'Receive Notifications', description: 'Get email/SMS for low stock alerts' },
          manageReorderPoints: { label: 'Manage Reorder Points', description: 'Set automatic reorder quantities' }
        }
      },
      pricing: {
        label: 'Pricing & Discounts',
        description: 'Manage product pricing and discount rules',
        permissions: {
          view: { label: 'View Pricing', description: 'See product prices' },
          edit: { label: 'Edit Pricing', description: 'Modify product selling prices' },
          viewMargins: { label: 'View Profit Margins', description: 'See profit margin percentages' },
          createDiscounts: { label: 'Create Discounts', description: 'Set up discount rules and promotions' },
          approveDiscounts: { label: 'Approve Discounts', description: 'Approve discount requests' }
        }
      },
      barcodes: {
        label: 'Barcode & SKU',
        description: 'Manage product barcodes and SKU codes',
        permissions: {
          view: { label: 'View Barcodes', description: 'See product barcodes/SKUs' },
          generate: { label: 'Generate Barcodes', description: 'Create new barcodes for products' },
          print: { label: 'Print Barcode Labels', description: 'Print barcode stickers' },
          scan: { label: 'Scan Barcodes', description: 'Use barcode scanner for stock operations' }
        }
      }
    }
  },
  store: {
    label: 'Store & Point of Sale',
    description: 'Retail store operations and billing',
    submodules: {
      bills: {
        label: 'Store Bills',
        description: 'Customer billing and invoicing at store',
        permissions: {
          view: { label: 'View Bills', description: 'See store bills list' },
          viewOwn: { label: 'View Own Bills', description: 'See only self-created bills' },
          viewAll: { label: 'View All Bills', description: 'See all store bills' },
          create: { label: 'Create Bills', description: 'Generate new customer bills' },
          edit: { label: 'Edit Bills', description: 'Modify bill details' },
          editOwn: { label: 'Edit Own Bills', description: 'Modify only own bills' },
          delete: { label: 'Delete Bills', description: 'Cancel/delete bills' },
          viewPayments: { label: 'View Payment Details', description: 'See payment method and status' },
          processPayment: { label: 'Process Payments', description: 'Record cash/card payments' },
          processRefund: { label: 'Process Refunds', description: 'Handle customer refunds' },
          export: { label: 'Export Bills', description: 'Download bills data as Excel' }
        }
      },
      invoices: {
        label: 'Store Invoices',
        description: 'Tax invoices and past billing records',
        permissions: {
          view: { label: 'View Invoices', description: 'See store invoices' },
          viewPastBills: { label: 'View Past Bills', description: 'Access historical billing data' },
          viewAll: { label: 'View All Invoices', description: 'See all store invoices' },
          create: { label: 'Create Invoices', description: 'Generate tax invoices' },
          edit: { label: 'Edit Invoices', description: 'Modify invoice details' },
          delete: { label: 'Delete Invoices', description: 'Cancel invoices' },
          sendEmail: { label: 'Email Invoices', description: 'Send invoices to customers via email' },
          export: { label: 'Export Invoices', description: 'Download invoices as PDF/Excel' }
        }
      },
      pos: {
        label: 'Point of Sale (POS)',
        description: 'Cash counter and billing terminal',
        permissions: {
          access: { label: 'Access POS', description: 'Open POS billing screen' },
          viewSales: { label: 'View Sales', description: 'See sales transactions' },
          processSale: { label: 'Process Sales', description: 'Create new sale transactions' },
          processReturn: { label: 'Process Returns', description: 'Handle product returns' },
          applyDiscount: { label: 'Apply Discounts', description: 'Give discounts during billing' },
          viewDailySummary: { label: 'View Daily Summary', description: 'See end-of-day sales report' },
          openCashDrawer: { label: 'Open Cash Drawer', description: 'Access cash drawer outside of sale' },
          voidTransaction: { label: 'Void Transaction', description: 'Cancel a completed transaction' }
        }
      },
      customers: {
        label: 'Store Customers',
        description: 'Walk-in customer database',
        permissions: {
          view: { label: 'View Customers', description: 'See customer list' },
          create: { label: 'Create Customers', description: 'Add new customers' },
          edit: { label: 'Edit Customers', description: 'Modify customer details' },
          delete: { label: 'Delete Customers', description: 'Remove customers' },
          viewPurchaseHistory: { label: 'View Purchase History', description: 'See customer purchase records' },
          manageLoyalty: { label: 'Manage Loyalty Points', description: 'Add/redeem loyalty points' }
        }
      }
    }
  },
  supply: {
    label: 'Supply Chain & Procurement',
    description: 'Vendor management and purchase operations',
    submodules: {
      vendors: {
        label: 'Vendor Management',
        description: 'Supplier and vendor database',
        permissions: {
          view: { label: 'View Vendors', description: 'See vendor list' },
          viewAll: { label: 'View All Vendors', description: 'See complete vendor database' },
          create: { label: 'Create Vendors', description: 'Add new vendors to system' },
          edit: { label: 'Edit Vendors', description: 'Modify vendor details and contacts' },
          delete: { label: 'Delete Vendors', description: 'Remove vendors from system' },
          viewPayments: { label: 'View Payment History', description: 'See vendor payment records' },
          viewPerformance: { label: 'View Performance', description: 'See vendor performance ratings' },
          manageContracts: { label: 'Manage Contracts', description: 'Handle vendor contracts and agreements' },
          export: { label: 'Export Vendors', description: 'Download vendor data as Excel' }
        }
      },
      purchaseOrders: {
        label: 'Purchase Orders',
        description: 'Create and track purchase orders',
        permissions: {
          view: { label: 'View Purchase Orders', description: 'See PO list' },
          viewAll: { label: 'View All POs', description: 'See all company purchase orders' },
          create: { label: 'Create Purchase Orders', description: 'Generate new POs for vendors' },
          edit: { label: 'Edit Purchase Orders', description: 'Modify PO details' },
          delete: { label: 'Delete Purchase Orders', description: 'Cancel purchase orders' },
          approve: { label: 'Approve Purchase Orders', description: 'Approve POs before sending' },
          send: { label: 'Send to Vendor', description: 'Email POs to vendors' },
          receiveGoods: { label: 'Receive Goods', description: 'Mark goods as received (GRN)' },
          viewPricing: { label: 'View Purchase Pricing', description: 'See purchase prices and totals' },
          export: { label: 'Export POs', description: 'Download PO data as Excel/PDF' }
        }
      },
      bills: {
        label: 'Vendor Bills & Payments',
        description: 'Manage vendor invoices and payments',
        permissions: {
          view: { label: 'View Vendor Bills', description: 'See vendor bills list' },
          viewAll: { label: 'View All Bills', description: 'See all vendor bills' },
          create: { label: 'Create Bills', description: 'Record vendor bills in system' },
          edit: { label: 'Edit Bills', description: 'Modify vendor bill details' },
          delete: { label: 'Delete Bills', description: 'Remove vendor bills' },
          approve: { label: 'Approve Bills', description: 'Approve bills for payment' },
          processPayment: { label: 'Process Payments', description: 'Make payments to vendors' },
          viewPaymentStatus: { label: 'View Payment Status', description: 'Track payment status (paid/pending)' },
          export: { label: 'Export Bills', description: 'Download vendor bills data' }
        }
      },
      grn: {
        label: 'Goods Receipt Notes',
        description: 'Track received goods and quality checks',
        permissions: {
          view: { label: 'View GRNs', description: 'See goods receipt records' },
          create: { label: 'Create GRN', description: 'Record received goods' },
          edit: { label: 'Edit GRN', description: 'Modify GRN details' },
          approve: { label: 'Approve GRN', description: 'Approve quality check and acceptance' },
          reject: { label: 'Reject Goods', description: 'Reject damaged/incorrect goods' }
        }
      }
    }
  },
  hrms: {
    label: 'Human Resource Management',
    description: 'Employee management and HR operations',
    submodules: {
      employees: {
        label: 'Employee Management',
        description: 'Employee database and records',
        permissions: {
          view: { label: 'View Employees', description: 'See employee list' },
          viewAll: { label: 'View All Employees', description: 'See complete employee database' },
          viewOwn: { label: 'View Own Profile', description: 'See only own employee details' },
          create: { label: 'Create Employees', description: 'Add new employees to system' },
          edit: { label: 'Edit Employees', description: 'Modify employee details' },
          delete: { label: 'Delete Employees', description: 'Remove employees from system' },
          viewSalary: { label: 'View Salary', description: 'See employee salary information' },
          editSalary: { label: 'Edit Salary', description: 'Modify employee salary' },
          viewDocuments: { label: 'View Documents', description: 'Access employee documents (Aadhaar, PAN, etc.)' },
          manageDocuments: { label: 'Manage Documents', description: 'Upload/delete employee documents' },
          export: { label: 'Export Employees', description: 'Download employee data as Excel' }
        }
      },
      payroll: {
        label: 'Payroll Processing',
        description: 'Salary calculation and payment',
        permissions: {
          view: { label: 'View Payroll', description: 'See payroll records' },
          viewAll: { label: 'View All Payroll', description: 'See complete payroll data' },
          process: { label: 'Process Payroll', description: 'Calculate monthly salaries' },
          approve: { label: 'Approve Payroll', description: 'Approve salary payments' },
          viewReports: { label: 'View Payroll Reports', description: 'Access salary reports and summaries' },
          generatePayslips: { label: 'Generate Payslips', description: 'Create employee salary slips' },
          export: { label: 'Export Payroll', description: 'Download payroll data as Excel' }
        }
      },
      attendance: {
        label: 'Attendance Tracking',
        description: 'Employee attendance and work hours',
        permissions: {
          view: { label: 'View Attendance', description: 'See attendance records' },
          viewAll: { label: 'View All Attendance', description: 'See all employee attendance' },
          viewOwn: { label: 'View Own Attendance', description: 'See only own attendance' },
          mark: { label: 'Mark Attendance', description: 'Record daily attendance' },
          edit: { label: 'Edit Attendance', description: 'Modify attendance records' },
          approve: { label: 'Approve Attendance', description: 'Approve attendance regularization' },
          viewReports: { label: 'View Reports', description: 'Access attendance reports' },
          manageShifts: { label: 'Manage Shifts', description: 'Create and assign work shifts' },
          export: { label: 'Export Attendance', description: 'Download attendance as Excel' }
        }
      },
      settlement: {
        label: 'Final Settlement',
        description: 'Employee exit and final settlement',
        permissions: {
          view: { label: 'View Settlements', description: 'See settlement records' },
          viewAll: { label: 'View All Settlements', description: 'See all employee settlements' },
          create: { label: 'Create Settlement', description: 'Initiate final settlement process' },
          process: { label: 'Process Settlement', description: 'Calculate final settlement amount' },
          approve: { label: 'Approve Settlement', description: 'Approve settlement payment' },
          viewDocuments: { label: 'View Settlement Docs', description: 'Access exit documents (NOC, relieving letter)' },
          export: { label: 'Export Settlements', description: 'Download settlement data' }
        }
      },
      leaves: {
        label: 'Leave Management',
        description: 'Employee leave requests and approvals',
        permissions: {
          view: { label: 'View Leaves', description: 'See leave applications' },
          viewAll: { label: 'View All Leaves', description: 'See all employee leave requests' },
          viewOwn: { label: 'View Own Leaves', description: 'See only own leave history' },
          apply: { label: 'Apply Leave', description: 'Submit leave applications' },
          approve: { label: 'Approve Leaves', description: 'Approve/reject leave requests' },
          reject: { label: 'Reject Leaves', description: 'Reject leave applications' },
          viewBalance: { label: 'View Leave Balance', description: 'See available leave balance' },
          managePolicy: { label: 'Manage Leave Policy', description: 'Configure leave types and policies' },
          cancelLeave: { label: 'Cancel Leave', description: 'Cancel approved leaves' }
        }
      },
      recruitment: {
        label: 'Recruitment & Hiring',
        description: 'Job postings and candidate management',
        permissions: {
          view: { label: 'View Jobs', description: 'See job postings' },
          createJob: { label: 'Create Job Posting', description: 'Post new job openings' },
          viewCandidates: { label: 'View Candidates', description: 'See candidate applications' },
          scheduleInterview: { label: 'Schedule Interview', description: 'Set up candidate interviews' },
          updateStatus: { label: 'Update Candidate Status', description: 'Move candidates through hiring stages' },
          makeOffer: { label: 'Make Offer', description: 'Send job offers to candidates' }
        }
      }
    }
  },
  vendor: {
    label: 'Vendor Portal Access',
    description: 'External vendor portal permissions',
    permissions: {
      viewAll: { label: 'View All Vendors', description: 'See complete vendor list' },
      viewAssigned: { label: 'View Assigned Vendors', description: 'See only assigned vendors' },
      create: { label: 'Create Vendor Profile', description: 'Add new vendors' },
      edit: { label: 'Edit Vendor', description: 'Modify vendor information' },
      delete: { label: 'Delete Vendor', description: 'Remove vendor from system' },
      communicate: { label: 'Communicate with Vendor', description: 'Send messages/emails to vendors' },
      viewPayments: { label: 'View Payment History', description: 'See vendor payment records' },
      viewPerformance: { label: 'View Performance Metrics', description: 'Access vendor ratings and KPIs' },
      grantPortalAccess: { label: 'Grant Portal Access', description: 'Give vendors login to vendor portal' },
      export: { label: 'Export Vendor Data', description: 'Download vendor information' }
    }
  },
  users: {
    label: 'User Management',
    description: 'System users and access control',
    permissions: {
      viewAll: { label: 'View All Users', description: 'See all system users' },
      create: { label: 'Create Users', description: 'Add new users to system' },
      edit: { label: 'Edit Users', description: 'Modify user details and information' },
      delete: { label: 'Delete Users', description: 'Remove users from system' },
      resetPassword: { label: 'Reset Password', description: 'Reset user passwords' },
      assignRoles: { label: 'Assign Roles', description: 'Assign/change user roles' },
      deactivate: { label: 'Deactivate Users', description: 'Temporarily disable user access' },
      viewAuditLog: { label: 'View Audit Log', description: 'See user activity history' }
    }
  },
  settings: {
    label: 'System Settings',
    description: 'Application configuration and admin settings',
    permissions: {
      view: { label: 'View Settings', description: 'Access settings pages' },
      manageRoles: { label: 'Manage Roles', description: 'Create/edit/delete roles and permissions' },
      manageUsers: { label: 'Manage Users', description: 'Full user management access' },
      manageOrganization: { label: 'Manage Organization', description: 'Edit company details and settings' },
      viewAuditLog: { label: 'View Audit Log', description: 'See system activity logs' },
      manageIntegrations: { label: 'Manage Integrations', description: 'Configure third-party integrations' },
      manageBilling: { label: 'Manage Billing', description: 'Handle subscription and payment settings' },
      manageNotifications: { label: 'Manage Notifications', description: 'Configure email/SMS notification settings' }
    }
  }
};

export function RolesNewClient({ initialRoles, allUsers }: RolesNewClientProps) {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const userCountsByRole = useMemo(() => {
    const counts = new Map<string, number>();
    allUsers.forEach(user => {
      user.roleIds.forEach(roleId => {
        counts.set(roleId, (counts.get(roleId) || 0) + 1);
      });
    });
    return counts;
  }, [allUsers]);

  const handleCreateRole = () => {
    setSelectedRole(null);
    setIsDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsDialogOpen(true);
  };

  const handleRoleSaved = (savedRole: Role) => {
    const existing = roles.find((r) => r.id === savedRole.id);
    if (existing) {
      setRoles(roles.map((r) => (r.id === savedRole.id ? savedRole : r)));
    } else {
      setRoles([...roles, savedRole]);
    }
    setIsDialogOpen(false);
  };

  const countPermissions = (permissionMap: any): number => {
    let count = 0;
    Object.values(permissionMap).forEach(modulePerms => {
      if (modulePerms && typeof modulePerms === 'object') {
        Object.values(modulePerms).forEach(submoduleVal => {
          if (typeof submoduleVal === 'boolean' && submoduleVal === true) {
            count++;
          } else if (submoduleVal && typeof submoduleVal === 'object') {
            // Handle 3-level structure: module -> submodule -> action
            count += Object.values(submoduleVal).filter(val => val === true).length;
          }
        });
      }
    });
    return count;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <KeyRound /> Manage Roles
          </h1>
          <p className="text-muted-foreground">
            Define roles and assign granular permissions by module and submodule.
          </p>
        </div>
        <Button onClick={handleCreateRole}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>View and manage roles in your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {userCountsByRole.get(role.id) || 0} users
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {countPermissions(role.permissions)} permissions
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditRole(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RoleEditorDialog
        role={selectedRole}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onRoleSaved={handleRoleSaved}
      />
    </div>
  );
}

interface RoleEditorDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleSaved: (role: Role) => void;
}

function RoleEditorDialog({ role, open, onOpenChange, onRoleSaved }: RoleEditorDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, startTransition] = useTransition();
  const isEditMode = !!role;

  const [roleName, setRoleName] = useState(role?.name || '');
  const [permissions, setPermissions] = useState<any>(role?.permissions || {});

  React.useEffect(() => {
    if (role) {
      setRoleName(role.name);
      setPermissions(role.permissions);
    } else {
      setRoleName('');
      setPermissions({});
    }
  }, [role]);

  const togglePermission = (module: string, submoduleOrPermission: string, permission?: string) => {
    setPermissions((prev: any) => {
      const newPerms = JSON.parse(JSON.stringify(prev)); // Deep clone
      
      if (permission) {
        // Nested: module -> submodule -> permission
        if (!newPerms[module]) newPerms[module] = {};
        if (!newPerms[module][submoduleOrPermission]) newPerms[module][submoduleOrPermission] = {};
        newPerms[module][submoduleOrPermission][permission] = !newPerms[module][submoduleOrPermission][permission];
      } else {
        // Flat: module -> permission
        if (!newPerms[module]) newPerms[module] = {};
        newPerms[module][submoduleOrPermission] = !newPerms[module][submoduleOrPermission];
      }
      
      return newPerms;
    });
  };

  const toggleAllSubmodulePermissions = (module: string, submodule: string, checked: boolean) => {
    const moduleConfig = MODULE_PERMISSIONS[module as keyof typeof MODULE_PERMISSIONS];
    if (!moduleConfig || !('submodules' in moduleConfig)) return;
    
    const submoduleConfig: any = (moduleConfig.submodules as any)[submodule];
    if (!submoduleConfig) return;

    setPermissions((prev: any) => {
      const newPerms = JSON.parse(JSON.stringify(prev));
      if (!newPerms[module]) newPerms[module] = {};
      newPerms[module][submodule] = {};
      
      // Handle new permission structure with labels and descriptions
      const permissionKeys = Object.keys(submoduleConfig.permissions);
      permissionKeys.forEach((permission: string) => {
        newPerms[module][submodule][permission] = checked;
      });
      
      return newPerms;
    });
  };

  const toggleAllModulePermissions = (module: string, checked: boolean) => {
    const moduleConfig = MODULE_PERMISSIONS[module as keyof typeof MODULE_PERMISSIONS];
    if (!moduleConfig) return;

    setPermissions((prev: any) => {
      const newPerms = JSON.parse(JSON.stringify(prev));
      newPerms[module] = {};
      
      if ('submodules' in moduleConfig) {
        // Module has submodules
        Object.entries(moduleConfig.submodules as any).forEach(([submodule, config]: [string, any]) => {
          newPerms[module][submodule] = {};
          const permissionKeys = Object.keys(config.permissions);
          permissionKeys.forEach((permission: string) => {
            newPerms[module][submodule][permission] = checked;
          });
        });
      } else if ('permissions' in moduleConfig) {
        // Module has direct permissions
        const permissionKeys = Object.keys(moduleConfig.permissions);
        permissionKeys.forEach((permission: string) => {
          newPerms[module][permission] = checked;
        });
      }
      
      return newPerms;
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Role name is required' });
      return;
    }

    startTransition(async () => {
      try {
        const endpoint = isEditMode ? `/api/admin/roles/${role.id}` : '/api/admin/roles';
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: roleName,
            permissions,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to save role');
        }

        const result = await response.json();
        const savedRole = result.role || result;

        onRoleSaved(savedRole);
        toast({
          title: isEditMode ? 'Role Updated' : 'Role Created',
          description: `${roleName} has been ${isEditMode ? 'updated' : 'created'}.`,
        });

        if (!isEditMode) {
          setRoleName('');
          setPermissions({});
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  };

  const countModulePermissions = (module: string): number => {
    const modulePerms = permissions[module];
    if (!modulePerms) return 0;
    
    let count = 0;
    Object.values(modulePerms).forEach((val: any) => {
      if (typeof val === 'boolean' && val) {
        count++;
      } else if (typeof val === 'object') {
        count += Object.values(val).filter(v => v === true).length;
      }
    });
    return count;
  };

  const getTotalModulePermissions = (module: string): number => {
    const moduleConfig = MODULE_PERMISSIONS[module as keyof typeof MODULE_PERMISSIONS];
    if (!moduleConfig) return 0;
    
    if ('submodules' in moduleConfig) {
      let total = 0;
      Object.values(moduleConfig.submodules as any).forEach((config: any) => {
        total += Object.keys(config.permissions).length;
      });
      return total;
    } else if ('permissions' in moduleConfig) {
      return Object.keys(moduleConfig.permissions).length;
    }
    return 0;
  };

  const isSubmoduleFullyChecked = (module: string, submodule: string): boolean => {
    const submodulePerms = permissions[module]?.[submodule];
    if (!submodulePerms) return false;
    
    const moduleConfig = MODULE_PERMISSIONS[module as keyof typeof MODULE_PERMISSIONS];
    if (!moduleConfig || !('submodules' in moduleConfig)) return false;
    
    const submoduleConfig: any = (moduleConfig.submodules as any)[submodule];
    if (!submoduleConfig) return false;
    
    const permissionKeys = Object.keys(submoduleConfig.permissions);
    return permissionKeys.every((perm: string) => submodulePerms[perm] === true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          <DialogDescription>
            Set the name and granular permissions for this role. Select specific permissions for each module and submodule.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label htmlFor="roleName">Role Name</Label>
            <Input
              id="roleName"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g., Sales Manager"
              required
            />
          </div>

          <div>
            <Label className="text-lg font-semibold">Module Permissions</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Select specific permissions for each module. Hover over permissions to see detailed descriptions of what each permission allows.
            </p>

            <Accordion type="multiple" className="w-full">
              {Object.entries(MODULE_PERMISSIONS).map(([module, moduleConfig]) => {
                const hasSubmodules = 'submodules' in moduleConfig;
                
                return (
                  <AccordionItem key={module} value={module}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={countModulePermissions(module) === getTotalModulePermissions(module) && getTotalModulePermissions(module) > 0}
                        onCheckedChange={(checked) =>
                          toggleAllModulePermissions(module, checked as boolean)
                        }
                        className="ml-4"
                      />
                      <AccordionTrigger className="hover:no-underline flex-1">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1 text-left">
                            <div className="font-semibold">{moduleConfig.label}</div>
                            <div className="text-xs text-muted-foreground font-normal">{moduleConfig.description}</div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {countModulePermissions(module)}/{getTotalModulePermissions(module)}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent>
                      {hasSubmodules ? (
                        <div className="space-y-6 pl-6">
                          {Object.entries((moduleConfig as any).submodules).map(([submodule, submoduleConfig]: [string, any]) => (
                            <div key={submodule} className="space-y-3 border-l-2 border-muted pl-4">
                              <div className="flex items-start gap-2 mb-3">
                                <Checkbox
                                  checked={isSubmoduleFullyChecked(module, submodule)}
                                  onCheckedChange={(checked) =>
                                    toggleAllSubmodulePermissions(module, submodule, checked as boolean)
                                  }
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{submoduleConfig.label}</div>
                                  <div className="text-xs text-muted-foreground">{submoduleConfig.description}</div>
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    {Object.values(permissions[module]?.[submodule] || {}).filter((v: any) => v === true).length}/{Object.keys(submoduleConfig.permissions).length} selected
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                                {Object.entries(submoduleConfig.permissions).map(([permKey, permConfig]: [string, any]) => (
                                  <div key={permKey} className="flex items-start space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                    <Checkbox
                                      id={`${module}-${submodule}-${permKey}`}
                                      checked={permissions[module]?.[submodule]?.[permKey] || false}
                                      onCheckedChange={() => togglePermission(module, submodule, permKey)}
                                      className="mt-1"
                                    />
                                    <label
                                      htmlFor={`${module}-${submodule}-${permKey}`}
                                      className="flex-1 cursor-pointer"
                                    >
                                      <div className="text-sm font-medium leading-none">{permConfig.label}</div>
                                      <div className="text-xs text-muted-foreground mt-1">{permConfig.description}</div>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6 pt-2">
                          {Object.entries((moduleConfig as any).permissions).map(([permKey, permConfig]: [string, any]) => (
                            <div key={permKey} className="flex items-start space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                              <Checkbox
                                id={`${module}-${permKey}`}
                                checked={permissions[module]?.[permKey] || false}
                                onCheckedChange={() => togglePermission(module, permKey)}
                                className="mt-1"
                              />
                              <label
                                htmlFor={`${module}-${permKey}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="text-sm font-medium leading-none">{permConfig.label}</div>
                                <div className="text-xs text-muted-foreground mt-1">{permConfig.description}</div>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


\n\n
// Database types for Supabase tables
interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  price?: number;
  cost?: number;
  unit?: string;
  image_url?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name?: string;
  po_date: string;
  delivery_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'delivered' | 'completed';
  total_amount: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Employee {
  id: string;
  employee_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  hire_date?: string;
  status: 'active' | 'inactive';
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Store {
  id: string;
  name: string;
  location?: string;
  address?: string;
  manager_id?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}
