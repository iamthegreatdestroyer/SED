/**
 * SED - Semantic Entropy Differencing
 * Analysis Service
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import type { SEDEngine } from '@sed/core';
import type { GitClient, DiffExtractor } from '@sed/git';
import type {
  AnalysisResult,
  FileAnalysisResult,
  AnalysisSummary,
  ReportOptions,
  Classification,
} from '../types.js';
import type { ConfigurationService } from './configurationService.js';
import type { OutputChannelLogger } from '../utils/logger.js';

/**
 * Service for running SED analysis
 */
export class AnalysisService {
  private currentAnalysis: AnalysisResult | null = null;
  private fileResults: Map<string, FileAnalysisResult> = new Map();
  private engine: SEDEngine | null = null;
  private gitClient: GitClient | null = null;

  constructor(
    private readonly configService: ConfigurationService,
    private readonly logger: OutputChannelLogger
  ) {}

  /**
   * Analyze uncommitted changes in the workspace
   */
  async analyzeChanges(workspacePath: string): Promise<AnalysisResult> {
    this.logger.info(`Analyzing changes in ${workspacePath}`);

    // Lazy load dependencies to avoid startup overhead
    const { SEDEngine } = await import('@sed/core');
    const { GitClient, DiffExtractor } = await import('@sed/git');

    this.gitClient = new GitClient(workspacePath);
    const diffExtractor = new DiffExtractor(this.gitClient);
    this.engine = new SEDEngine({
      thresholds: this.configService.get('threshold'),
      languages: this.configService.get('languages'),
    });

    const diff = await diffExtractor.extract({
      from: this.configService.get('defaultRef'),
      to: 'HEAD',
    });

    const files: FileAnalysisResult[] = [];

    for (const file of diff.files) {
      try {
        const analysis = await this.engine.analyzeFile(file.path, {
          oldContent: file.oldContent,
          newContent: file.newContent,
          language: file.language,
        });

        const result: FileAnalysisResult = {
          path: file.path,
          relativePath: file.relativePath,
          status: file.status as 'added' | 'modified' | 'deleted' | 'renamed',
          language: file.language,
          classification: analysis.classification as Classification,
          entropy: analysis.metrics.totalEntropy,
          changes: analysis.changes.map((c) => ({
            type: c.type as 'added' | 'modified' | 'deleted',
            nodeType: c.nodeType,
            name: c.name,
            startLine: c.startLine,
            endLine: c.endLine,
            entropy: c.entropy,
            description: c.description,
          })),
          metrics: {
            additions: analysis.metrics.additions,
            deletions: analysis.metrics.deletions,
            modifications: analysis.metrics.modifications,
          },
        };

        files.push(result);
        this.fileResults.set(file.path, result);
      } catch (error) {
        this.logger.warn(`Failed to analyze ${file.path}: ${error}`);
      }
    }

    const summary = this.computeSummary(files);

    this.currentAnalysis = {
      from: this.configService.get('defaultRef'),
      to: 'HEAD',
      timestamp: new Date(),
      files,
      summary,
      stats: {
        additions: diff.stats.additions,
        deletions: diff.stats.deletions,
        filesChanged: diff.stats.filesChanged,
      },
    };

    this.logger.info(
      `Analysis complete: ${files.length} files, avg entropy ${summary.averageEntropy.toFixed(2)}`
    );

    return this.currentAnalysis;
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(filePath: string): Promise<FileAnalysisResult | null> {
    this.logger.info(`Analyzing file ${filePath}`);

    // Check if we have a cached result
    const cached = this.fileResults.get(filePath);
    if (cached) {
      return cached;
    }

    // Need full analysis for context
    const workspacePath = this.findWorkspacePath(filePath);
    if (workspacePath) {
      await this.analyzeChanges(workspacePath);
      return this.fileResults.get(filePath) || null;
    }

    return null;
  }

  /**
   * Compare two git references
   */
  async compareRefs(
    workspacePath: string,
    fromRef: string,
    toRef: string
  ): Promise<AnalysisResult> {
    this.logger.info(`Comparing ${fromRef}..${toRef} in ${workspacePath}`);

    const { SEDEngine } = await import('@sed/core');
    const { GitClient, DiffExtractor } = await import('@sed/git');

    this.gitClient = new GitClient(workspacePath);
    const diffExtractor = new DiffExtractor(this.gitClient);
    this.engine = new SEDEngine({
      thresholds: this.configService.get('threshold'),
      languages: this.configService.get('languages'),
    });

    const diff = await diffExtractor.extract({ from: fromRef, to: toRef });
    const files: FileAnalysisResult[] = [];

    for (const file of diff.files) {
      try {
        const analysis = await this.engine.analyzeFile(file.path, {
          oldContent: file.oldContent,
          newContent: file.newContent,
          language: file.language,
        });

        files.push({
          path: file.path,
          relativePath: file.relativePath,
          status: file.status as 'added' | 'modified' | 'deleted' | 'renamed',
          language: file.language,
          classification: analysis.classification as Classification,
          entropy: analysis.metrics.totalEntropy,
          changes: analysis.changes.map((c) => ({
            type: c.type as 'added' | 'modified' | 'deleted',
            nodeType: c.nodeType,
            name: c.name,
            startLine: c.startLine,
            endLine: c.endLine,
            entropy: c.entropy,
            description: c.description,
          })),
          metrics: {
            additions: analysis.metrics.additions,
            deletions: analysis.metrics.deletions,
            modifications: analysis.metrics.modifications,
          },
        });
      } catch (error) {
        this.logger.warn(`Failed to analyze ${file.path}: ${error}`);
      }
    }

    const summary = this.computeSummary(files);

    return {
      from: fromRef,
      to: toRef,
      timestamp: new Date(),
      files,
      summary,
      stats: {
        additions: diff.stats.additions,
        deletions: diff.stats.deletions,
        filesChanged: diff.stats.filesChanged,
      },
    };
  }

  /**
   * Generate a report
   */
  async generateReport(workspacePath: string, options: ReportOptions): Promise<string> {
    this.logger.info(`Generating ${options.format} report for ${workspacePath}`);

    // Ensure we have analysis data
    if (!this.currentAnalysis) {
      await this.analyzeChanges(workspacePath);
    }

    const { writeFile, mkdir } = await import('fs/promises');
    const { join, dirname } = await import('path');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = options.format === 'markdown' ? 'md' : options.format;
    const filename = `sed-report-${timestamp}.${extension}`;
    const outputPath = options.outputPath || join(workspacePath, '.sed', 'reports', filename);

    await mkdir(dirname(outputPath), { recursive: true });

    let content: string;
    switch (options.format) {
      case 'html':
        content = this.generateHtmlReport(options.title);
        break;
      case 'markdown':
        content = this.generateMarkdownReport(options.title);
        break;
      case 'json':
        content = JSON.stringify(this.currentAnalysis, null, 2);
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }

    await writeFile(outputPath, content, 'utf-8');
    this.logger.info(`Report written to ${outputPath}`);

    return outputPath;
  }

  /**
   * Get current analysis results
   */
  getCurrentAnalysis(): AnalysisResult | null {
    return this.currentAnalysis;
  }

  /**
   * Get analysis for a specific file
   */
  getFileAnalysis(filePath: string): FileAnalysisResult | undefined {
    return this.fileResults.get(filePath);
  }

  /**
   * Clear cached analysis
   */
  clearCache(): void {
    this.currentAnalysis = null;
    this.fileResults.clear();
  }

  private computeSummary(files: FileAnalysisResult[]): AnalysisSummary {
    const classifications: Record<Classification, number> = {
      trivial: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let totalEntropy = 0;
    for (const file of files) {
      classifications[file.classification]++;
      totalEntropy += file.entropy;
    }

    const averageEntropy = files.length > 0 ? totalEntropy / files.length : 0;

    const highestImpact = [...files].sort((a, b) => b.entropy - a.entropy).slice(0, 5);

    return {
      totalFiles: files.length,
      totalEntropy,
      averageEntropy,
      classifications,
      highestImpact,
    };
  }

  private findWorkspacePath(filePath: string): string | null {
    const vscode = require('vscode');
    const uri = vscode.Uri.file(filePath);
    const folder = vscode.workspace.getWorkspaceFolder(uri);
    return folder?.uri.fsPath || null;
  }

  private generateHtmlReport(title?: string): string {
    const data = this.currentAnalysis!;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'SED Analysis Report'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; }
    h1 { color: #333; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
    .stat { padding: 15px; border-radius: 8px; background: #f5f5f5; }
    .files { margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
    .trivial { color: #28a745; }
    .low { color: #17a2b8; }
    .medium { color: #ffc107; }
    .high { color: #fd7e14; }
    .critical { color: #dc3545; }
  </style>
</head>
<body>
  <h1>${title || 'SED Analysis Report'}</h1>
  <p>Generated: ${data.timestamp.toISOString()}</p>
  <p>Comparing: ${data.from} → ${data.to}</p>
  
  <h2>Summary</h2>
  <div class="summary">
    <div class="stat"><strong>Files:</strong> ${data.summary.totalFiles}</div>
    <div class="stat"><strong>Total Entropy:</strong> ${data.summary.totalEntropy.toFixed(2)}</div>
    <div class="stat"><strong>Average:</strong> ${data.summary.averageEntropy.toFixed(2)}</div>
  </div>

  <h2>Files</h2>
  <table>
    <thead><tr><th>File</th><th>Classification</th><th>Entropy</th></tr></thead>
    <tbody>
      ${data.files.map((f) => `<tr><td>${f.relativePath}</td><td class="${f.classification}">${f.classification}</td><td>${f.entropy.toFixed(2)}</td></tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`;
  }

  private generateMarkdownReport(title?: string): string {
    const data = this.currentAnalysis!;
    return `# ${title || 'SED Analysis Report'}

Generated: ${data.timestamp.toISOString()}
Comparing: \`${data.from}\` → \`${data.to}\`

## Summary

| Metric | Value |
|--------|-------|
| Files Analyzed | ${data.summary.totalFiles} |
| Total Entropy | ${data.summary.totalEntropy.toFixed(2)} |
| Average Entropy | ${data.summary.averageEntropy.toFixed(2)} |

## Files

| File | Classification | Entropy |
|------|----------------|---------|
${data.files.map((f) => `| ${f.relativePath} | ${f.classification} | ${f.entropy.toFixed(2)} |`).join('\n')}
`;
  }
}
