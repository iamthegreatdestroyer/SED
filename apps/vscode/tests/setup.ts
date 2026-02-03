/**
 * SED - Semantic Entropy Differencing
 * VS Code Extension Tests Setup
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { vi } from 'vitest';

/**
 * Mock VS Code API
 */
export const mockVscode = {
  window: {
    createTextEditorDecorationType: vi.fn(() => ({
      dispose: vi.fn(),
    })),
    createOutputChannel: vi.fn(() => ({
      appendLine: vi.fn(),
      show: vi.fn(),
      clear: vi.fn(),
      dispose: vi.fn(),
    })),
    createStatusBarItem: vi.fn(() => ({
      text: '',
      tooltip: '',
      command: '',
      backgroundColor: undefined,
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn(),
    })),
    createTreeView: vi.fn(() => ({
      dispose: vi.fn(),
    })),
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showInputBox: vi.fn(),
    showQuickPick: vi.fn(),
    visibleTextEditors: [],
    activeTextEditor: undefined,
    onDidChangeActiveTextEditor: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeVisibleTextEditors: vi.fn(() => ({ dispose: vi.fn() })),
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, defaultValue?: unknown) => defaultValue),
      update: vi.fn(),
    })),
    workspaceFolders: [
      {
        uri: { fsPath: '/workspace' },
        name: 'test-workspace',
        index: 0,
      },
    ],
    getWorkspaceFolder: vi.fn(() => ({
      uri: { fsPath: '/workspace' },
    })),
    onDidSaveTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
  },
  commands: {
    registerCommand: vi.fn(() => ({ dispose: vi.fn() })),
    executeCommand: vi.fn(),
  },
  env: {
    openExternal: vi.fn(),
  },
  Uri: {
    file: vi.fn((path: string) => ({ fsPath: path, scheme: 'file' })),
    parse: vi.fn((str: string) => ({ fsPath: str, scheme: 'data' })),
  },
  Range: vi.fn((startLine: number, startChar: number, endLine: number, endChar: number) => ({
    start: { line: startLine, character: startChar },
    end: { line: endLine, character: endChar },
  })),
  ThemeColor: vi.fn((id: string) => ({ id })),
  ThemeIcon: vi.fn((id: string, color?: unknown) => ({ id, color })),
  TreeItem: vi.fn(),
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2,
  },
  MarkdownString: vi.fn((value: string) => ({ value })),
  StatusBarAlignment: {
    Left: 1,
    Right: 2,
  },
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3,
  },
  OverviewRulerLane: {
    Left: 1,
    Center: 2,
    Right: 4,
    Full: 7,
  },
  EventEmitter: vi.fn(() => ({
    event: vi.fn(),
    fire: vi.fn(),
    dispose: vi.fn(),
  })),
};

// Mock the vscode module
vi.mock('vscode', () => mockVscode);

/**
 * Reset all mocks
 */
export function resetMocks(): void {
  vi.clearAllMocks();
  mockVscode.workspace.workspaceFolders = [
    {
      uri: { fsPath: '/workspace' },
      name: 'test-workspace',
      index: 0,
    },
  ];
}

/**
 * Create a mock text editor
 */
export function createMockEditor(document: {
  uri: { fsPath: string };
  getText?: () => string;
}): unknown {
  return {
    document: {
      uri: document.uri,
      getText: document.getText || (() => ''),
      languageId: 'typescript',
    },
    setDecorations: vi.fn(),
    selection: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    },
  };
}

/**
 * Create mock analysis result
 */
export function createMockAnalysisResult() {
  return {
    from: 'HEAD~1',
    to: 'HEAD',
    timestamp: new Date(),
    files: [
      {
        path: '/workspace/src/test.ts',
        relativePath: 'src/test.ts',
        status: 'modified' as const,
        language: 'typescript',
        classification: 'medium' as const,
        entropy: 2.5,
        changes: [
          {
            type: 'modified' as const,
            nodeType: 'function',
            name: 'testFunction',
            startLine: 10,
            endLine: 20,
            entropy: 2.5,
            description: 'Modified function body',
          },
        ],
        metrics: {
          additions: 5,
          deletions: 3,
          modifications: 1,
        },
      },
    ],
    summary: {
      totalFiles: 1,
      totalEntropy: 2.5,
      averageEntropy: 2.5,
      classifications: {
        trivial: 0,
        low: 0,
        medium: 1,
        high: 0,
        critical: 0,
      },
      highestImpact: [],
    },
    stats: {
      additions: 5,
      deletions: 3,
      filesChanged: 1,
    },
  };
}
