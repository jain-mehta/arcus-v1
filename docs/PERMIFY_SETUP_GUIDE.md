# Permify Setup Guide - Complete Instructions

**Last Updated:** October 26, 2025
**Platform:** Permify Control Plane (https://console.permify.co)

---

## 🎯 Objective

Set up Permify for the Arcus v1 platform to manage RBAC (Role-Based Access Control) with 230+ granular permissions.

---

## 📋 Prerequisites

- ✅ Account email (Gmail recommended)
- ✅ 15 minutes
- ✅ Internet connection

---

## 🚀 Step-by-Step Setup

### **Phase 1: Account & Workspace Creation** (5 min)

#### Step 1.1: Create Permify Account
1. Go to **https://console.permify.co**
2. Click **"Sign Up"**
3. Enter:
   - Email: your@email.com
   - Password: strong password
   - Full Name: Your Name
4. Click **"Create Account"**
5. Verify email (check inbox/spam)

#### Step 1.2: Create Workspace
1. After login, click **"Create New Workspace"**
2. Enter:
   - **Workspace Name:** `Arcus-v1-Dev`
   - **Description:** "Multi-tenant SaaS platform with vendor, product, orders, inventory"
   - **Plan:** Free (sufficient for MVP)
3. Click **"Create"**
4. Wait for workspace to initialize (~10 seconds)

#### Step 1.3: Copy Workspace Details
Navigate to **Settings → General**:
- Copy **Workspace ID** (format: `workspace_xxxxx`)
- Copy **API URL** (usually `https://api.permify.co`)

---

### **Phase 2: API Key Generation** (3 min)

#### Step 2.1: Generate API Key
1. Navigate to **Settings → API Keys**
2. Click **"Create New API Key"**
3. Enter:
   - **Key Name:** `Development Key`
   - **Permissions:** Select **"Write"** (needed to sync schemas and create policies)
4. Click **"Generate"**

#### Step 2.2: Save API Key Securely
⚠️ **IMPORTANT:** Copy immediately (won't show again)
```
API Key: permify_xxxxxxxxxx_xxxxx
```

Save to a secure location (password manager, etc.)

---

### **Phase 3: Store Credentials in `.env.local`** (2 min)

#### Step 3.1: Create/Update `.env.local`

In the project root (`c:\Users\saksh\OneDrive\Desktop\Bobs_Firebase\`), create or update `.env.local`:

```env
# ===== PERMIFY CONFIGURATION =====
PERMIFY_API_KEY=permify_xxxxxxxxxx_xxxxx
PERMIFY_WORKSPACE_ID=workspace_xxxxx
PERMIFY_API_URL=https://api.permify.co
PERMIFY_SCHEMA_NAME=arcus-v1

# ===== SUPABASE CONFIGURATION =====
# (Fill these if using hosted Supabase; Docker Postgres used for local dev)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ===== DATABASE CONFIGURATION =====
# Docker Postgres (for local development)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/arcus_control
TENANT_DATABASE_URL_TEMPLATE=postgresql://postgres:postgres@localhost:5432/tenant_{tenantId}

# ===== NEXT.JS CONFIG =====
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### Step 3.2: Verify `.env.local` in Git Ignore

Make sure `.env.local` is in `.gitignore`:
```
# In .gitignore
.env.local
.env.*.local
```

---

### **Phase 4: Test Permify Connectivity** (3 min)

#### Step 4.1: Create Test Script

Create file: `scripts/test-permify.mjs`

```javascript
import fetch from 'node-fetch';

const apiKey = process.env.PERMIFY_API_KEY;
const workspaceId = process.env.PERMIFY_WORKSPACE_ID;
const apiUrl = process.env.PERMIFY_API_URL;

if (!apiKey || !workspaceId) {
  console.error('❌ Missing Permify credentials in .env.local');
  process.exit(1);
}

try {
  const response = await fetch(
    `${apiUrl}/v1/workspaces/${workspaceId}/schemas`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (response.ok) {
    console.log('✅ Permify connection successful!');
    const data = await response.json();
    console.log('Workspace ID:', workspaceId);
    console.log('API URL:', apiUrl);
  } else {
    console.error('❌ Permify API error:', response.status, response.statusText);
  }
} catch (error) {
  console.error('❌ Connection failed:', error.message);
}
```

#### Step 4.2: Run Test
```powershell
cd c:\Users\saksh\OneDrive\Desktop\Bobs_Firebase
node scripts/test-permify.mjs
```

**Expected Output:**
```
✅ Permify connection successful!
Workspace ID: workspace_xxxxx
API URL: https://api.permify.co
```

---

### **Phase 5: Define Schema in Permify UI** (5 min)

#### Step 5.1: Navigate to Schema
1. In Permify console, go to **Schema** tab
2. Click **"Create New Schema"**

#### Step 5.2: Define Arcus V1 Schema
Click in the schema editor and enter:

```
// Entities (Business Objects)
entity user {}
entity tenant {
  relation admin @user
}
entity vendor {
  relation tenant @tenant
  relation owner @user
}
entity product {
  relation tenant @tenant
}
entity purchase_order {
  relation tenant @tenant
  relation created_by @user
  relation approved_by @user
}
entity sales_order {
  relation tenant @tenant
  relation created_by @user
}
entity inventory {
  relation tenant @tenant
}

// Roles
role admin {
  permissions = [
    vendor:create,
    vendor:read,
    vendor:update,
    vendor:delete,
    product:create,
    product:read,
    product:update,
    product:delete,
    purchase_order:create,
    purchase_order:read,
    purchase_order:update,
    purchase_order:delete,
    purchase_order:approve,
    sales_order:create,
    sales_order:read,
    sales_order:update,
    sales_order:delete,
    inventory:read,
    inventory:adjust,
    user:manage,
  ]
}

role manager {
  permissions = [
    vendor:read,
    product:read,
    purchase_order:create,
    purchase_order:read,
    purchase_order:update,
    sales_order:create,
    sales_order:read,
    inventory:read,
  ]
}

role user {
  permissions = [
    vendor:read,
    product:read,
    sales_order:read,
    purchase_order:read,
  ]
}
```

#### Step 5.3: Save Schema
1. Click **"Save Schema"**
2. Click **"Publish"** to activate

---

## 📝 Verification Checklist

- [ ] Permify account created
- [ ] Workspace "Arcus-v1-Dev" created
- [ ] API Key generated and saved
- [ ] `.env.local` file created with Permify credentials
- [ ] `.env.local` added to `.gitignore`
- [ ] `scripts/test-permify.mjs` created
- [ ] Test script runs successfully (✅ connection successful)
- [ ] Schema defined and published in Permify console
- [ ] Ready to use in application

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid API Key" | Regenerate key in Permify console, copy again |
| "Workspace not found" | Verify Workspace ID matches exactly |
| "Connection timeout" | Check internet, verify `PERMIFY_API_URL` is correct |
| "Schema validation failed" | Copy schema exactly as shown above, check syntax |
| "401 Unauthorized" | Ensure API Key is prefixed with `permify_` |

---

## 🎓 Next Steps

1. ✅ Complete this setup
2. ✅ Return to agent to continue with middleware implementation
3. ✅ Agent will implement `permifyClient.ts` to sync schemas programmatically
4. ✅ Agent will add permission checks to middleware
5. ✅ Full end-to-end testing with real Permify instance

---

## 📞 Support

- **Permify Docs:** https://docs.permify.co
- **Permify Support:** support@permify.co
- **API Reference:** https://docs.permify.co/api

---

**Document Status:** ✅ Complete Setup Guide
**Time to Complete:** ~15 minutes
**Next Step:** Provide `.env.local` values to agent, then resume development
