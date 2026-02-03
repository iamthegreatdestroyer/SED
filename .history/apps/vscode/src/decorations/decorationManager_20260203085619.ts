/**
 * SED - Semantic Entropy Differencing
 * Decoration Manager
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import * as vscode from 'vscode';
import type { Classification, ChangeDetail } from '../types.js';
import type { ConfigurationService } from '../services/configurationService.js';

/**
 * Decoration types for each classification
 */
interface DecorationTypes {
  trivial: vscode.TextEditorDecorationType;
  low: vscode.TextEditorDecorationType;
  medium: vscode.TextEditorDecorationType;
  high: vscode.TextEditorDecorationType;
  critical: vscode.TextEditorDecorationType;
}

/**
 * Cached decoration data for a file
 */
interface FileDecorations {
  path: string;
  decorations: Map<Classification, vscode.DecorationOptions[]>;
}

/**
 * Manages inline decorations for analyzed files
 */
export class DecorationManager implements vscode.Disposable {
  private decorationTypes: DecorationTypes;
  private fileDecorations: Map<string, FileDecorations> = new Map();
  private disposables: vscode.Disposable[] = [];

  constructor(private readonly configService: ConfigurationService) {
    this.decorationTypes = this.createDecorationTypes();
  }

  /**
   * Create decoration types for each classification
   */
  private createDecorationTypes(): DecorationTypes {
    return {
      trivial: vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        borderRadius: '2px',
        gutterIconPath: this.createGutterIcon('#28a745'),
        gutterIconSize: 'contain',
        overviewRulerColor: '#28a745',
        overviewRulerLane: vscode.OverviewRulerLane.Left,
      }),
      low: vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        backgroundColor: 'rgba(23, 162, 184, 0.1)',
        borderRadius: '2px',
        gutterIconPath: this.createGutterIcon('#17a2b8'),
        gutterIconSize: 'contain',
        overviewRulerColor: '#17a2b8',
        overviewRulerLane: vscode.OverviewRulerLane.Left,
      }),
      medium: vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        backgroundColor: 'rgba(255, 193, 7, 0.15)',
        borderRadius: '2px',
        gutterIconPath: this.createGutterIcon('#ffc107'),
        gutterIconSize: 'contain',
        overviewRulerColor: '#ffc107',
        overviewRulerLane: vscode.OverviewRulerLane.Left,
      }),
      high: vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        backgroundColor: 'rgba(253, 126, 20, 0.15)',
        borderRadius: '2px',
        gutterIconPath: this.createGutterIcon('#fd7e14'),
        gutterIconSize: 'contain',
        overviewRulerColor: '#fd7e14',
        overviewRulerLane: vscode.OverviewRulerLane.Left,
      }),
      critical: vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        backgroundColor: 'rgba(220, 53, 69, 0.2)',
        borderRadius: '2px',
        border: '1px solid rgba(220, 53, 69, 0.3)',
        gutterIconPath: this.createGutterIcon('#dc3545'),
        gutterIconSize: 'contain',
        overviewRulerColor: '#dc3545',
        overviewRulerLane: vscode.OverviewRulerLane.Left,
      }),
    };
  }

  /**
   * Create a gutter icon SVG URI
   */
  private createGutterIcon(color: string): vscode.Uri {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="${color}"><circle cx="8" cy="8" r="4"/></svg>`;
    return vscode.Uri.parse(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
  }

  /**
   * Set decorations for a file
   */
  setFileDecorations(filePath: string, changes: ChangeDetail[]): void {
    const decorations = new Map<Classification, vscode.DecorationOptions[]>();

    for (const classification of [
      'trivial',
      'low',
      'medium',
      'high',
      'critical',
    ] as Classification[]) {
      decorations.set(classification, []);
    }

    for (const change of changes) {
      const classification = this.classifyChange(change);
      const range = new vscode.Range(change.startLine - 1, 0, change.endLine - 1, Number.MAX_VALUE);

      const decoration: vscode.DecorationOptions = {
        range,
        hoverMessage: new vscode.MarkdownString(
          `**SED Analysis**\n\n` +
            `Type: ${change.type}\n\n` +
            `Node: ${change.nodeType}${change.name ? ` (${change.name})` : ''}\n\n` +
            `Entropy: ${change.entropy.toFixed(2)}\n\n` +
            `Classification: ${classification}`
        ),
      };

      decorations.get(classification)!.push(decoration);
    }

    this.fileDecorations.set(filePath, { path: filePath, decorations });
  }

  /**
   * Classify a change based on entropy thresholds
   */
  private classifyChange(change: ChangeDetail): Classification {
    const thresholds = this.configService.getThresholds();
    const entropy = change.entropy;

    if (entropy >= thresholds.critical) return 'critical';
    if (entropy >= thresholds.high) return 'high';
    if (entropy >= thresholds.medium) return 'medium';
    if (entropy >= thresholds.low) return 'low';
    return 'trivial';
  }

  /**
   * Update decorations for all visible editors
   */
  updateDecorations(): void {
    if (!this.configService.get('showInlineDecorations')) {
      this.clearAllDecorations();
      return;
    }

    for (const editor of vscode.window.visibleTextEditors) {
      this.updateDecorationsForEditor(editor);
    }
  }

  /**
   * Update decorations for a specific editor
   */
  updateDecorationsForEditor(editor: vscode.TextEditor): void {
    const filePath = editor.document.uri.fsPath;
    const fileData = this.fileDecorations.get(filePath);

    if (!fileData || !this.configService.get('showInlineDecorations')) {
      // Clear decorations for this editor
      for (const decorationType of Object.values(this.decorationTypes)) {
        editor.setDecorations(decorationType, []);
      }
      return;
    }

    // Apply decorations
    for (const [classification, decorations] of fileData.decorations) {
      const decorationType = this.decorationTypes[classification];
      editor.setDecorations(decorationType, decorations);
    }
  }

  /**
   * Clear all decorations from all editors
   */
  clearAllDecorations(): void {
    for (const editor of vscode.window.visibleTextEditors) {
      for (const decorationType of Object.values(this.decorationTypes)) {
        editor.setDecorations(decorationType, []);
      }
    }
    this.fileDecorations.clear();
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.clearAllDecorations();
    for (const decorationType of Object.values(this.decorationTypes)) {
      decorationType.dispose();
    }
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
