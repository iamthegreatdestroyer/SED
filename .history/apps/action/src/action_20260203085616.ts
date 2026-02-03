/**
 * SED - Semantic Entropy Differencing
 * GitHub Action Core Logic
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import type { Context } from '@actions/github/lib/context';
import type { GitHub } from '@actions/github/lib/utils';
import { analyzeCommitRange } from './analyzer';
import { formatMarkdownReport, formatPRComment } from './formatter';
import type { ActionInputs, ActionResult, AnalysisResult } from './types';

const CLASSIFICATION_THRESHOLD: Record<string, number> = {
  trivial: 0.5,
  low: 1.5,
  medium: 3.0,
  high: 4.5,
  critical: Infinity,
};

export async function runAction(
  inputs: ActionInputs,
  context: Context,
  octokit?: InstanceType<typeof GitHub>
): Promise<ActionResult> {
  core.info('🔍 SED - Semantic Entropy Differencing');
  core.info('━'.repeat(50));

  // Determine commits to compare
  const { base, head } = resolveCommits(inputs, context);
  core.info(`Comparing: ${base} → ${head}`);

  // Parse include/exclude patterns
  const include = inputs.include ? inputs.include.split(',').map((p) => p.trim()) : undefined;
  const exclude = inputs.exclude
    ? inputs.exclude.split(',').map((p) => p.trim())
    : ['node_modules/**', 'dist/**', '.git/**'];

  // Run analysis
  core.startGroup('Analyzing changes...');
  const analysis = await analyzeCommitRange({
    from: base,
    to: head,
    path: inputs.path,
    include,
    exclude,
  });
  core.endGroup();

  // Determine overall classification
  const classification = determineClassification(analysis);

  // Check failure conditions
  const { shouldFail, failureMessage } = checkFailureConditions(inputs, analysis, classification);

  // Generate outputs
  const result: ActionResult = {
    analysis,
    summary: {
      totalEntropy: analysis.summary.totalEntropy,
      averageEntropy: analysis.summary.averageEntropy,
      totalFiles: analysis.summary.totalFiles,
    },
    classification,
    shouldFail,
    failureMessage,
  };

  // Write summary to GitHub Actions
  if (inputs.summary) {
    await writeSummary(analysis, classification);
  }

  // Write JSON output
  if (inputs.jsonOutput) {
    const jsonPath = path.resolve(inputs.jsonOutput);
    fs.writeFileSync(jsonPath, JSON.stringify(analysis, null, 2));
    core.info(`📄 JSON output written to: ${jsonPath}`);
  }

  // Write Markdown output
  if (inputs.markdownOutput) {
    const mdPath = path.resolve(inputs.markdownOutput);
    const markdown = formatMarkdownReport(analysis);
    fs.writeFileSync(mdPath, markdown);
    core.info(`📄 Markdown output written to: ${mdPath}`);
  }

  // Post PR comment
  if (inputs.comment && octokit && context.payload.pull_request) {
    await postPRComment(octokit, context, analysis);
  }

  // Log summary
  logSummary(analysis, classification);

  return result;
}

function resolveCommits(inputs: ActionInputs, context: Context): { base: string; head: string } {
  let base = inputs.base;
  let head = inputs.head;

  // Auto-detect for pull requests
  if (context.payload.pull_request) {
    base = base || context.payload.pull_request.base.sha;
    head = head || context.payload.pull_request.head.sha;
  }

  // Auto-detect for push events
  if (context.eventName === 'push') {
    base = base || context.payload.before;
    head = head || context.payload.after;
  }

  // Default fallback
  base = base || 'HEAD~1';
  head = head || 'HEAD';

  return { base, head };
}

function determineClassification(
  analysis: AnalysisResult
): 'trivial' | 'low' | 'medium' | 'high' | 'critical' {
  const avgEntropy = analysis.summary.averageEntropy;

  if (avgEntropy < CLASSIFICATION_THRESHOLD.trivial) return 'trivial';
  if (avgEntropy < CLASSIFICATION_THRESHOLD.low) return 'low';
  if (avgEntropy < CLASSIFICATION_THRESHOLD.medium) return 'medium';
  if (avgEntropy < CLASSIFICATION_THRESHOLD.high) return 'high';
  return 'critical';
}

function checkFailureConditions(
  inputs: ActionInputs,
  analysis: AnalysisResult,
  classification: string
): { shouldFail: boolean; failureMessage?: string } {
  if (inputs.failOn === 'never') {
    return { shouldFail: false };
  }

  // Custom threshold
  if (inputs.threshold) {
    const threshold = parseFloat(inputs.threshold);
    if (analysis.summary.averageEntropy > threshold) {
      return {
        shouldFail: true,
        failureMessage: `Average entropy (${analysis.summary.averageEntropy.toFixed(2)}) exceeds threshold (${threshold})`,
      };
    }
    return { shouldFail: false };
  }

  // Classification-based failure
  const classificationOrder = ['trivial', 'low', 'medium', 'high', 'critical'];
  const failIndex = classificationOrder.indexOf(inputs.failOn);
  const currentIndex = classificationOrder.indexOf(classification);

  if (currentIndex >= failIndex) {
    return {
      shouldFail: true,
      failureMessage: `Classification "${classification}" exceeds threshold "${inputs.failOn}"`,
    };
  }

  return { shouldFail: false };
}

async function writeSummary(analysis: AnalysisResult, classification: string): Promise<void> {
  const classificationEmoji: Record<string, string> = {
    trivial: '✅',
    low: '💚',
    medium: '💛',
    high: '🟠',
    critical: '🔴',
  };

  await core.summary
    .addHeading('SED Analysis Results')
    .addTable([
      [
        { data: 'Metric', header: true },
        { data: 'Value', header: true },
      ],
      ['Files Analyzed', analysis.summary.totalFiles.toString()],
      ['Total Entropy', analysis.summary.totalEntropy.toFixed(2)],
      ['Average Entropy', analysis.summary.averageEntropy.toFixed(2)],
      ['Classification', `${classificationEmoji[classification]} ${classification.toUpperCase()}`],
    ])
    .addBreak()
    .addDetails(
      'Top Entropy Files',
      analysis.files
        .sort((a, b) => b.entropy - a.entropy)
        .slice(0, 10)
        .map((f) => `- \`${f.relativePath}\`: ${f.entropy.toFixed(2)} (${f.classification})`)
        .join('\n')
    )
    .write();
}

async function postPRComment(
  octokit: InstanceType<typeof GitHub>,
  context: Context,
  analysis: AnalysisResult
): Promise<void> {
  const prNumber = context.payload.pull_request?.number;
  if (!prNumber) return;

  const comment = formatPRComment(analysis);

  // Check for existing SED comment
  const { data: comments } = await octokit.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: prNumber,
  });

  const existingComment = comments.find((c) => c.body?.includes('<!-- SED Analysis -->'));

  if (existingComment) {
    // Update existing comment
    await octokit.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: existingComment.id,
      body: comment,
    });
    core.info('📝 Updated existing PR comment');
  } else {
    // Create new comment
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: prNumber,
      body: comment,
    });
    core.info('📝 Created PR comment');
  }
}

function logSummary(analysis: AnalysisResult, classification: string): void {
  core.info('');
  core.info('📊 Analysis Summary');
  core.info('━'.repeat(50));
  core.info(`Files Analyzed: ${analysis.summary.totalFiles}`);
  core.info(`Total Entropy:  ${analysis.summary.totalEntropy.toFixed(2)}`);
  core.info(`Avg Entropy:    ${analysis.summary.averageEntropy.toFixed(2)}`);
  core.info(`Classification: ${classification.toUpperCase()}`);
  core.info('━'.repeat(50));

  // Distribution
  core.info('');
  core.info('Classification Distribution:');
  Object.entries(analysis.summary.classifications).forEach(([cls, count]) => {
    if (count > 0) {
      core.info(`  ${cls}: ${count}`);
    }
  });
}
