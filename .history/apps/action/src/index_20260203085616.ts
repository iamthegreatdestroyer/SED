/**
 * SED - Semantic Entropy Differencing
 * GitHub Action Entry Point
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import * as core from '@actions/core';
import * as github from '@actions/github';
import { runAction } from './action';

async function main(): Promise<void> {
  try {
    const inputs = {
      base: core.getInput('base'),
      head: core.getInput('head'),
      path: core.getInput('path') || '.',
      include: core.getInput('include'),
      exclude: core.getInput('exclude'),
      failOn: core.getInput('fail-on') as 'critical' | 'high' | 'medium' | 'low' | 'never',
      threshold: core.getInput('threshold'),
      comment: core.getInput('comment') === 'true',
      jsonOutput: core.getInput('json-output'),
      markdownOutput: core.getInput('markdown-output'),
      summary: core.getInput('summary') === 'true',
    };

    const token = core.getInput('github-token') || process.env.GITHUB_TOKEN;
    const octokit = token ? github.getOctokit(token) : undefined;

    const result = await runAction(inputs, github.context, octokit);

    // Set outputs
    core.setOutput('total-entropy', result.summary.totalEntropy);
    core.setOutput('average-entropy', result.summary.averageEntropy);
    core.setOutput('files-analyzed', result.summary.totalFiles);
    core.setOutput('classification', result.classification);
    core.setOutput('json', JSON.stringify(result));

    // Fail if threshold exceeded
    if (result.shouldFail) {
      core.setFailed(result.failureMessage || 'Entropy threshold exceeded');
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

main();
