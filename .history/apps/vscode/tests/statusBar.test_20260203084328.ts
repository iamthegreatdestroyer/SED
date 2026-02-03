/**
 * SED - Semantic Entropy Differencing
 * Status Bar Manager Tests
 * Copyright (C) 2026 Stevo (sgbilod)
 * @license MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetMocks, mockVscode } from './setup.js';

// Import after mocking
const { StatusBarManager } = await import('../src/ui/statusBar.js');

describe('StatusBarManager', () => {
  let statusBar: InstanceType<typeof StatusBarManager>;
  let mockStatusBarItem: ReturnType<typeof mockVscode.window.createStatusBarItem>;

  beforeEach(() => {
    resetMocks();
    mockStatusBarItem = {
      text: '',
      tooltip: '',
      command: '',
      backgroundColor: undefined,
      show: vi.fn(),
      hide: vi.fn(),
      dispose: vi.fn(),
    };
    mockVscode.window.createStatusBarItem = vi.fn(() => mockStatusBarItem);
    statusBar = new StatusBarManager();
  });

  describe('constructor', () => {
    it('should create a status bar item', () => {
      expect(mockVscode.window.createStatusBarItem).toHaveBeenCalled();
    });

    it('should set command to sed.showPanel', () => {
      expect(mockStatusBarItem.command).toBe('sed.showPanel');
    });

    it('should show the status bar item', () => {
      expect(mockStatusBarItem.show).toHaveBeenCalled();
    });
  });

  describe('setReady', () => {
    it('should set ready state', () => {
      statusBar.setReady();

      expect(statusBar.getState()).toBe('ready');
      expect(mockStatusBarItem.text).toBe('$(check) SED');
    });
  });

  describe('setAnalyzing', () => {
    it('should set analyzing state', () => {
      statusBar.setAnalyzing();

      expect(statusBar.getState()).toBe('analyzing');
      expect(mockStatusBarItem.text).toBe('$(loading~spin) SED');
    });
  });

  describe('setError', () => {
    it('should set error state', () => {
      statusBar.setError('Test error');

      expect(statusBar.getState()).toBe('error');
      expect(mockStatusBarItem.text).toBe('$(error) SED');
      expect(mockStatusBarItem.tooltip).toBe('SED - Test error');
    });

    it('should set default error tooltip when no message provided', () => {
      statusBar.setError();

      expect(mockStatusBarItem.tooltip).toBe('SED - Error');
    });
  });

  describe('setResults', () => {
    it('should set results state with file count and entropy', () => {
      statusBar.setResults(5, 2.5);

      expect(statusBar.getState()).toBe('ready');
      expect(mockStatusBarItem.text).toBe('$(pulse) SED: 5 files');
    });
  });

  describe('hide', () => {
    it('should hide the status bar', () => {
      statusBar.hide();

      expect(mockStatusBarItem.hide).toHaveBeenCalled();
    });
  });

  describe('show', () => {
    it('should show the status bar', () => {
      mockStatusBarItem.show.mockClear();
      statusBar.show();

      expect(mockStatusBarItem.show).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('should dispose the status bar item', () => {
      statusBar.dispose();

      expect(mockStatusBarItem.dispose).toHaveBeenCalled();
    });
  });
});
