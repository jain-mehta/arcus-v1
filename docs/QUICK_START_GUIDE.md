# Quick Start & Reference Guide

**Last Updated:** October 28, 2025

---

## 🚀 Quick Commands

### Start Development Server
```bash
npm run dev
```
Server runs on: http://localhost:3000

### Seed Admin User
```bash
npm run seed:admin
```
Creates:
- Email: `admin@arcus.local`
- Password: `Admin@123456`
- Role: Administrator (Full Access)

### Run Build
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Run Type Check
```bash
npm run type-check
```

---

## 🔐 Admin Credentials

**Email:** `admin@arcus.local`  
**Password:** `Admin@123456`

### Permissions
- ✅ Full dashboard access
- ✅ User management (create, edit, delete)
- ✅ Role management
- ✅ Vendor management
- ✅ Inventory control
- ✅ Purchase orders
- ✅ Sales orders
- ✅ HRMS access
- ✅ Reports & analytics
- ✅ Settings management
- ✅ Audit logs

---

## 📡 API Endpoints Quick Reference

### Authentication
```
POST   /api/auth/login              - Login
POST   /api/auth/logout             - Logout
GET    /api/auth/me                 - Current user
GET    /api/auth/validate           - Validate token
POST   /api/auth/check-permission   - Check permission
GET    /api/auth/permissions        - Get permissions
```

### Users
```
POST   /api/users                   - Create user
GET    /api/dashboard/users         - List users
GET    /api/users/:userId           - Get user
PUT    /api/users/:userId           - Update user
DELETE /api/users/:userId           - Delete user
PUT    /api/users/:userId/roles     - Assign roles
```

### Roles
```
POST   /api/admin/roles             - Create role
GET    /api/admin/roles             - List roles
GET    /api/admin/roles/:roleId     - Get role
PUT    /api/admin/roles/:roleId     - Update role
DELETE /api/admin/roles/:roleId     - Delete role
```

### Vendors
```
POST   /api/vendors                 - Create vendor
GET    /api/vendors                 - List vendors
GET    /api/vendors/:vendorId       - Get vendor
PUT    /api/vendors/:vendorId       - Update vendor
DELETE /api/vendors/:vendorId       - Delete vendor
```

### Products
```
POST   /api/products                - Create product
GET    /api/products                - List products
GET    /api/products/:productId     - Get product
PUT    /api/products/:productId     - Update product
DELETE /api/products/:productId     - Delete product
```

### Inventory
```
GET    /api/inventory               - Get inventory
POST   /api/inventory/adjust        - Adjust stock
POST   /api/inventory/transfer      - Transfer inventory
GET    /api/inventory/low-stock     - Get low stock
```

### Purchase Orders
```
POST   /api/purchase-orders         - Create PO
GET    /api/purchase-orders         - List POs
GET    /api/purchase-orders/:poId   - Get PO
PUT    /api/purchase-orders/:poId   - Update PO
POST   /api/purchase-orders/:poId/approve   - Approve
POST   /api/purchase-orders/:poId/receive   - Receive
```

### Sales Orders
```
POST   /api/sales-orders            - Create SO
GET    /api/sales-orders            - List SOs
GET    /api/sales-orders/:soId      - Get SO
PUT    /api/sales-orders/:soId/status      - Update status
```

### HRMS
```
GET    /api/employees               - List employees
POST   /api/employees               - Create employee
GET    /api/hrms/attendance         - Get attendance
POST   /api/hrms/leaves             - Apply leave
```

### Admin
```
GET    /api/admin/sessions          - Get sessions
POST   /api/admin/set-claims        - Set claims
POST   /api/admin/create-role       - Create role
```

### Health
```
GET    /api/health                  - Health check
```

---

## 📁 Key Files

### Documentation
- `API_DOCUMENTATION.md` - Complete API reference (51 endpoints)
- `FIREBASE_REMOVAL_VERIFICATION.md` - Firebase removal verification
- `TASK_COMPLETION_REPORT.md` - Task completion details

