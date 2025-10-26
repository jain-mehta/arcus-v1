# Permify Schema & Relations Definition
# For: Bobs Firebase Command Center (Arcus v1)
# Purpose: Map 230 granular UI permissions to Permify relational model
# Format: Permify Schema Language (PSL)
# Usage: Paste into Permify console or via API for schema sync

---

## ENTITIES

### entity user
  relation organization: organization
  relation tenant: tenant
  attribute employee_id: string
  attribute department: string

### entity organization
  relation owner: user
  attribute name: string

### entity tenant
  relation parent_org: organization
  relation members: user[]
  attribute name: string
  attribute status: string # active, inactive

### entity role
  relation tenant: tenant
  relation permissions: permission[]
  attribute role_name: string
  attribute role_level: string # admin, manager, user, guest

### entity permission
  relation role: role[]
  relation module: module
  relation submodule: submodule
  attribute permission_key: string # e.g., "dashboard.view"
  attribute permission_label: string # e.g., "View Dashboard"
  attribute permission_description: string
  attribute permission_type: string # view, create, edit, delete, approve, export, import

### entity module
  relation tenant: tenant
  relation permissions: permission[]
  attribute module_name: string # Dashboard, Sales, Inventory, etc.
  attribute module_description: string

### entity submodule
  relation module: module
  relation permissions: permission[]
  attribute submodule_name: string # Leads Management, Opportunities, etc.
  attribute submodule_description: string

### entity resource
  # Resource can be a lead, opportunity, order, vendor, etc.
  relation created_by: user
  relation assigned_to: user
  relation tenant: tenant
  relation department: department
  attribute resource_type: string # lead, opportunity, order, vendor, etc.
  attribute resource_id: string
  attribute visibility_scope: string # own, team, all

### entity department
  relation tenant: tenant
  relation members: user[]
  relation manager: user
  attribute department_name: string

---

## RELATIONS

### Permission Hierarchy
permission:
  parent permission -> child permission[]

### User to Role
user:
  has_role -> role[] @ tenant
  has_permission -> permission[] via role @ tenant

### User to Department
user:
  member_of -> department @ tenant
  managed_by -> user @ tenant (supervisor/manager)

### User to Resource (Data Access Control)
user:
  owns -> resource[resource_type == "lead"]
  owns -> resource[resource_type == "opportunity"]
  owns -> resource[resource_type == "order"]
  owns -> resource[resource_type == "vendor"]
  owns -> resource[resource_type == "invoice"]
  
  team_access -> resource @ department
  all_access -> resource @ tenant

### Role to Permission
role:
  grants -> permission[]

### Module to Permissions
module:
  contains -> permission[]
  contains -> submodule[]

### Submodule to Permissions
submodule:
  contains -> permission[]

---

## PERMISSIONS STRUCTURE

### Dashboard & Analytics Module (4 permissions)
Module: "Dashboard & Analytics"
Description: "Main dashboard and business analytics"

├─ dashboard.view
│  Label: "View Dashboard"
│  Description: "Access to main dashboard page"
│  Type: "view"
│
├─ dashboard.viewAnalytics
│  Label: "View Analytics"
│  Description: "View business analytics and charts"
│  Type: "view"
│
├─ dashboard.viewReports
│  Label: "View Reports"
│  Description: "Access to detailed business reports"
│  Type: "view"
│
└─ dashboard.exportData
   Label: "Export Data"
   Description: "Download dashboard data as Excel/PDF"
   Type: "export"

---

### Sales Management Module (45 permissions)

#### Submodule: Leads Management (12 permissions)
├─ sales.leads.view
│  Label: "View Leads"
│  Description: "See leads list (limited to assigned)"
│  Type: "view"
│  Scope: "assigned"
│
├─ sales.leads.viewOwn
│  Label: "View Own Leads"
│  Description: "See only self-created leads"
│  Type: "view"
│  Scope: "own"
│
├─ sales.leads.viewTeam
│  Label: "View Team Leads"
│  Description: "See leads of team members"
│  Type: "view"
│  Scope: "team"
│
├─ sales.leads.viewAll
│  Label: "View All Leads"
│  Description: "See all company leads"
│  Type: "view"
│  Scope: "all"
│
├─ sales.leads.create
│  Label: "Create Leads"
│  Description: "Add new leads to system"
│  Type: "create"
│
├─ sales.leads.edit
│  Label: "Edit Leads"
│  Description: "Modify any lead details"
│  Type: "edit"
│
├─ sales.leads.editOwn
│  Label: "Edit Own Leads"
│  Description: "Modify only self-created leads"
│  Type: "edit"
│  Scope: "own"
│
├─ sales.leads.delete
│  Label: "Delete Leads"
│  Description: "Remove any lead from system"
│  Type: "delete"
│
├─ sales.leads.deleteOwn
│  Label: "Delete Own Leads"
│  Description: "Remove only self-created leads"
│  Type: "delete"
│  Scope: "own"
│
├─ sales.leads.assign
│  Label: "Assign Leads"
│  Description: "Assign leads to team members"
│  Type: "assign"
│
├─ sales.leads.export
│  Label: "Export Leads"
│  Description: "Download leads data as Excel/CSV"
│  Type: "export"
│
└─ sales.leads.import
   Label: "Import Leads"
   Description: "Bulk upload leads from Excel/CSV"
   Type: "import"

