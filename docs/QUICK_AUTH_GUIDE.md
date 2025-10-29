# 🔐 Quick Guide: Getting Auth Token & Testing APIs

## Three Ways to Get Authentication Token

### Method 1: Login via API (Recommended)

```powershell
# Step 1: Login
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        email = "admin@arcus.local"
        password = "YOUR_PASSWORD"
    } | ConvertTo-Json)

# Step 2: Extract token
$token = $response.accessToken
Write-Host $token
```

### Method 2: From Browser (Developer Tools)

1. **Open browser DevTools** (F12 or Right-click → Inspect)
2. **Go to Network tab**
3. **Login to app**
4. **Find login request** → Click on it
5. **Look for Response** → Copy `accessToken` value
6. **Use in PowerShell:**
   ```powershell
   $token = "eyJhbGciOiJIUzI1NiIs..."
   ```

### Method 3: From Application Cookies

1. **Open DevTools** (F12)
2. **Go to Application tab**
3. **Click Cookies** → Select your domain
4. **Find** `accessToken` or `authToken`
5. Copy the value

---

## Simple PowerShell Examples

### Get Token & Save to Variable

```powershell
# Login and save token
$loginBody = @{
    email = "admin@arcus.local"
    password = "TestAdmin123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $loginBody

$token = $response.accessToken
$userId = $response.user.id

# Show what we got
Write-Host "Token: $token"
Write-Host "User: $($response.user.email)"
```

### Create a Role

```powershell
$token = "YOUR_TOKEN_HERE"

$roleBody = @{
    name = "sales_manager"
    description = "Manages sales team"
    permissions = @(
        @{ resource = "sales:leads"; action = "view" },
        @{ resource = "sales:leads"; action = "create" }
    )
} | ConvertTo-Json -Depth 10

$role = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/roles" `
    -Method POST `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    } `
    -Body $roleBody

$roleId = $role.role.id
Write-Host "Created role: $roleId"
```

### Create a User

```powershell
$token = "YOUR_TOKEN_HERE"
$roleId = "role-uuid-from-above"

$userBody = @{
    email = "john@example.com"
    password = "Password123!"
    fullName = "John Doe"
    roleIds = @($roleId)
} | ConvertTo-Json

$user = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/users" `
    -Method POST `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    } `
    -Body $userBody

Write-Host "Created user: $($user.user.email)"
```

### List Users

```powershell
$token = "YOUR_TOKEN_HERE"

$users = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/users" `
    -Method GET `
    -Headers @{
        "Authorization" = "Bearer $token"
    }

$users.users | Select-Object id, email, name, roleIds | Format-Table
```

---

## Complete Flow Script

**Run this PowerShell script to test everything:**

```powershell
# 1. LOGIN
Write-Host "Step 1: Logging in..." -ForegroundColor Yellow
$admin = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        email = "admin@arcus.local"
        password = "TestAdmin123!"
    } | ConvertTo-Json)

$adminToken = $admin.accessToken
Write-Host "✓ Logged in as $($admin.user.email)" -ForegroundColor Green

# 2. CREATE ROLE
Write-Host "`nStep 2: Creating role..." -ForegroundColor Yellow
$roleResp = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/roles" `
    -Method POST `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -Body (@{
        name = "sales_manager"
        permissions = @(@{ resource = "sales:leads"; action = "view" })
    } | ConvertTo-Json -Depth 10)

$roleId = $roleResp.role.id
Write-Host "✓ Created role: $roleId" -ForegroundColor Green

# 3. CREATE USER
Write-Host "`nStep 3: Creating user..." -ForegroundColor Yellow
$userResp = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/users" `
    -Method POST `
    -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    } `
    -Body (@{
        email = "test.user@example.com"
        password = "TestUser123!"
        fullName = "Test User"
        roleIds = @($roleId)
    } | ConvertTo-Json)

Write-Host "✓ Created user: $($userResp.user.email)" -ForegroundColor Green

# 4. LIST USERS
Write-Host "`nStep 4: Listing users..." -ForegroundColor Yellow
$allUsers = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/users" `
    -Method GET `
    -Headers @{ "Authorization" = "Bearer $adminToken" }

$allUsers.users | Format-Table -Property email, name, @{Name="Roles"; Expression={$_.roleIds -join ", "}}

Write-Host "`n✓ All tests passed!" -ForegroundColor Green
```

---

## Troubleshooting

### "401 Unauthorized" Error

**Cause:** Missing or invalid token

**Solution:**
```powershell
# Make sure you're sending the header correctly:
-Headers @{ "Authorization" = "Bearer $token" }

# NOT:
-Headers @{ "Authorization" = $token }  # ❌ Missing "Bearer"
```

### "403 Permission Denied" Error

**Cause:** User doesn't have permission

**Solution:**
- Check if email is `admin@arcus.local` for admin access
- Check if user has admin role in database
- Try with different user

### Token Expired

**Solution:** Get a new token by logging in again

### Can't Login - User Doesn't Exist

**Solution:** Create the user first via signup:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body (@{
        email = "admin@arcus.local"
        password = "TestAdmin123!"
        firstName = "Admin"
        lastName = "User"
    } | ConvertTo-Json)
```

---

## Database Verification

After testing, verify in database:

```sql
-- Check users
SELECT id, email, full_name FROM users LIMIT 5;

-- Check roles
SELECT id, name, permissions FROM roles LIMIT 5;

-- Check user-role assignments
SELECT ur.user_id, ur.role_id, r.name FROM user_roles ur
JOIN roles r ON ur.role_id = r.id LIMIT 5;

-- Check Casbin policies
SELECT * FROM casbin_rule WHERE v0 LIKE 'role:%' LIMIT 10;
```

---

## API Endpoints Reference

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/api/auth/login` | POST | ❌ | Login and get token |
| `/api/auth/signup` | POST | ❌ | Create new account |
| `/api/admin/roles` | GET | ✅ | List roles |
| `/api/admin/roles` | POST | ✅ | Create role |
| `/api/admin/users` | GET | ✅ | List users |
| `/api/admin/users` | POST | ✅ | Create user |
| `/api/admin/users` | PUT | ✅ | Update user |
| `/api/admin/users` | DELETE | ✅ | Delete user |

---

## Quick Copy-Paste Commands

### PowerShell: Get Token
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body (@{email="admin@arcus.local";password="TestAdmin123!"} | ConvertTo-Json) | Select-Object -ExpandProperty accessToken
```

### PowerShell: List Users (with token)
```powershell
$token="YOUR_TOKEN"
Invoke-RestMethod -Uri "http://localhost:3000/api/admin/users" -Method GET -Headers @{"Authorization"="Bearer $token"} | Select-Object -ExpandProperty users | ConvertTo-Json
```

---

## Recommended Next Steps

1. ✅ Run the PowerShell test script: `./test-api.ps1`
2. ✅ Verify users in database
3. ✅ Check Casbin permissions synced correctly
4. ✅ Test login with created user
5. ✅ Try accessing protected endpoints
6. ✅ Go to web UI and verify users appear in Users page
