# Platform API Documentation

**Generated:** October 28, 2025  
**Project:** Arcus Command Center  
**Status:** Production Ready

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [User Management APIs](#user-management-apis)
3. [Role Management APIs](#role-management-apis)
4. [Vendor Management APIs](#vendor-management-apis)
5. [Product Management APIs](#product-management-apis)
6. [Inventory APIs](#inventory-apis)
7. [Purchase Orders APIs](#purchase-orders-apis)
8. [Sales Orders APIs](#sales-orders-apis)
9. [HRMS APIs](#hrms-apis)
10. [AI APIs](#ai-apis)
11. [Admin APIs](#admin-apis)

---

## Authentication APIs

### 1. Login
- **Endpoint:** `POST /api/auth/login`
- **Description:** Authenticate user with email and password
- **Request Body:**
  ```json
  {
    "email": "admin@arcus.local",
    "password": "Admin@123456"
  }
  ```
- **Response:** JWT token, session cookie
- **Status Codes:** 200 (Success), 400 (Invalid credentials), 401 (Unauthorized)

### 2. Signup
- **Endpoint:** `POST /api/auth/signup`
- **Description:** Create new user account
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123",
    "fullName": "John Doe"
  }
  ```
- **Response:** User object, JWT token
- **Status Codes:** 201 (Created), 400 (Invalid input), 409 (User exists)

### 3. Logout
- **Endpoint:** `POST /api/auth/logout`
- **Description:** Logout user and destroy session
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ "success": true }`
- **Status Codes:** 200 (Success), 401 (Unauthorized)

### 4. Get Current User
- **Endpoint:** `GET /api/auth/me`
- **Description:** Get current authenticated user details
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "id": "user-id",
    "email": "admin@arcus.local",
    "fullName": "System Administrator",
    "isActive": true,
    "organizationId": "org-id",
    "roles": ["Administrator"]
  }
  ```
- **Status Codes:** 200 (Success), 401 (Unauthorized)

### 5. Check Permission
- **Endpoint:** `POST /api/auth/check-permission`
- **Description:** Verify if user has specific permission
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "module": "users",
    "action": "edit"
  }
  ```
- **Response:** `{ "allowed": true }`
- **Status Codes:** 200 (Success), 403 (Forbidden)

### 6. Get User Permissions
- **Endpoint:** `GET /api/auth/permissions`
- **Description:** Get all permissions for current user
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "dashboard": { "view": true, "manage": true },
    "users": { "view": true, "create": true, "edit": true, "delete": true },
    "roles": { "view": true, "manage": true }
  }
  ```
- **Status Codes:** 200 (Success), 401 (Unauthorized)

### 7. Validate Token
- **Endpoint:** `GET /api/auth/validate`
- **Description:** Validate JWT token
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ "valid": true }`
- **Status Codes:** 200 (Valid), 401 (Invalid)

---

## User Management APIs

### 1. Create User
- **Endpoint:** `POST /api/users`
- **Description:** Create new user (Admin only)
- **Headers:** `Authorization: Bearer <admin-token>`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123",
    "fullName": "John Doe",
    "phone": "+1-123-456-7890",
    "roleIds": ["role-id-1", "role-id-2"]
  }
  ```
- **Response:** User object
- **Status Codes:** 201 (Created), 400 (Invalid), 401 (Unauthorized), 409 (Exists)

### 2. Get Users
- **Endpoint:** `GET /api/dashboard/users` (Dashboard page)
- **Description:** List all users in organization
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:** `skip=0&limit=50&search=query`
- **Response:** Paginated user list
- **Status Codes:** 200 (Success), 401 (Unauthorized)

### 3. Get User Details
- **Endpoint:** `GET /api/users/:userId`
- **Description:** Get specific user details
- **Headers:** `Authorization: Bearer <token>`
- **Response:** User object with roles and permissions
- **Status Codes:** 200 (Success), 404 (Not found)

### 4. Update User
- **Endpoint:** `PUT /api/users/:userId`
- **Description:** Update user details
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "fullName": "Updated Name",
    "phone": "+1-new-number",
    "isActive": true
  }
  ```
- **Response:** Updated user object
- **Status Codes:** 200 (Success), 400 (Invalid), 404 (Not found)

### 5. Delete User
- **Endpoint:** `DELETE /api/users/:userId`
- **Description:** Soft delete user (Admin only)
- **Headers:** `Authorization: Bearer <admin-token>`
- **Response:** `{ "success": true }`
- **Status Codes:** 200 (Success), 401 (Unauthorized), 404 (Not found)

### 6. Update User Roles
- **Endpoint:** `PUT /api/users/:userId/roles`
- **Description:** Assign roles to user
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "roleIds": ["role-1", "role-2"]
  }
  ```
- **Response:** Updated user with new roles
- **Status Codes:** 200 (Success), 404 (Not found)

---

## Role Management APIs

### 1. Create Role
- **Endpoint:** `POST /api/admin/roles`
- **Description:** Create custom role (Admin only)
- **Headers:** `Authorization: Bearer <admin-token>`
- **Request Body:**
  ```json
  {
    "name": "Manager",
    "description": "Department Manager",
    "permissions": {
      "users": { "view": true, "create": true, "edit": true },
      "reports": { "view": true, "export": true }
    }
  }
  ```
- **Response:** Created role object
- **Status Codes:** 201 (Created), 400 (Invalid), 401 (Unauthorized)

### 2. Get Roles
- **Endpoint:** `GET /api/admin/roles`
- **Description:** List all roles in organization
- **Headers:** `Authorization: Bearer <admin-token>`
- **Query Parameters:** `skip=0&limit=50&search=query`
- **Response:** Paginated role list
- **Status Codes:** 200 (Success), 401 (Unauthorized)

### 3. Get Role Details
- **Endpoint:** `GET /api/admin/roles/:roleId`
- **Description:** Get specific role details
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Role object with permissions
- **Status Codes:** 200 (Success), 404 (Not found)

### 4. Update Role
- **Endpoint:** `PUT /api/admin/roles/:roleId`
- **Description:** Update role and permissions (Admin only)
- **Headers:** `Authorization: Bearer <admin-token>`
- **Request Body:**
  ```json
  {
    "name": "Senior Manager",
    "description": "Updated description",
    "permissions": { ... }
  }
  ```
- **Response:** Updated role object
- **Status Codes:** 200 (Success), 400 (Invalid), 404 (Not found)

### 5. Delete Role
- **Endpoint:** `DELETE /api/admin/roles/:roleId`
- **Description:** Delete custom role (Admin only)
- **Headers:** `Authorization: Bearer <admin-token>`
- **Response:** `{ "success": true }`
- **Status Codes:** 200 (Success), 400 (In use), 404 (Not found)

---

## Vendor Management APIs

### 1. Get Vendors
- **Endpoint:** `GET /api/vendors`
- **Description:** List all vendors
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:** `skip=0&limit=50&search=query&region=North`
- **Response:** Paginated vendor list
- **Status Codes:** 200 (Success), 401 (Unauthorized)

### 2. Create Vendor
- **Endpoint:** `POST /api/vendors`
- **Description:** Onboard new vendor
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "name": "Vendor Name",
    "email": "vendor@example.com",
    "phone": "+1-123-456-7890",
    "city": "Delhi",
    "state": "Delhi",
    "address": "123 Main St"
  }
  ```
- **Response:** Created vendor object
- **Status Codes:** 201 (Created), 400 (Invalid), 409 (Exists)

### 3. Get Vendor Details
- **Endpoint:** `GET /api/vendors/:vendorId`
- **Description:** Get vendor details with documents and history
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Vendor object with documents, ratings, communication logs
- **Status Codes:** 200 (Success), 404 (Not found)

### 4. Update Vendor
- **Endpoint:** `PUT /api/vendors/:vendorId`
- **Description:** Update vendor information
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:** Vendor fields to update
- **Response:** Updated vendor object
- **Status Codes:** 200 (Success), 400 (Invalid), 404 (Not found)

### 5. Delete Vendor
- **Endpoint:** `DELETE /api/vendors/:vendorId`
- **Description:** Deactivate vendor
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ "success": true }`
- **Status Codes:** 200 (Success), 400 (Has active POs), 404 (Not found)

---

## Product Management APIs

### 1. Get Products
- **Endpoint:** `GET /api/products`
- **Description:** List all products
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:** `skip=0&limit=50&search=query&category=electronics`
- **Response:** Paginated product list
- **Status Codes:** 200 (Success), 401 (Unauthorized)

### 2. Create Product
- **Endpoint:** `POST /api/products`
- **Description:** Add new product (Admin/Inventory only)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "sku": "PROD-001",
    "name": "Product Name",
    "category": "Electronics",
    "price": 99.99,
    "quantity": 100,
    "description": "Product description"
  }
  ```
- **Response:** Created product object
- **Status Codes:** 201 (Created), 400 (Invalid), 409 (SKU exists)

### 3. Get Product Details
- **Endpoint:** `GET /api/products/:productId`
- **Description:** Get product with inventory levels
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Product object with stock levels by store
- **Status Codes:** 200 (Success), 404 (Not found)

### 4. Update Product
- **Endpoint:** `PUT /api/products/:productId`
- **Description:** Update product details
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Updated product object
- **Status Codes:** 200 (Success), 400 (Invalid), 404 (Not found)

### 5. Delete Product
- **Endpoint:** `DELETE /api/products/:productId`
- **Description:** Archive product
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `{ "success": true }`
- **Status Codes:** 200 (Success), 400 (In use), 404 (Not found)

---

## Inventory APIs

### 1. Get Inventory
- **Endpoint:** `GET /api/inventory`
- **Description:** Get current inventory levels
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:** `storeId=store-1&productId=prod-1`
- **Response:** Inventory items with locations
- **Status Codes:** 200 (Success), 401 (Unauthorized)

### 2. Adjust Inventory
- **Endpoint:** `POST /api/inventory/adjust`
- **Description:** Adjust stock levels
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "productId": "prod-1",
    "storeId": "store-1",
    "quantity": 10,
    "type": "increase",
    "reason": "Purchase Order received"
  }
  ```
- **Response:** Updated inventory
- **Status Codes:** 200 (Success), 400 (Invalid)

### 3. Transfer Inventory
- **Endpoint:** `POST /api/inventory/transfer`
- **Description:** Transfer inventory between stores
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "productId": "prod-1",
    "fromStoreId": "store-1",
    "toStoreId": "store-2",
    "quantity": 5
  }
  ```
- **Response:** Transfer confirmation
- **Status Codes:** 200 (Success), 400 (Insufficient stock)

### 4. Get Low Stock Items
- **Endpoint:** `GET /api/inventory/low-stock`
- **Description:** Get items below reorder level
- **Headers:** `Authorization: Bearer <token>`
- **Response:** List of low stock items
- **Status Codes:** 200 (Success), 401 (Unauthorized)

---

## Purchase Orders APIs

### 1. Create Purchase Order
- **Endpoint:** `POST /api/purchase-orders`
- **Description:** Create new purchase order
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "vendorId": "vendor-1",
    "items": [
      { "productId": "prod-1", "quantity": 100, "unitPrice": 10.00 }
    ],
    "expectedDeliveryDate": "2025-11-15",
    "notes": "Urgent order"
  }
  ```
- **Response:** Created PO object
- **Status Codes:** 201 (Created), 400 (Invalid), 404 (Vendor not found)

### 2. Get Purchase Orders
- **Endpoint:** `GET /api/purchase-orders`
- **Description:** List all purchase orders
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:** `vendorId=vendor-1&status=pending&skip=0&limit=50`
- **Response:** Paginated PO list
- **Status Codes:** 200 (Success), 401 (Unauthorized)

### 3. Get PO Details
- **Endpoint:** `GET /api/purchase-orders/:poId`
- **Description:** Get purchase order details
- **Headers:** `Authorization: Bearer <token>`
- **Response:** PO with items and status
- **Status Codes:** 200 (Success), 404 (Not found)

### 4. Update PO
- **Endpoint:** `PUT /api/purchase-orders/:poId`
- **Description:** Update PO (before approval)
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Updated PO object
- **Status Codes:** 200 (Success), 400 (Already approved), 404 (Not found)

### 5. Approve PO
- **Endpoint:** `POST /api/purchase-orders/:poId/approve`
- **Description:** Approve purchase order
- **Headers:** `Authorization: Bearer <token>`
- **Response:** Approved PO object
- **Status Codes:** 200 (Success), 400 (Invalid state), 403 (Forbidden)

### 6. Receive PO
- **Endpoint:** `POST /api/purchase-orders/:poId/receive`
- **Description:** Mark PO as received and update inventory
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "items": [
      { "productId": "prod-1", "receivedQuantity": 98 }
    ]
  }
  ```
- **Response:** Updated PO with receipt details
- **Status Codes:** 200 (Success), 400 (Invalid)

---

## Sales Orders APIs

### 1. Create Sales Order
- **Endpoint:** `POST /api/sales-orders`
- **Description:** Create new sales order
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "customerId": "cust-1",
    "items": [
      { "productId": "prod-1", "quantity": 50, "unitPrice": 15.00 }
    ],
    "deliveryDate": "2025-11-20",
    "shippingAddress": "..."
  }
  ```
- **Response:** Created SO object
- **Status Codes:** 201 (Created), 400 (Invalid)

### 2. Get Sales Orders
- **Endpoint:** `GET /api/sales-orders`
- **Description:** List sales orders
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:** `customerId=cust-1&status=pending`
- **Response:** Paginated SO list
- **Status Codes:** 200 (Success), 401 (Unauthorized)

### 3. Get SO Details
- **Endpoint:** `GET /api/sales-orders/:soId`
- **Description:** Get sales order details
- **Headers:** `Authorization: Bearer <token>`
- **Response:** SO with items and timeline
- **Status Codes:** 200 (Success), 404 (Not found)

### 4. Update SO Status
- **Endpoint:** `PUT /api/sales-orders/:soId/status`
- **Description:** Update order status
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "status": "shipped",
    "trackingNumber": "TRACK123"
  }
  ```
- **Response:** Updated SO
- **Status Codes:** 200 (Success), 400 (Invalid transition)

---

## HRMS APIs

### 1. Get Employees
- **Endpoint:** `GET /api/employees`
- **Description:** List all employees
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:** `departmentId=dept-1&status=active`
- **Response:** Paginated employee list
- **Status Codes:** 200 (Success), 401 (Unauthorized)

### 2. Create Employee
- **Endpoint:** `POST /api/employees`
- **Description:** Add new employee
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "name": "Employee Name",
    "email": "emp@example.com",
    "phone": "+1-123-456-7890",
    "departmentId": "dept-1",
    "designation": "Sales Executive",
    "joiningDate": "2025-01-01"
  }
  ```
- **Response:** Created employee object
- **Status Codes:** 201 (Created), 400 (Invalid)

### 3. Get Attendance
- **Endpoint:** `GET /api/hrms/attendance`
- **Description:** Get attendance records
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:** `employeeId=emp-1&month=10&year=2025`
- **Response:** Attendance records
- **Status Codes:** 200 (Success)

### 4. Apply Leave
- **Endpoint:** `POST /api/hrms/leaves`
- **Description:** Apply for leave
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "leaveType": "Casual Leave",
    "fromDate": "2025-11-01",
    "toDate": "2025-11-03",
    "reason": "Personal"
  }
  ```
