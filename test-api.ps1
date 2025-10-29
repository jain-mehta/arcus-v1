# Testing Complete User Management Flow with PowerShell

# Colors
$Green = 'Green'
$Yellow = 'Yellow'
$Blue = 'Cyan'

function Write-Step {
    param([string]$message)
    Write-Host "[*] $message" -ForegroundColor $Yellow
}

function Write-Success {
    param([string]$message)
    Write-Host "[✓] $message" -ForegroundColor $Green
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
Write-Header "User Management API Testing - PowerShell"
Write-Host ""

# ============================================================
# STEP 1: LOGIN AS ADMIN
# ============================================================
Write-Step "Step 1: Logging in as admin ($AdminEmail)..."

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
Write-Host ""

# ============================================================
# STEP 2: CREATE A ROLE
# ============================================================
Write-Step "Step 2: Creating sales_manager role..."

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
Write-Host "Role details:"
Write-Host ($roleResponse.role | ConvertTo-Json -Depth 5) -ForegroundColor Gray
Write-Host ""

# ============================================================
# STEP 3: CREATE A USER
# ============================================================
Write-Step "Step 3: Creating user ($TestUserEmail) with sales_manager role..."

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
Write-Host "User details:"
Write-Host ($userResponse.user | ConvertTo-Json -Depth 5) -ForegroundColor Gray
Write-Host ""

# ============================================================
# STEP 4: LIST ALL USERS
# ============================================================
Write-Step "Step 4: Listing all users..."

$usersResponse = Invoke-RestMethod -Uri "$BaseURL/api/admin/users" `
    -Method GET `
    -Headers @{
        "Authorization" = "Bearer $adminToken"
    }

Write-Success "Retrieved users:"
Write-Host ($usersResponse.users | ConvertTo-Json -Depth 5) -ForegroundColor Gray
Write-Host ""

# ============================================================
# STEP 5: UPDATE USER
# ============================================================
Write-Step "Step 5: Updating user profile..."

$updateBody = @{
    userId = $userId
    fullName = "John Doe (Updated)"
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

Write-Success "Updated user"
Write-Host ($updateResponse.user | ConvertTo-Json -Depth 5) -ForegroundColor Gray
Write-Host ""

# ============================================================
# STEP 6: TEST USER LOGIN
# ============================================================
Write-Step "Step 6: Testing user login..."

$userLoginBody = @{
    email = $TestUserEmail
    password = $TestUserPassword
} | ConvertTo-Json

$userLoginResponse = Invoke-RestMethod -Uri "$BaseURL/api/auth/login" `
    -Method POST `
    -Headers @{"Content-Type" = "application/json"} `
    -Body $userLoginBody

$userToken = $userLoginResponse.accessToken
Write-Success "User login successful!"
Write-Host "User token: $($userToken.Substring(0, 20))..."
Write-Host "User ID: $($userLoginResponse.user.id)"
Write-Host "User Email: $($userLoginResponse.user.email)"
Write-Host ""

# ============================================================
# STEP 7: VERIFY PERMISSIONS
# ============================================================
Write-Step "Step 7: Verifying user can access protected endpoints..."

try {
    $dashboardResponse = Invoke-RestMethod -Uri "$BaseURL/api/admin/users" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $userToken"
        }
    
    Write-Success "User can access /api/admin/users endpoint"
} catch {
    Write-Host "User cannot access endpoint (expected if no permission)" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================
# SUMMARY
# ============================================================
Write-Header "✓ Testing Complete!"
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Admin Email: $AdminEmail" -ForegroundColor Gray
Write-Host "  Admin Token: $($adminToken.Substring(0, 30))..." -ForegroundColor Gray
Write-Host ""
Write-Host "  Role Created: $roleId" -ForegroundColor Gray
Write-Host "  Role Name: sales_manager" -ForegroundColor Gray
Write-Host ""
Write-Host "  User Created: $userId" -ForegroundColor Gray
Write-Host "  User Email: $TestUserEmail" -ForegroundColor Gray
Write-Host "  User Token: $($userToken.Substring(0, 30))..." -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Use admin token to manage roles and users" -ForegroundColor Gray
Write-Host "  2. Use user token to access resources" -ForegroundColor Gray
Write-Host "  3. Check database: SELECT * FROM users;" -ForegroundColor Gray
Write-Host "  4. Check roles: SELECT * FROM roles;" -ForegroundColor Gray
Write-Host "  5. Check Casbin: SELECT * FROM casbin_rule;" -ForegroundColor Gray
Write-Host ""
