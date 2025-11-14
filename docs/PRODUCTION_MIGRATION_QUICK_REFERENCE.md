# 📋 Production Migration - Quick Reference

**Document Created:** November 11, 2025  
**Main Guide:** `docs/PRODUCTION_MIGRATION_GUIDE.md`  
**Status:** ✅ Ready for Implementation

---

## 🎯 QUICK SUMMARY

Your project has **mock data files and syntax issues** that need to be removed/fixed before production. I've created a **comprehensive 8,000+ word guide** that covers everything needed.

### What You Need to Do

1. **Remove 19 mock data imports** (3 types of files affected)
2. **Fix 3 broken server actions** (with syntax errors)
3. **Implement real database queries** (replacing mock returns)
4. **Reorganize folder structure** (create lib/actions, lib/rbac, lib/types)
5. **Update 50+ import paths** (from mock-data to real locations)
6. **Verify RBAC integrity** (Casbin-based permissions)
7. **Test & optimize** (performance benchmarking)

**Total Time:** 4-6 hours to complete everything

---

## 📍 KEY FILES TO REVIEW

### Priority 1: Broken Implementations (FIX IMMEDIATELY)
```
❌ src/app/dashboard/vendor/rating/actions.ts
   Issue: Uses empty arrays [] → crashes
   Impact: Vendor rating feature broken
   Time: 30 mins

❌ src/app/dashboard/hrms/payroll/formats/actions.ts
   Issue: 4 TODO comments, unimplemented functions
   Impact: Payroll format not working
   Time: 40 mins

❌ src/app/api/employees/route.ts
   Issue: 11+ hardcoded employee records
   Impact: Not scalable, not real data
   Time: 20 mins
```

### Priority 2: Mock Imports (REMOVE NEXT)
```
⚠️ 19 files importing @/lib/mock-data/
   Impact: Type definitions not properly organized
   Time: 1-1.5 hours

⚠️ src/lib/mock-data/ directory
   Impact: 2000+ lines of dead code
   Solution: Remove after all imports fixed
```

### Priority 3: Email & Testing (REFACTOR)
```
🔄 src/lib/email-service-client.ts
   Current: Falls back to 'mock' provider
   Fix: Production must use real Mailgun/SendGrid

🔄 src/tests/* and src/lib/permifyClient.ts
   Current: Have mock mode
   Fix: Keep mock for dev, enforce real in prod
```

---

## 📊 MOCK DATA INVENTORY

### Files with Direct Mock Imports (19 total)

**UI Components Importing Types (9 files):**
- `src/app/dashboard/sales/visits/client.tsx`
- `src/app/dashboard/sales/orders/client.tsx`
- `src/app/dashboard/vendor/purchase-orders/client.tsx` & client.tsx
- `src/app/dashboard/vendor/history/client.tsx`
- `src/app/dashboard/store/staff/client.tsx`
- `src/app/dashboard/store/billing-history/client.tsx`
- `src/app/dashboard/hrms/recruitment/page.tsx`
- `src/app/dashboard/hrms/payroll/printable-payslip.tsx`

**Server Actions (6 files):**
- `src/app/dashboard/vendor/rating/actions.ts`
- `src/app/dashboard/vendor/profile/[id]/edit/actions.ts`
- `src/app/dashboard/store/profile/[id]/edit/actions.ts`
- `src/app/dashboard/vendor/material-mapping/components/add-discount-dialog.tsx`
- `src/app/dashboard/hrms/payroll/formats/actions.ts`
- `src/app/api/admin/create-role/route.ts`

**Tests (2 files):**
- `src/tests/rbac-smoke.test.ts`
- (Others may have indirect usage)

**API Routes (1 file):**
- `src/app/api/employees/route.ts`

**Misc (1 file):**
- `src/lib/email-service-client.ts` (has mock provider)

---

## 🔧 IMPLEMENTATION PHASES

### Phase 1: Fix Syntax Errors (3 hours)
Essential fixes to make app work correctly.

**1.1 Vendor Rating Actions** (30 min)
- Replace `[].findIndex()` → real array operation
- Replace `MOCK_RATING_CRITERIA` → Supabase query
- Replace `MOCK_RATING_HISTORY` → Supabase query
- Implement real database update logic

**1.2 Payroll Format Actions** (40 min)
- Implement `getCurrentUserFromDb()` with real query
- Implement `assertUserPermission()` with Casbin check
- Remove 4 TODO comments
- Add proper error handling

**1.3 Email Provider** (15 min)
- Ensure production fails if EMAIL_PROVIDER not set
- Keep mock mode only for development
- Add validation on startup

**1.4 Employees API** (20 min)
- Replace hardcoded mock array with Supabase query
- Add tenant filtering
- Add proper pagination

### Phase 2: Remove Mock Imports (1.5-2 hours)
Clean up type imports and restore proper structure.

**2.1 Convert UI Component Types** (45 min)
- Move types from `@/lib/mock-data/types` → `@/lib/types/domain`
- Update 9 component imports
- Verify type resolution

