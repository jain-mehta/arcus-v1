# Testing Complete User Management Flow - PowerShell Script

# Colors
$Green = 'Green'
$Yellow = 'Yellow'
$Blue = 'Cyan'
$Red = 'Red'

# Helper functions
function Write-Step {
    param([string]$msg)
    Write-Host "[*] $msg" -ForegroundColor $Yellow
}

function Write-Success {
    param([string]$msg)
    Write-Host "[OK] $msg" -ForegroundColor $Green
}

function Write-ErrorMsg {
    param([string]$msg)
    Write-Host "[ER] $msg" -ForegroundColor $Red
}

function Write-Header {
    param([string]$msg)
    Write-Host "========================================" -ForegroundColor $Blue
    Write-Host $msg -ForegroundColor $Blue
    Write-Host "========================================" -ForegroundColor $Blue
}

# Config
$BaseURL = "http://localhost:3000"
$AdminEmail = "admin@arcus.local"
$AdminPassword = "Admin@123456"
$TestUserEmail = "john.doe@example.com"
$TestUserPassword = "UserPassword123!"

Write-Host ""
Write-Header "User Management API Testing"
Write-Host ""

# STEP 1: LOGIN AS ADMIN
Write-Step "Logging in as admin..."
try {
    $loginBody = @{
        email = $AdminEmail
        password = $AdminPassword
    } | ConvertTo-Json

    $loginResp = Invoke-RestMethod -Uri "$BaseURL/api/auth/login" -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $loginBody -ErrorAction Stop

    $adminToken = $loginResp.accessToken
    Write-Success "Login successful"
    Write-Host "Token: $($adminToken.Substring(0, 30))..." -ForegroundColor Gray
}
catch {
    Write-ErrorMsg "Login failed: $($_.Exception.Message)"
    exit 1
}
Write-Host ""

# STEP 2: CREATE A ROLE
Write-Step "Creating sales_manager role..."
try {
    $roleBody = @{
        name = "sales_manager"
        description = "Sales Manager Role"
        permissions = @(
            @{ resource = "sales:leads"; action = "view"; effect = "allow" },
            @{ resource = "sales:leads"; action = "create"; effect = "allow" },
            @{ resource = "sales:opportunities"; action = "view"; effect = "allow" }
        )
    } | ConvertTo-Json -Depth 10

    $roleResp = Invoke-RestMethod -Uri "$BaseURL/api/admin/roles" -Method POST `
        -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $adminToken" } `
        -Body $roleBody -ErrorAction Stop

    $roleId = $roleResp.role.id
    Write-Success "Role created: $roleId"
}
catch {
    Write-ErrorMsg "Role creation failed: $($_.Exception.Message)"
    exit 1
}
Write-Host ""

# STEP 3: CREATE A USER
Write-Step "Creating user test.user+$(Get-Date -Format 'yyyyMMddHHmmss')@example.com..."
try {
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    $TestUserEmail = "test.user+$timestamp@example.com"
    
    $userBody = @{
        email = $TestUserEmail
        password = $TestUserPassword
        fullName = "Test User"
        phone = "+1234567890"
        roleIds = @($roleId)
    } | ConvertTo-Json

    $userResp = Invoke-RestMethod -Uri "$BaseURL/api/admin/users" -Method POST `
        -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $adminToken" } `
        -Body $userBody -ErrorAction Stop

    $userId = $userResp.user.id
    Write-Success "User created: $userId"
}
catch {
    Write-ErrorMsg "User creation failed: $($_.Exception.Message)"
    exit 1
}
Write-Host ""

# STEP 4: LIST ALL USERS
Write-Step "Listing all users..."
try {
    $usersResp = Invoke-RestMethod -Uri "$BaseURL/api/admin/users" -Method GET `
        -Headers @{ "Authorization" = "Bearer $adminToken" } -ErrorAction Stop

    Write-Success "Retrieved $($usersResp.users.Count) users"
    foreach ($user in $usersResp.users) {
        Write-Host "  - $($user.email) ($($user.fullName))" -ForegroundColor Gray
    }
}
catch {
    Write-ErrorMsg "List users failed: $($_.Exception.Message)"
    exit 1
}
Write-Host ""

# STEP 5: UPDATE USER
Write-Step "Updating user profile..."
try {
    $updateBody = @{
        userId = $userId
        fullName = "John Doe Updated"
        phone = "+9876543210"
        roleIds = @($roleId)
    } | ConvertTo-Json

    $updateResp = Invoke-RestMethod -Uri "$BaseURL/api/admin/users" -Method PUT `
        -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $adminToken" } `
        -Body $updateBody -ErrorAction Stop

    Write-Success "User updated"
}
catch {
    Write-ErrorMsg "Update failed: $($_.Exception.Message)"
    exit 1
}
Write-Host ""

# STEP 6: TEST USER LOGIN
Write-Step "Testing user login..."
try {
    $userLoginBody = @{
        email = $TestUserEmail
        password = $TestUserPassword
    } | ConvertTo-Json

    $userResp = Invoke-RestMethod -Uri "$BaseURL/api/auth/login" -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $userLoginBody -ErrorAction Stop

    $userToken = $userResp.accessToken
    Write-Success "User login successful"
    Write-Host "Token: $($userToken.Substring(0, 30))..." -ForegroundColor Gray
}
catch {
    Write-ErrorMsg "User login failed: $($_.Exception.Message)"
    exit 1
}
Write-Host ""

# STEP 7: VERIFY PERMISSIONS
Write-Step "Verifying user permissions..."
try {
    $checkResp = Invoke-RestMethod -Uri "$BaseURL/api/admin/users" -Method GET `
        -Headers @{ "Authorization" = "Bearer $userToken" } -ErrorAction Stop
    
    Write-Success "User can access protected endpoint"
}
catch {
    Write-Host "Access check: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# SUMMARY
Write-Header "All Tests Complete!"
Write-Host ""
Write-Host "Created successfully:" -ForegroundColor Cyan
Write-Host "  Admin Token: $($adminToken.Substring(0, 30))..." -ForegroundColor Gray
Write-Host "  User Token:  $($userToken.Substring(0, 30))..." -ForegroundColor Gray
Write-Host "  Role ID:     $roleId" -ForegroundColor Gray
Write-Host "  User ID:     $userId" -ForegroundColor Gray
Write-Host ""
Write-Host "Verify in database:" -ForegroundColor Cyan
Write-Host "  1. SELECT * FROM users WHERE email = 'john.doe@example.com';" -ForegroundColor Gray
Write-Host "  2. SELECT * FROM roles WHERE name = 'sales_manager';" -ForegroundColor Gray
Write-Host "  3. SELECT * FROM user_roles;" -ForegroundColor Gray
Write-Host "  4. SELECT * FROM casbin_rule LIMIT 5;" -ForegroundColor Gray
Write-Host ""
