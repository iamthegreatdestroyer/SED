/**
 * SED - Semantic Entropy Differencing
 * Commit Parser - Parse and Analyze Git Commits
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { GitClient, LogEntry } from './git-client.js';

/**
 * Parsed commit with full metadata
 */
export interface ParsedCommit {
  hash: string;
  abbreviatedHash: string;
  author: {
    name: string;
    email: string;
  };
  date: Date;
  message: string;
  subject: string;
  body: string;
  refs: string[];
  parent?: string;
  isConventional: boolean;
  conventional?: ConventionalCommit;
}

/**
 * Conventional commit parsed fields
 */
export interface ConventionalCommit {
  type: string;
  scope?: string;
  description: string;
  body?: string;
  footer?: Record<string, string>;
  breaking: boolean;
  breakingDescription?: string;
}

/**
 * Commit range specification
 */
export interface CommitRange {
  from: string;
  to: string;
  commits: ParsedCommit[];
  totalCommits: number;
}

/**
 * Options for commit parsing
 */
export interface CommitParserOptions {
  /** Parse conventional commit format */
  parseConventional?: boolean;
  /** Maximum commits to fetch */
  maxCommits?: number;
  /** Include merge commits */
  includeMerges?: boolean;
}

// Conventional commit types
const CONVENTIONAL_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
];

// Conventional commit regex
const CONVENTIONAL_REGEX = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;

/**
 * CommitParser handles parsing and analysis of Git commits
 */
export class CommitParser {
  private git: GitClient;
  private options: Required<CommitParserOptions>;

  constructor(git: GitClient, options: CommitParserOptions = {}) {
    this.git = git;
    this.options = {
      parseConventional: options.parseConventional ?? true,
      maxCommits: options.maxCommits ?? 100,
      includeMerges: options.includeMerges ?? true,
    };
  }

  /**
   * Parse a single commit
   */
  async parse(ref: string): Promise<ParsedCommit> {
    const log = await this.git.getLog({ maxCount: 1, from: ref });
    
    if (log.length === 0) {
      throw new Error(`Commit not found: ${ref}`);
    }

    return this.parseLogEntry(log[0]);
  }

  /**
   * Parse a range of commits
   */
  async parseRange(fromRef: string, toRef: string = 'HEAD'): Promise<CommitRange> {
    const log = await this.git.getLog({
      from: fromRef,
      to: toRef,
      maxCount: this.options.maxCommits,
    });

    const commits = log.map((entry) => this.parseLogEntry(entry));

    return {
      from: fromRef,
      to: toRef,
      commits,
      totalCommits: commits.length,
    };
  }

  /**
   * Parse recent commits
   */
  async parseRecent(count: number): Promise<ParsedCommit[]> {
    const log = await this.git.getLog({
      maxCount: Math.min(count, this.options.maxCommits),
    });

    return log.map((entry) => this.parseLogEntry(entry));
  }

  /**
   * Parse conventional commit message
   */
  parseConventionalMessage(message: string): ConventionalCommit | null {
    const lines = message.split('\n');
    const subjectLine = lines[0].trim();
    
    const match = CONVENTIONAL_REGEX.exec(subjectLine);
    if (!match) {
      return null;
    }

    const [, type, scope, breaking, description] = match;
    
    if (!CONVENTIONAL_TYPES.includes(type)) {
      return null;
    }

    // Parse body and footer
    let body: string | undefined;
    const footer: Record<string, string> = {};
    let breakingDescription: string | undefined;

    if (lines.length > 1) {
      // Skip empty line after subject
      const bodyLines: string[] = [];
      let inFooter = false;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for footer tokens
        const footerMatch = line.match(/^([\w-]+):\s*(.+)$/);
        const breakingMatch = line.match(/^BREAKING CHANGE:\s*(.+)$/);
        
        if (breakingMatch) {
          inFooter = true;
          breakingDescription = breakingMatch[1];
        } else if (footerMatch && line === line.toUpperCase()) {
          inFooter = true;
          footer[footerMatch[1]] = footerMatch[2];
        } else if (!inFooter && line.trim()) {
          bodyLines.push(line);
        }
      }

      if (bodyLines.length > 0) {
        body = bodyLines.join('\n').trim();
      }
    }

