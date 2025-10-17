# Fix missing imports in all action files

$files = @(
    "src\app\dashboard\hrms\compliance\actions.ts",
    "src\app\dashboard\hrms\leave\actions.ts",
    "src\app\dashboard\hrms\payroll\actions.ts",
    "src\app\dashboard\hrms\attendance\actions.ts",
    "src\app\dashboard\hrms\recruitment\actions.ts",
    "src\app\dashboard\hrms\performance\actions.ts",
    "src\app\dashboard\hrms\settlement\actions.ts",
    "src\app\dashboard\vendor\profile\[id]\edit\actions.ts",
    "src\app\dashboard\vendor\profile\[id]\actions.ts",
    "src\app\dashboard\vendor\purchase-orders\create\actions.ts",
    "src\app\dashboard\vendor\documents\actions.ts",
    "src\app\dashboard\vendor\price-comparison\actions.ts",
    "src\app\dashboard\vendor\material-mapping\actions.ts",
    "src\app\dashboard\vendor\onboarding\actions.ts",
    "src\app\dashboard\vendor\list\actions.ts",
    "src\app\dashboard\store\profile\[id]\actions.ts",
    "src\app\dashboard\store\profile\[id]\edit\actions.ts",
    "src\app\dashboard\store\receiving\actions.ts",
    "src\app\dashboard\store\reports\actions.ts",
    "src\app\dashboard\settings\profile\actions.ts",
    "src\app\dashboard\inventory\actions.ts",
    "src\app\dashboard\sales\opportunities\actions.ts",
    "src\app\dashboard\sales\reports\actions.ts",
    "src\app\api\auth\permissions\route.ts"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        # Check if imports are missing
        $needsSessionClaims = $content -match "getSessionClaims\(\)" -and $content -notmatch "import.*getSessionClaims.*from"
        $needsAssertPermission = $content -match "assertPermission\(" -and $content -notmatch "import.*assertPermission.*from '@/lib/rbac'"
        
        if ($needsSessionClaims -or $needsAssertPermission) {
            Write-Host "Fixing $file..."
            
            # Find the last import line
            $lines = $content -split "`n"
            $lastImportIndex = -1
            for ($i = 0; $i -lt $lines.Length; $i++) {
                if ($lines[$i] -match "^import ") {
                    $lastImportIndex = $i
                }
            }
            
            if ($lastImportIndex -ge 0) {
                # Add imports after the last import
                $newImports = @()
                if ($needsAssertPermission) {
                    $newImports += "import { assertPermission } from '@/lib/rbac';"
                }
                if ($needsSessionClaims) {
                    $newImports += "import { getSessionClaims } from '@/lib/session';"
                }
                
                $lines = $lines[0..$lastImportIndex] + $newImports + $lines[($lastImportIndex + 1)..($lines.Length - 1)]
                $newContent = $lines -join "`n"
                Set-Content $fullPath -Value $newContent -NoNewline
                Write-Host "  ✓ Fixed $file" -ForegroundColor Green
            }
        }
    }
}

Write-Host "`nDone! All files have been fixed." -ForegroundColor Green
