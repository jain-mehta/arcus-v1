#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Mock Data Removal Verification
 *
 * This script performs thorough testing to ensure all mock data has been
 * properly removed and replaced with database calls.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = __dirname;

const TEST_RESULTS = {
  passed: [],
  failed: [],
  warnings: []
};

// Test configuration
const TESTS = {
  mockImportCheck: true,
  mockVariableCheck: true,
  supabaseImportCheck: true,
  typeDefinitionCheck: true,
  syntaxValidationCheck: true,
  buildTestCheck: true,
  importResolutionCheck: true,
  edgeCaseCheck: true
};

async function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '📋',
    'success': '✅',
    'error': '❌',
    'warning': '⚠️'
  }[type];

  console.log(`${prefix} [${timestamp.slice(11, 19)}] ${message}`);
}

async function findAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];

  async function walk(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (!['node_modules', '.next', '.git', 'dist', 'build', 'coverage'].includes(entry.name)) {
            await walk(fullPath);
          }
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      await log(`Error reading directory ${currentDir}: ${error.message}`, 'warning');
    }
  }

  await walk(dir);
  return files;
}

async function readFileContent(filePath) {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    await log(`Error reading file ${filePath}: ${error.message}`, 'warning');
    return null;
  }
}

// Test 1: Check for remaining mock imports
async function testMockImports() {
  await log('Testing for remaining mock imports...', 'info');

  const srcDir = path.join(projectRoot, 'src');
  const files = await findAllFiles(srcDir);
  const issues = [];

  for (const filePath of files) {
    const content = await readFileContent(filePath);
    if (!content) continue;

    const relativePath = path.relative(projectRoot, filePath);

    // Check for mock imports
    const mockImportPatterns = [
      /import\s+.*from\s+['"]@\/lib\/mock-data/gi,
      /import\s+.*from\s+['"].*\/mock-data/gi,
      /import\s+.*from\s+['"]@\/lib\/mock-sessions/gi
    ];

    for (const pattern of mockImportPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          file: relativePath,
          imports: matches
        });
      }
    }
  }

  if (issues.length > 0) {
    TEST_RESULTS.failed.push({
      test: 'Mock Imports',
      issues: issues
    });
    await log(`Found ${issues.length} files with mock imports`, 'error');
  } else {
    TEST_RESULTS.passed.push('Mock Imports');
    await log('No mock imports found', 'success');
  }

  return issues.length === 0;
}

// Test 2: Check for remaining mock variables
async function testMockVariables() {
  await log('Testing for remaining mock variables...', 'info');

  const srcDir = path.join(projectRoot, 'src');
  const files = await findAllFiles(srcDir);
  const issues = [];

  for (const filePath of files) {
    const content = await readFileContent(filePath);
    if (!content) continue;

    const relativePath = path.relative(projectRoot, filePath);

    // Look for MOCK_ variable usage that's not in comments
    const lines = content.split('');
    const mockUsages = [];

    lines.forEach((line, index) => {
      // Skip comments and TODO comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

      const mockMatches = line.match(/\bMOCK_[A-Z_]+\b/g);
      if (mockMatches) {
        mockUsages.push({
          line: index + 1,
          content: line.trim(),
          variables: mockMatches
        });
      }
    });

    if (mockUsages.length > 0) {
      issues.push({
        file: relativePath,
        usages: mockUsages
      });
    }
  }

  if (issues.length > 0) {
    TEST_RESULTS.failed.push({
      test: 'Mock Variables',
      issues: issues
    });
    await log(`Found ${issues.length} files with mock variable usage`, 'error');
  } else {
    TEST_RESULTS.passed.push('Mock Variables');
    await log('No mock variable usage found', 'success');
  }

  return issues.length === 0;
}

// Test 3: Check for Supabase client imports
async function testSupabaseImports() {
  await log('Testing for proper Supabase imports...', 'info');

  const srcDir = path.join(projectRoot, 'src');
  const files = await findAllFiles(srcDir);
  const stats = {
    withSupabase: 0,
    serverActions: 0,
    missingSupabase: []
  };

  for (const filePath of files) {
    const content = await readFileContent(filePath);
    if (!content) continue;

    const relativePath = path.relative(projectRoot, filePath);

    // Check if it's a server action file
    const isServerAction = content.includes("'use server'") || content.includes('"use server"');

    if (isServerAction) {
      stats.serverActions++;

      // Check if it has Supabase import
      const hasSupabaseImport = content.includes('getSupabaseServerClient');

      if (hasSupabaseImport) {
        stats.withSupabase++;
      } else {
        // Check if it actually needs database access
        const needsDatabase = content.includes('.from(') ||
                             content.includes('supabase') ||
                             content.includes('database') ||
                             content.includes('TODO: Replace with actual database');

        if (needsDatabase) {
          stats.missingSupabase.push(relativePath);
        }
      }
    }
  }

  await log(`Found ${stats.serverActions} server action files`, 'info');
  await log(`${stats.withSupabase} have Supabase imports`, 'info');

  if (stats.missingSupabase.length > 0) {
    TEST_RESULTS.warnings.push({
      test: 'Supabase Imports',
      message: `${stats.missingSupabase.length} server action files may need Supabase imports`,
      files: stats.missingSupabase
    });
    await log(`${stats.missingSupabase.length} files may need Supabase imports`, 'warning');
  } else {
    TEST_RESULTS.passed.push('Supabase Imports');
    await log('Supabase imports look good', 'success');
  }

  return stats.missingSupabase.length === 0;
}

