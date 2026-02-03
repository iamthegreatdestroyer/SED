/**
 * SED - Semantic Entropy Differencing
 * Tree Data Provider for Views
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import * as vscode from 'vscode';
import type { 
  FileAnalysisResult, 
  AnalysisSummary, 
  HistoryEntry, 
  Classification,
  TreeItemData,
} from '../types.js';

/**
 * Tree item for SED explorer views
 */
export class SEDTreeItem extends vscode.TreeItem {
  constructor(
    public readonly data: TreeItemData,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(data.label, collapsibleState);
    
    this.description = data.description;
    this.tooltip = data.tooltip || data.label;
    this.contextValue = data.contextValue;

    // Set icon based on type and classification
    this.iconPath = this.getIcon();
  }

  private getIcon(): vscode.ThemeIcon | undefined {
    if (this.data.type === 'file') {
      return new vscode.ThemeIcon('file', this.getClassificationColor());
    }
    if (this.data.type === 'change') {
      return new vscode.ThemeIcon('symbol-function');
    }
    if (this.data.type === 'summary') {
      return new vscode.ThemeIcon('dashboard');
    }
    if (this.data.type === 'statistic') {
      return new vscode.ThemeIcon('graph');
    }
    if (this.data.type === 'history') {
      return new vscode.ThemeIcon('history');
    }
    return undefined;
  }

  private getClassificationColor(): vscode.ThemeColor | undefined {
    if (!this.data.classification) {
      return undefined;
    }

    const colorMap: Record<Classification, string> = {
      trivial: 'sed.entropyTrivial',
      low: 'sed.entropyLow',
      medium: 'sed.entropyMedium',
      high: 'sed.entropyHigh',
      critical: 'sed.entropyCritical',
    };

    return new vscode.ThemeColor(colorMap[this.data.classification]);
  }
}

/**
 * Tree data provider for SED views
 */
