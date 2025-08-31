#!/usr/bin/env node

/**
 * AI Personal Trainer - Unused Import Cleaner
 * Automatically removes unused imports detected by TypeScript
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Cleaning unused imports...');

// Get TypeScript errors for unused imports
let tscOutput;
try {
  execSync('pnpm type-check', { stdio: 'pipe' });
  console.log('✅ No TypeScript errors found!');
  process.exit(0);
} catch (error) {
  tscOutput = error.stdout.toString();
}

// Parse unused import errors
const unusedImportRegex =
  /(.+?)\((\d+),(\d+)\): error TS6133: '(.+?)' is declared but its value is never read\./g;
const unusedImportLineRegex =
  /(.+?)\((\d+),(\d+)\): error TS6192: All imports in import declaration are unused\./g;

const filesToFix = new Map();

// Collect unused imports
let match;
while ((match = unusedImportRegex.exec(tscOutput)) !== null) {
  const [, filePath, line, col, importName] = match;
  if (!filesToFix.has(filePath)) {
    filesToFix.set(filePath, { unusedImports: [], unusedLines: [] });
  }
  filesToFix
    .get(filePath)
    .unusedImports.push({ line: parseInt(line), importName });
}

// Collect completely unused import lines
while ((match = unusedImportLineRegex.exec(tscOutput)) !== null) {
  const [, filePath, line] = match;
  if (!filesToFix.has(filePath)) {
    filesToFix.set(filePath, { unusedImports: [], unusedLines: [] });
  }
  filesToFix.get(filePath).unusedLines.push(parseInt(line));
}

if (filesToFix.size === 0) {
  console.log('✅ No unused imports found!');
  process.exit(0);
}

console.log(`📁 Found unused imports in ${filesToFix.size} files`);

// Process each file
filesToFix.forEach((fixes, relativeFilePath) => {
  const filePath = path.resolve(process.cwd(), relativeFilePath);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  console.log(`🔧 Fixing ${relativeFilePath}`);

  // Remove completely unused import lines (from highest line number to lowest)
  fixes.unusedLines
    .sort((a, b) => b - a)
    .forEach((lineNum) => {
      if (lineNum > 0 && lineNum <= lines.length) {
        const line = lines[lineNum - 1];
        console.log(`   ❌ Removing line ${lineNum}: ${line.trim()}`);
        lines.splice(lineNum - 1, 1);
      }
    });

  // For individual unused imports, we'll let ESLint handle those
  // as it's more sophisticated at handling import syntax

  fs.writeFileSync(filePath, lines.join('\n'));
});

console.log('🎯 Running ESLint to fix remaining import issues...');
try {
  execSync('pnpm lint:fix', { stdio: 'inherit' });
  console.log('✅ ESLint fixes applied');
} catch (error) {
  console.log('⚠️ Some ESLint issues may need manual attention');
}

console.log('✅ Unused import cleanup completed!');
console.log('💡 Run "pnpm type-check" to verify fixes');