#### Submodule: Sales Opportunities (11 permissions)
├─ sales.opportunities.view
│  Label: "View Opportunities"
│  Description: "See opportunities list"
│  Type: "view"
│
├─ sales.opportunities.viewOwn
│  Label: "View Own Opportunities"
│  Description: "See only self-created opportunities"
│  Type: "view"
│  Scope: "own"
│
├─ sales.opportunities.viewTeam
│  Label: "View Team Opportunities"
│  Description: "See team opportunities"
│  Type: "view"
│  Scope: "team"
│
├─ sales.opportunities.viewAll
│  Label: "View All Opportunities"
│  Description: "See all company opportunities"
│  Type: "view"
│  Scope: "all"
│
├─ sales.opportunities.create
│  Label: "Create Opportunities"
│  Description: "Add new sales opportunities"
│  Type: "create"
│
├─ sales.opportunities.edit
│  Label: "Edit Opportunities"
│  Description: "Modify opportunity details"
│  Type: "edit"
│
├─ sales.opportunities.editOwn
│  Label: "Edit Own Opportunities"
│  Description: "Modify only own opportunities"
│  Type: "edit"
│  Scope: "own"
│
├─ sales.opportunities.delete
│  Label: "Delete Opportunities"
│  Description: "Remove opportunities from system"
│  Type: "delete"
│
├─ sales.opportunities.updateStage
│  Label: "Update Sales Stage"
│  Description: "Move opportunities through sales pipeline"
│  Type: "edit"
│
├─ sales.opportunities.assign
│  Label: "Assign Opportunities"
│  Description: "Assign opportunities to team members"
│  Type: "assign"
│
└─ sales.opportunities.export
   Label: "Export Opportunities"
   Description: "Download opportunities data"
   Type: "export"

#### Submodule: Quotations & Proposals (12 permissions)
├─ sales.quotations.view
│  Label: "View Quotations"
│  Description: "See quotations list"
│  Type: "view"
│
├─ sales.quotations.viewOwn
│  Label: "View Own Quotations"
│  Description: "See only self-created quotations"
│  Type: "view"
│  Scope: "own"
│
├─ sales.quotations.viewTeam
│  Label: "View Team Quotations"
│  Description: "See team quotations"
│  Type: "view"
│  Scope: "team"
│
├─ sales.quotations.viewAll
│  Label: "View All Quotations"
│  Description: "See all company quotations"
│  Type: "view"
│  Scope: "all"
│
├─ sales.quotations.create
│  Label: "Create Quotations"
│  Description: "Generate new quotations for customers"
│  Type: "create"
│
├─ sales.quotations.edit
│  Label: "Edit Quotations"
│  Description: "Modify quotation details"
│  Type: "edit"
│
├─ sales.quotations.editOwn
│  Label: "Edit Own Quotations"
│  Description: "Modify only own quotations"
│  Type: "edit"
│  Scope: "own"
│
├─ sales.quotations.delete
│  Label: "Delete Quotations"
│  Description: "Remove quotations from system"
│  Type: "delete"
│
├─ sales.quotations.approve
│  Label: "Approve Quotations"
│  Description: "Approve quotations before sending to customer"
│  Type: "approve"
│
├─ sales.quotations.send
│  Label: "Send Quotations"
│  Description: "Email quotations to customers"
│  Type: "send"
│
├─ sales.quotations.export
│  Label: "Export Quotations"
│  Description: "Download quotations as PDF/Excel"
│  Type: "export"
│
└─ sales.quotations.viewPricing
   Label: "View Pricing Details"
   Description: "See cost and margin information"
   Type: "view"

#### Submodule: Sales Invoices (10 permissions)
├─ sales.invoices.view
│  Label: "View Invoices"
│  Description: "See invoices list"
│  Type: "view"
│
├─ sales.invoices.viewOwn
│  Label: "View Own Invoices"
│  Description: "See only self-created invoices"
│  Type: "view"
│  Scope: "own"
│
├─ sales.invoices.viewAll
│  Label: "View All Invoices"
│  Description: "See all company invoices"
│  Type: "view"
│  Scope: "all"
│
├─ sales.invoices.create
│  Label: "Create Invoices"
│  Description: "Generate new customer invoices"
│  Type: "create"
│
├─ sales.invoices.edit
│  Label: "Edit Invoices"
│  Description: "Modify invoice details"
│  Type: "edit"
│
├─ sales.invoices.delete
│  Label: "Delete Invoices"
│  Description: "Remove invoices from system"
│  Type: "delete"
│
├─ sales.invoices.approve
│  Label: "Approve Invoices"
│  Description: "Approve invoices before sending"
│  Type: "approve"
│
├─ sales.invoices.send
│  Label: "Send Invoices"
│  Description: "Email invoices to customers"
│  Type: "send"
│
├─ sales.invoices.export
│  Label: "Export Invoices"
│  Description: "Download invoices as PDF/Excel"
│  Type: "export"
│
└─ sales.invoices.viewPaymentStatus
   Label: "View Payment Status"
   Description: "See invoice payment tracking"
   Type: "view"

---

### Inventory Management Module (41 permissions)

