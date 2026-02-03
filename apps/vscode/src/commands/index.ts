/**
 * SED - Semantic Entropy Differencing
 * VS Code Commands Registration
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import * as vscode from 'vscode';
import type { ServiceDependencies } from '../types.js';

/**
 * Register all extension commands
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  services: ServiceDependencies
): void {
  const {
    analysisService,
    decorationManager,
    statusBarManager,
    changesProvider,
    summaryProvider,
    historyProvider,
    logger,
  } = services;

  // Analyze Changes Command
  context.subscriptions.push(
    vscode.commands.registerCommand('sed.analyzeChanges', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showWarningMessage('SED: No workspace folder open');
        return;
      }

      try {
        statusBarManager.setAnalyzing();
        const result = await analysisService.analyzeChanges(workspaceFolder.uri.fsPath);

        if (result.files.length === 0) {
          vscode.window.showInformationMessage('SED: No changes detected');
          statusBarManager.setReady();
          return;
        }

        changesProvider.setData(result.files);
        summaryProvider.setSummary(result.summary);
        historyProvider.addEntry({
          id: Date.now().toString(),
          timestamp: result.timestamp,
          from: result.from,
          to: result.to,
          summary: result.summary,
        });

        decorationManager.updateDecorations();
        statusBarManager.setReady();

        vscode.window.showInformationMessage(
          `SED: Analyzed ${result.files.length} files (avg entropy: ${result.summary.averageEntropy.toFixed(2)})`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Analyze changes failed: ${message}`);
        statusBarManager.setError('Analysis failed');
        vscode.window.showErrorMessage(`SED: Analysis failed - ${message}`);
      }
    })
  );

  // Analyze Current File Command
  context.subscriptions.push(
    vscode.commands.registerCommand('sed.analyzeFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('SED: No active editor');
        return;
      }

      try {
        statusBarManager.setAnalyzing();
        const result = await analysisService.analyzeFile(editor.document.uri.fsPath);

        if (!result) {
          vscode.window.showInformationMessage('SED: No changes in current file');
          statusBarManager.setReady();
          return;
        }

        decorationManager.updateDecorationsForEditor(editor);
        statusBarManager.setReady();

        vscode.window.showInformationMessage(
          `SED: ${result.classification} impact (entropy: ${result.entropy.toFixed(2)})`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Analyze file failed: ${message}`);
        statusBarManager.setError('Analysis failed');
        vscode.window.showErrorMessage(`SED: Analysis failed - ${message}`);
      }
    })
  );

  // Compare References Command
  context.subscriptions.push(
    vscode.commands.registerCommand('sed.compareRefs', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showWarningMessage('SED: No workspace folder open');
        return;
      }

      const fromRef = await vscode.window.showInputBox({
        prompt: 'Enter base reference (e.g., main, HEAD~1, v1.0.0)',
        placeHolder: 'main',
        value: services.configService.get('defaultRef'),
      });

      if (!fromRef) {
        return;
      }

      const toRef = await vscode.window.showInputBox({
        prompt: 'Enter target reference (e.g., HEAD, feature/new)',
        placeHolder: 'HEAD',
        value: 'HEAD',
      });

      if (!toRef) {
        return;
      }

      try {
        statusBarManager.setAnalyzing();
        const result = await analysisService.compareRefs(
          workspaceFolder.uri.fsPath,
          fromRef,
          toRef
        );

        changesProvider.setData(result.files);
        summaryProvider.setSummary(result.summary);
        decorationManager.updateDecorations();
        statusBarManager.setReady();

        vscode.window.showInformationMessage(
          `SED: Compared ${fromRef}..${toRef} (${result.files.length} files)`
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Compare refs failed: ${message}`);
        statusBarManager.setError('Comparison failed');
        vscode.window.showErrorMessage(`SED: Comparison failed - ${message}`);
      }
    })
  );

  // Generate Report Command
  context.subscriptions.push(
    vscode.commands.registerCommand('sed.generateReport', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showWarningMessage('SED: No workspace folder open');
        return;
      }

      const format = (await vscode.window.showQuickPick(['html', 'markdown', 'json'], {
        placeHolder: 'Select report format',
      })) as 'html' | 'markdown' | 'json' | undefined;

      if (!format) {
        return;
      }

      const title = await vscode.window.showInputBox({
        prompt: 'Enter report title',
        placeHolder: 'SED Analysis Report',
        value: 'SED Analysis Report',
      });

      try {
        statusBarManager.setAnalyzing();
        const reportPath = await analysisService.generateReport(workspaceFolder.uri.fsPath, {
          format,
          title: title || 'SED Analysis Report',
          includeChanges: true,
          includeCommits: true,
        });

        statusBarManager.setReady();

        const action = await vscode.window.showInformationMessage(
          `SED: Report generated at ${reportPath}`,
          'Open'
        );

        if (action === 'Open') {
          const uri = vscode.Uri.file(reportPath);
          if (format === 'html') {
            await vscode.env.openExternal(uri);
          } else {
            await vscode.window.showTextDocument(uri);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Generate report failed: ${message}`);
        statusBarManager.setError('Report failed');
        vscode.window.showErrorMessage(`SED: Report generation failed - ${message}`);
      }
    })
  );

  // Show Panel Command
  context.subscriptions.push(
    vscode.commands.registerCommand('sed.showPanel', async () => {
      await vscode.commands.executeCommand('sed.changesView.focus');
    })
  );

  // Refresh Analysis Command
  context.subscriptions.push(
    vscode.commands.registerCommand('sed.refreshAnalysis', async () => {
      await vscode.commands.executeCommand('sed.analyzeChanges');
    })
  );
}
