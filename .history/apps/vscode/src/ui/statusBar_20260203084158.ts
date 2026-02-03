/**
 * SED - Semantic Entropy Differencing
 * Status Bar Manager
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import * as vscode from 'vscode';

/**
 * Status bar states
 */
type StatusState = 'ready' | 'analyzing' | 'error';

/**
 * Manages the status bar item for SED
 */
export class StatusBarManager implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private state: StatusState = 'ready';

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.statusBarItem.command = 'sed.showPanel';
    this.statusBarItem.show();
    this.setReady();
  }

  /**
   * Set status to ready
   */
  setReady(): void {
    this.state = 'ready';
    this.statusBarItem.text = '$(check) SED';
    this.statusBarItem.tooltip = 'SED - Click to show panel';
    this.statusBarItem.backgroundColor = undefined;
  }

  /**
   * Set status to analyzing
   */
  setAnalyzing(): void {
    this.state = 'analyzing';
    this.statusBarItem.text = '$(loading~spin) SED';
    this.statusBarItem.tooltip = 'SED - Analyzing...';
    this.statusBarItem.backgroundColor = undefined;
  }

  /**
   * Set status to error
   */
  setError(message?: string): void {
    this.state = 'error';
    this.statusBarItem.text = '$(error) SED';
    this.statusBarItem.tooltip = message ? `SED - ${message}` : 'SED - Error';
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  }

  /**
   * Set status with analysis results
   */
  setResults(fileCount: number, avgEntropy: number): void {
    this.state = 'ready';
    this.statusBarItem.text = `$(pulse) SED: ${fileCount} files`;
    this.statusBarItem.tooltip = `SED - ${fileCount} files analyzed\nAverage entropy: ${avgEntropy.toFixed(2)}`;
    this.statusBarItem.backgroundColor = undefined;
  }

  /**
   * Get current state
   */
  getState(): StatusState {
    return this.state;
  }

  /**
   * Hide the status bar
   */
  hide(): void {
    this.statusBarItem.hide();
  }

  /**
   * Show the status bar
   */
  show(): void {
    this.statusBarItem.show();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.statusBarItem.dispose();
  }
}
