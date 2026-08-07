import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = __dirname;

const PAGES = [
  { name: 'Main Page', url: path.join(PROJECT_ROOT, 'index.html') },
  { name: 'Case: Stomatology Clinic', url: path.join(PROJECT_ROOT, 'cases', 'stomatology-clinic', 'index.html') },
  { name: '404 Page', url: path.join(PROJECT_ROOT, '404.html') },
  { name: 'Model Viewer', url: path.join(PROJECT_ROOT, 'model-viewer.html') },
];

function fileUrl(filePath) {
  return pathToFileURL(filePath).href;
}

async function runAccessibilityTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  try {
    const results = {
      timestamp: new Date().toISOString(),
      wcagVersion: '2.2',
      targetLevel: 'AA',
      pages: []
    };

    for (const pageInfo of PAGES) {
      const page = await context.newPage();
      console.log(`Testing: ${pageInfo.name}`);
      
      try {
        await page.goto(fileUrl(pageInfo.url), { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const a11yResults = await new AxeBuilder({ page })
          .withTags(['wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .analyze();

        const violations = a11yResults.violations || [];
        const passes = a11yResults.passes || [];
        const incomplete = a11yResults.incomplete || [];
        const inapplicable = a11yResults.inapplicable || [];

        const pageResult = {
          name: pageInfo.name,
          url: pageInfo.url,
          violations: violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            tags: v.tags,
            nodes: v.nodes.map(n => ({
              html: n.html,
              target: n.target,
              failureSummary: n.failureSummary
            }))
          })),
          passes: passes.length,
          incomplete: incomplete.length,
          inapplicable: inapplicable.length,
          violationCount: violations.length,
          criticalViolations: violations.filter(v => v.impact === 'critical').length,
          seriousViolations: violations.filter(v => v.impact === 'serious').length,
          moderateViolations: violations.filter(v => v.impact === 'moderate').length,
          minorViolations: violations.filter(v => v.impact === 'minor').length
        };

        results.pages.push(pageResult);
        console.log(`  Violations: ${violations.length} (Critical: ${pageResult.criticalViolations}, Serious: ${pageResult.seriousViolations}, Moderate: ${pageResult.moderateViolations}, Minor: ${pageResult.minorViolations})`);
        
        if (violations.length > 0) {
          violations.forEach(v => {
            console.log(`    [${v.impact.toUpperCase()}] ${v.id}: ${v.description}`);
            v.nodes.forEach(n => {
              console.log(`      Element: ${n.target.join(' > ')}`);
              console.log(`      Issue: ${n.failureSummary}`);
            });
          });
        }
      } catch (error) {
        console.error(`Error testing ${pageInfo.name}:`, error.message);
        results.pages.push({
          name: pageInfo.name,
          url: pageInfo.url,
          error: error.message
        });
      } finally {
        await page.close().catch(() => {});
      }
    }

    // Calculate overall compliance
    const totalViolations = results.pages.reduce((sum, p) => sum + (p.violationCount || 0), 0);
    const totalCritical = results.pages.reduce((sum, p) => sum + (p.criticalViolations || 0), 0);
    const totalSerious = results.pages.reduce((sum, p) => sum + (p.seriousViolations || 0), 0);
    const totalModerate = results.pages.reduce((sum, p) => sum + (p.moderateViolations || 0), 0);
    const totalMinor = results.pages.reduce((sum, p) => sum + (p.minorViolations || 0), 0);

    results.summary = {
      totalPages: PAGES.length,
      testedPages: results.pages.filter(p => !p.error).length,
      errorPages: results.pages.filter(p => p.error).length,
      totalViolations,
      totalCritical,
      totalSerious,
      totalModerate,
      totalMinor,
      complianceLevel: totalCritical === 0 && totalSerious === 0 ? 'AA' : 
                       totalCritical === 0 ? 'A' : 'Non-compliant'
    };

    // Save JSON results
    const jsonPath = path.join(__dirname, 'accessibility-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`\nJSON results saved to: ${jsonPath}`);
    
    // Generate HTML report
    const htmlPath = path.join(__dirname, 'accessibility-report.html');
    generateHtmlReport(results, htmlPath);
    console.log(`HTML report saved to: ${htmlPath}`);
    
    return results;
  } finally {
    await browser.close().catch(() => {});
  }
}

function generateHtmlReport(results, outputPath) {
  const { summary, pages, timestamp, wcagVersion, targetLevel } = results;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Test Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: #2c3e50; color: white; padding: 30px; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header .meta { opacity: 0.8; font-size: 14px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; background: #f8f9fa; border-bottom: 1px solid #eee; }
    .summary-card { background: white; padding: 20px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .summary-card h3 { font-size: 14px; color: #666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-card .value { font-size: 32px; font-weight: 700; }
    .summary-card.compliant .value { color: #27ae60; }
    .summary-card.non-compliant .value { color: #e74c3c; }
    .summary-card.warning .value { color: #f39c12; }
    .page { border-bottom: 1px solid #eee; }
    .page:last-child { border-bottom: none; }
    .page-header { padding: 20px 30px; background: #fafafa; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
    .page-header:hover { background: #f0f0f0; }
    .page-title { font-weight: 600; font-size: 16px; }
    .page-badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .badge-critical { background: #fadbd8; color: #c0392b; }
    .badge-serious { background: #fadbd8; color: #e67e22; }
    .badge-moderate { background: #fef9e7; color: #f39c12; }
    .badge-minor { background: #e8f8f5; color: #27ae60; }
    .badge-error { background: #fadbd8; color: #c0392b; }
    .badge-pass { background: #e8f8f5; color: #27ae60; }
    .page-content { padding: 0 30px 30px; display: none; }
    .page-content.open { display: block; }
    .violation { background: #fff; border: 1px solid #eee; border-radius: 6px; margin-top: 15px; padding: 20px; }
    .violation-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; flex-wrap: wrap; gap: 10px; }
    .violation-id { font-family: monospace; font-size: 14px; color: #2c3e50; }
    .violation-desc { color: #555; margin-top: 5px; }
    .violation-help { color: #3498db; font-size: 14px; margin-top: 5px; }
    .violation-nodes { margin-top: 15px; }
    .node { background: #f8f9fa; border-radius: 4px; padding: 12px; margin-bottom: 10px; font-family: monospace; font-size: 13px; overflow-x: auto; }
    .node-target { color: #2c3e50; margin-bottom: 5px; }
    .node-failure { color: #c0392b; }
    .error-page { padding: 20px; background: #fdf2f2; border-radius: 6px; color: #c0392b; }
    .toggle { background: none; border: none; cursor: pointer; padding: 5px; color: #666; }
    .toggle:hover { color: #2c3e50; }
    .compliance-badge { display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-top: 10px; }
    .compliance-AA { background: #e8f8f5; color: #27ae60; }
    .compliance-A { background: #fef9e7; color: #f39c12; }
    .compliance-Non-compliant { background: #fadbd8; color: #c0392b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Accessibility Test Report</h1>
      <div class="meta">WCAG ${wcagVersion} Level ${targetLevel} | Generated: ${new Date(timestamp).toLocaleString()}</div>
    </div>
    
    <div class="summary">
      <div class="summary-card ${summary.complianceLevel === 'AA' ? 'compliant' : summary.complianceLevel === 'A' ? 'warning' : 'non-compliant'}">
        <h3>Compliance Level</h3>
        <div class="value">${summary.complianceLevel}</div>
      </div>
      <div class="summary-card">
        <h3>Total Pages</h3>
        <div class="value">${summary.totalPages}</div>
      </div>
      <div class="summary-card">
        <h3>Tested</h3>
        <div class="value">${summary.testedPages}</div>
      </div>
      <div class="summary-card">
        <h3>Errors</h3>
        <div class="value">${summary.errorPages}</div>
      </div>
      <div class="summary-card">
        <h3>Total Violations</h3>
        <div class="value">${summary.totalViolations}</div>
      </div>
      <div class="summary-card">
        <h3>Critical</h3>
        <div class="value">${summary.totalCritical}</div>
      </div>
      <div class="summary-card">
        <h3>Serious</h3>
        <div class="value">${summary.totalSerious}</div>
      </div>
      <div class="summary-card">
        <h3>Moderate</h3>
        <div class="value">${summary.totalModerate}</div>
      </div>
      <div class="summary-card">
        <h3>Minor</h3>
        <div class="value">${summary.totalMinor}</div>
      </div>
    </div>
    
    <div class="pages">
      ${pages.map((page, index) => {
        if (page.error) {
          return `<div class="page">
            <div class="page-header">
              <span class="page-title">${page.name}</span>
              <span class="badge badge-error">Error</span>
            </div>
            <div class="page-content">
              <div class="error-page">Error: ${page.error}</div>
            </div>
          </div>`;
        }
        
        const violationBadges = [];
        if (page.criticalViolations > 0) violationBadges.push(`<span class="badge badge-critical">Critical: ${page.criticalViolations}</span>`);
        if (page.seriousViolations > 0) violationBadges.push(`<span class="badge badge-serious">Serious: ${page.seriousViolations}</span>`);
        if (page.moderateViolations > 0) violationBadges.push(`<span class="badge badge-moderate">Moderate: ${page.moderateViolations}</span>`);
        if (page.minorViolations > 0) violationBadges.push(`<span class="badge badge-minor">Minor: ${page.minorViolations}</span>`);
        if (page.violationCount === 0) violationBadges.push(`<span class="badge badge-pass">No Violations</span>`);
        
        return `<div class="page">
          <div class="page-header" onclick="togglePage(${index})">
            <span class="page-title">${page.name}</span>
            <div class="page-badges">${violationBadges.join('')}</div>
          </div>
          <div class="page-content" id="page-${index}">
            ${page.violations.length > 0 ? page.violations.map(v => `
              <div class="violation">
                <div class="violation-header">
                  <div>
                    <div class="violation-id">${v.id}</div>
                    <div class="violation-desc">${v.description}</div>
                    <div class="violation-help"><a href="${v.helpUrl}" target="_blank">${v.helpUrl}</a></div>
                  </div>
                  <span class="badge badge-${v.impact}">${v.impact.toUpperCase()}</span>
                </div>
                <div class="violation-nodes">
                  ${v.nodes.map(n => `
                    <div class="node">
                      <div class="node-target">Target: ${n.target.join(' > ')}</div>
                      <div class="node-failure">Issue: ${n.failureSummary}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('') : '<p style="color: #27ae60; padding: 20px;">No accessibility violations found!</p>'}
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>
  
  <script>
    function togglePage(index) {
      const content = document.getElementById('page-' + index);
      content.classList.toggle('open');
    }
  </script>
</body>
</html>`;
  
  fs.writeFileSync(outputPath, html);
}

runAccessibilityTest().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});