# Testing Complete User Management Flow with cURL

## 📋 Table of Contents
1. [Get Authentication Token](#step-1-get-authentication-token)
2. [Create a Role](#step-2-create-a-role)
3. [Create a User](#step-3-create-a-user)
4. [List Users](#step-4-list-users)
5. [Update User](#step-5-update-user)
6. [Verify Permissions](#step-6-verify-permissions)

---

## Step 1: Get Authentication Token

### Option A: Login as Admin User

**Admin Credentials:**
- Email: `admin@arcus.local`
- Password: (depends on your setup)

**If you have the admin password, login with:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@arcus.local",
    "password": "YOUR_ADMIN_PASSWORD"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "admin-uuid",
    "email": "admin@arcus.local",
    "fullName": "Admin User"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Option B: Create Test User First (if admin doesn't exist)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@arcus.local",
    "password": "TestAdmin123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

### Option C: Get Session Cookie (if running in browser)

If you're logged in via the web app, the session is stored in **httpOnly cookies**. When using curl from command line, you need the token instead.

**To extract token from browser DevTools:**
1. Open Browser DevTools (F12)
2. Go to Application → Cookies
3. Look for `accessToken` or check Local Storage
4. Copy the token value

---

## Step 2: Create a Role

**Store the token from Step 1:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

**Create a Sales Manager Role:**
```bash
curl -X POST http://localhost:3000/api/admin/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "sales_manager",
    "description": "Sales Manager Role",
    "permissions": [
      {
        "resource": "sales:leads",
        "action": "view",
        "effect": "allow"
      },
      {
        "resource": "sales:leads",
        "action": "create",
        "effect": "allow"
      },
      {
        "resource": "sales:opportunities",
        "action": "view",
        "effect": "allow"
      },
      {
        "resource": "sales:opportunities",
        "action": "create",
        "effect": "allow"
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "role": {
    "id": "role-uuid",
    "name": "sales_manager",
    "organization_id": "org-uuid",
    "permissions": [...]
  }
}
```

**Store the role ID:**
```bash
export ROLE_ID="role-uuid"
```

---

## Step 3: Create a User

**Create a new user and assign the role:**

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "john.doe@example.com",
    "password": "UserPassword123!",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "roleIds": ["'"$ROLE_ID"'"]
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "roles": [
      {
        "id": "role-uuid",
        "name": "sales_manager"
      }
    ]
  }
}
```

**Store the user ID:**
```bash
export USER_ID="user-uuid"
```

---

## Step 4: List Users

**List all users in your organization:**

```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

**With pagination and search:**

```bash
curl -X GET "http://localhost:3000/api/admin/users?limit=10&skip=0&search=john" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "roles": [...]
    }
  ],
  "total": 1
}
```

---

## Step 5: Update User

**Update user profile and roles:**

```bash
curl -X PUT http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "'"$USER_ID"'",
    "fullName": "John Doe Updated",
    "phone": "+9876543210",
    "roleIds": ["'"$ROLE_ID"'"]
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "fullName": "John Doe Updated",
    "phone": "+9876543210"
  }
}
```

---

## Step 6: Verify Permissions

### Option A: User Login

**User logs in with new credentials:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "UserPassword123!"
  }'
```

This returns a NEW access token for the user.

### Option B: Check Casbin Permissions

**Check if user has specific permission (internal endpoint):**

```bash
curl -X POST http://localhost:3000/api/rbac/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "'"$USER_ID"'",
    "resource": "sales:leads",
    "action": "view"
  }'
```

**Response:**
```json
{
  "allowed": true,
  "reason": "Role sales_manager has permission"
}
```

---

## Complete Testing Script

Save as `test-api.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}User Management API Testing${NC}"
echo -e "${BLUE}================================${NC}"

# Step 1: Login
echo -e "${YELLOW}[1/5] Logging in as admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@arcus.local",
    "password": "TestAdmin123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}✓ Got token: ${TOKEN:0:20}...${NC}"

# Step 2: Create Role
echo -e "${YELLOW}[2/5] Creating sales_manager role...${NC}"
ROLE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "sales_manager",
    "description": "Sales Manager Role",
    "permissions": [
      {"resource": "sales:leads", "action": "view"},
      {"resource": "sales:leads", "action": "create"}
    ]
  }')

ROLE_ID=$(echo $ROLE_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✓ Created role: $ROLE_ID${NC}"

# Step 3: Create User
echo -e "${YELLOW}[3/5] Creating user john.doe@example.com...${NC}"
USER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "john.doe@example.com",
    "password": "UserPassword123!",
    "fullName": "John Doe",
    "roleIds": ["'"$ROLE_ID"'"]
  }')

USER_ID=$(echo $USER_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✓ Created user: $USER_ID${NC}"

# Step 4: List Users
echo -e "${YELLOW}[4/5] Listing all users...${NC}"
curl -s -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $TOKEN" | jq '.users[] | {id, email, fullName}'
echo -e "${GREEN}✓ Listed users${NC}"

# Step 5: User Login
echo -e "${YELLOW}[5/5] Testing user login...${NC}"
USER_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "UserPassword123!"
  }')

USER_TOKEN=$(echo $USER_LOGIN | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo -e "${GREEN}✓ User login successful, got token: ${USER_TOKEN:0:20}...${NC}"

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}✓ All tests passed!${NC}"
echo -e "${BLUE}================================${NC}"
```

**Run the script:**
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Common Issues & Solutions

### Issue 1: "Not authenticated" (401)

**Solution:** Make sure you're sending the Authorization header:
```bash
-H "Authorization: Bearer $TOKEN"
```

### Issue 2: "Permission denied" (403)

**Solution:** Admin user needs proper permissions. Check:
- Is user email in `admin@arcus.local`?
- Does user have admin role in database?

### Issue 3: "Invalid token"

**Solution:** Token might have expired. Get a new one:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@arcus.local",
    "password": "YOUR_PASSWORD"
  }' | jq '.accessToken'
```

### Issue 4: Can't login - user doesn't exist

**Solution:** Create admin user first:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@arcus.local",
    "password": "TestAdmin123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| **Login** | `POST /api/auth/login` |
| **Create Role** | `POST /api/admin/roles` |
| **Create User** | `POST /api/admin/users` |
| **List Users** | `GET /api/admin/users` |
| **Update User** | `PUT /api/admin/users` |
| **Delete User** | `DELETE /api/admin/users` |
| **Check Permission** | `POST /api/rbac/check` |

---

## Next Steps

1. ✅ Run the test script
2. ✅ Verify users appear in database
3. ✅ Check Casbin permissions are synced
4. ✅ Test login with created user
5. ✅ Try accessing protected endpoints
