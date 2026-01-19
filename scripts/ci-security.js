#!/usr/bin/env node
/**
 * CI Security Scanner
 * Static code analysis for common security issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const patterns = [
  {
    name: 'Hardcoded Secrets',
    regex: /(password|secret|api[_-]?key|token)\s*[:=]\s*['"][^'"]+['"]/gi,
    severity: 'high'
  },
  {
    name: 'Eval Usage',
    regex: /\beval\s*\(/g,
    severity: 'high'
  },
  {
    name: 'innerHTML Assignment',
    regex: /\.innerHTML\s*=/g,
    severity: 'medium',
    whitelist: ['components.js'] // Allow in specific files
  },
  {
    name: 'Unsafe Protocol',
    regex: /javascript:/g,
    severity: 'medium',
    whitelist: ['bookmarklet'] // Allow in bookmarklet code
  }
];

function scanFile(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  patterns.forEach(pattern => {
    const matches = [...content.matchAll(pattern.regex)];
    matches.forEach(match => {
      // Check whitelist
      if (pattern.whitelist && pattern.whitelist.some(w => relativePath.includes(w))) {
        return;
      }
      
      const lines = content.substring(0, match.index).split('\n');
      const lineNum = lines.length;
      
      issues.push({
        file: relativePath,
        line: lineNum,
        pattern: pattern.name,
        severity: pattern.severity,
        match: match[0]
      });
    });
  });
  
  return issues;
}

function scanDirectory(dir, baseDir = dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    // Skip node_modules, .git, etc.
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }
    
    if (entry.isDirectory()) {
      scanDirectory(fullPath, baseDir, results);
    } else if (entry.name.match(/\.(js|html)$/)) {
      const issues = scanFile(fullPath, relativePath);
      results.push(...issues);
    }
  }
  
  return results;
}

function main() {
  console.log('🔒 Starting security scan...');
  
  const projectRoot = path.join(__dirname, '..');
  const issues = scanDirectory(projectRoot);
  
  const grouped = issues.reduce((acc, issue) => {
    if (!acc[issue.severity]) acc[issue.severity] = [];
    acc[issue.severity].push(issue);
    return acc;
  }, {});
  
  console.log('\n' + '='.repeat(60));
  console.log('🔒 Security Scan Summary');
  console.log('='.repeat(60));
  
  if (issues.length === 0) {
    console.log('✅ No security issues found');
    return;
  }
  
  ['high', 'medium', 'low'].forEach(severity => {
    if (grouped[severity]) {
      console.log(`\n${severity.toUpperCase()} (${grouped[severity].length}):`);
      grouped[severity].forEach(issue => {
        console.log(`  ❌ ${issue.file}:${issue.line}`);
        console.log(`     ${issue.pattern}: ${issue.match}`);
      });
    }
  });
  
  console.log('='.repeat(60));
  
  // Only fail on high severity issues
  if (grouped.high && grouped.high.length > 0) {
    console.error(`\n❌ Found ${grouped.high.length} high-severity security issues`);
    process.exit(1);
  }
  
  if (grouped.medium) {
    console.warn(`\n⚠️  Found ${grouped.medium.length} medium-severity issues (not blocking)`);
  }
  
  console.log('\n✅ No high-severity security issues found');
}

main();