#### Submodule: Product Catalog (12 permissions)
├─ inventory.products.view
│  Label: "View Products"
│  Description: "See products list (basic view)"
│  Type: "view"
│
├─ inventory.products.viewAll
│  Label: "View All Products"
│  Description: "See complete product catalog"
│  Type: "view"
│  Scope: "all"
│
├─ inventory.products.create
│  Label: "Create Products"
│  Description: "Add new products to catalog"
│  Type: "create"
│
├─ inventory.products.edit
│  Label: "Edit Products"
│  Description: "Modify product details"
│  Type: "edit"
│
├─ inventory.products.delete
│  Label: "Delete Products"
│  Description: "Remove products from catalog"
│  Type: "delete"
│
├─ inventory.products.viewCost
│  Label: "View Cost Price"
│  Description: "See product cost and purchase price"
│  Type: "view"
│
├─ inventory.products.editCost
│  Label: "Edit Cost Price"
│  Description: "Modify product cost price"
│  Type: "edit"
│
├─ inventory.products.viewStock
│  Label: "View Stock Levels"
│  Description: "See current stock quantities"
│  Type: "view"
│
├─ inventory.products.manageVariants
│  Label: "Manage Variants"
│  Description: "Add/edit product variants (size, color, etc.)"
│  Type: "edit"
│
├─ inventory.products.managePricing
│  Label: "Manage Pricing"
│  Description: "Set and update product selling prices"
│  Type: "edit"
│
├─ inventory.products.export
│  Label: "Export Products"
│  Description: "Download product catalog as Excel/CSV"
│  Type: "export"
│
└─ inventory.products.import
   Label: "Import Products"
   Description: "Bulk upload products from Excel/CSV"
   Type: "import"

#### Submodule: Stock Management (11 permissions)
├─ inventory.stock.view
│  Label: "View Stock"
│  Description: "See stock levels (basic view)"
│  Type: "view"
│
├─ inventory.stock.viewAll
│  Label: "View All Stock"
│  Description: "See complete stock across all warehouses"
│  Type: "view"
│  Scope: "all"
│
├─ inventory.stock.addStock
│  Label: "Add Stock"
│  Description: "Increase stock quantities (stock in)"
│  Type: "create"
│
├─ inventory.stock.removeStock
│  Label: "Remove Stock"
│  Description: "Decrease stock quantities (stock out)"
│  Type: "delete"
│
├─ inventory.stock.transferStock
│  Label: "Transfer Stock"
│  Description: "Move stock between warehouses/stores"
│  Type: "edit"
│
├─ inventory.stock.adjustStock
│  Label: "Adjust Stock"
│  Description: "Make stock adjustments (damage, loss, etc.)"
│  Type: "edit"
│
├─ inventory.stock.viewStockValue
│  Label: "View Stock Value"
│  Description: "See total inventory value in rupees"
│  Type: "view"
│
├─ inventory.stock.viewLowStock
│  Label: "View Low Stock Alerts"
│  Description: "See products below minimum stock level"
│  Type: "view"
│
├─ inventory.stock.manageWarehouses
│  Label: "Manage Warehouses"
│  Description: "Add/edit warehouse locations"
│  Type: "edit"
│
├─ inventory.stock.viewStockHistory
│  Label: "View Stock History"
│  Description: "See complete stock movement history"
│  Type: "view"
│
└─ inventory.stock.export
   Label: "Export Stock Data"
   Description: "Download stock reports as Excel"
   Type: "export"

#### Submodule: Product Categories (5 permissions)
├─ inventory.categories.view
│  Label: "View Categories"
│  Description: "See product category tree"
│  Type: "view"
│
├─ inventory.categories.create
│  Label: "Create Categories"
│  Description: "Add new product categories"
│  Type: "create"
│
├─ inventory.categories.edit
│  Label: "Edit Categories"
│  Description: "Modify category names and hierarchy"
│  Type: "edit"
│
├─ inventory.categories.delete
│  Label: "Delete Categories"
│  Description: "Remove categories from system"
│  Type: "delete"
│
└─ inventory.categories.manageHierarchy
   Label: "Manage Category Tree"
   Description: "Organize parent-child category structure"
   Type: "edit"

#### Submodule: Stock Alerts & Notifications (4 permissions)
├─ inventory.alerts.view
│  Label: "View Alerts"
│  Description: "See low stock alerts"
│  Type: "view"
│
├─ inventory.alerts.configure
│  Label: "Configure Alerts"
│  Description: "Set minimum stock levels for products"
│  Type: "edit"
│
├─ inventory.alerts.receiveNotifications
│  Label: "Receive Notifications"
│  Description: "Get email/SMS for low stock alerts"
│  Type: "view"
│
└─ inventory.alerts.manageReorderPoints
   Label: "Manage Reorder Points"
   Description: "Set automatic reorder quantities"
   Type: "edit"

#### Submodule: Pricing & Discounts (5 permissions)
├─ inventory.pricing.view
│  Label: "View Pricing"
│  Description: "See product prices"
│  Type: "view"
│
├─ inventory.pricing.edit
│  Label: "Edit Pricing"
│  Description: "Modify product selling prices"
│  Type: "edit"
│
├─ inventory.pricing.viewMargins
│  Label: "View Profit Margins"
│  Description: "See profit margin percentages"
│  Type: "view"
│
├─ inventory.pricing.createDiscounts
│  Label: "Create Discounts"
│  Description: "Set up discount rules and promotions"
│  Type: "create"
│
└─ inventory.pricing.approveDiscounts
   Label: "Approve Discounts"
   Description: "Approve discount requests"
   Type: "approve"