export class SEDTreeDataProvider implements vscode.TreeDataProvider<SEDTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SEDTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private files: FileAnalysisResult[] = [];
  private summary: AnalysisSummary | null = null;
  private history: HistoryEntry[] = [];
  private viewType: 'changes' | 'summary' | 'history';

  constructor(viewType: 'changes' | 'summary' | 'history') {
    this.viewType = viewType;
  }

  /**
   * Set file analysis data
   */
  setData(files: FileAnalysisResult[]): void {
    this.files = files;
    this.refresh();
  }

  /**
   * Set summary data
   */
  setSummary(summary: AnalysisSummary): void {
    this.summary = summary;
    this.refresh();
  }

  /**
   * Add a history entry
   */
  addEntry(entry: HistoryEntry): void {
    this.history.unshift(entry);
    if (this.history.length > 10) {
      this.history.pop();
    }
    this.refresh();
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.files = [];
    this.summary = null;
    this.refresh();
  }

  getTreeItem(element: SEDTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SEDTreeItem): Thenable<SEDTreeItem[]> {
    if (!element) {
      return Promise.resolve(this.getRootItems());
    }

    if (element.data.children) {
      return Promise.resolve(
        element.data.children.map(
          (child) =>
            new SEDTreeItem(
              child,
              child.collapsible
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None,
            ),
        ),
      );
    }

    return Promise.resolve([]);
  }

  private getRootItems(): SEDTreeItem[] {
    switch (this.viewType) {
      case 'changes':
        return this.getChangesItems();
      case 'summary':
        return this.getSummaryItems();
      case 'history':
        return this.getHistoryItems();
      default:
        return [];
    }
  }

  private getChangesItems(): SEDTreeItem[] {
    if (this.files.length === 0) {
      return [
        new SEDTreeItem(
          {
            type: 'summary',
            label: 'No changes analyzed',
            description: 'Run "Analyze Changes" to start',
            collapsible: false,
          },
          vscode.TreeItemCollapsibleState.None,
        ),
      ];
    }

    // Group by classification
    const groups: Record<Classification, FileAnalysisResult[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      trivial: [],
    };

    for (const file of this.files) {
      groups[file.classification].push(file);
    }

    const items: SEDTreeItem[] = [];

    for (const classification of ['critical', 'high', 'medium', 'low', 'trivial'] as Classification[]) {
      const groupFiles = groups[classification];
      if (groupFiles.length === 0) continue;

      const children: TreeItemData[] = groupFiles.map((file) => ({
        type: 'file' as const,
        label: file.relativePath,
        description: `${file.entropy.toFixed(2)}`,
        tooltip: `${file.relativePath}\nEntropy: ${file.entropy.toFixed(2)}\nChanges: ${file.changes.length}`,
        classification: file.classification,
        entropy: file.entropy,
        path: file.path,
        collapsible: file.changes.length > 0,
        contextValue: 'sedFile',
        children: file.changes.map((change) => ({
          type: 'change' as const,
          label: change.name || change.nodeType,
          description: `${change.type} (${change.entropy.toFixed(2)})`,
          tooltip: change.description || `${change.type} ${change.nodeType}`,
          collapsible: false,
        })),
      }));

      items.push(
        new SEDTreeItem(
          {
            type: 'summary',
            label: classification.charAt(0).toUpperCase() + classification.slice(1),
            description: `${groupFiles.length} files`,
            classification,
            collapsible: true,
            children,
          },
          vscode.TreeItemCollapsibleState.Expanded,
        ),
      );
    }

    return items;
  }

  private getSummaryItems(): SEDTreeItem[] {
    if (!this.summary) {
      return [
        new SEDTreeItem(
          {
            type: 'summary',
            label: 'No summary available',
            description: 'Run "Analyze Changes" to start',
            collapsible: false,
          },
          vscode.TreeItemCollapsibleState.None,
        ),
      ];
    }

    return [
      new SEDTreeItem(
        {
          type: 'statistic',
          label: 'Files Analyzed',
          description: `${this.summary.totalFiles}`,
          collapsible: false,
        },
        vscode.TreeItemCollapsibleState.None,
      ),
      new SEDTreeItem(
        {
          type: 'statistic',
          label: 'Total Entropy',
          description: `${this.summary.totalEntropy.toFixed(2)}`,
          collapsible: false,
        },
        vscode.TreeItemCollapsibleState.None,
      ),
      new SEDTreeItem(
        {
          type: 'statistic',
          label: 'Average Entropy',
          description: `${this.summary.averageEntropy.toFixed(2)}`,
          collapsible: false,
        },
        vscode.TreeItemCollapsibleState.None,
      ),
      new SEDTreeItem(
        {
          type: 'summary',
          label: 'Classifications',
          collapsible: true,
          children: Object.entries(this.summary.classifications).map(([classification, count]) => ({
            type: 'statistic' as const,
            label: classification.charAt(0).toUpperCase() + classification.slice(1),
            description: `${count}`,
            classification: classification as Classification,
            collapsible: false,
          })),
        },
        vscode.TreeItemCollapsibleState.Expanded,
      ),
    ];
  }

  private getHistoryItems(): SEDTreeItem[] {
    if (this.history.length === 0) {
      return [
        new SEDTreeItem(
          {
            type: 'history',
            label: 'No history',
            description: 'Analyses will appear here',
            collapsible: false,
          },
          vscode.TreeItemCollapsibleState.None,
        ),
      ];
    }

    return this.history.map(
      (entry) =>
        new SEDTreeItem(
          {
            type: 'history',
            label: `${entry.from}..${entry.to}`,
            description: entry.timestamp.toLocaleString(),
            tooltip: `Files: ${entry.summary.totalFiles}, Avg: ${entry.summary.averageEntropy.toFixed(2)}`,
            collapsible: false,
            contextValue: 'sedHistory',
          },
          vscode.TreeItemCollapsibleState.None,
        ),
    );
  }
}