**2.2 Update Test Files** (20 min)
- Replace mock RBAC imports with Casbin
- Use real permission checking
- Maintain test structure

**2.3 Uncomment Supabase Imports** (15 min)
- `src/app/api/admin/create-role/route.ts`
- Verify Supabase functions exist

### Phase 3: Implement Real DB Queries (1.5-2 hours)
Create production-ready query layer.

**3.1 Server Actions Module** (60 min)
- Create `src/lib/actions/` directory
- Implement vendor, product, order, employee queries
- Add proper error handling

**3.2 RBAC Module** (45 min)
- Create `src/lib/rbac/` directory
- Refactor from mixed mock+real to all real
- Use Casbin enforcer

**3.3 Update Existing Server Actions** (15 min)
- Replace mock calls with real queries
- Verify data transformations

### Phase 4: Organize Folder Structure (30 min)
Production-ready file organization.

**Actions:**
1. Create lib/rbac/ - move casbinClient, update rbac.ts
2. Create lib/actions/ - server query functions
3. Create lib/types/ - domain types
4. Update barrel exports (index.ts files)
5. Remove lib/mock-data/ directory

### Phase 5: Update Import Paths (30 min)
Fix all broken imports after reorganization.

**Search & Replace:**
1. `@/lib/mock-data` → `@/lib/types/domain` (types)
2. `@/lib/rbac` → `@/lib/rbac/permissions` (functions)
3. `@/lib/casbinClient` → `@/lib/rbac/casbin-enforcer`
4. Import new action functions from `@/lib/actions/*`

### Phase 6: QA & Performance (30 min)
Verification and optimization.

**Checklist:**
- [ ] TypeScript: `npm run type-check` → 0 errors
- [ ] Build: `npm run build` → success
- [ ] Tests: `npm run test` → all pass
- [ ] RBAC: Verify Casbin permissions work
- [ ] Database: All indexes created
- [ ] Performance: Query times < 200ms

---

## 📁 TARGET FOLDER STRUCTURE

```
src/lib/
├── auth/                        ← Keep (auth logic)
├── rbac/                        ← NEW (rename from scattered)
│   ├── casbin-enforcer.ts       ← Moved from casbinClient.ts
│   ├── permissions.ts           ← Refactored from rbac.ts
│   ├── policy-adapter.ts        ← Moved from policyAdapterCasbin.ts
│   └── index.ts                 ← Barrel export
├── actions/                     ← NEW (server queries)
│   ├── vendors.ts
│   ├── products.ts
│   ├── orders.ts
│   ├── employees.ts
│   ├── users.ts
│   ├── roles.ts
│   └── index.ts
├── types/                       ← NEW (type definitions)
│   ├── domain.ts                ← Vendor, Product, Order, etc.
│   ├── api.ts                   ← Request/Response types
│   ├── rbac.ts                  ← Permission types
│   └── index.ts
├── entities/                    ← Keep (TypeORM entities)
├── supabase/                    ← Keep (Supabase client)
├── validators/                  ← Keep (validation)
├── utils/                       ← Keep (utilities)
├── middleware/                  ← Keep (middleware)
├── logger.ts                    ← Keep
├── rate-limit.ts                ← Keep
├── email-service-client.ts      ← Keep (fix mock provider)
└── (other files)
```

---

## 🚀 EXACT COMMANDS TO RUN

### Step 1: Create Directory Structure
```bash
mkdir -p src/lib/rbac
mkdir -p src/lib/actions
mkdir -p src/lib/types
```

### Step 2: Move Files (with git)
```bash
# Track moves so git knows it's a rename, not delete+add
git mv src/lib/casbinClient.ts src/lib/rbac/casbin-enforcer.ts
git mv src/lib/policyAdapterCasbin.ts src/lib/rbac/policy-adapter.ts
# Keep src/lib/rbac.ts for now, refactor in place
```

### Step 3: Create Barrel Exports
```bash
# Create src/lib/rbac/index.ts
cat > src/lib/rbac/index.ts << 'EOF'
export * from './permissions';
export * from './casbin-enforcer';
export * from './policy-adapter';
EOF

# Create src/lib/actions/index.ts
cat > src/lib/actions/index.ts << 'EOF'
export * from './vendors';
export * from './products';
export * from './orders';
export * from './employees';
export * from './users';
export * from './roles';
EOF
```

### Step 4: Verify Changes
```bash
# Check what files were created/moved
git status

# Check TypeScript errors
npm run type-check 2>&1 | head -20

# Run build to catch import errors
npm run build 2>&1 | grep -i error | head -10
```

---

## ✅ VERIFICATION CHECKLIST

### Before You Start
- [ ] Read PRODUCTION_MIGRATION_GUIDE.md (full 8000+ word guide)
- [ ] Understand RBAC/Casbin architecture
- [ ] Have database schema ready (COMPLETE_DATABASE_SCHEMA.sql)
- [ ] Test environment variables configured

### Phase 1 Complete?
- [ ] Vendor rating actions use real DB
- [ ] Payroll format actions don't have TODO
- [ ] Employees API queries real data
- [ ] Email provider configured correctly
- [ ] Build succeeds: `npm run build`