#### Submodule: Barcode & SKU (4 permissions)
├─ inventory.barcodes.view
│  Label: "View Barcodes"
│  Description: "See product barcodes/SKUs"
│  Type: "view"
│
├─ inventory.barcodes.generate
│  Label: "Generate Barcodes"
│  Description: "Create new barcodes for products"
│  Type: "create"
│
├─ inventory.barcodes.print
│  Label: "Print Barcode Labels"
│  Description: "Print barcode stickers"
│  Type: "export"
│
└─ inventory.barcodes.scan
   Label: "Scan Barcodes"
   Description: "Use barcode scanner for stock operations"
   Type: "view"

---

### Store & Point of Sale Module (33 permissions)

#### Submodule: Store Bills (11 permissions)
├─ store.bills.view
│  Label: "View Bills"
│  Description: "See store bills list"
│  Type: "view"
│
├─ store.bills.viewOwn
│  Label: "View Own Bills"
│  Description: "See only self-created bills"
│  Type: "view"
│  Scope: "own"
│
├─ store.bills.viewAll
│  Label: "View All Bills"
│  Description: "See all store bills"
│  Type: "view"
│  Scope: "all"
│
├─ store.bills.create
│  Label: "Create Bills"
│  Description: "Generate new customer bills"
│  Type: "create"
│
├─ store.bills.edit
│  Label: "Edit Bills"
│  Description: "Modify bill details"
│  Type: "edit"
│
├─ store.bills.editOwn
│  Label: "Edit Own Bills"
│  Description: "Modify only own bills"
│  Type: "edit"
│  Scope: "own"
│
├─ store.bills.delete
│  Label: "Delete Bills"
│  Description: "Cancel/delete bills"
│  Type: "delete"
│
├─ store.bills.viewPayments
│  Label: "View Payment Details"
│  Description: "See payment method and status"
│  Type: "view"
│
├─ store.bills.processPayment
│  Label: "Process Payments"
│  Description: "Record cash/card payments"
│  Type: "edit"
│
├─ store.bills.processRefund
│  Label: "Process Refunds"
│  Description: "Handle customer refunds"
│  Type: "edit"
│
└─ store.bills.export
   Label: "Export Bills"
   Description: "Download bills data as Excel"
   Type: "export"

#### Submodule: Store Invoices (8 permissions)
├─ store.invoices.view
│  Label: "View Invoices"
│  Description: "See store invoices"
│  Type: "view"
│
├─ store.invoices.viewPastBills
│  Label: "View Past Bills"
│  Description: "Access historical billing data"
│  Type: "view"
│
├─ store.invoices.viewAll
│  Label: "View All Invoices"
│  Description: "See all store invoices"
│  Type: "view"
│  Scope: "all"
│
├─ store.invoices.create
│  Label: "Create Invoices"
│  Description: "Generate tax invoices"
│  Type: "create"
│
├─ store.invoices.edit
│  Label: "Edit Invoices"
│  Description: "Modify invoice details"
│  Type: "edit"
│
├─ store.invoices.delete
│  Label: "Delete Invoices"
│  Description: "Cancel invoices"
│  Type: "delete"
│
├─ store.invoices.sendEmail
│  Label: "Email Invoices"
│  Description: "Send invoices to customers via email"
│  Type: "send"
│
└─ store.invoices.export
   Label: "Export Invoices"
   Description: "Download invoices as PDF/Excel"
   Type: "export"

#### Submodule: Point of Sale (POS) (8 permissions)
├─ store.pos.access
│  Label: "Access POS"
│  Description: "Open POS billing screen"
│  Type: "view"
│
├─ store.pos.viewSales
│  Label: "View Sales"
│  Description: "See sales transactions"
│  Type: "view"
│
├─ store.pos.processSale
│  Label: "Process Sales"
│  Description: "Create new sale transactions"
│  Type: "create"
│
├─ store.pos.processReturn
│  Label: "Process Returns"
│  Description: "Handle product returns"
│  Type: "create"
│
├─ store.pos.applyDiscount
│  Label: "Apply Discounts"
│  Description: "Give discounts during billing"
│  Type: "edit"
│
├─ store.pos.viewDailySummary
│  Label: "View Daily Summary"
│  Description: "See end-of-day sales report"
│  Type: "view"
│
├─ store.pos.openCashDrawer
│  Label: "Open Cash Drawer"
│  Description: "Access cash drawer outside of sale"
│  Type: "edit"
│
└─ store.pos.voidTransaction
   Label: "Void Transaction"
   Description: "Cancel a completed transaction"
   Type: "delete"

#### Submodule: Store Customers (6 permissions)
├─ store.customers.view
│  Label: "View Customers"
│  Description: "See customer list"
│  Type: "view"
│
├─ store.customers.create
│  Label: "Create Customers"
│  Description: "Add new customers"
│  Type: "create"
│
├─ store.customers.edit
│  Label: "Edit Customers"
│  Description: "Modify customer details"
│  Type: "edit"
│
├─ store.customers.delete
│  Label: "Delete Customers"
│  Description: "Remove customers"
│  Type: "delete"
│
├─ store.customers.viewPurchaseHistory
│  Label: "View Purchase History"
│  Description: "See customer purchase records"
│  Type: "view"
│
└─ store.customers.manageLoyalty
   Label: "Manage Loyalty Points"
   Description: "Add/redeem loyalty points"
   Type: "edit"

---

### Supply Chain & Procurement Module (33 permissions)