// Test 4: Check for syntax errors
async function testSyntaxValidation() {
  await log('Testing for syntax errors...', 'info');

  const srcDir = path.join(projectRoot, 'src');
  const files = await findAllFiles(srcDir);
  const syntaxIssues = [];

  for (const filePath of files) {
    const content = await readFileContent(filePath);
    if (!content) continue;

    const relativePath = path.relative(projectRoot, filePath);

    // Check for common syntax issues from the cleanup
    const issues = [];

    // Check for escaped newlines
    if (content.includes('\')) {
      issues.push('Contains escaped newlines');
    }

    // Check for malformed imports
    if (content.match(/import.*.*import/g)) {
      issues.push('Possible malformed imports');
    }

    // Check for empty array operations
    if (content.includes('[].push') || content.includes('[].splice') || content.includes('[].findIndex')) {
      issues.push('Invalid empty array operations');
    }

    // Check for incomplete interface definitions
    if (content.match(/interface\s+\w+\s*{\s*}\s*interface/g)) {
      issues.push('Duplicate or malformed interfaces');
    }

    if (issues.length > 0) {
      syntaxIssues.push({
        file: relativePath,
        issues: issues
      });
    }
  }

  if (syntaxIssues.length > 0) {
    TEST_RESULTS.failed.push({
      test: 'Syntax Validation',
      issues: syntaxIssues
    });
    await log(`Found syntax issues in ${syntaxIssues.length} files`, 'error');
  } else {
    TEST_RESULTS.passed.push('Syntax Validation');
    await log('No syntax issues found', 'success');
  }

  return syntaxIssues.length === 0;
}

// Test 5: Check TypeScript compilation
async function testTypeScriptCompilation() {
  await log('Testing TypeScript compilation...', 'info');

  try {
    const { spawn } = await import('child_process');

    return new Promise((resolve) => {
      const tsc = spawn('npx', ['tsc', '--noEmit', '--skipLibCheck'], {
        cwd: projectRoot,
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      tsc.stdout.on('data', (data) => {
        output += data.toString();
      });

      tsc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      tsc.on('close', (code) => {
        if (code === 0) {
          TEST_RESULTS.passed.push('TypeScript Compilation');
          log('TypeScript compilation successful', 'success');
          resolve(true);
        } else {
          TEST_RESULTS.failed.push({
            test: 'TypeScript Compilation',
            error: errorOutput || output,
            exitCode: code
          });
          log(`TypeScript compilation failed with code ${code}`, 'error');
          resolve(false);
        }
      });
    });
  } catch (error) {
    TEST_RESULTS.warnings.push({
      test: 'TypeScript Compilation',
      message: `Could not run TypeScript compiler: ${error.message}`
    });
    await log('Could not run TypeScript compiler', 'warning');
    return false;
  }
}

// Test 6: Check for edge cases
async function testEdgeCases() {
  await log('Testing edge cases...', 'info');

  const srcDir = path.join(projectRoot, 'src');
  const files = await findAllFiles(srcDir);
  const edgeCases = [];

  for (const filePath of files) {
    const content = await readFileContent(filePath);
    if (!content) continue;

    const relativePath = path.relative(projectRoot, filePath);
    const issues = [];

    // Check for circular dependencies in type imports
    if (content.includes('import type') && content.includes('export interface')) {
      issues.push('Possible circular type dependencies');
    }

    // Check for hardcoded organization IDs
    if (content.match(/['"]org-\w+['"]/g)) {
      issues.push('Contains hardcoded organization IDs');
    }

    // Check for TODO comments indicating incomplete implementation
    const todoMatches = content.match(/TODO:.*database/gi);
    if (todoMatches && todoMatches.length > 3) {
      issues.push(`Multiple TODO comments (${todoMatches.length}) for database implementation`);
    }

    // Check for potential null pointer issues
    if (content.includes('user.orgId') && !content.includes('user.organization_id')) {
      issues.push('Using deprecated orgId property instead of organization_id');
    }

    if (issues.length > 0) {
      edgeCases.push({
        file: relativePath,
        issues: issues
      });
    }
  }

  if (edgeCases.length > 0) {
    TEST_RESULTS.warnings.push({
      test: 'Edge Cases',
      message: `Found ${edgeCases.length} files with potential edge cases`,
      issues: edgeCases
    });
    await log(`Found edge cases in ${edgeCases.length} files`, 'warning');
  } else {
    TEST_RESULTS.passed.push('Edge Cases');
    await log('No edge cases detected', 'success');
  }

  return edgeCases.length === 0;
}

// Test 7: Build test
async function testBuild() {
  await log('Testing build process...', 'info');

  try {
    const { spawn } = await import('child_process');

    return new Promise((resolve) => {
      const build = spawn('npm', ['run', 'build'], {
        cwd: projectRoot,
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      build.stdout.on('data', (data) => {
        output += data.toString();
      });

      build.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      build.on('close', (code) => {
        if (code === 0) {
          TEST_RESULTS.passed.push('Build Process');
          log('Build process successful', 'success');
          resolve(true);
        } else {
          // Parse build errors to find mock-related issues
          const mockRelatedErrors = [];
          const allErrors = (errorOutput + output).split('');

          for (const line of allErrors) {
            if (line.includes('mock') || line.includes('MOCK_') || line.includes('Cannot resolve module')) {
              mockRelatedErrors.push(line.trim());
            }
          }

          TEST_RESULTS.failed.push({
            test: 'Build Process',
            error: errorOutput || output,
            mockRelatedErrors: mockRelatedErrors,
            exitCode: code
          });
          log(`Build process failed with code ${code}`, 'error');
          if (mockRelatedErrors.length > 0) {
            log(`Found ${mockRelatedErrors.length} mock-related build errors`, 'error');
          }
          resolve(false);
        }
      });
    });
  } catch (error) {
    TEST_RESULTS.failed.push({
      test: 'Build Process',
      error: `Could not run build: ${error.message}`
    });
    await log('Could not run build process', 'error');
    return false;
  }
}

// Generate detailed report
async function generateReport() {
  await log('📊 GENERATING COMPREHENSIVE TEST REPORT...', 'info');

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: Object.values(TESTS).filter(Boolean).length,
      passed: TEST_RESULTS.passed.length,
      failed: TEST_RESULTS.failed.length,
      warnings: TEST_RESULTS.warnings.length
    },
    results: TEST_RESULTS
  };

  // Write detailed report
  const reportPath = path.join(projectRoot, 'mock-removal-test-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  // Console summary
  console.log('' + '='.repeat(60));
  console.log('             MOCK DATA REMOVAL TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`📊 Total Tests: ${report.summary.totalTests}`);
  console.log(`✅ Passed: ${report.summary.passed}`);
  console.log(`❌ Failed: ${report.summary.failed}`);
  console.log(`⚠️  Warnings: ${report.summary.warnings}`);
  console.log('='.repeat(60));

  if (report.summary.failed > 0) {
    console.log('❌ FAILED TESTS:');
    for (const failure of TEST_RESULTS.failed) {
      console.log(`   • ${failure.test}`);
      if (failure.issues) {
        console.log(`     Issues found in ${failure.issues.length} files`);
      }
    }
  }

  if (report.summary.warnings > 0) {
    console.log('⚠️  WARNINGS:');
    for (const warning of TEST_RESULTS.warnings) {
      console.log(`   • ${warning.test}: ${warning.message}`);
    }
  }

  console.log(`📄 Detailed report saved to: ${reportPath}`);

  const success = report.summary.failed === 0;
  const status = success ? 'PASSED' : 'FAILED';
  const icon = success ? '✅' : '❌';

  console.log(`${icon} OVERALL STATUS: ${status}`);

  return success;
}

// Main test runner
async function runTests() {
  await log('🚀 Starting comprehensive mock data removal tests...', 'info');

  const results = [];

  if (TESTS.mockImportCheck) {
    results.push(await testMockImports());
  }

  if (TESTS.mockVariableCheck) {
    results.push(await testMockVariables());
  }

  if (TESTS.supabaseImportCheck) {
    results.push(await testSupabaseImports());
  }

  if (TESTS.syntaxValidationCheck) {
    results.push(await testSyntaxValidation());
  }

  if (TESTS.edgeCaseCheck) {
    results.push(await testEdgeCases());
  }

  // Run compilation test
  if (TESTS.typeDefinitionCheck) {
    results.push(await testTypeScriptCompilation());
  }

  // Run build test last as it's most comprehensive
  if (TESTS.buildTestCheck) {
    results.push(await testBuild());
  }

  return await generateReport();
}

// Run the test suite
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});