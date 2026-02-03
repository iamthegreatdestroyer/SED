/**
 * SED - Semantic Entropy Differencing
 * VS Code Extension Entry Point
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import * as vscode from 'vscode';
import { registerCommands } from './commands/index.js';
import { SEDTreeDataProvider } from './views/treeDataProvider.js';
import { DecorationManager } from './decorations/decorationManager.js';
import { AnalysisService } from './services/analysisService.js';
import { ConfigurationService } from './services/configurationService.js';
import { StatusBarManager } from './ui/statusBar.js';
import { OutputChannelLogger } from './utils/logger.js';

/**
 * Extension context for cleanup
 */
let analysisService: AnalysisService | undefined;
let decorationManager: DecorationManager | undefined;
let statusBarManager: StatusBarManager | undefined;
let logger: OutputChannelLogger | undefined;

/**
 * Called when the extension is activated
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // Initialize logger
  logger = new OutputChannelLogger('SED');
  logger.info('SED extension activating...');

  try {
    // Initialize services
    const configService = new ConfigurationService();
    analysisService = new AnalysisService(configService, logger);
    decorationManager = new DecorationManager(configService);
    statusBarManager = new StatusBarManager();

    // Initialize tree data providers
    const changesProvider = new SEDTreeDataProvider('changes');
    const summaryProvider = new SEDTreeDataProvider('summary');
    const historyProvider = new SEDTreeDataProvider('history');

    // Register tree views
    const changesView = vscode.window.createTreeView('sed.changesView', {
      treeDataProvider: changesProvider,
      showCollapseAll: true,
    });

    const summaryView = vscode.window.createTreeView('sed.summaryView', {
      treeDataProvider: summaryProvider,
    });

    const historyView = vscode.window.createTreeView('sed.historyView', {
      treeDataProvider: historyProvider,
      showCollapseAll: true,
    });

    // Register commands
    registerCommands(context, {
      analysisService,
      decorationManager,
      configService,
      statusBarManager,
      changesProvider,
      summaryProvider,
      historyProvider,
      logger,
    });

    // Register event handlers
    registerEventHandlers(context, {
      analysisService,
      decorationManager,
      configService,
      statusBarManager,
      changesProvider,
    });

    // Add disposables
    context.subscriptions.push(
      changesView,
      summaryView,
      historyView,
      decorationManager,
      statusBarManager,
      logger,
    );

    // Initial status bar
    statusBarManager.setReady();

    logger.info('SED extension activated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger?.error(`Failed to activate SED extension: ${message}`);
    vscode.window.showErrorMessage(`SED: Failed to activate - ${message}`);
  }
}

/**
 * Register event handlers for file changes, etc.
 */
function registerEventHandlers(
  context: vscode.ExtensionContext,
  services: {
    analysisService: AnalysisService;
    decorationManager: DecorationManager;
    configService: ConfigurationService;
    statusBarManager: StatusBarManager;
    changesProvider: SEDTreeDataProvider;
  },
): void {
  const { analysisService, decorationManager, configService, statusBarManager, changesProvider } = services;

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('sed')) {
        configService.reload();
        decorationManager.updateDecorations();
      }
    }),
  );

  // Watch for file saves (auto-analyze)
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (!configService.get('autoAnalyze')) {
        return;
      }

      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
      if (!workspaceFolder) {
        return;
      }

      try {
        statusBarManager.setAnalyzing();
        await analysisService.analyzeFile(document.uri.fsPath);
        decorationManager.updateDecorations();
        changesProvider.refresh();
        statusBarManager.setReady();
      } catch {
        statusBarManager.setError('Analysis failed');
      }
    }),
  );

  // Watch for active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        decorationManager.updateDecorationsForEditor(editor);
      }
    }),
  );

  // Watch for visible editors changes
  context.subscriptions.push(
    vscode.window.onDidChangeVisibleTextEditors((editors) => {
      for (const editor of editors) {
        decorationManager.updateDecorationsForEditor(editor);
      }
    }),
  );
}

/**
 * Called when the extension is deactivated
 */
export function deactivate(): void {
  logger?.info('SED extension deactivating...');
  analysisService = undefined;
  decorationManager = undefined;
  statusBarManager = undefined;
  logger = undefined;
}