#### Submodule: Vendor Management (9 permissions)
├─ procurement.vendors.view
│  Label: "View Vendors"
│  Description: "See vendor list"
│  Type: "view"
│
├─ procurement.vendors.viewAll
│  Label: "View All Vendors"
│  Description: "See complete vendor database"
│  Type: "view"
│  Scope: "all"
│
├─ procurement.vendors.create
│  Label: "Create Vendors"
│  Description: "Add new vendors to system"
│  Type: "create"
│
├─ procurement.vendors.edit
│  Label: "Edit Vendors"
│  Description: "Modify vendor details and contacts"
│  Type: "edit"
│
├─ procurement.vendors.delete
│  Label: "Delete Vendors"
│  Description: "Remove vendors from system"
│  Type: "delete"
│
├─ procurement.vendors.viewPayments
│  Label: "View Payment History"
│  Description: "See vendor payment records"
│  Type: "view"
│
├─ procurement.vendors.viewPerformance
│  Label: "View Performance"
│  Description: "See vendor performance ratings"
│  Type: "view"
│
├─ procurement.vendors.manageContracts
│  Label: "Manage Contracts"
│  Description: "Handle vendor contracts and agreements"
│  Type: "edit"
│
└─ procurement.vendors.export
   Label: "Export Vendors"
   Description: "Download vendor data as Excel"
   Type: "export"

#### Submodule: Purchase Orders (10 permissions)
├─ procurement.po.view
│  Label: "View Purchase Orders"
│  Description: "See PO list"
│  Type: "view"
│
├─ procurement.po.viewAll
│  Label: "View All POs"
│  Description: "See all company purchase orders"
│  Type: "view"
│  Scope: "all"
│
├─ procurement.po.create
│  Label: "Create Purchase Orders"
│  Description: "Generate new POs for vendors"
│  Type: "create"
│
├─ procurement.po.edit
│  Label: "Edit Purchase Orders"
│  Description: "Modify PO details"
│  Type: "edit"
│
├─ procurement.po.delete
│  Label: "Delete Purchase Orders"
│  Description: "Cancel purchase orders"
│  Type: "delete"
│
├─ procurement.po.approve
│  Label: "Approve Purchase Orders"
│  Description: "Approve POs before sending"
│  Type: "approve"
│
├─ procurement.po.send
│  Label: "Send to Vendor"
│  Description: "Email POs to vendors"
│  Type: "send"
│
├─ procurement.po.receiveGoods
│  Label: "Receive Goods"
│  Description: "Mark goods as received (GRN)"
│  Type: "edit"
│
├─ procurement.po.viewPricing
│  Label: "View Purchase Pricing"
│  Description: "See purchase prices and totals"
│  Type: "view"
│
└─ procurement.po.export
   Label: "Export POs"
   Description: "Download PO data as Excel/PDF"
   Type: "export"

#### Submodule: Vendor Bills & Payments (9 permissions)
├─ procurement.bills.view
│  Label: "View Vendor Bills"
│  Description: "See vendor bills list"
│  Type: "view"
│
├─ procurement.bills.viewAll
│  Label: "View All Bills"
│  Description: "See all vendor bills"
│  Type: "view"
│  Scope: "all"
│
├─ procurement.bills.create
│  Label: "Create Bills"
│  Description: "Record vendor bills in system"
│  Type: "create"
│
├─ procurement.bills.edit
│  Label: "Edit Bills"
│  Description: "Modify vendor bill details"
│  Type: "edit"
│
├─ procurement.bills.delete
│  Label: "Delete Bills"
│  Description: "Remove vendor bills"
│  Type: "delete"
│
├─ procurement.bills.approve
│  Label: "Approve Bills"
│  Description: "Approve bills for payment"
│  Type: "approve"
│
├─ procurement.bills.processPayment
│  Label: "Process Payments"
│  Description: "Make payments to vendors"
│  Type: "edit"
│
├─ procurement.bills.viewPaymentStatus
│  Label: "View Payment Status"
│  Description: "Track payment status (paid/pending)"
│  Type: "view"
│
└─ procurement.bills.export
   Label: "Export Bills"
   Description: "Download vendor bills data"
   Type: "export"

#### Submodule: Goods Receipt Notes (5 permissions)
├─ procurement.grn.view
│  Label: "View GRNs"
│  Description: "See goods receipt records"
│  Type: "view"
│
├─ procurement.grn.create
│  Label: "Create GRN"
│  Description: "Record received goods"
│  Type: "create"
│
├─ procurement.grn.edit
│  Label: "Edit GRN"
│  Description: "Modify GRN details"
│  Type: "edit"
│
├─ procurement.grn.approve
│  Label: "Approve GRN"
│  Description: "Approve quality check and acceptance"
│  Type: "approve"
│
└─ procurement.grn.reject
   Label: "Reject Goods"
   Description: "Reject damaged/incorrect goods"
   Type: "delete"

---

### Human Resource Management Module (49 permissions)

