# 🚀 Complete API Reference - Arcus Platform

**Last Updated:** October 28, 2025  
**Platform:** Next.js 15.3.3 + Supabase  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Admin Management APIs](#admin-management-apis)
3. [Vendor Management APIs](#vendor-management-apis)
4. [Product Management APIs](#product-management-apis)
5. [Purchase Order APIs](#purchase-order-apis)
6. [Sales Order APIs](#sales-order-apis)
7. [Inventory Management APIs](#inventory-management-apis)
8. [Employee/HRMS APIs](#employeehrms-apis)
9. [AI/Genkit APIs](#aigenkit-apis)
10. [Health & Status APIs](#health--status-apis)
11. [Session Management APIs](#session-management-apis)

---

## 🔐 Authentication APIs

### 1. **Login (Supabase)**
- **Endpoint:** `POST /api/auth/login/route-supabase.ts`
- **Method:** `POST`
- **Description:** Authenticate user with email and password using Supabase
- **Request Body:**
  ```json
  {
    "email": "admin@arcus.local",
    "password": "Admin@123456"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid",
      "email": "admin@arcus.local",
      "access_token": "jwt-token",
      "session": {}
    }
  }
  ```
- **Status Codes:** 200, 400, 401, 500
- **Rate Limit:** Standard auth rate limit

### 2. **Login (Standard)**
- **Endpoint:** `POST /api/auth/login`
- **Method:** `POST`
- **Description:** Standard authentication endpoint
- **Request Body:** Same as above
- **Response:** JWT tokens with user info

### 3. **Sign Up**
- **Endpoint:** `POST /api/auth/signup`
- **Method:** `POST`
- **Description:** Register new user with Supabase Auth
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "organizationId": "org-uuid" (optional)
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2025-10-28T..."
    },
    "message": "User created successfully. Please check your email to confirm."
  }
  ```
- **Status Codes:** 201, 400, 409

### 4. **Logout**
- **Endpoint:** `POST /api/auth/logout`
- **Method:** `POST`
- **Description:** Logout user and clear session
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

### 5. **Get Current User**
- **Endpoint:** `GET /api/auth/me`
- **Method:** `GET`
- **Description:** Get authenticated user profile
- **Response (200):**
  ```json
  {
    "id": "uuid",
    "email": "admin@arcus.local",
    "firstName": "Admin",
    "lastName": "User",
    "organizationId": "org-uuid",
    "roles": [],
    "permissions": {}
  }
  ```
- **Status Codes:** 200, 401, 500

### 6. **Check Permission**
- **Endpoint:** `POST /api/auth/check-permission`
- **Method:** `POST`
- **Description:** Verify if user has specific permission
- **Request Body:**
  ```json
  {
    "module": "users",
    "action": "create"
  }
  ```
- **Response (200):**
  ```json
  {
    "hasPermission": true,
    "module": "users",
    "action": "create"
  }
  ```

### 7. **Get All Permissions**
- **Endpoint:** `GET /api/auth/permissions`
- **Method:** `GET`
- **Description:** Get all permissions for current user
- **Response (200):**
  ```json
  {
    "dashboard": { "create": true, "read": true, "update": true, "delete": true, "manage": true },
    "users": { "create": true, "read": true, "update": true, "delete": true, "manage": true },
    ...
  }
  ```

### 8. **Validate Token**
- **Endpoint:** `GET /api/auth/validate`
- **Method:** `GET`
- **Description:** Validate JWT token validity
- **Query Parameters:**
  - `token` (string, optional): Token to validate
- **Response (200):**
  ```json
  {
    "valid": true,
    "expires": "2025-10-28T..."
  }
  ```
- **Status Codes:** 200, 401, 500

### 9. **Create Session**
- **Endpoint:** `POST /api/auth/createSession`
- **Method:** `POST`
- **Description:** Create new user session
- **Request Body:**
  ```json
  {
    "userId": "uuid",
    "organizationId": "org-uuid"
  }
  ```
- **Response (200):** Session created

### 10. **Destroy Session**
- **Endpoint:** `POST /api/auth/destroySession`
- **Method:** `POST`
- **Description:** Destroy user session
- **Response (200):** Session destroyed

---

## 👥 Admin Management APIs

### 1. **List All Roles**
- **Endpoint:** `GET /api/admin/roles`
- **Method:** `GET`
- **Description:** Get all system roles with permissions
- **Response (200):**
  ```json
  [
    {
      "id": "role-uuid",
      "name": "role-admin-arcus",
      "description": "System Administrator",
      "permissions": {...},
      "isSystemRole": true,
      "createdAt": "2025-10-28T..."
    }
  ]
  ```
- **Permissions Required:** `admin.read`

### 2. **Create Role**
- **Endpoint:** `POST /api/admin/roles`
- **Method:** `POST`
- **Description:** Create new system role with custom permissions
- **Request Body:**
  ```json
  {
    "name": "role-manager",
    "description": "Department Manager",
    "permissions": {
      "vendors": { "create": true, "read": true, "update": true },
      "products": { "read": true }
    },
    "isSystemRole": false
  }
  ```
- **Response (201):**
  ```json
  {
    "id": "role-uuid",
    "name": "role-manager",
    "permissions": {...},
    "message": "Role created successfully"
  }
  ```
- **Permissions Required:** `admin.create`

### 3. **Get Specific Role**
- **Endpoint:** `GET /api/admin/roles/[roleId]`
- **Method:** `GET`
- **Description:** Get details of specific role including all permissions
- **Response (200):**
  ```json
  {
    "id": "role-uuid",
    "name": "role-admin-arcus",
    "description": "System Administrator",
    "permissions": {...},
    "userCount": 1,
    "createdAt": "2025-10-28T..."
  }
  ```

### 4. **Update Role**
- **Endpoint:** `PUT /api/admin/roles/[roleId]`
- **Method:** `PUT`
- **Description:** Update role name, description, and permissions
- **Request Body:**
  ```json
  {
    "name": "role-manager-updated",
    "description": "Updated Manager Role",
    "permissions": {
      "vendors": { "create": true, "read": true },
      "products": { "read": true, "create": true }
    }
  }
  ```
- **Response (200):** Role updated successfully
- **Permissions Required:** `admin.update`

### 5. **Delete Role**
- **Endpoint:** `DELETE /api/admin/roles/[roleId]`
- **Method:** `DELETE`
- **Description:** Delete system role (cannot delete if users assigned)
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Role deleted successfully"
  }
  ```
- **Status Codes:** 200, 409 (if users assigned), 500
- **Permissions Required:** `admin.delete`

### 6. **Create Role (Alternative)**
- **Endpoint:** `POST /api/admin/create-role`
- **Method:** `POST`
- **Description:** Alternative endpoint to create custom role
- **Request Body:** Same as Create Role above

### 7. **Set Claims**
- **Endpoint:** `POST /api/admin/set-claims`
- **Method:** `POST`
- **Description:** Set custom claims for user (for permission management)
- **Request Body:**
  ```json
  {
    "userId": "uuid",
    "claims": {
      "roleId": "role-uuid",
      "permissions": {...}
    }
  }
  ```
- **Response (200):** Claims set successfully

### 8. **List Active Sessions**
- **Endpoint:** `GET /api/admin/sessions`
- **Method:** `GET`
- **Description:** Get all active user sessions
- **Response (200):**
  ```json
  [
    {
      "sessionId": "session-uuid",
      "userId": "user-uuid",
      "email": "user@example.com",
      "createdAt": "2025-10-28T...",
      "lastActive": "2025-10-28T...",
      "ipAddress": "192.168.1.1"
    }
  ]
  ```

### 9. **Terminate Session**
- **Endpoint:** `DELETE /api/admin/sessions`
- **Method:** `DELETE`
- **Description:** Terminate specific user session
- **Query Parameters:**
  - `sessionId` (string): Session to terminate
- **Response (200):** Session terminated

---

## 🏢 Vendor Management APIs

### 1. **List All Vendors**
- **Endpoint:** `GET /api/vendors`
- **Method:** `GET`
- **Description:** Get paginated list of all vendors
- **Query Parameters:**
  - `page` (number, default: 1): Page number
  - `limit` (number, default: 20): Items per page
  - `search` (string): Search vendor name/code
  - `status` (string): Filter by status (Active, Inactive, Suspended)
  - `category` (string): Filter by category
- **Response (200):**
  ```json
  {
    "vendors": [
      {
        "id": "vendor-uuid",
        "name": "Global Suppliers Inc",
        "code": "SUPP-001",
        "email": "contact@globalsuppliers.com",
        "phone": "+1-555-0123",
        "category": "Electronics",
        "status": "Active",
        "rating": 4.5,
        "totalPurchases": 250000,
        "createdAt": "2025-10-28T..."
      }
    ],
    "total": 45,
    "page": 1,
    "pages": 3
  }
  ```

### 2. **Create Vendor**
- **Endpoint:** `POST /api/vendors`
- **Method:** `POST`
- **Description:** Add new vendor to system
- **Request Body:**
  ```json
  {
    "name": "New Supplier Ltd",
    "code": "SUPP-046",
    "email": "contact@newsupplier.com",
    "phone": "+1-555-9999",
    "category": "Raw Materials",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "gst": "22AABCT1234H1Z0",
    "bankAccount": "1234567890",
    "bankName": "Global Bank"
  }
  ```
- **Response (201):**
  ```json
  {
    "id": "vendor-uuid",
    "name": "New Supplier Ltd",
    "code": "SUPP-046",
    "message": "Vendor created successfully"
  }
  ```
- **Permissions Required:** `vendor.create`

### 3. **Get Vendor Details**
- **Endpoint:** `GET /api/vendors/[id]`
- **Method:** `GET`
- **Description:** Get complete vendor profile and history
- **Response (200):**
  ```json
  {
    "id": "vendor-uuid",
    "name": "Global Suppliers Inc",
    "code": "SUPP-001",
    "email": "contact@globalsuppliers.com",
    "phone": "+1-555-0123",
    "category": "Electronics",
    "status": "Active",
    "rating": 4.5,
    "address": {...},
    "bankDetails": {...},
    "documents": [],
    "totalPurchases": 250000,
    "totalOrders": 125,
    "averageDeliveryTime": 5,
    "qualityScore": 95,
    "createdAt": "2025-10-28T..."
  }
  ```

### 4. **Update Vendor**
- **Endpoint:** `PUT /api/vendors/[id]`
- **Method:** `PUT`
- **Description:** Update vendor information
- **Request Body:** Same fields as Create Vendor
- **Response (200):** Vendor updated successfully
- **Permissions Required:** `vendor.update`

### 5. **Delete Vendor**
- **Endpoint:** `DELETE /api/vendors/[id]`
- **Method:** `DELETE`
- **Description:** Archive/delete vendor
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Vendor deleted successfully"
  }
  ```
- **Permissions Required:** `vendor.delete`

---

## 📦 Product Management APIs

### 1. **List All Products**
- **Endpoint:** `GET /api/products`
- **Method:** `GET`
- **Description:** Get paginated product catalog
- **Query Parameters:**
  - `page` (number, default: 1): Page number
  - `limit` (number, default: 20): Items per page
  - `search` (string): Search product name/SKU
  - `category` (string): Filter by category
  - `status` (string): Filter by status (Active, Discontinued, Archived)
- **Response (200):**
  ```json
  {
    "products": [
      {
        "id": "product-uuid",
        "name": "Industrial Motor",
        "sku": "MOTOR-001",
        "category": "Machinery",
        "price": 5000,
        "unit": "piece",
        "stock": 45,
        "status": "Active",
        "supplier": "Global Suppliers Inc",
        "createdAt": "2025-10-28T..."
      }
    ],
    "total": 234,
    "page": 1,
    "pages": 12
  }
  ```

### 2. **Create Product**
- **Endpoint:** `POST /api/products`
- **Method:** `POST`
- **Description:** Add new product to catalog
- **Request Body:**
  ```json
  {
    "name": "Industrial Motor",
    "sku": "MOTOR-001",
    "category": "Machinery",
    "description": "High-efficiency industrial motor",
    "price": 5000,
    "currency": "USD",
    "unit": "piece",
    "hsn": "8501",
    "gst": 18,
    "vendorId": "vendor-uuid",
    "image": "https://..."
  }
  ```
- **Response (201):**
  ```json
  {
    "id": "product-uuid",
    "sku": "MOTOR-001",
    "message": "Product created successfully"
  }
  ```
- **Permissions Required:** `store.create`

### 3. **Get Product Details**
- **Endpoint:** `GET /api/products/[id]`
- **Method:** `GET`
- **Description:** Get complete product information
- **Response (200):**
  ```json
  {
    "id": "product-uuid",
    "name": "Industrial Motor",
    "sku": "MOTOR-001",
    "category": "Machinery",
    "price": 5000,
    "stock": 45,
    "history": [...],
    "reviews": [...],
    "createdAt": "2025-10-28T..."
  }
  ```

### 4. **Update Product**
- **Endpoint:** `PUT /api/products/[id]`
- **Method:** `PUT`
- **Description:** Update product details
- **Request Body:** Same fields as Create Product
- **Response (200):** Product updated successfully
- **Permissions Required:** `store.update`

### 5. **Delete Product**
- **Endpoint:** `DELETE /api/products/[id]`
- **Method:** `DELETE`
- **Description:** Archive/delete product
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Product deleted successfully"
  }
  ```
- **Permissions Required:** `store.delete`

---

## 🛒 Purchase Order APIs

### 1. **List Purchase Orders**
- **Endpoint:** `GET /api/purchase-orders`
- **Method:** `GET`
- **Description:** Get all purchase orders with filters
- **Query Parameters:**
  - `page` (number): Page number
  - `status` (string): Filter by status (Draft, Submitted, Approved, Received, Closed)
  - `vendorId` (string): Filter by vendor
  - `fromDate` (date): Filter from date
  - `toDate` (date): Filter to date
- **Response (200):**
  ```json
  {
    "orders": [
      {
        "id": "po-uuid",
        "poNumber": "PO-2025-001",
        "vendorId": "vendor-uuid",
        "vendorName": "Global Suppliers Inc",
        "totalAmount": 50000,
        "status": "Approved",
        "createdDate": "2025-10-28T...",
        "expectedDelivery": "2025-11-15T..."
      }
    ],
    "total": 150
  }
  ```

### 2. **Create Purchase Order**
- **Endpoint:** `POST /api/purchase-orders`
- **Method:** `POST`
- **Description:** Create new purchase order
- **Request Body:**
  ```json
  {
    "vendorId": "vendor-uuid",
    "items": [
      {
        "productId": "product-uuid",
        "quantity": 100,
        "unitPrice": 500,
        "gstPercent": 18
      }
    ],
    "deliveryDate": "2025-11-15",
    "paymentTerms": "Net 30",
    "notes": "Urgent delivery required"
  }
  ```
- **Response (201):**
  ```json
  {
    "id": "po-uuid",
    "poNumber": "PO-2025-001",
    "message": "PO created successfully"
  }
  ```
- **Permissions Required:** `sales.create`

### 3. **Get PO Details**
- **Endpoint:** `GET /api/purchase-orders/[poId]`
- **Method:** `GET`
- **Description:** Get complete PO with all items and history

### 4. **Update PO Status**
- **Endpoint:** `PUT /api/purchase-orders/[poId]/status`
- **Method:** `PUT`
- **Description:** Update PO status or items
- **Request Body:**
  ```json
  {
    "status": "Approved"
  }
  ```
- **Permissions Required:** `sales.update`

### 5. **Approve Purchase Order**
- **Endpoint:** `POST /api/purchase-orders/[poId]/approve`
- **Method:** `POST`
- **Description:** Approve pending PO
- **Response (200):** PO approved

### 6. **Receive Purchase Order**
- **Endpoint:** `POST /api/purchase-orders/[poId]/receive`
- **Method:** `POST`
- **Description:** Mark PO as received
- **Request Body:**
  ```json
  {
    "receivedItems": [
      {
        "productId": "product-uuid",
        "quantity": 95
      }
    ]
  }
  ```
- **Response (200):** PO marked as received

---

## 📊 Sales Order APIs

### 1. **List Sales Orders**
- **Endpoint:** `GET /api/sales-orders`
- **Method:** `GET`
- **Description:** Get all sales orders
- **Query Parameters:**
  - `page` (number): Page number
  - `status` (string): Filter by status
  - `customerId` (string): Filter by customer
- **Response (200):**
  ```json
  {
    "orders": [
      {
        "id": "so-uuid",
        "soNumber": "SO-2025-001",
        "customerId": "customer-uuid",
        "totalAmount": 75000,
        "status": "Confirmed"
      }
    ]
  }
  ```

### 2. **Create Sales Order**
- **Endpoint:** `POST /api/sales-orders`
- **Method:** `POST`
- **Description:** Create new sales order
- **Request Body:**
  ```json
  {
    "customerId": "customer-uuid",
    "items": [
      {
        "productId": "product-uuid",
        "quantity": 50,
        "unitPrice": 1500
      }
    ],
    "deliveryDate": "2025-11-20"
  }
  ```
- **Response (201):** SO created
- **Permissions Required:** `sales.create`

### 3. **Get SO Details**
- **Endpoint:** `GET /api/sales-orders/[soId]`
- **Method:** `GET`
- **Description:** Get complete sales order details

### 4. **Update SO Status**
- **Endpoint:** `PUT /api/sales-orders/[soId]/status`
- **Method:** `PUT`
- **Description:** Update sales order status
- **Request Body:**
  ```json
  {
    "status": "Shipped"
  }
  ```
- **Permissions Required:** `sales.update`

---

## 📦 Inventory Management APIs

### 1. **Get Inventory**
- **Endpoint:** `GET /api/inventory`
- **Method:** `GET`
- **Description:** Get current inventory levels
- **Query Parameters:**
  - `warehouseId` (string): Filter by warehouse
  - `productId` (string): Filter by product
  - `lowStock` (boolean): Show only low stock items
- **Response (200):**
  ```json
  {
    "inventory": [
      {
        "productId": "product-uuid",
        "productName": "Industrial Motor",
        "sku": "MOTOR-001",
        "quantity": 45,
        "warehouse": "Main Warehouse",
        "reorderLevel": 20,
        "status": "OK"
      }
    ]
  }
  ```

### 2. **Adjust Stock**
- **Endpoint:** `POST /api/inventory/adjust`
- **Method:** `POST`
- **Description:** Adjust inventory levels
- **Request Body:**
  ```json
  {
    "productId": "product-uuid",
    "warehouseId": "warehouse-uuid",
    "adjustmentQuantity": 10,
    "reason": "Stock Receiving",
    "referenceDocument": "PO-2025-001"
  }
  ```
- **Response (200):** Inventory adjusted
- **Permissions Required:** `inventory.update`

### 3. **Transfer Inventory**
- **Endpoint:** `POST /api/inventory/transfer`
- **Method:** `POST`
- **Description:** Transfer stock between warehouses
- **Request Body:**
  ```json
  {
    "productId": "product-uuid",
    "fromWarehouse": "warehouse-uuid-1",
    "toWarehouse": "warehouse-uuid-2",
    "quantity": 20
  }
  ```
- **Response (200):** Transfer completed

### 4. **Get Low Stock Items**
- **Endpoint:** `GET /api/inventory/low-stock`
- **Method:** `GET`
- **Description:** Get items below reorder level
- **Response (200):**
  ```json
  {
    "lowStockItems": [
      {
        "productId": "product-uuid",
        "productName": "Motor",
        "currentStock": 5,
        "reorderLevel": 20,
        "status": "CRITICAL"
      }
    ]
  }
  ```

---

## 👨‍💼 Employee/HRMS APIs

### 1. **List All Employees**
- **Endpoint:** `GET /api/employees`
- **Method:** `GET`
- **Description:** Get all employee records
- **Query Parameters:**
  - `page` (number): Page number
  - `department` (string): Filter by department
  - `status` (string): Filter by employment status
- **Response (200):**
  ```json
  {
    "employees": [
      {
        "id": "emp-uuid",
        "name": "John Doe",
        "email": "john@company.com",
        "department": "Sales",
        "position": "Sales Manager",
        "status": "Active"
      }
    ],
    "total": 45
  }
  ```

### 2. **Create Employee**
- **Endpoint:** `POST /api/employees`
- **Method:** `POST`
- **Description:** Add new employee
- **Request Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@company.com",
    "phone": "+1-555-0123",
    "department": "Sales",
    "position": "Sales Manager",
    "dateOfJoining": "2025-10-28",
    "salary": 60000,
    "manager": "emp-uuid"
  }
  ```
- **Response (201):** Employee created
- **Permissions Required:** `hrms.create`

### 3. **Get Attendance**
- **Endpoint:** `GET /api/hrms/attendance`
- **Method:** `GET`
- **Description:** Get employee attendance records
- **Query Parameters:**
  - `employeeId` (string): Get specific employee
  - `month` (string): Month filter (YYYY-MM)
- **Response (200):**
  ```json
  {
    "attendanceRecords": [
      {
        "date": "2025-10-28",
        "employeeId": "emp-uuid",
        "status": "Present",
        "checkIn": "09:00 AM",
        "checkOut": "05:30 PM"
      }
    ]
  }
  ```

### 4. **Apply for Leave**
- **Endpoint:** `POST /api/hrms/leaves`
- **Method:** `POST`
- **Description:** Submit leave request
- **Request Body:**
  ```json
  {
    "employeeId": "emp-uuid",
    "leaveType": "Casual Leave",
    "fromDate": "2025-11-01",
    "toDate": "2025-11-03",
    "reason": "Personal work"
  }
  ```
- **Response (201):** Leave request created

### 5. **Salary Settlement**
- **Endpoint:** `POST /api/hrms/settlement`
- **Method:** `POST`
- **Description:** Process employee salary settlement
- **Request Body:**
  ```json
  {
    "employeeId": "emp-uuid",
    "month": "2025-10",
    "baseSalary": 60000,
    "deductions": 5000,
    "bonuses": 5000
  }
  ```
- **Response (200):** Settlement processed

---

## 🤖 AI/Genkit APIs

### 1. **Suggest KPIs Based on Performance**
- **Endpoint:** `POST /api/ai/suggest-kpis`
- **Method:** `POST`
- **Description:** AI-powered KPI suggestions based on business performance
- **Request Body:**
  ```json
  {
    "departmentId": "dept-uuid",
    "performanceData": {
      "revenue": 500000,
      "costs": 250000,
      "growth": 15
    },
    "period": "quarterly"
  }
  ```
- **Response (200):**
  ```json
  {
    "suggestedKPIs": [
      {
        "name": "Revenue Growth",
        "target": "20%",
        "metric": "quarterly_revenue",
        "confidence": 0.95
      }
    ]
  }
  ```
- **AI Model:** Genkit + Google AI

---

## 💚 Health & Status APIs

### 1. **Health Check**
- **Endpoint:** `GET /api/health`
- **Method:** `GET`
- **Description:** System health status endpoint
- **Response (200):**
  ```json
  {
    "status": "healthy",
    "timestamp": "2025-10-28T...",
    "services": {
      "database": "connected",
      "auth": "connected",
      "cache": "connected"
    },
    "uptime": 86400000
  }
  ```
- **Status Codes:** 200, 503
- **Rate Limited:** No

---

## 🔄 Session Management APIs

### 1. **Create Session**
- **Endpoint:** `POST /api/auth/createSession`
- **Method:** `POST`
- **Description:** Create new user session
- **Request Body:**
  ```json
  {
    "userId": "user-uuid",
    "organizationId": "org-uuid"
  }
  ```
- **Response (200):** Session created

### 2. **Destroy Session**
- **Endpoint:** `POST /api/auth/destroySession`
- **Method:** `POST`
- **Description:** Destroy user session
- **Response (200):** Session destroyed

---

## 🔑 Authentication Headers

All authenticated endpoints require:
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

## ⚙️ Error Response Format

All endpoints return errors in this format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "error details"
  },
  "timestamp": "2025-10-28T..."
}
```

## 📊 Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

## 🔐 Rate Limiting

- **Auth endpoints:** 5 requests/minute per IP
- **Standard endpoints:** 100 requests/minute per user
- **Health check:** Unlimited

## 💾 Data Formats

### Date Format
All dates in ISO 8601: `2025-10-28T12:00:00Z`

### Currency
USD by default, configurable per organization

### Pagination
All list endpoints use: `page`, `limit`, `total`, `pages`

---

## 🚀 Production Deployment

- All endpoints use HTTPS (enforced)
- JWT tokens expire in 15 minutes
- Refresh tokens valid for 7 days
- Rate limiting and DDoS protection enabled
- All data encrypted at rest
- CORS configured for approved domains

---

## 📞 Support & Documentation

For detailed integration examples, visit:
- [API Documentation](./API_DOCUMENTATION.md)
- [Quick Start Guide](./QUICK_START_GUIDE.md)
- [Firebase Removal Verification](./FIREBASE_REMOVAL_VERIFICATION.md)

**Last Updated:** October 28, 2025  
**Total Endpoints:** 48+  
**Authentication:** Supabase JWT + Supabase Auth
