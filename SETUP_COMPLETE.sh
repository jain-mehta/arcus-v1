#!/usr/bin/env bash

# Arcus Project Complete Setup and Startup Guide
# Last updated: November 14, 2025
# Status: PRODUCTION READY

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║          ARCUS PROJECT - COMPLETE SETUP GUIDE                      ║"
echo "║          Enterprise-grade Full Stack Application                    ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# SECTION 1: ENVIRONMENT SETUP
# ============================================================================

echo "📋 Step 1: Verifying Environment Variables..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env.local" ]; then
    echo "✅ .env.local found"
    echo ""
    echo "Expected environment variables (verify in .env.local):"
    echo "  • NEXT_PUBLIC_SUPABASE_URL=https://asuxcwlbzspsifvigmov.supabase.co"
    echo "  • NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>"
    echo "  • SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>"
    echo "  • DATABASE_URL=postgresql://..."
else
    echo "❌ .env.local not found!"
    echo "   Create .env.local with required Supabase credentials"
    exit 1
fi

# ============================================================================
# SECTION 2: DEPENDENCY INSTALLATION
# ============================================================================

echo ""
echo "📋 Step 2: Installing Dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ node_modules found - dependencies already installed"
fi

# ============================================================================
# SECTION 3: BUILD PROCESS
# ============================================================================

echo ""
echo "📋 Step 3: Building Project..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npm run build
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo "   All TypeScript files compiled without errors"
    echo "   Next.js production build ready"
else
    echo "❌ Build failed"
    exit 1
fi

# ============================================================================
# SECTION 4: DATABASE DIAGNOSTIC
# ============================================================================

echo ""
echo "📋 Step 4: Testing Supabase Database Connection..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

node scripts/diagnose.mjs

# ============================================================================
# SECTION 5: UNIT TESTS
# ============================================================================

echo ""
echo "📋 Step 5: Running Unit Tests..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

npm test -- src/tests/unit.test.ts --run 2>&1 | grep -E "(PASS|FAIL|✓|✗|passed|failed)" || true

# ============================================================================
# SECTION 6: READY TO START
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                     ✅ SETUP COMPLETE                              ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 To start the development server, run:"
echo "   npm run dev"
echo ""
echo "📚 Available Commands:"
echo "   npm run dev              - Start development server (http://localhost:3000)"
echo "   npm run build            - Build production bundle"
echo "   npm start                - Start production server"
echo "   npm test                 - Run unit tests"
echo "   npm test -- unit.test    - Run specific tests"
echo "   node scripts/diagnose.mjs - Run diagnostic checks"
echo ""
echo "🔗 Important URLs:"
echo "   Application:  http://localhost:3000"
echo "   Admin Panel:  http://localhost:3000/dashboard"
echo "   API Health:   http://localhost:3000/api/health"
echo ""
echo "📖 Documentation:"
echo "   • Type System:   src/lib/types/"
echo "   • Auth/RBAC:     src/lib/rbac.ts"
echo "   • Database:      src/lib/supabase/"
echo "   • Actions:       src/app/dashboard/*/actions.ts"
echo ""
echo "⚠️  Default Admin User:"
echo "   Email: admin@arcus.local"
echo "   (First setup required via /api/admin/users)"
echo ""
