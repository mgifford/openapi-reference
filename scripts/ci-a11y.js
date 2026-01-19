#!/usr/bin/env node
/**
 * CI Accessibility Scanner
 * Uses Playwright + axe-core to scan pages for accessibility violations
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

const pages = [
  { url: '/', name: 'Landing Page' },
  { url: '/demo/', name: 'Demo App' }
];

async function scanPage(browser, pageInfo) {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log(`\n🔍 Scanning: ${pageInfo.name} (${BASE_URL}${pageInfo.url})`);
    await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'networkidle' });
    
    const results = await new AxeBuilder({ page }).analyze();
    
    if (results.violations.length === 0) {
      console.log(`✅ ${pageInfo.name}: No accessibility violations found`);
      return { page: pageInfo.name, violations: [] };
    }
    
    console.log(`❌ ${pageInfo.name}: ${results.violations.length} violation(s) found`);
    results.violations.forEach(violation => {
      console.log(`\n  Issue: ${violation.id} (${violation.impact})`);
      console.log(`  Description: ${violation.description}`);
      console.log(`  Help: ${violation.helpUrl}`);
      console.log(`  Affected elements: ${violation.nodes.length}`);
      violation.nodes.slice(0, 3).forEach(node => {
        console.log(`    - ${node.html.substring(0, 100)}...`);
      });
    });
    
    return { page: pageInfo.name, violations: results.violations };
  } finally {
    await context.close();
  }
}

async function main() {
  console.log('🚀 Starting accessibility scan...');
  console.log(`Base URL: ${BASE_URL}`);
  
  const browser = await chromium.launch();
  
  try {
    const results = [];
    for (const pageInfo of pages) {
      const result = await scanPage(browser, pageInfo);
      results.push(result);
    }
    
    const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Accessibility Scan Summary');
    console.log('='.repeat(60));
    results.forEach(r => {
      const status = r.violations.length === 0 ? '✅' : '❌';
      console.log(`${status} ${r.page}: ${r.violations.length} violation(s)`);
    });
    console.log('='.repeat(60));
    
    if (totalViolations > 0) {
      console.error(`\n❌ Found ${totalViolations} total accessibility violations`);
      process.exit(1);
    }
    
    console.log('\n✅ All pages passed accessibility checks!');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
