/**
 * SED - Semantic Entropy Differencing
 * Git Package Public API
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

// Core Git client
export { GitClient } from './git-client.js';
export type { GitClientOptions } from './git-client.js';

// Diff extraction
export { DiffExtractor } from './diff-extractor.js';
export type { DiffExtractorOptions, ExtractedDiff, FileDiff } from './diff-extractor.js';

// Commit parsing
export { CommitParser } from './commit-parser.js';
export type { ParsedCommit, CommitRange, ConventionalCommit } from './commit-parser.js';

// Repository utilities
export { RepoAnalyzer } from './repo-analyzer.js';
export type { RepoInfo, BranchInfo, TagInfo } from './repo-analyzer.js';