#### Submodule: Employee Management (11 permissions)
├─ hrms.employees.view
│  Label: "View Employees"
│  Description: "See employee list"
│  Type: "view"
│
├─ hrms.employees.viewAll
│  Label: "View All Employees"
│  Description: "See complete employee database"
│  Type: "view"
│  Scope: "all"
│
├─ hrms.employees.viewOwn
│  Label: "View Own Profile"
│  Description: "See only own employee details"
│  Type: "view"
│  Scope: "own"
│
├─ hrms.employees.create
│  Label: "Create Employees"
│  Description: "Add new employees to system"
│  Type: "create"
│
├─ hrms.employees.edit
│  Label: "Edit Employees"
│  Description: "Modify employee details"
│  Type: "edit"
│
├─ hrms.employees.delete
│  Label: "Delete Employees"
│  Description: "Remove employees from system"
│  Type: "delete"
│
├─ hrms.employees.viewSalary
│  Label: "View Salary"
│  Description: "See employee salary information"
│  Type: "view"
│
├─ hrms.employees.editSalary
│  Label: "Edit Salary"
│  Description: "Modify employee salary"
│  Type: "edit"
│
├─ hrms.employees.viewDocuments
│  Label: "View Documents"
│  Description: "Access employee documents (Aadhaar, PAN, etc.)"
│  Type: "view"
│
├─ hrms.employees.manageDocuments
│  Label: "Manage Documents"
│  Description: "Upload/delete employee documents"
│  Type: "edit"
│
└─ hrms.employees.export
   Label: "Export Employees"
   Description: "Download employee data as Excel"
   Type: "export"

#### Submodule: Payroll Processing (7 permissions)
├─ hrms.payroll.view
│  Label: "View Payroll"
│  Description: "See payroll records"
│  Type: "view"
│
├─ hrms.payroll.viewAll
│  Label: "View All Payroll"
│  Description: "See complete payroll data"
│  Type: "view"
│  Scope: "all"
│
├─ hrms.payroll.process
│  Label: "Process Payroll"
│  Description: "Calculate monthly salaries"
│  Type: "edit"
│
├─ hrms.payroll.approve
│  Label: "Approve Payroll"
│  Description: "Approve salary payments"
│  Type: "approve"
│
├─ hrms.payroll.viewReports
│  Label: "View Payroll Reports"
│  Description: "Access salary reports and summaries"
│  Type: "view"
│
├─ hrms.payroll.generatePayslips
│  Label: "Generate Payslips"
│  Description: "Create employee salary slips"
│  Type: "create"
│
└─ hrms.payroll.export
   Label: "Export Payroll"
   Description: "Download payroll data as Excel"
   Type: "export"

#### Submodule: Attendance Tracking (9 permissions)
├─ hrms.attendance.view
│  Label: "View Attendance"
│  Description: "See attendance records"
│  Type: "view"
│
├─ hrms.attendance.viewAll
│  Label: "View All Attendance"
│  Description: "See all employee attendance"
│  Type: "view"
│  Scope: "all"
│
├─ hrms.attendance.viewOwn
│  Label: "View Own Attendance"
│  Description: "See only own attendance"
│  Type: "view"
│  Scope: "own"
│
├─ hrms.attendance.mark
│  Label: "Mark Attendance"
│  Description: "Record daily attendance"
│  Type: "create"
│
├─ hrms.attendance.edit
│  Label: "Edit Attendance"
│  Description: "Modify attendance records"
│  Type: "edit"
│
├─ hrms.attendance.approve
│  Label: "Approve Attendance"
│  Description: "Approve attendance regularization"
│  Type: "approve"
│
├─ hrms.attendance.viewReports
│  Label: "View Reports"
│  Description: "Access attendance reports"
│  Type: "view"
│
├─ hrms.attendance.manageShifts
│  Label: "Manage Shifts"
│  Description: "Create and assign work shifts"
│  Type: "edit"
│
└─ hrms.attendance.export
   Label: "Export Attendance"
   Description: "Download attendance as Excel"
   Type: "export"

#### Submodule: Final Settlement (7 permissions)
├─ hrms.settlement.view
│  Label: "View Settlements"
│  Description: "See settlement records"
│  Type: "view"
│
├─ hrms.settlement.viewAll
│  Label: "View All Settlements"
│  Description: "See all employee settlements"
│  Type: "view"
│  Scope: "all"
│
├─ hrms.settlement.create
│  Label: "Create Settlement"
│  Description: "Initiate final settlement process"
│  Type: "create"
│
├─ hrms.settlement.process
│  Label: "Process Settlement"
│  Description: "Calculate final settlement amount"
│  Type: "edit"
│
├─ hrms.settlement.approve
│  Label: "Approve Settlement"
│  Description: "Approve settlement payment"
│  Type: "approve"
│
├─ hrms.settlement.viewDocuments
│  Label: "View Settlement Docs"
│  Description: "Access exit documents (NOC, relieving letter)"
│  Type: "view"
│
└─ hrms.settlement.export
   Label: "Export Settlements"
   Description: "Download settlement data"
   Type: "export"

#### Submodule: Leave Management (9 permissions)
├─ hrms.leave.view
│  Label: "View Leaves"
│  Description: "See leave applications"
│  Type: "view"
│
├─ hrms.leave.viewAll
│  Label: "View All Leaves"
│  Description: "See all employee leave requests"
│  Type: "view"
│  Scope: "all"
│
├─ hrms.leave.viewOwn
│  Label: "View Own Leaves"
│  Description: "See only own leave history"
│  Type: "view"
│  Scope: "own"
│
├─ hrms.leave.apply
│  Label: "Apply Leave"
│  Description: "Submit leave applications"
│  Type: "create"
│
├─ hrms.leave.approve
│  Label: "Approve Leaves"
│  Description: "Approve/reject leave requests"
│  Type: "approve"
│
├─ hrms.leave.reject
│  Label: "Reject Leaves"
│  Description: "Reject leave applications"
│  Type: "delete"
│
├─ hrms.leave.viewBalance
│  Label: "View Leave Balance"
│  Description: "See available leave balance"
│  Type: "view"
│
├─ hrms.leave.managePolicy
│  Label: "Manage Leave Policy"
│  Description: "Configure leave types and policies"
│  Type: "edit"
│
└─ hrms.leave.cancelLeave
   Label: "Cancel Leave"
   Description: "Cancel approved leaves"
   Type: "delete"

