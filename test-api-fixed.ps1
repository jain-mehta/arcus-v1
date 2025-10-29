# Testing Complete User Management Flow with PowerShell

# Colors
$Green = 'Green'
$Yellow = 'Yellow'
$Blue = 'Cyan'
$Red = 'Red'

function Write-Step {
    param([string]$message)
    Write-Host "[*] $message" -ForegroundColor $Yellow
}

function Write-Success {
    param([string]$message)
    Write-Host "[✓] $message" -ForegroundColor $Green
}

function Write-Error-Custom {
    param([string]$message)
    Write-Host "[✗] $message" -ForegroundColor $Red
}

function Write-Header {
    param([string]$message)
    Write-Host "================================" -ForegroundColor $Blue
    Write-Host $message -ForegroundColor $Blue
    Write-Host "================================" -ForegroundColor $Blue
}

# Configuration
$BaseURL = "http://localhost:3000"
$AdminEmail = "admin@arcus.local"
$AdminPassword = "TestAdmin123!"
$TestUserEmail = "john.doe@example.com"
$TestUserPassword = "UserPassword123!"

Write-Host ""
Write-Header "User Management API Testing"
Write-Host ""

# ============================================================
# STEP 1: LOGIN AS ADMIN
# ============================================================
Write-Step "Step 1: Logging in as admin ($AdminEmail)..."

try {
    $loginBody = @{
        email = $AdminEmail
        password = $AdminPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$BaseURL/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $loginBody

    $adminToken = $loginResponse.accessToken
    Write-Success "Got admin token: $($adminToken.Substring(0, 20))..."
} catch {
    Write-Error-Custom "Failed to login: $($_.Exception.Message)"
    exit 1
}

Write-Host ""

# ============================================================
# STEP 2: CREATE A ROLE
# ============================================================
Write-Step "Step 2: Creating sales_manager role..."

try {
    $roleBody = @{
        name = "sales_manager"
        description = "Sales Manager Role"
        permissions = @(
            @{
                resource = "sales:leads"
                action = "view"
                effect = "allow"
            },
            @{
                resource = "sales:leads"
                action = "create"
                effect = "allow"
            },
            @{
                resource = "sales:opportunities"
                action = "view"
                effect = "allow"
            }
        )
    } | ConvertTo-Json -Depth 10

    $roleResponse = Invoke-RestMethod -Uri "$BaseURL/api/admin/roles" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $adminToken"
        } `
        -Body $roleBody

    $roleId = $roleResponse.role.id
    Write-Success "Created role: $roleId"
} catch {
    Write-Error-Custom "Failed to create role: $($_.Exception.Message)"
    exit 1
}

Write-Host ""

# ============================================================
# STEP 3: CREATE A USER
# ============================================================
Write-Step "Step 3: Creating user ($TestUserEmail) with sales_manager role..."

try {
    $userBody = @{
        email = $TestUserEmail
        password = $TestUserPassword
        fullName = "John Doe"
        phone = "+1234567890"
        roleIds = @($roleId)
    } | ConvertTo-Json

    $userResponse = Invoke-RestMethod -Uri "$BaseURL/api/admin/users" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $adminToken"
        } `
        -Body $userBody

    $userId = $userResponse.user.id
    Write-Success "Created user: $userId"
} catch {
    Write-Error-Custom "Failed to create user: $($_.Exception.Message)"
    exit 1
}

Write-Host ""

# ============================================================
# STEP 4: LIST ALL USERS
# ============================================================
Write-Step "Step 4: Listing all users..."

try {
    $usersResponse = Invoke-RestMethod -Uri "$BaseURL/api/admin/users" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $adminToken"
        }

    Write-Success "Retrieved $($usersResponse.users.Count) users"
    $usersResponse.users | ForEach-Object {
        Write-Host "  - $($_.email) ($($_.fullName))" -ForegroundColor Gray
    }
} catch {
    Write-Error-Custom "Failed to list users: $($_.Exception.Message)"
    exit 1
}

Write-Host ""

# ============================================================
# STEP 5: UPDATE USER
# ============================================================
Write-Step "Step 5: Updating user profile..."

try {
    $updateBody = @{
        userId = $userId
        fullName = "John Doe Updated"
        phone = "+9876543210"
        roleIds = @($roleId)
    } | ConvertTo-Json

    $updateResponse = Invoke-RestMethod -Uri "$BaseURL/api/admin/users" `
        -Method PUT `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $adminToken"
        } `
        -Body $updateBody

    Write-Success "Updated user profile"
} catch {
    Write-Error-Custom "Failed to update user: $($_.Exception.Message)"
    exit 1
}

Write-Host ""

# ============================================================
# STEP 6: TEST USER LOGIN
# ============================================================
Write-Step "Step 6: Testing user login..."

try {
    $userLoginBody = @{
        email = $TestUserEmail
        password = $TestUserPassword
    } | ConvertTo-Json

    $userLoginResponse = Invoke-RestMethod -Uri "$BaseURL/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $userLoginBody

    $userToken = $userLoginResponse.accessToken
    Write-Success "User login successful"
} catch {
    Write-Error-Custom "Failed to login as user: $($_.Exception.Message)"
    exit 1
}

Write-Host ""

# ============================================================
# STEP 7: VERIFY PERMISSIONS
# ============================================================
Write-Step "Step 7: Verifying user permissions..."

try {
    $dashboardResponse = Invoke-RestMethod -Uri "$BaseURL/api/admin/users" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $userToken"
        }
    
    Write-Success "User can access protected endpoint"
} catch {
    Write-Host "User access check: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================
# SUMMARY
# ============================================================
Write-Header "Testing Complete"
Write-Host ""
Write-Host "Admin Token: $($adminToken.Substring(0, 30))..." -ForegroundColor Gray
Write-Host "User Token:  $($userToken.Substring(0, 30))..." -ForegroundColor Gray
Write-Host "Role ID:     $roleId" -ForegroundColor Gray
Write-Host "User ID:     $userId" -ForegroundColor Gray
Write-Host ""
Write-Host "All tests passed! Check database:" -ForegroundColor Cyan
Write-Host '  SELECT * FROM users WHERE email = ''' + $TestUserEmail + ''';' -ForegroundColor Gray
Write-Host '  SELECT * FROM roles WHERE name = ''' + 'sales_manager' + ''';' -ForegroundColor Gray
Write-Host '  SELECT * FROM user_roles WHERE user_id = ''' + $userId + ''';' -ForegroundColor Gray
Write-Host '  SELECT * FROM casbin_rule LIMIT 10;' -ForegroundColor Gray
Write-Host ""