### Configuration
- `.env` - Environment variables
- `.env.local` - Local overrides
- `tsconfig.json` - TypeScript configuration
- `next.config.mjs` - Next.js configuration

### Scripts
- `scripts/seed-admin.mjs` - Seed admin user
- `scripts/seed-admin.sql` - SQL seed script
- `scripts/env-check.js` - Check environment

### Source
- `src/lib/supabase/` - Supabase clients
- `src/lib/auth/` - Authentication
- `src/lib/rbac.ts` - RBAC system
- `src/app/api/` - API routes
- `src/app/dashboard/` - Dashboard pages
- `src/lib/mock-data/` - Mock data for development

---

## 🔍 Environment Variables

### Required
```
NEXT_PUBLIC_SUPABASE_URL=https://asuxcwlbzspsifvigmov.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Optional
```
DATABASE_URL=postgresql://...
CONTROL_DATABASE_URL=postgresql://...
NODE_ENV=development|production
```

---

## 🧪 Testing

### Test Admin Login
1. Start dev server: `npm run dev`
2. Go to http://localhost:3000/login
3. Enter:
   - Email: `admin@arcus.local`
   - Password: `Admin@123456`
4. Should redirect to dashboard

### Check API
```bash
curl http://localhost:3000/api/health
```

### Verify Build
```bash
npm run build
# Should complete with "Compiled successfully in 33s"
```

---

## 📊 Database Schema

### Main Tables
- `users` - User accounts
- `roles` - User roles
- `user_roles` - User-role mappings
- `organizations` - Organizations
- `permissions` - Permission definitions
- `audit_logs` - Audit trail

### Business Tables
- `vendors` - Vendor information
- `products` - Product catalog
- `purchase_orders` - Purchase orders
- `sales_orders` - Sales orders
- `employees` - Employee records
- `leaves` - Leave requests

---

## ⚡ Performance

### Build Time
- Development: ~33 seconds
- Production: ~50 seconds

### Dev Server Startup
- Time to ready: ~2.8 seconds

### Routes
- Total: 101
- API Routes: 51
- Pages: 50

---

## 🔒 Security

### Authentication
- JWT-based with Supabase
- httpOnly session cookies
- Automatic token refresh
- Password hashing with bcrypt

### Authorization
- Role-Based Access Control (RBAC)
- Module and action level permissions
- User-specific constraints
- Audit logging

### Environment
- Sensitive keys in environment variables only
- No credentials in code
- Server-side secrets protected
- Client-side public keys only

---

## 📝 Troubleshooting

### Server Won't Start
```bash
# Clear build cache
rm -r .next

# Reinstall dependencies
npm install

# Try again
npm run dev
```

### Build Fails
```bash
# Check TypeScript
npm run type-check

# Check environment variables
npm run env-check

# Rebuild
npm run build
```

### Seed Script Error
```bash
# Check environment variables are set
npm run env-check

# Run with verbose output
node scripts/seed-admin.mjs
```

### Login Issues
```bash
# Check Supabase connection
curl -X GET https://asuxcwlbzspsifvigmov.supabase.co/auth/v1/health

# Check admin user exists
# Use Supabase dashboard to verify
```

---

## 📞 Support

For issues or questions:
1. Check `API_DOCUMENTATION.md` for endpoint details
2. Check `FIREBASE_REMOVAL_VERIFICATION.md` for system status
3. Review error messages in browser console
4. Check server logs in terminal

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Run `npm run build` successfully
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Supabase production database ready
- [ ] Run `npm run seed:admin` on production
- [ ] Test admin login on production
- [ ] Verify all API endpoints
- [ ] Check security audit
- [ ] Monitor error logs
- [ ] Backup database

---

## 📚 Documentation Files

1. **API_DOCUMENTATION.md** - 51 API endpoints with examples
2. **FIREBASE_REMOVAL_VERIFICATION.md** - Firebase migration complete
3. **TASK_COMPLETION_REPORT.md** - Task summary and checklist
4. **README.md** - Project overview
5. **This file** - Quick reference

---

**Last Updated:** October 28, 2025  
**Next Update:** After production deployment