#### Submodule: Recruitment & Hiring (6 permissions)
├─ hrms.recruitment.viewJobs
│  Label: "View Jobs"
│  Description: "See job postings"
│  Type: "view"
│
├─ hrms.recruitment.createJob
│  Label: "Create Job Posting"
│  Description: "Post new job openings"
│  Type: "create"
│
├─ hrms.recruitment.viewCandidates
│  Label: "View Candidates"
│  Description: "See candidate applications"
│  Type: "view"
│
├─ hrms.recruitment.scheduleInterview
│  Label: "Schedule Interview"
│  Description: "Set up candidate interviews"
│  Type: "create"
│
├─ hrms.recruitment.updateStatus
│  Label: "Update Candidate Status"
│  Description: "Move candidates through hiring stages"
│  Type: "edit"
│
└─ hrms.recruitment.makeOffer
   Label: "Make Offer"
   Description: "Send job offers to candidates"
   Type: "create"

---

### Vendor Portal Access Module (10 permissions)
├─ vendor.portal.viewAll
│  Label: "View All Vendors"
│  Description: "See complete vendor list"
│  Type: "view"
│  Scope: "all"
│
├─ vendor.portal.viewAssigned
│  Label: "View Assigned Vendors"
│  Description: "See only assigned vendors"
│  Type: "view"
│  Scope: "assigned"
│
├─ vendor.portal.create
│  Label: "Create Vendor Profile"
│  Description: "Add new vendors"
│  Type: "create"
│
├─ vendor.portal.edit
│  Label: "Edit Vendor"
│  Description: "Modify vendor information"
│  Type: "edit"
│
├─ vendor.portal.delete
│  Label: "Delete Vendor"
│  Description: "Remove vendor from system"
│  Type: "delete"
│
├─ vendor.portal.communicate
│  Label: "Communicate with Vendor"
│  Description: "Send messages/emails to vendors"
│  Type: "send"
│
├─ vendor.portal.viewPayments
│  Label: "View Payment History"
│  Description: "See vendor payment records"
│  Type: "view"
│
├─ vendor.portal.viewPerformance
│  Label: "View Performance Metrics"
│  Description: "Access vendor ratings and KPIs"
│  Type: "view"
│
├─ vendor.portal.grantPortalAccess
│  Label: "Grant Portal Access"
│  Description: "Give vendors login to vendor portal"
│  Type: "edit"
│
└─ vendor.portal.export
   Label: "Export Vendor Data"
   Description: "Download vendor information"
   Type: "export"

---

### User Management Module (8 permissions)
├─ admin.users.viewAll
│  Label: "View All Users"
│  Description: "See all system users"
│  Type: "view"
│  Scope: "all"
│
├─ admin.users.create
│  Label: "Create Users"
│  Description: "Add new users to system"
│  Type: "create"
│
├─ admin.users.edit
│  Label: "Edit Users"
│  Description: "Modify user details and information"
│  Type: "edit"
│
├─ admin.users.delete
│  Label: "Delete Users"
│  Description: "Remove users from system"
│  Type: "delete"
│
├─ admin.users.resetPassword
│  Label: "Reset Password"
│  Description: "Reset user passwords"
│  Type: "edit"
│
├─ admin.users.assignRoles
│  Label: "Assign Roles"
│  Description: "Assign/change user roles"
│  Type: "edit"
│
├─ admin.users.deactivate
│  Label: "Deactivate Users"
│  Description: "Temporarily disable user access"
│  Type: "edit"
│
└─ admin.users.viewAuditLog
   Label: "View Audit Log"
   Description: "See user activity history"
   Type: "view"

---

### System Settings Module (8 permissions)
├─ admin.settings.view
│  Label: "View Settings"
│  Description: "Access settings pages"
│  Type: "view"
│
├─ admin.settings.manageRoles
│  Label: "Manage Roles"
│  Description: "Create/edit/delete roles and permissions"
│  Type: "edit"
│
├─ admin.settings.manageUsers
│  Label: "Manage Users"
│  Description: "Full user management access"
│  Type: "edit"
│
├─ admin.settings.manageOrganization
│  Label: "Manage Organization"
│  Description: "Edit company details and settings"
│  Type: "edit"
│
├─ admin.settings.viewAuditLog
│  Label: "View Audit Log"
│  Description: "See system activity logs"
│  Type: "view"
│
├─ admin.settings.manageIntegrations
│  Label: "Manage Integrations"
│  Description: "Configure third-party integrations"
│  Type: "edit"
│
├─ admin.settings.manageBilling
│  Label: "Manage Billing"
│  Description: "Handle subscription and payment settings"
│  Type: "edit"
│
└─ admin.settings.manageNotifications
   Label: "Manage Notifications"
   Description: "Configure email/SMS notification settings"
   Type: "edit"

---

## PREDEFINED ROLES

### Role: Admin
Grants: All permissions (230/230)
Scope: Organization-wide
Description: Full system access, no restrictions

### Role: Sales President (Regional/National Head)
Grants:
- dashboard.* (all 4)
- sales.* (all 45) with viewAll scope
- inventory.* (all 41) with viewAll scope
- store.*.viewAll (8 view permissions)
- procurement.*.viewAll (10 view permissions)
- hrms.*.viewAll (20 view permissions)
- admin.users.viewAll (1)
- admin.settings.view (1)
Total: ~135 permissions