    return {
      type,
      scope,
      description,
      body,
      footer: Object.keys(footer).length > 0 ? footer : undefined,
      breaking: Boolean(breaking) || Boolean(breakingDescription),
      breakingDescription,
    };
  }

  /**
   * Check if a commit message follows conventional format
   */
  isConventional(message: string): boolean {
    return this.parseConventionalMessage(message) !== null;
  }

  /**
   * Get commit type counts from range
   */
  async getTypeStats(fromRef: string, toRef: string = 'HEAD'): Promise<Record<string, number>> {
    const range = await this.parseRange(fromRef, toRef);
    const stats: Record<string, number> = {};

    for (const commit of range.commits) {
      if (commit.conventional) {
        stats[commit.conventional.type] = (stats[commit.conventional.type] || 0) + 1;
      } else {
        stats['other'] = (stats['other'] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Get breaking changes from range
   */
  async getBreakingChanges(fromRef: string, toRef: string = 'HEAD'): Promise<ParsedCommit[]> {
    const range = await this.parseRange(fromRef, toRef);
    
    return range.commits.filter(
      (commit) => commit.conventional?.breaking
    );
  }

  /**
   * Filter commits by type
   */
  filterByType(commits: ParsedCommit[], types: string[]): ParsedCommit[] {
    return commits.filter(
      (commit) =>
        commit.conventional && types.includes(commit.conventional.type)
    );
  }

  /**
   * Filter commits by scope
   */
  filterByScope(commits: ParsedCommit[], scopes: string[]): ParsedCommit[] {
    return commits.filter(
      (commit) =>
        commit.conventional?.scope && scopes.includes(commit.conventional.scope)
    );
  }

  /**
   * Generate changelog from commit range
   */
  async generateChangelog(
    fromRef: string,
    toRef: string = 'HEAD',
    options: { grouped?: boolean } = {}
  ): Promise<string> {
    const range = await this.parseRange(fromRef, toRef);
    
    if (options.grouped) {
      return this.generateGroupedChangelog(range.commits);
    }
    
    return this.generateFlatChangelog(range.commits);
  }

  // Private helper methods

  private parseLogEntry(entry: LogEntry): ParsedCommit {
    const subject = entry.message.split('\n')[0];
    const conventional = this.options.parseConventional
      ? this.parseConventionalMessage(entry.message)
      : null;

    return {
      hash: entry.hash,
      abbreviatedHash: entry.abbreviatedHash,
      author: {
        name: entry.author,
        email: entry.authorEmail,
      },
      date: entry.date,
      message: entry.message,
      subject,
      body: entry.body,
      refs: entry.refs,
      isConventional: conventional !== null,
      conventional: conventional || undefined,
    };
  }

  private generateFlatChangelog(commits: ParsedCommit[]): string {
    const lines: string[] = ['# Changelog', ''];
    
    for (const commit of commits) {
      const prefix = commit.conventional
        ? `${commit.conventional.type}${commit.conventional.scope ? `(${commit.conventional.scope})` : ''}: `
        : '';
      const breaking = commit.conventional?.breaking ? ' **BREAKING**' : '';
      
      lines.push(
        `- ${prefix}${commit.subject}${breaking} (${commit.abbreviatedHash})`
      );
    }

    return lines.join('\n');
  }

  private generateGroupedChangelog(commits: ParsedCommit[]): string {
    const groups: Record<string, ParsedCommit[]> = {
      breaking: [],
      feat: [],
      fix: [],
      perf: [],
      refactor: [],
      docs: [],
      other: [],
    };

    for (const commit of commits) {
      if (commit.conventional?.breaking) {
        groups.breaking.push(commit);
      } else if (commit.conventional) {
        const type = commit.conventional.type;
        if (type in groups) {
          groups[type].push(commit);
        } else {
          groups.other.push(commit);
        }
      } else {
        groups.other.push(commit);
      }
    }

    const lines: string[] = ['# Changelog', ''];

    const sectionTitles: Record<string, string> = {
      breaking: '⚠️ Breaking Changes',
      feat: '✨ Features',
      fix: '🐛 Bug Fixes',
      perf: '⚡ Performance',
      refactor: '♻️ Refactoring',
      docs: '📚 Documentation',
      other: '📝 Other Changes',
    };

    for (const [key, title] of Object.entries(sectionTitles)) {
      const groupCommits = groups[key];
      if (groupCommits && groupCommits.length > 0) {
        lines.push(`## ${title}`, '');
        for (const commit of groupCommits) {
          const scope = commit.conventional?.scope
            ? `**${commit.conventional.scope}:** `
            : '';
          lines.push(
            `- ${scope}${commit.conventional?.description || commit.subject} (${commit.abbreviatedHash})`
          );
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}