### Phase 2 Complete?
- [ ] No imports from @/lib/mock-data (check: `grep -r "@/lib/mock-data" src/`)
- [ ] All types come from @/lib/types/domain
- [ ] RBAC tests use Casbin, not mocks
- [ ] Build succeeds

### Phase 3 Complete?
- [ ] Server actions in src/lib/actions/ work
- [ ] Vendor queries return data
- [ ] Product queries return data
- [ ] Order queries return data
- [ ] Employee queries return data

### Phase 4 Complete?
- [ ] lib/rbac/ has 3 files + index.ts
- [ ] lib/actions/ has all query functions
- [ ] lib/types/ has domain types
- [ ] lib/mock-data/ directory removed
- [ ] All imports updated

### Phase 5 Complete?
- [ ] All imports resolve: `npm run type-check` → 0 errors
- [ ] Build passes: `npm run build` → success
- [ ] No console errors on startup

### Phase 6 Complete?
- [ ] Tests pass: `npm run test`
- [ ] RBAC works: Casbin enforcer initializes
- [ ] Database indexes exist
- [ ] Performance targets met (see guide)
- [ ] Ready for production deployment

---

## 🎯 SUCCESS CRITERIA

Your implementation is **production-ready** when:

✅ **Zero Mock Data**
```bash
# This should return 0
grep -r "MOCK_" src/app/ src/lib/actions/ | grep -v test | grep -v ".test" | wc -l
# Should be: 0

# This should return 0
grep -r "@/lib/mock-data" src/ | wc -l
# Should be: 0
```

✅ **Type Safety**
```bash
npm run type-check
# Expected: No errors
```

✅ **Build Success**
```bash
npm run build
# Expected: ✅ Compiled successfully
```

✅ **RBAC Enforced**
```bash
# All permission checks should use Casbin
grep -r "checkCasbin\|checkPermission" src/lib/actions src/app/api/ | wc -l
# Expected: > 10 (multiple permission checks)
```

✅ **Real Database Queries**
```bash
# All actions should query Supabase, not mocks
grep -r "from('vendors')" src/lib/actions/ | wc -l
# Expected: > 3
```

---

## 📚 COMPLETE RESOURCE

**Main Document:** `docs/PRODUCTION_MIGRATION_GUIDE.md` (8000+ words)

**Sections:**
1. Executive Summary & State Analysis
2. Phase 1: Fix Broken Implementations (detailed with code examples)
3. Phase 2: Remove Mock Imports
4. Phase 3: Implement Real Database Queries (with code)
5. Phase 4: Organize Folder Structure
6. Phase 5: Update Import Paths
7. Phase 6: QA & Performance Optimization
8. Verification Checklist
9. Security Considerations
10. Performance Targets
11. Implementation Roadmap
12. Troubleshooting Guide

**Each phase includes:**
- Exact files to modify
- Before & after code examples
- Expected outcomes
- Time estimates
- Commands to run

---

## 💡 PRO TIPS

1. **Use find & replace wisely**
   ```bash
   # Find all files needing attention
   grep -r "@/lib/mock-data" src/ | cut -d: -f1 | sort -u
   
   # Find files with syntax issues
   grep -r "\[\].findIndex\|\[\].filter" src/
   ```

2. **Test incrementally**
   - Fix Phase 1 → Test → Phase 2 → Test → etc.
   - Don't try to do everything at once

3. **Commit frequently**
   ```bash
   git add src/app/dashboard/vendor/rating/actions.ts
   git commit -m "chore: replace mock RATING_CRITERIA with Supabase query"
   ```

4. **Use TypeScript strict mode**
   - It will catch many errors automatically
   - Run `npm run type-check` after each phase

5. **Keep mock-data for development**
   - Good for Storybook, tests, demos
   - Just don't use in production code

---

## ⏱️ TIME BREAKDOWN

| Phase | Task | Time |
|-------|------|------|
| 1.1 | Fix Vendor Rating | 30 min |
| 1.2 | Fix Payroll Formats | 40 min |
| 1.3 | Fix Email Provider | 15 min |
| 1.4 | Fix Employees API | 20 min |
| 2 | Remove Mock Imports | 1.5 hours |
| 3 | Implement Real Queries | 1.5-2 hours |
| 4 | Reorganize Folders | 30 min |
| 5 | Update Import Paths | 30 min |
| 6 | QA & Testing | 30 min |
| **TOTAL** | **All Phases** | **4-6 hours** |

---

## 🚀 NEXT ACTION

1. ✅ Read `docs/PRODUCTION_MIGRATION_GUIDE.md` (full guide)
2. ✅ Review the **6 implementation phases**
3. ✅ Follow the **exact steps** in order
4. ✅ Run **verification checklist** after each phase
5. ✅ Commit changes to **git** frequently
6. ✅ Test in **development** before production

---

**Document Status:** ✅ Complete & Production-Ready  
**Created:** November 11, 2025  
**Maintainer:** Your Development Team

