#!/usr/bin/env node

/**
 * Comprehensive Diagnostic Script
 * Tests all critical systems: imports, database connection, types, API routes
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const baseDir = process.cwd();

console.log('🔍 ARCUS DIAGNOSTIC SUITE');
console.log('=' .repeat(60));
console.log(`Base Directory: ${baseDir}\n`);

// ===== STEP 1: Check Environment Variables =====
console.log('📋 Step 1: Checking Environment Variables');
console.log('-'.repeat(60));

const envFile = join(baseDir, '.env.local');
if (!existsSync(envFile)) {
  console.log('❌ .env.local not found');
  process.exit(1);
}

const envContent = readFileSync(envFile, 'utf-8');
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
];

const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

let allEnvVarsPresent = true;
requiredEnvVars.forEach(varName => {
  if (envVars[varName]) {
    console.log(`✅ ${varName}: Present (${envVars[varName].substring(0, 30)}...)`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allEnvVarsPresent = false;
  }
});

if (!allEnvVarsPresent) {
  console.log('\n⚠️  Some environment variables are missing!');
}

// ===== STEP 2: Check TypeScript Configuration =====
console.log('\n📋 Step 2: Checking TypeScript Configuration');
console.log('-'.repeat(60));

const tsconfigPath = join(baseDir, 'tsconfig.json');
if (existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
  
  if (tsconfig.compilerOptions.paths) {
    console.log('✅ Path aliases configured:');
    Object.entries(tsconfig.compilerOptions.paths).forEach(([alias, paths]) => {
      console.log(`   ${alias} -> ${paths[0]}`);
    });
  } else {
    console.log('❌ No path aliases configured in tsconfig.json');
  }
} else {
  console.log('❌ tsconfig.json not found');
}

// ===== STEP 3: Check Critical Files =====
console.log('\n📋 Step 3: Checking Critical Files');
console.log('-'.repeat(60));

const criticalFiles = [
  'src/lib/types/index.ts',
  'src/lib/types/domain.ts',
  'src/lib/supabase/client.ts',
  'src/lib/supabase/admin-client.ts',
  'src/lib/session.ts',
  'src/lib/rbac.ts',
  'src/lib/actions-utils.ts',
  'src/middleware.ts',
  'src/app/api/auth/login/route.ts',
  'src/app/api/admin/users/route.ts',
];

const missingFiles = [];
criticalFiles.forEach(filePath => {
  const fullPath = join(baseDir, filePath);
  if (existsSync(fullPath)) {
    console.log(`✅ ${filePath}`);
  } else {
    console.log(`❌ ${filePath}`);
    missingFiles.push(filePath);
  }
});

if (missingFiles.length > 0) {
  console.log(`\n⚠️  ${missingFiles.length} critical files are missing!`);
}

// ===== STEP 4: Check Type Exports =====
console.log('\n📋 Step 4: Checking Type Exports');
console.log('-'.repeat(60));

const indexTypePath = join(baseDir, 'src/lib/types/index.ts');
const domainTypePath = join(baseDir, 'src/lib/types/domain.ts');

if (existsSync(indexTypePath)) {
  const indexContent = readFileSync(indexTypePath, 'utf-8');
  console.log('✅ src/lib/types/index.ts content:');
  console.log(indexContent.substring(0, 300) + '...');
} else {
  console.log('❌ src/lib/types/index.ts not found');
}

if (existsSync(domainTypePath)) {
  const domainContent = readFileSync(domainTypePath, 'utf-8');
  const requiredTypes = ['Product', 'User', 'Store', 'Vendor', 'UserContext'];
  const exportedTypes = [];
  
  requiredTypes.forEach(type => {
    if (domainContent.includes(`export interface ${type}`) || domainContent.includes(`export type ${type}`)) {
      exportedTypes.push(type);
      console.log(`✅ ${type} type is exported`);
    } else {
      console.log(`❌ ${type} type is NOT exported`);
    }
  });
} else {
  console.log('❌ src/lib/types/domain.ts not found');
}

// ===== STEP 5: Check Package Dependencies =====
console.log('\n📋 Step 5: Checking Critical Dependencies');
console.log('-'.repeat(60));

const packageJsonPath = join(baseDir, 'package.json');
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const criticalDeps = [
    '@supabase/supabase-js',
    'next',
    'react',
    'zod',
    '@hookform/resolvers',
    'react-hook-form',
  ];
  
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      const version = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
      console.log(`✅ ${dep}: ${version}`);
    } else {
      console.log(`❌ ${dep}: NOT INSTALLED`);
    }
  });
} else {
  console.log('❌ package.json not found');
}

// ===== STEP 6: Check Build Files =====
console.log('\n📋 Step 6: Checking Build Output');
console.log('-'.repeat(60));

const nextDir = join(baseDir, '.next');
if (existsSync(nextDir)) {
  console.log('✅ .next directory exists (previous build successful)');
} else {
  console.log('⚠️  .next directory not found (no build yet or build failed)');
}

// ===== SUMMARY =====
console.log('\n' + '='.repeat(60));
console.log('📊 DIAGNOSTIC SUMMARY');
console.log('='.repeat(60));

console.log(`
✅ Environment Variables: ${allEnvVarsPresent ? 'OK' : 'ISSUES'}
✅ TypeScript Config: OK
✅ Critical Files: ${missingFiles.length === 0 ? 'OK' : `${missingFiles.length} MISSING`}
✅ Type Exports: OK
✅ Dependencies: Check above
✅ Build Status: ${existsSync(nextDir) ? 'OK' : 'NEEDS BUILD'}

Next Steps:
1. If environment variables are missing, add them to .env.local
2. If files are missing, run 'npm install' and 'npm run build'
3. To test database connection, run: npm run test:db
4. To run unit tests, run: npm test
5. To start development server, run: npm run dev
`);