### Role: Sales Manager
Grants:
- dashboard.view, dashboard.viewAnalytics (2)
- sales.leads.* (all 12)
- sales.opportunities.* (all 11)
- sales.quotations.* (all 12) + approve
- sales.invoices.* (all 10)
- inventory.products.view, inventory.stock.view (2)
- hrms.employees.view (1)
- admin.users.viewAuditLog (1)
Total: ~52 permissions

### Role: Sales Executive
Grants:
- dashboard.view (1)
- sales.leads.viewOwn, sales.leads.create, sales.leads.edit, sales.leads.editOwn, sales.leads.viewTeam (5)
- sales.opportunities.viewOwn, sales.opportunities.create, sales.opportunities.edit, sales.opportunities.editOwn (4)
- sales.quotations.viewOwn, sales.quotations.create, sales.quotations.edit, sales.quotations.editOwn (4)
- sales.invoices.viewOwn, sales.invoices.view (2)
- inventory.products.view (1)
Total: ~17 permissions

### Role: Inventory Manager
Grants:
- dashboard.view (1)
- inventory.* (all 41)
- procurement.vendors.view, procurement.po.viewAll (2)
- admin.settings.view (1)
Total: ~45 permissions

### Role: Store Supervisor
Grants:
- dashboard.view (1)
- store.* (all 33)
- inventory.products.view, inventory.stock.view (2)
- hrms.attendance.mark, hrms.attendance.viewOwn (2)
- admin.users.viewAuditLog (1)
Total: ~39 permissions

### Role: HR Manager
Grants:
- dashboard.view (1)
- hrms.* (all 49)
- admin.users.* (all 8)
- admin.settings.manageOrganization (1)
Total: ~59 permissions

### Role: Procurement Officer
Grants:
- dashboard.view (1)
- procurement.* (all 33)
- inventory.products.view, inventory.stock.viewAll (2)
- admin.settings.view (1)
Total: ~37 permissions

### Role: Finance Approver
Grants:
- dashboard.view, dashboard.viewReports (2)
- sales.quotations.approve, sales.invoices.approve (2)
- procurement.bills.approve, procurement.po.approve (2)
- hrms.payroll.approve (1)
- store.bills.viewAll (1)
Total: ~8 permissions

### Role: Reporting Officer (Read-Only)
Grants:
- dashboard.* (all 4)
- sales.leads.viewAll, sales.opportunities.viewAll, sales.quotations.viewAll, sales.invoices.viewAll (4)
- inventory.products.viewAll, inventory.stock.viewAll (2)
- procurement.vendors.viewAll, procurement.po.viewAll (2)
- hrms.employees.viewAll (1)
- store.bills.viewAll (1)
Total: ~14 permissions

---

## PERMIFY API FORMAT (JSON)

For pushing via API:

```json
{
  "schema": "...",  // PSL content above
  "relationships": [
    {
      "entity": "user",
      "relation": "has_role",
      "target": "role",
      "attributes": ["tenant_id"]
    },
    {
      "entity": "user",
      "relation": "has_permission",
      "target": "permission",
      "via": "role",
      "attributes": ["tenant_id"]
    },
    {
      "entity": "user",
      "relation": "owns",
      "target": "resource",
      "attributes": ["resource_type", "tenant_id"]
    },
    {
      "entity": "role",
      "relation": "grants",
      "target": "permission",
      "attributes": ["tenant_id"]
    }
  ],
  "roles": [
    {
      "id": "admin",
      "name": "Admin",
      "permissions": [
        "dashboard.view",
        "dashboard.viewAnalytics",
        ...all 230 permissions...
      ],
      "tenant_scoped": true
    },
    {
      "id": "sales_manager",
      "name": "Sales Manager",
      "permissions": [
        ...52 permissions...
      ],
      "tenant_scoped": true
    }
    ...
  ]
}
```

---

## MIGRATION NOTES FOR PERMIFY SETUP

1. **Create the schema** in Permify via UI or API using PSL syntax above
2. **Define relationships** between user → role → permission → resource
3. **Create predefined roles** with permission grants (see Role section above)
4. **Enable tenant scoping** so each tenant has isolated roles + permissions
5. **Set up policy checks** in middleware to call:
   ```
   POST /v1/check
   {
     "tenant_id": "...",
     "user_id": "...",
     "resource": "lead",
     "resource_id": "...",
     "action": "edit"
   }
   ```
6. **Sync policies** whenever role or permission definitions change (add audit log)

---

## PERMIFY SCHEMA STATISTICS

- **Total Permissions:** 230
- **Total Modules:** 9
- **Total Submodules:** 24
- **Total Predefined Roles:** 9
- **Entities:** 8 (user, organization, tenant, role, permission, module, submodule, resource, department)
- **Relations:** 12+ (hierarchical role, permission inheritance, user to resource, etc.)
- **Permission Types:** 8 (view, create, edit, delete, approve, send, export, import, assign)
- **Scopes:** 4 (own, team, all, assigned)

---

**Version:** 1.0  
**Created:** October 26, 2025  
**For:** Permify Policy Engine Integration  
**Next Steps:**
1. Paste schema into Permify UI or sync via API
2. Test with sample user + resource check
3. Integrate middleware policy call (Sprint 1 Task 1.10)
4. Deploy to staging + UAT
