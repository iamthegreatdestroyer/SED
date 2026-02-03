/**
 * SED - Semantic Entropy Differencing
 * CLI HTML Report Generator
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type { ReportData, ReportOptions } from '../types.js';

/**
 * Generate HTML report
 */
export function generateHtmlReport(data: ReportData, options: ReportOptions): string {
  const classificationColors: Record<string, string> = {
    trivial: '#9CA3AF',
    low: '#22C55E',
    medium: '#EAB308',
    high: '#EF4444',
    critical: '#DC2626',
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1F2937;
      background: #F9FAFB;
      padding: 2rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
      color: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .subtitle { opacity: 0.9; font-size: 0.95rem; }
    .meta { display: flex; gap: 2rem; margin-top: 1rem; font-size: 0.875rem; }
    .meta-item { display: flex; align-items: center; gap: 0.5rem; }
    .section {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .section h2 {
      font-size: 1.25rem;
      color: #374151;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #E5E7EB;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
    .stat-card {
      background: #F3F4F6;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value { font-size: 1.75rem; font-weight: bold; color: #3B82F6; }
    .stat-label { font-size: 0.875rem; color: #6B7280; }
    .classification-bar {
      display: flex;
      height: 24px;
      border-radius: 12px;
      overflow: hidden;
      margin: 1rem 0;
    }
    .classification-segment {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #E5E7EB;
    }
    th { 
      background: #F9FAFB;
      font-weight: 600;
      color: #374151;
    }
    tr:hover { background: #F9FAFB; }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .status-added { color: #22C55E; }
    .status-deleted { color: #EF4444; }
    .status-modified { color: #EAB308; }
    .changelog {
      white-space: pre-wrap;
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 0.875rem;
      background: #1F2937;
      color: #F9FAFB;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
    }
    footer {
      text-align: center;
      padding: 2rem;
      color: #9CA3AF;
      font-size: 0.875rem;
    }
    footer a { color: #3B82F6; text-decoration: none; }
    .entropy-bar {
      height: 8px;
      background: #E5E7EB;
      border-radius: 4px;
      overflow: hidden;
    }
    .entropy-fill {
      height: 100%;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapeHtml(data.title)}</h1>
      <p class="subtitle">Semantic Entropy Differencing Report</p>
      <div class="meta">
        <div class="meta-item">
          <strong>From:</strong> ${escapeHtml(data.from)}
        </div>
        <div class="meta-item">
          <strong>To:</strong> ${escapeHtml(data.to)}
        </div>
        <div class="meta-item">
          <strong>Generated:</strong> ${data.generatedAt.toISOString()}
        </div>
      </div>
    </header>

    <section class="section">
      <h2>📊 Summary Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${data.summary.totalFiles}</div>
          <div class="stat-label">Files Analyzed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #22C55E;">+${data.stats.additions}</div>
          <div class="stat-label">Lines Added</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #EF4444;">-${data.stats.deletions}</div>
          <div class="stat-label">Lines Deleted</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.stats.totalCommits}</div>
          <div class="stat-label">Commits</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.summary.averageEntropy.toFixed(2)}</div>
          <div class="stat-label">Avg Entropy</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.summary.totalEntropy.toFixed(2)}</div>
          <div class="stat-label">Total Entropy</div>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>🎯 Classification Distribution</h2>
      ${generateClassificationBar(data.summary.classifications, classificationColors)}
      <div style="display: flex; justify-content: space-between; margin-top: 1rem;">
        ${Object.entries(data.summary.classifications)
          .map(
            ([cls, count]) => `
          <div style="text-align: center;">
            <div class="badge" style="background: ${classificationColors[cls]}; color: white;">${count}</div>
            <div style="font-size: 0.75rem; color: #6B7280; margin-top: 0.25rem;">${cls}</div>
          </div>
        `
          )
          .join('')}
      </div>
    </section>

    <section class="section">
      <h2>⚡ Highest Impact Files</h2>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Entropy</th>
            <th>Classification</th>
          </tr>
        </thead>
        <tbody>
          ${data.summary.highestImpact
            .map(
              (file) => `
            <tr>
              <td><code>${escapeHtml(file.file)}</code></td>
              <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span>${file.entropy.toFixed(3)}</span>
                  <div class="entropy-bar" style="flex: 1; max-width: 100px;">
                    <div class="entropy-fill" style="width: ${Math.min((file.entropy / 10) * 100, 100)}%; background: ${classificationColors[file.classification]};"></div>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge" style="background: ${classificationColors[file.classification]}; color: white;">${file.classification}</span>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>📁 All Files</h2>
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>File</th>
            <th>Language</th>
            <th>Entropy</th>
            <th>Classification</th>
          </tr>
        </thead>
        <tbody>
          ${data.files
            .map((file) => {
              const statusClass = `status-${file.status}`;
              const entropy = file.analysis?.metrics.totalEntropy ?? 0;
              const classification = file.analysis?.classification ?? 'unknown';
              return `
              <tr>
                <td><span class="${statusClass}">${getStatusSymbol(file.status)}</span></td>
                <td><code>${escapeHtml(file.file)}</code></td>
                <td>${file.language || '-'}</td>
                <td>${file.error ? '<span style="color: #EF4444;">Error</span>' : entropy.toFixed(3)}</td>
                <td>
                  ${
                    file.error
                      ? '<span style="color: #EF4444;">Failed</span>'
                      : `
                    <span class="badge" style="background: ${classificationColors[classification] || '#9CA3AF'}; color: white;">${classification}</span>
                  `
                  }
                </td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>
    </section>

    ${
      data.changelog
        ? `
      <section class="section">
        <h2>📝 Changelog</h2>
        <div class="changelog">${escapeHtml(data.changelog)}</div>
      </section>
    `
        : ''
    }

    <footer>
      Generated by <a href="https://github.com/sgbilod/sed">SED</a> - Semantic Entropy Differencing
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Generate classification bar HTML
 */
function generateClassificationBar(
  classifications: Record<string, number>,
  colors: Record<string, string>
): string {
  const total = Object.values(classifications).reduce((a, b) => a + b, 0);
  if (total === 0)
    return '<div class="classification-bar" style="background: #E5E7EB;">No data</div>';

  const segments = Object.entries(classifications)
    .filter(([_, count]) => count > 0)
    .map(([cls, count]) => {
      const percentage = (count / total) * 100;
      return `<div class="classification-segment" style="width: ${percentage}%; background: ${colors[cls]};" title="${cls}: ${count}">${percentage > 10 ? cls : ''}</div>`;
    })
    .join('');

  return `<div class="classification-bar">${segments}</div>`;
}

/**
 * Get status symbol
 */
function getStatusSymbol(status: string): string {
  const symbols: Record<string, string> = {
    added: '+',
    deleted: '-',
    modified: '~',
    renamed: '→',
    copied: '⊕',
  };
  return symbols[status] || status;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const escapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => escapes[char] || char);
}
