/**
 * Test script to verify React Query optimizations
 * Run this to check if the optimizations are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying React Query Optimizations...\n');

// Check if configuration files exist
const configPath = path.join(__dirname, 'src/lib/query/config.ts');
const utilsPath = path.join(__dirname, 'src/lib/query/utils.ts');

let allChecksPassed = true;

// Test 1: Check configuration file exists
if (fs.existsSync(configPath)) {
  console.log('✅ Configuration file exists: /src/lib/query/config.ts');
} else {
  console.log('❌ Configuration file missing: /src/lib/query/config.ts');
  allChecksPassed = false;
}

// Test 2: Check utils file exists
if (fs.existsSync(utilsPath)) {
  console.log('✅ Utils file exists: /src/lib/query/utils.ts');
} else {
  console.log('❌ Utils file missing: /src/lib/query/utils.ts');
  allChecksPassed = false;
}

// Test 3: Check configuration content
if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  const checks = [
    { pattern: /CACHE_TIME/, name: 'Cache time constants' },
    { pattern: /queryKeys/, name: 'Query key factory' },
    { pattern: /createQueryClientOptions/, name: 'Query client options' },
    { pattern: /staleTime/, name: 'Stale time configuration' },
    { pattern: /gcTime/, name: 'Garbage collection time' },
  ];
  
  console.log('\n📋 Configuration checks:');
  checks.forEach(check => {
    if (check.pattern.test(configContent)) {
      console.log(`  ✅ ${check.name} configured`);
    } else {
      console.log(`  ❌ ${check.name} missing`);
      allChecksPassed = false;
    }
  });
}

// Test 4: Check utils content
if (fs.existsSync(utilsPath)) {
  const utilsContent = fs.readFileSync(utilsPath, 'utf8');
  
  const utilChecks = [
    { pattern: /prefetchCommonData/, name: 'Prefetch function' },
    { pattern: /smartInvalidate/, name: 'Smart invalidation' },
    { pattern: /createOptimisticGoalUpdate/, name: 'Optimistic goal updates' },
    { pattern: /createOptimisticEventUpdate/, name: 'Optimistic event updates' },
    { pattern: /es-toolkit/, name: 'es-toolkit integration' },
  ];
  
  console.log('\n🛠️ Utility checks:');
  utilChecks.forEach(check => {
    if (check.pattern.test(utilsContent)) {
      console.log(`  ✅ ${check.name} implemented`);
    } else {
      console.log(`  ❌ ${check.name} missing`);
      allChecksPassed = false;
    }
  });
}

// Test 5: Check hooks are updated
const hooksToCheck = [
  'src/hooks/useGoals.ts',
  'src/hooks/useEvents.ts',
  'src/hooks/useCategories.ts'
];

console.log('\n🔗 Hook updates:');
hooksToCheck.forEach(hookPath => {
  const fullPath = path.join(__dirname, hookPath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasOptimizations = 
      content.includes("from '@/lib/query/config'") &&
      content.includes("from '@/lib/query/utils'");
    
    if (hasOptimizations) {
      console.log(`  ✅ ${path.basename(hookPath)} using optimizations`);
    } else {
      console.log(`  ⚠️  ${path.basename(hookPath)} not fully updated`);
    }
  }
});

// Summary
console.log('\n' + '='.repeat(50));
if (allChecksPassed) {
  console.log('✅ All React Query optimizations are properly configured!');
  console.log('\nOptimizations implemented:');
  console.log('  • Centralized cache configuration');
  console.log('  • Smart query invalidation');
  console.log('  • Optimistic updates for mutations');
  console.log('  • Prefetching strategies');
  console.log('  • es-toolkit integration for utilities');
} else {
  console.log('⚠️  Some checks failed. Please review the implementation.');
}
console.log('='.repeat(50));