- **Response:** Leave request object
- **Status Codes:** 201 (Created), 400 (Invalid)

---

## AI APIs

### 1. Suggest KPIs
- **Endpoint:** `POST /api/ai/suggest-kpis`
- **Description:** Generate KPI suggestions based on performance
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "departmentId": "dept-1",
    "timeRange": "Q4-2025"
  }
  ```
- **Response:** AI-generated KPI suggestions
- **Status Codes:** 200 (Success), 400 (Invalid)

---

## Admin APIs

### 1. Get Sessions
- **Endpoint:** `GET /api/admin/sessions`
- **Description:** View active user sessions (Admin only)
- **Headers:** `Authorization: Bearer <admin-token>`
- **Response:** List of active sessions
- **Status Codes:** 200 (Success), 401 (Unauthorized)

### 2. Set User Claims
- **Endpoint:** `POST /api/admin/set-claims`
- **Description:** Set custom claims for user (Admin only)
- **Headers:** `Authorization: Bearer <admin-token>`
- **Request Body:**
  ```json
  {
    "userId": "user-id",
    "claims": {
      "role": "admin",
      "department": "operations"
    }
  }
  ```
- **Response:** Updated user claims
- **Status Codes:** 200 (Success), 404 (User not found)

### 3. Create Role (via Admin)
- **Endpoint:** `POST /api/admin/create-role`
- **Description:** Create system role
- **Headers:** `Authorization: Bearer <admin-token>`
- **Request Body:** Role configuration
- **Response:** Created role
- **Status Codes:** 201 (Created), 400 (Invalid)

---

## Health & Status APIs

### 1. Health Check
- **Endpoint:** `GET /api/health`
- **Description:** Check API health status
- **Response:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2025-10-28T12:00:00Z",
    "uptime": 3600
  }
  ```
- **Status Codes:** 200 (Healthy), 503 (Unhealthy)

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "skip": 0,
    "limit": 50,
    "pages": 2
  }
}
```

---

## Authentication

All endpoints (except login/signup) require:
- **Header:** `Authorization: Bearer <jwt_token>`
- **Token Validity:** 24 hours
- **Refresh:** Via `/api/auth/refresh` endpoint

---

## Rate Limiting

- **Free Tier:** 100 requests/minute
- **Premium:** 1000 requests/minute
- **Admin:** Unlimited

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

**Last Updated:** October 28, 2025  
**Version:** 1.0.0  
**Maintainer:** Development Team
